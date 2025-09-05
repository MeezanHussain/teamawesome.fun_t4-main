const db = require("../../db/db");

const schema =
  process.env.NODE_ENV == "production"
    ? process.env.DB_SCHEMA
    : (process.env.DEV_SCHEMA || 'public');

// Search users
exports.searchUsers = async (req, res, next) => {
  try {
    const { query, page = 1, limit = 10 } = req.query;
    const searchTerms = query ? query.trim() : "";
    const currentUserId = req.user ? req.user.id : null; // Get current user ID if authenticated

    // Validate pagination parameters
    const pageNum = Math.max(1, parseInt(page) || 1);
    const limitNum = Math.min(20, Math.max(5, parseInt(limit) || 10)); // Limit between 5-20, default 10
    const offset = (pageNum - 1) * limitNum;

    let searchQuery;
    let countQuery;
    let queryParams;

    if (!searchTerms || searchTerms.length < 2) {
      // If no search terms, return all users (for suggestions)
      if (currentUserId) {
        // Authenticated user - exclude current user
        searchQuery = `
          SELECT u.id, u.first_name, u.last_name, u.user_name, u.bio, u.profile_picture_url, u.is_profile_public, 
                 COALESCE(fs.followers_count, 0) AS followers_count, 
                 COALESCE(fs.following_count, 0) AS following_count,
                 CASE WHEN f.follower_id IS NOT NULL THEN true ELSE false END AS is_following,
                 CASE WHEN fr.requester_id IS NOT NULL THEN fr.status ELSE NULL END AS follow_request_status
          FROM ${schema}.users u
          LEFT JOIN ${schema}.followers_summary fs ON u.id = fs.user_id
          LEFT JOIN ${schema}.follows f ON f.following_id = u.id AND f.follower_id = $1
          LEFT JOIN ${schema}.follow_requests fr ON fr.target_id = u.id AND fr.requester_id = $1
          WHERE u.id != $1
          ORDER BY u.first_name, u.last_name
          LIMIT $2 OFFSET $3
        `;
        countQuery = `
          SELECT COUNT(*) as total
          FROM ${schema}.users u
          WHERE u.id != $1
        `;
        queryParams = [currentUserId, limitNum, offset];
        countParams = [currentUserId];
      } else {
        // Unauthenticated user - show all users
        searchQuery = `
          SELECT u.id, u.first_name, u.last_name, u.user_name, u.bio, u.profile_picture_url, u.is_profile_public, 
                 COALESCE(fs.followers_count, 0) AS followers_count, 
                 COALESCE(fs.following_count, 0) AS following_count,
                 false AS is_following,
                 NULL AS follow_request_status
          FROM ${schema}.users u
          LEFT JOIN ${schema}.followers_summary fs ON u.id = fs.user_id
          ORDER BY u.first_name, u.last_name
          LIMIT $1 OFFSET $2
        `;
        countQuery = `
          SELECT COUNT(*) as total
          FROM ${schema}.users u
        `;
        queryParams = [limitNum, offset];
        countParams = [];
      }
    } else {
      // If search terms provided, search by name
      if (currentUserId) {
        // Authenticated user - exclude current user
        searchQuery = `
          SELECT u.id, u.first_name, u.last_name, u.user_name, u.bio, u.profile_picture_url, u.is_profile_public, 
                 COALESCE(fs.following_count, 0) AS following_count,
                 COALESCE(fs.followers_count, 0) AS followers_count, 
                 CASE WHEN f.follower_id IS NOT NULL THEN true ELSE false END AS is_following,
                 CASE WHEN fr.requester_id IS NOT NULL THEN fr.status ELSE NULL END AS follow_request_status
          FROM ${schema}.users u
          LEFT JOIN ${schema}.followers_summary fs ON u.id = fs.user_id
          LEFT JOIN ${schema}.follows f ON f.following_id = u.id AND f.follower_id = $2
          LEFT JOIN ${schema}.follow_requests fr ON fr.target_id = u.id AND fr.requester_id = $2
          WHERE 
            (
              LOWER(u.first_name) LIKE LOWER($1) OR
              LOWER(u.last_name) LIKE LOWER($1) OR
              LOWER(CONCAT(u.first_name, ' ', u.last_name)) LIKE LOWER($1)
            )
            AND u.id != $2
          ORDER BY u.first_name, u.last_name
          LIMIT $3 OFFSET $4
        `;
        countQuery = `
          SELECT COUNT(*) as total
          FROM ${schema}.users u
          WHERE 
            (
              LOWER(u.first_name) LIKE LOWER($1) OR
              LOWER(u.last_name) LIKE LOWER($1) OR
              LOWER(CONCAT(u.first_name, ' ', u.last_name)) LIKE LOWER($1)
            )
            AND u.id != $2
        `;
        queryParams = [`%${searchTerms}%`, currentUserId, limitNum, offset];
        countParams = [`%${searchTerms}%`, currentUserId];
      } else {
        // Unauthenticated user - show all matching users
        searchQuery = `
          SELECT u.id, u.first_name, u.last_name, u.user_name, u.bio, u.profile_picture_url, u.is_profile_public, 
                 COALESCE(fs.following_count, 0) AS following_count,
                 COALESCE(fs.followers_count, 0) AS followers_count, 
                 false AS is_following,
                 NULL AS follow_request_status
          FROM ${schema}.users u
          LEFT JOIN ${schema}.followers_summary fs ON u.id = fs.user_id
          WHERE 
            (
              LOWER(u.first_name) LIKE LOWER($1) OR
              LOWER(u.last_name) LIKE LOWER($1) OR
              LOWER(CONCAT(u.first_name, ' ', u.last_name)) LIKE LOWER($1)
            )
          ORDER BY u.first_name, u.last_name
          LIMIT $2 OFFSET $3
        `;
        countQuery = `
          SELECT COUNT(*) as total
          FROM ${schema}.users u
          WHERE 
            (
              LOWER(u.first_name) LIKE LOWER($1) OR
              LOWER(u.last_name) LIKE LOWER($1) OR
              LOWER(CONCAT(u.first_name, ' ', u.last_name)) LIKE LOWER($1)
            )
        `;
        queryParams = [`%${searchTerms}%`, limitNum, offset];
        countParams = [`%${searchTerms}%`];
      }
    }

    // Execute both queries in parallel
    const [searchResult, countResult] = await Promise.all([
      db.query(searchQuery, queryParams),
      db.query(countQuery, countParams)
    ]);

    const totalUsers = parseInt(countResult.rows[0]?.total || 0);
    const totalPages = Math.ceil(totalUsers / limitNum);
    const hasNextPage = pageNum < totalPages;
    const hasPrevPage = pageNum > 1;

    return res.status(200).json({
      success: true,
      data: {
        users: searchResult.rows.map((user) => ({
          id: user.id,
          firstName: user.first_name,
          lastName: user.last_name,
          userName: user.user_name,
          bio: user.bio
            ? user.bio.length > 100
              ? `${user.bio.substring(0, 100)}...`
              : user.bio
            : null,
          profilePictureUrl: user.profile_picture_url,
          followersCount: parseInt(user.followers_count),
          followingCount: parseInt(user.following_count),
          isProfilePublic: user.is_profile_public,
          isFollowing: user.is_following,
          followRequestStatus: user.follow_request_status,
        })),
        pagination: {
          currentPage: pageNum,
          totalPages: totalPages,
          totalUsers: totalUsers,
          limit: limitNum,
          hasNextPage: hasNextPage,
          hasPrevPage: hasPrevPage
        }
      },
    });
  } catch (error) {
    console.error("Search users error:", error);
    next(error);
  }
};

