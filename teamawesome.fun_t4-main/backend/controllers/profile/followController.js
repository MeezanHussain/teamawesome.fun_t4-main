const db = require("../../db/db");

const schema = process.env.NODE_ENV == 'production' ? process.env.DB_SCHEMA : (process.env.DEV_SCHEMA || 'public');

// Follow or request to follow a user
exports.followUser = async (req, res, next) => {
    try {
        const followerUserName = req.user.userName;
        const { targetUserName } = req.params;

        console.log(followerUserName, targetUserName)

        // Check if trying to follow self
        if (followerUserName === targetUserName) {
            return res.status(400).json({
                success: false,
                message: "You cannot follow yourself",
            });
        }

        // Begin transaction
        await db.query("BEGIN");

        //Get follower user details
        const followerUserQuery = `SELECT id FROM ${schema}.users WHERE user_name = $1`;
        const followerUserResult = await db.query(followerUserQuery, [followerUserName]);
        const followerId = followerUserResult.rows[0].id;

        // Get target user details
        const targetUserQuery = `SELECT id, user_name, is_profile_public FROM ${schema}.users WHERE user_name = $1`;
        const targetUserResult = await db.query(targetUserQuery, [targetUserName]);
        const targetUser = targetUserResult.rows[0];
        const targetId = targetUserResult.rows[0].id;


        if (targetUserResult.rows.length === 0) {
            await db.query("ROLLBACK");
            return res.status(404).json({
                success: false,
                message: "User not found",
            });
        }

        // Check if already following
        const followCheckQuery = `SELECT id FROM ${schema}.follows WHERE follower_id = $1 AND following_id = $2`;
        const followCheckResult = await db.query(followCheckQuery, [
            followerId,
            targetId,
        ]);

        if (followCheckResult.rows.length > 0) {
            await db.query("ROLLBACK");
            return res.status(400).json({
                success: false,
                message: "You are already following this user",
            });
        }

        // Check if there's an existing request
        const requestCheckQuery = `SELECT id, status FROM ${schema}.follow_requests WHERE requester_id = $1 AND target_id = $2`;
        const requestCheckResult = await db.query(requestCheckQuery, [
            followerId,
            targetId,
        ]);

        if (requestCheckResult.rows.length > 0) {
            const existingRequest = requestCheckResult.rows[0];
            
            if (existingRequest.status === "pending") {
                await db.query("ROLLBACK");
                return res.status(400).json({
                    success: false,
                    message: "Follow request already pending",
                });
            }
            
                    // If there's a rejected or accepted request, we can update it to pending
            // This allows users to re-send requests after being rejected
            if (existingRequest.status === "rejected" || existingRequest.status === "accepted") {
            // For private profiles, update existing request to pending
            if (!targetUser.is_profile_public) {
                const updateRequestQuery = `
                        UPDATE ${schema}.follow_requests 
                        SET status = 'pending', requested_at = CURRENT_TIMESTAMP
                        WHERE id = $1
                        RETURNING id
                    `;
                await db.query(updateRequestQuery, [existingRequest.id]);
                
                await db.query("COMMIT");
                return res.status(200).json({
                    success: true,
                    message: "Follow request sent",
                    data: {
                        isFollowing: false,
                        followRequestStatus: "pending"
                    }
                });
            }
            // For public profiles, if there was an accepted request, they should already be following
            // If there was a rejected request, we can proceed to follow directly since it's public
        }
        }

        // If profile is public, follow directly
        if (targetUser.is_profile_public) {
            const followQuery = `
        INSERT INTO ${schema}.follows (follower_id, following_id)
        VALUES ($1, $2)
        RETURNING id
      `;
            const followResult = await db.query(followQuery, [followerId, targetId]);

            // Update followers summary for both users
            await updateFollowersSummary(followerId, targetId);

            await db.query("COMMIT");
            return res.status(200).json({
                success: true,
                message: "You are now following this user",
                data: {
                    isFollowing: true,
                    followRequestStatus: null
                }
            });
        }
        // If private, create a follow request
        else {
            // Use UPSERT (INSERT ... ON CONFLICT) to handle any edge case duplicates
            const requestQuery = `
        INSERT INTO ${schema}.follow_requests (requester_id, target_id, status, requested_at)
        VALUES ($1, $2, 'pending', CURRENT_TIMESTAMP)
        ON CONFLICT (requester_id, target_id)
        DO UPDATE SET 
            status = 'pending',
            requested_at = CURRENT_TIMESTAMP
        RETURNING id
      `;
            await db.query(requestQuery, [followerId, targetId]);

            await db.query("COMMIT");
            return res.status(200).json({
                success: true,
                message: "Follow request sent",
                data: {
                    isFollowing: false,
                    followRequestStatus: "pending"
                }
            });
        }
    } catch (error) {
        await db.query("ROLLBACK");
        console.error("Follow user error:", error);
        next(error);
    }
};

