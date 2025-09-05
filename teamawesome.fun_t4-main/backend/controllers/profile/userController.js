const bcrypt = require("bcrypt");
const db = require("../../db/db");

const schema =
  process.env.NODE_ENV == "production"
    ? process.env.DB_SCHEMA
    : (process.env.DEV_SCHEMA || 'public');

// Get user profile
exports.getProfile = async (req, res, next) => {
  try {
    const userId = req.user.id;

    const profileQuery = `
      SELECT id, first_name, last_name, user_name, email, bio, profile_picture_url, is_profile_public, created_at 
      FROM ${schema}.users 
      WHERE id = $1
    `;
    const profileResult = await db.query(profileQuery, [userId]);

    if (profileResult.rows.length === 0) {
      const error = new Error("Profile not found");
      error.status = 404;
      error.code = "PROFILE_NOT_FOUND";
      return next(error);
    }

    const profile = profileResult.rows[0];

        // Get user links
        const linksQuery = `
      SELECT id, title, url
      FROM ${schema}.user_links
      WHERE user_id = $1
      ORDER BY created_at DESC
    `;
    const linksResult = await db.query(linksQuery, [userId]);

    // Get followers and following counts
    const countsQuery = `
      SELECT followers_count, following_count
      FROM ${schema}.followers_summary
      WHERE user_id = $1
    `;
    const countsResult = await db.query(countsQuery, [userId]);
    const counts = countsResult.rows[0] || {
      followers_count: 0,
      following_count: 0,
    };

    const profileResponse = {
        id: profile.id,
        firstName: profile.first_name,
        lastName: profile.last_name,
        userName: profile.user_name,
        email: profile.email,
        bio: profile.bio || null,
        profilePictureUrl: profile.profile_picture_url || null,
        isProfilePublic: profile.is_profile_public,
        createdAt: profile.created_at,
        followersCount: counts.followers_count,
        followingCount: counts.following_count,
        links: linksResult.rows.map((link) => ({
            id: link.id,
            title: link.title,
            url: link.url,
        })),
    };
    


        return res.status(200).json({
            success: true,
            data: {
                profile: profileResponse,
            },
        });
    } catch (error) {
        console.error("Get profile error:", error);
        next(error);
    }
};

// Update name
exports.updateName = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { firstName, lastName } = req.body;



    const updateQuery = `
      UPDATE ${schema}.users
      SET first_name = $1, last_name = $2
      WHERE id = $3
      RETURNING id, first_name, last_name
    `;
    const result = await db.query(updateQuery, [firstName, lastName, userId]);

    if (result.rows.length === 0) {
      const error = new Error("User not found");
      error.status = 404;
      error.code = "USER_NOT_FOUND";
      return next(error);
    }

    return res.status(200).json({
      success: true,
      data: {
        user: {
          id: result.rows[0].id,
          firstName: result.rows[0].first_name,
          lastName: result.rows[0].last_name,
        },
      },
      message: "Name updated successfully",
    });
  } catch (error) {
    console.error("Update name error:", error);
    next(error);
  }
};

// Update bio
exports.updateBio = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { bio } = req.body;

    const updateQuery = `
      UPDATE ${schema}.users
      SET bio = $1
      WHERE id = $2
      RETURNING id, bio
    `;
    const result = await db.query(updateQuery, [bio, userId]);

    if (result.rows.length === 0) {
      const error = new Error("User not found");
      error.status = 404;
      error.code = "USER_NOT_FOUND";
      return next(error);
    }

    return res.status(200).json({
      success: true,
      data: {
        user: {
          id: result.rows[0].id,
          bio: result.rows[0].bio,
        },
      },
      message: "Bio updated successfully",
    });
  } catch (error) {
    console.error("Update bio error:", error);
    next(error);
  }
};

// Update profile visibility
exports.updateProfileVisibility = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { isPublic } = req.body;
    


    // Validate the request body
    if (typeof isPublic !== 'boolean') {
      const error = new Error("isPublic must be a boolean value");
      error.status = 400;
      error.code = "INVALID_REQUEST";
      return next(error);
    }

    // Update the is_profile_public status to the specified value
    const updateQuery = `
      UPDATE ${schema}.users
      SET is_profile_public = $1
      WHERE id = $2
      RETURNING id, is_profile_public
    `;


    const result = await db.query(updateQuery, [isPublic, userId]);

    if (result.rows.length === 0) {
      const error = new Error("User not found");
      error.status = 404;
      error.code = "USER_NOT_FOUND";
      return next(error);
    }



    return res.status(200).json({
      success: true,
      data: {
        isProfilePublic: result.rows[0].is_profile_public,
      },
      message: `Profile is now ${
        result.rows[0].is_profile_public ? "public" : "private"
      }`,
    });
  } catch (error) {
    console.error("Update profile visibility error:", error);
    next(error);
  }
};

// Delete account
exports.deleteAccount = async (req, res, next) => {
  try {
    const userId = req.user.id;

    // Begin transaction
    await db.query("BEGIN");

    // Delete user links
    const deleteLinksQuery = `DELETE FROM ${schema}.user_links WHERE user_id = $1`;
    await db.query(deleteLinksQuery, [userId]);

    // Delete password reset tokens if any
    const deleteTokensQuery = `DELETE FROM ${schema}.password_resets WHERE user_id = $1`;
    await db.query(deleteTokensQuery, [userId]);

    // Delete the user
    const deleteUserQuery = `DELETE FROM ${schema}.users WHERE id = $1`;
    await db.query(deleteUserQuery, [userId]);

    // Commit transaction
    await db.query("COMMIT");

    return res.status(200).json({
      success: true,
      message: "Account deleted successfully",
    });
  } catch (error) {
    // Rollback transaction in case of error
    await db.query("ROLLBACK");
    console.error("Delete account error:", error);
    next(error);
  }
};