// Get public profile - now accessible without authentication
exports.getPublicProfile = async (req, res, next) => {
  try {
    const { userName } = req.params;
    const currentUserName = req.user?.userName || null;
    const currentUserId = req.user?.id || null; // May be null for unauthenticated users

    //Get user details
    const userQuery = `SELECT id FROM ${schema}.users WHERE user_name = $1`;
    const userResult = await db.query(userQuery, [userName]);
    
    if (userResult.rows.length === 0) {
      const error = new Error("User not found");
      error.status = 404;
      error.code = "USER_NOT_FOUND";
      return next(error);
    }
    
    const userId = userResult.rows[0].id;

    // Query to get user profile
    const profileQuery = `
      SELECT u.id, u.first_name, u.last_name, u.user_name, u.bio, u.profile_picture_url, u.is_profile_public, u.created_at,
             COALESCE(fs.followers_count, 0) AS followers_count,
             COALESCE(fs.following_count, 0) AS following_count,
             CASE WHEN f.follower_id IS NOT NULL THEN true ELSE false END AS is_following,
             CASE WHEN fr.requester_id IS NOT NULL AND fr.status = 'pending' THEN fr.status ELSE NULL END AS follow_request_status
      FROM ${schema}.users u
      LEFT JOIN ${schema}.followers_summary fs ON u.id = fs.user_id
      LEFT JOIN ${schema}.follows f ON f.following_id = u.id AND f.follower_id = $2
      LEFT JOIN ${schema}.follow_requests fr ON fr.target_id = u.id AND fr.requester_id = $2
      WHERE u.id = $1
    `;

    const profileResult = await db.query(profileQuery, [userId, currentUserId]);

    // If no user found
    if (profileResult.rows.length === 0) {
      const error = new Error("Profile not found");
      error.status = 404;
      error.code = "PROFILE_NOT_FOUND";
      return next(error);
    }

    const profile = profileResult.rows[0];

    // Check access control
    const canViewFullProfile = profile.is_profile_public || profile.is_following || currentUserId === userId;
    
    if (!canViewFullProfile) {
      // Return limited profile info for private profiles
      return res.status(200).json({
        success: true,
        data: {
          profile: {
            id: profile.id,
            firstName: profile.first_name,
            lastName: profile.last_name,
            userName: profile.user_name,
            profilePictureUrl: profile.profile_picture_url || null,
            isProfilePublic: profile.is_profile_public,
            createdAt: profile.created_at,
            followersCount: parseInt(profile.followers_count),
            followingCount: parseInt(profile.following_count),
            isFollowing: profile.is_following || false,
            followRequestStatus: profile.follow_request_status || null,
            links: [],
            projects: [],
            canViewFullProfile: false,
            accessMessage: currentUserId ? "This profile is private. Follow to see their content." : "Please log in to view this profile."
          },
        },
      });
    }

    // User can view full profile - get links and projects
    let links = [];
    let projects = [];
    
    if (canViewFullProfile) {
      // Get user public links
      const linksQuery = `
        SELECT id, title, url
        FROM ${schema}.user_links
        WHERE user_id = $1
        ORDER BY created_at DESC
      `;

      const linksResult = await db.query(linksQuery, [userId]);
      links = linksResult.rows.map((link) => ({
        id: link.id,
        title: link.title,
        url: link.url,
      }));

      // Get user projects
      const projectsQuery = `
        SELECT 
          p.id,
          p.title,
          p.description,
          p.image_urls,
          p.created_at,
          COUNT(pl.id) as likes_count
        FROM ${schema}.projects p
        LEFT JOIN ${schema}.project_likes pl ON p.id = pl.project_id
        WHERE p.user_id = $1
        GROUP BY p.id
        ORDER BY p.created_at DESC
      `;

      const projectsResult = await db.query(projectsQuery, [userId]);
      projects = projectsResult.rows;
    }

    return res.status(200).json({
      success: true,
      data: {
        profile: {
          id: profile.id,
          firstName: profile.first_name,
          lastName: profile.last_name,
          userName: profile.user_name,
          bio: profile.bio || null,
          profilePictureUrl: profile.profile_picture_url || null,
          isProfilePublic: profile.is_profile_public,
          createdAt: profile.created_at,
          followersCount: parseInt(profile.followers_count),
          followingCount: parseInt(profile.following_count),
          isFollowing: profile.is_following || false,
          followRequestStatus: profile.follow_request_status || null,
          links: links,
          projects: projects,
          canViewFullProfile: true,
          accessMessage: null
        },
      },
    });
  } catch (error) {
    console.error("Get public profile error:", error);
    next(error);
  }
};