// Unfollow a user
exports.unfollowUser = async (req, res, next) => {
    try {
        const followerId = req.user.id;
        const { targetUserName } = req.params;

        // Get target user ID from username
        const targetUserQuery = `SELECT id FROM ${schema}.users WHERE user_name = $1`;
        const targetUserResult = await db.query(targetUserQuery, [targetUserName]);
        
        if (targetUserResult.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: "User not found",
            });
        }
        
        const targetId = targetUserResult.rows[0].id;

        // Check if actually following
        const followCheckQuery = `SELECT id FROM ${schema}.follows WHERE follower_id = $1 AND following_id = $2`;
        const followCheckResult = await db.query(followCheckQuery, [
            followerId,
            targetId,
        ]);

        if (followCheckResult.rows.length === 0) {
            return res.status(400).json({
                success: false,
                message: "Not following this user",
            });
        }

        // Begin transaction
        await db.query("BEGIN");

        // Delete the follow relationship
        const unfollowQuery = `DELETE FROM ${schema}.follows WHERE follower_id = $1 AND following_id = $2`;
        await db.query(unfollowQuery, [followerId, targetId]);

        // Also clear any follow requests (in case user was following through a request)
        const clearRequestsQuery = `DELETE FROM ${schema}.follow_requests WHERE requester_id = $1 AND target_id = $2`;
        await db.query(clearRequestsQuery, [followerId, targetId]);

        // Update followers summary for both users
        await updateFollowersSummary(followerId, targetId);

        await db.query("COMMIT");

        return res.status(200).json({
            success: true,
            message: "You have unfollowed this user",
            data: {
                isFollowing: false,
                followRequestStatus: null
            }
        });
    } catch (error) {
        await db.query("ROLLBACK");
        console.error("Unfollow user error:", error);
        next(error);
    }
};

// Cancel a follow request
exports.cancelFollowRequest = async (req, res, next) => {
    try {
        const requesterId = req.user.id;
        const { targetUserName } = req.params;

        // Get target user ID from username
        const targetUserQuery = `SELECT id FROM ${schema}.users WHERE user_name = $1`;
        const targetUserResult = await db.query(targetUserQuery, [targetUserName]);
        
        if (targetUserResult.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: "User not found",
            });
        }
        
        const targetId = targetUserResult.rows[0].id;

        // Check if request exists
        const requestCheckQuery = `SELECT id FROM ${schema}.follow_requests WHERE requester_id = $1 AND target_id = $2 AND status = 'pending'`;
        const requestCheckResult = await db.query(requestCheckQuery, [
            requesterId,
            targetId,
        ]);

        if (requestCheckResult.rows.length === 0) {
            return res.status(400).json({
                success: false,
                message: "No pending follow request found",
            });
        }

        // Delete the request
        const deleteRequestQuery = `DELETE FROM ${schema}.follow_requests WHERE requester_id = $1 AND target_id = $2`;
        await db.query(deleteRequestQuery, [requesterId, targetId]);

        return res.status(200).json({
            success: true,
            message: "Follow request cancelled",
        });
    } catch (error) {
        console.error("Cancel follow request error:", error);
        next(error);
    }
};

// Get pending follow requests for the current user
exports.getPendingRequests = async (req, res, next) => {
    try {
        const userId = req.user.id;

        // Get all incoming follow requests
        const requestsQuery = `
      SELECT fr.id, fr.requester_id, fr.requested_at, fr.status,
             u.first_name, u.last_name, u.profile_picture_url
      FROM ${schema}.follow_requests fr
      JOIN ${schema}.users u ON fr.requester_id = u.id
      WHERE fr.target_id = $1 AND fr.status = 'pending'
      ORDER BY fr.requested_at DESC
    `;
        const requestsResult = await db.query(requestsQuery, [userId]);

        return res.status(200).json({
            success: true,
            data: {
                requests: requestsResult.rows.map((req) => ({
                    id: req.id,
                    requesterId: req.requester_id,
                    requesterName: `${req.first_name} ${req.last_name}`,
                    requesterPicture: req.profile_picture_url,
                    requestedAt: req.requested_at,
                })),
            },
        });
    } catch (error) {
        console.error("Get follow requests error:", error);
        next(error);
    }
};

// Respond to a follow request (accept or reject)
exports.respondToFollowRequest = async (req, res, next) => {
    try {
        const userId = req.user.id;
        const { requestId } = req.params;
        const { action } = req.body;

        if (!["accept", "reject"].includes(action)) {
            const error = new Error("Action must be accept or reject");
            error.status = 400;
            error.code = "INVALID_ACTION";
            return next(error);
        }

        // Check if request exists and belongs to the current user
        const requestCheckQuery = `
      SELECT id, requester_id, target_id 
      FROM ${schema}.follow_requests 
      WHERE id = $1 AND target_id = $2 AND status = 'pending'
    `;
        const requestCheckResult = await db.query(requestCheckQuery, [
            requestId,
            userId,
        ]);

        if (requestCheckResult.rows.length === 0) {
            const error = new Error(
                "Follow request not found or already processed"
            );
            error.status = 404;
            error.code = "REQUEST_NOT_FOUND";
            return next(error);
        }

        const request = requestCheckResult.rows[0];

        // Begin transaction
        await db.query("BEGIN");

        // Update the request status
        const updateRequestQuery = `
      UPDATE ${schema}.follow_requests
      SET status = $1
      WHERE id = $2
      RETURNING id
    `;
        await db.query(updateRequestQuery, [
            action === "accept" ? "accepted" : "rejected",
            requestId,
        ]);

        // If accepted, create a follow relationship
        if (action === "accept") {
            const followQuery = `
        INSERT INTO ${schema}.follows (follower_id, following_id)
        VALUES ($1, $2)
        RETURNING id
      `;
            await db.query(followQuery, [request.requester_id, userId]);

            // Update followers summary
            await updateFollowersSummary(request.requester_id, userId);
        }

        await db.query("COMMIT");

        return res.status(200).json({
            success: true,
            message:
                action === "accept"
                    ? "Follow request accepted"
                    : "Follow request rejected",
        });
    } catch (error) {
        await db.query("ROLLBACK");
        console.error("Respond to follow request error:", error);
        next(error);
    }
};

// Get followers list
exports.getFollowers = async (req, res, next) => {
    try {
        const userId = req.user.id;



        const followersQuery = `
      SELECT u.id, u.first_name, u.last_name, u.user_name, u.bio, u.profile_picture_url, f.followed_at, u.is_profile_public,
             CASE WHEN f2.follower_id IS NOT NULL THEN true ELSE false END AS is_following,
             CASE WHEN fr.requester_id IS NOT NULL THEN fr.status ELSE NULL END AS follow_request_status
      FROM ${schema}.follows f
      JOIN ${schema}.users u ON f.follower_id = u.id
      LEFT JOIN ${schema}.follows f2 ON f2.following_id = u.id AND f2.follower_id = $1
      LEFT JOIN ${schema}.follow_requests fr ON fr.target_id = u.id AND fr.requester_id = $1
      WHERE f.following_id = $1
      ORDER BY f.followed_at DESC
    `;
        
        const followersResult = await db.query(followersQuery, [userId]);

        return res.status(200).json({
            success: true,
            data: {
                count: followersResult.rows.length,
                followers: followersResult.rows.map((follower) => ({
                    id: follower.id,
                    firstName: follower.first_name,
                    lastName: follower.last_name,
                    userName: follower.user_name,
                    bio: follower.bio,
                    profilePictureUrl: follower.profile_picture_url,
                    followedAt: follower.followed_at,
                    isProfilePublic: follower.is_profile_public,
                    isFollowing: follower.is_following,
                    followRequestStatus: follower.follow_request_status
                })),
            },
        });
    } catch (error) {
        console.error("Get followers error:", error);
        next(error);
    }
};

// Get another user's followers list
exports.getUserFollowers = async (req, res, next) => {
    try {
        const currentUserId = req.user.id; // The logged-in user
        const targetUserId = req.params.userId; // The user whose followers we want to see



        // Check if target user exists
        const userCheckQuery = `SELECT id, first_name, last_name, user_name, is_profile_public FROM ${schema}.users WHERE id = $1`;
        const userCheckResult = await db.query(userCheckQuery, [targetUserId]);

        if (userCheckResult.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: "User not found",
            });
        }

        const targetUser = userCheckResult.rows[0];

        // If profile is private, only show followers if the current user is following them
        if (!targetUser.is_profile_public) {
            const followCheckQuery = `SELECT id FROM ${schema}.follows WHERE follower_id = $1 AND following_id = $2`;
            const followCheckResult = await db.query(followCheckQuery, [currentUserId, targetUserId]);

            if (followCheckResult.rows.length === 0) {
                return res.status(403).json({
                    success: false,
                    message: "Cannot view followers of private profile",
                });
            }
        }

        const followersQuery = `
      SELECT u.id, u.first_name, u.last_name, u.user_name, u.bio, u.profile_picture_url, f.followed_at, u.is_profile_public,
             CASE WHEN f2.follower_id IS NOT NULL THEN true ELSE false END AS is_following,
             CASE WHEN fr.requester_id IS NOT NULL THEN fr.status ELSE NULL END AS follow_request_status
      FROM ${schema}.follows f
      JOIN ${schema}.users u ON f.follower_id = u.id
      LEFT JOIN ${schema}.follows f2 ON f2.following_id = u.id AND f2.follower_id = $1
      LEFT JOIN ${schema}.follow_requests fr ON fr.target_id = u.id AND fr.requester_id = $1
      WHERE f.following_id = $2
      ORDER BY f.followed_at DESC
    `;
        
        const followersResult = await db.query(followersQuery, [currentUserId, targetUserId]);

        return res.status(200).json({
            success: true,
            data: {
                count: followersResult.rows.length,
                followers: followersResult.rows.map((follower) => ({
                    id: follower.id,
                    firstName: follower.first_name,
                    lastName: follower.last_name,
                    userName: follower.user_name,
                    bio: follower.bio,
                    profilePictureUrl: follower.profile_picture_url,
                    followedAt: follower.followed_at,
                    isProfilePublic: follower.is_profile_public,
                    isFollowing: follower.is_following,
                    followRequestStatus: follower.follow_request_status
                })),
            },
        });
    } catch (error) {
        console.error("Get user followers error:", error);
        next(error);
    }
};

// Get following list
exports.getFollowing = async (req, res, next) => {
    try {
        const userId = req.user.id;

        const followingQuery = `
      SELECT u.id, u.first_name, u.last_name, u.user_name, u.bio, u.profile_picture_url, f.followed_at, u.is_profile_public,
             CASE WHEN f2.follower_id IS NOT NULL THEN true ELSE false END AS is_following,
             CASE WHEN fr.requester_id IS NOT NULL THEN fr.status ELSE NULL END AS follow_request_status
      FROM ${schema}.follows f
      JOIN ${schema}.users u ON f.following_id = u.id
      LEFT JOIN ${schema}.follows f2 ON f2.following_id = u.id AND f2.follower_id = $1
      LEFT JOIN ${schema}.follow_requests fr ON fr.target_id = u.id AND fr.requester_id = $1
      WHERE f.follower_id = $1
      ORDER BY f.followed_at DESC
    `;
        const followingResult = await db.query(followingQuery, [userId]);

        return res.status(200).json({
            success: true,
            data: {
                count: followingResult.rows.length,
                following: followingResult.rows.map((following) => ({
                    id: following.id,
                    firstName: following.first_name,
                    lastName: following.last_name,
                    userName: following.user_name,
                    bio: following.bio,
                    profilePictureUrl: following.profile_picture_url,
                    followedAt: following.followed_at,
                    isProfilePublic: following.is_profile_public,
                    isFollowing: following.is_following,
                    followRequestStatus: following.follow_request_status
                })),
            },
        });
    } catch (error) {
        console.error("Get following error:", error);
        next(error);
    }
};

// Get another user's following list
exports.getUserFollowing = async (req, res, next) => {
    try {
        const currentUserId = req.user.id; // The logged-in user
        const targetUserId = req.params.userId; // The user whose following list we want to see



        // Check if target user exists
        const userCheckQuery = `SELECT id, first_name, last_name, user_name, is_profile_public FROM ${schema}.users WHERE id = $1`;
        const userCheckResult = await db.query(userCheckQuery, [targetUserId]);

        if (userCheckResult.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: "User not found",
            });
        }

        const targetUser = userCheckResult.rows[0];

        // If profile is private, only show following list if the current user is following them
        if (!targetUser.is_profile_public) {
            const followCheckQuery = `SELECT id FROM ${schema}.follows WHERE follower_id = $1 AND following_id = $2`;
            const followCheckResult = await db.query(followCheckQuery, [currentUserId, targetUserId]);

            if (followCheckResult.rows.length === 0) {
                return res.status(403).json({
                    success: false,
                    message: "Cannot view following list of private profile",
                });
            }
        }

        const followingQuery = `
      SELECT u.id, u.first_name, u.last_name, u.user_name, u.bio, u.profile_picture_url, f.followed_at, u.is_profile_public,
             CASE WHEN f2.follower_id IS NOT NULL THEN true ELSE false END AS is_following,
             CASE WHEN fr.requester_id IS NOT NULL THEN fr.status ELSE NULL END AS follow_request_status
      FROM ${schema}.follows f
      JOIN ${schema}.users u ON f.following_id = u.id
      LEFT JOIN ${schema}.follows f2 ON f2.following_id = u.id AND f2.follower_id = $1
      LEFT JOIN ${schema}.follow_requests fr ON fr.target_id = u.id AND fr.requester_id = $1
      WHERE f.follower_id = $2
      ORDER BY f.followed_at DESC
    `;
        
        const followingResult = await db.query(followingQuery, [currentUserId, targetUserId]);

        return res.status(200).json({
            success: true,
            data: {
                count: followingResult.rows.length,
                following: followingResult.rows.map((following) => ({
                    id: following.id,
                    firstName: following.first_name,
                    lastName: following.last_name,
                    userName: following.user_name,
                    bio: following.bio,
                    profilePictureUrl: following.profile_picture_url,
                    followedAt: following.followed_at,
                    isProfilePublic: following.is_profile_public,
                    isFollowing: following.is_following,
                    followRequestStatus: following.follow_request_status
                })),
            },
        });
    } catch (error) {
        console.error("Get user following error:", error);
        next(error);
    }
};

// Remove a follower (current user removes someone who is following them)
exports.removeFollower = async (req, res, next) => {
    try {
        const currentUserId = req.user.id; // The user whose profile this is
        const { followerUserName } = req.params; // The user to remove as a follower

        // Get follower user ID from username
        const followerUserQuery = `SELECT id FROM ${schema}.users WHERE user_name = $1`;
        const followerUserResult = await db.query(followerUserQuery, [followerUserName]);
        
        if (followerUserResult.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: "User not found",
            });
        }
        
        const followerId = followerUserResult.rows[0].id;

        // Check if the follower relationship exists
        const followCheckQuery = `SELECT id FROM ${schema}.follows WHERE follower_id = $1 AND following_id = $2`;
        const followCheckResult = await db.query(followCheckQuery, [followerId, currentUserId]);

        if (followCheckResult.rows.length === 0) {
            return res.status(400).json({
                success: false,
                message: "This user is not following you",
            });
        }

        // Begin transaction
        await db.query("BEGIN");

        // Delete the follow relationship
        const removeFollowerQuery = `DELETE FROM ${schema}.follows WHERE follower_id = $1 AND following_id = $2`;
        const deleteResult = await db.query(removeFollowerQuery, [followerId, currentUserId]);

        // Update followers summary for both users
        await updateFollowersSummary(followerId, currentUserId);

        await db.query("COMMIT");

        return res.status(200).json({
            success: true,
            message: "Follower removed successfully",
        });
    } catch (error) {
        await db.query("ROLLBACK");
        console.error("Remove follower error:", error);
        next(error);
    }
};

// Helper function to update followers/following counts
async function updateFollowersSummary(followerId, followingId) {
    try {
        // Update follower's following count (how many people they follow)
        const updateFollowerQuery = `
            INSERT INTO ${schema}.followers_summary (user_id, following_count, followers_count, updated_at)
            SELECT 
                $1, 
                COUNT(*) AS following_count,
                COALESCE((SELECT followers_count FROM ${schema}.followers_summary WHERE user_id = $1), 0) AS followers_count,
                CURRENT_TIMESTAMP
            FROM ${schema}.follows 
            WHERE follower_id = $1
            ON CONFLICT (user_id) 
            DO UPDATE SET 
                following_count = EXCLUDED.following_count,
                updated_at = CURRENT_TIMESTAMP
        `;
        const followerResult = await db.query(updateFollowerQuery, [followerId]);

        // Update following user's followers count (how many people follow them)
        const updateFollowingQuery = `
            INSERT INTO ${schema}.followers_summary (user_id, followers_count, following_count, updated_at)
            SELECT 
                $1, 
                COUNT(*) AS followers_count,
                COALESCE((SELECT following_count FROM ${schema}.followers_summary WHERE user_id = $1), 0) AS following_count,
                CURRENT_TIMESTAMP
            FROM ${schema}.follows 
            WHERE following_id = $1
            ON CONFLICT (user_id) 
            DO UPDATE SET 
                followers_count = EXCLUDED.followers_count,
                updated_at = CURRENT_TIMESTAMP
        `;
        const followingResult = await db.query(updateFollowingQuery, [followingId]);
    } catch (error) {
        console.error("Error updating followers summary:", error);
        throw error;
    }
}
