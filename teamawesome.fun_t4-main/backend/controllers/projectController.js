const db = require("../db/db");
const s3Service = require("../utils/s3Service");

const schema =
  process.env.NODE_ENV === "production"
    ? process.env.DB_SCHEMA
    : (process.env.DEV_SCHEMA || 'public');

// Create a new project
const createProject = async (req, res, next) => {
  try {
    const { title, description } = req.body;
    const userId = req.user.id;
    const files = req.files || [];



    // Validate required fields
    if (!title || title.trim().length < 3) {
      const error = new Error("Title must be at least 3 characters long");
      error.status = 400;
      return next(error);
    }

    if (title.length > 100) {
      const error = new Error("Title cannot exceed 100 characters");
      error.status = 400;
      return next(error);
    }

    if (description && description.length > 500) {
      const error = new Error("Description cannot exceed 500 characters");
      error.status = 400;
      return next(error);
    }

    // Upload images to S3 if provided
    let imageUrls = [];
    if (files.length > 0) {
      const uploadPromises = files.map((file) =>
        s3Service.uploadProjectImage(
          file.buffer,
          file.originalname,
          file.mimetype
        )
      );
      imageUrls = await Promise.all(uploadPromises);
    }

    // Insert project into database
    const query = `
      INSERT INTO ${schema}.projects (user_id, title, description, image_urls)
      VALUES ($1, $2, $3, $4)
      RETURNING id, title, description, image_urls, created_at
    `;

    const result = await db.query(query, [
      userId,
      title.trim(),
      description?.trim() || null,
      imageUrls,
    ]);
    const project = result.rows[0];



    res.status(201).json({
      success: true,
      message: "Project created successfully",
      project: project,
    });
  } catch (error) {
    console.error("Create project error:", error);

    // If S3 upload failed, clean up any uploaded files
    if (req.uploadedUrls) {
      try {
        await Promise.all(
          req.uploadedUrls.map((url) => s3Service.deleteFile(url))
        );
      } catch (cleanupError) {
        console.error("Cleanup error:", cleanupError);
      }
    }

    next(error);
  }
};

// Get all projects (feed) - requires authentication
const getProjects = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;



    const query = `
      SELECT 
        p.id,
        p.title,
        p.description,
        p.image_urls,
        p.created_at,
        u.first_name,
        u.last_name,
        u.user_name,
        u.profile_picture_url,
        COUNT(pl.id) as likes_count,
        CASE WHEN user_likes.user_id IS NOT NULL THEN true ELSE false END as is_liked
      FROM ${schema}.projects p
      JOIN ${schema}.users u ON p.user_id = u.id
      LEFT JOIN ${schema}.project_likes pl ON p.id = pl.project_id
      LEFT JOIN ${schema}.project_likes user_likes ON p.id = user_likes.project_id AND user_likes.user_id = $1
      GROUP BY p.id, u.first_name, u.last_name, u.user_name, u.profile_picture_url, user_likes.user_id
      ORDER BY p.created_at DESC
      LIMIT $2 OFFSET $3
    `;

    const result = await db.query(query, [req.user.id, limit, offset]);

    res.json({
      success: true,
      projects: result.rows,
      pagination: {
        page,
        limit,
        hasMore: result.rows.length === limit,
      },
    });
  } catch (error) {
    console.error("Get projects error:", error);
    next(error);
  }
};

// Get public project gallery - no authentication required
const getPublicProjectGallery = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;
    const currentUserId = req.user ? req.user.id : null;

    const query = `
      SELECT 
        p.id,
        p.title,
        p.description,
        p.image_urls,
        p.created_at,
        p.user_id,
        u.first_name,
        u.last_name,
        u.user_name,
        u.profile_picture_url,
        COUNT(pl.id) as likes_count,
        CASE WHEN user_likes.user_id IS NOT NULL THEN true ELSE false END as is_liked
      FROM ${schema}.projects p
      JOIN ${schema}.users u ON p.user_id = u.id
      LEFT JOIN ${schema}.project_likes pl ON p.id = pl.project_id
      LEFT JOIN ${schema}.project_likes user_likes ON p.id = user_likes.project_id AND user_likes.user_id = $1
      WHERE u.is_profile_public = true
      GROUP BY p.id, u.first_name, u.last_name, u.user_name, u.profile_picture_url, user_likes.user_id, p.user_id
      ORDER BY p.created_at DESC
      LIMIT $2 OFFSET $3
    `;

    const result = await db.query(query, [currentUserId, limit, offset]);

    res.json({
      success: true,
      projects: result.rows,
      pagination: {
        page,
        limit,
        hasMore: result.rows.length === limit,
      },
    });
  } catch (error) {
    console.error("Get public project gallery error:", error);
    next(error);
  }
};

// Get user's own projects
const getUserProjects = async (req, res, next) => {
  try {
    const userId = req.params.userId || req.user.id;



    const query = `
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

    const result = await db.query(query, [userId]);

    res.json({
      success: true,
      projects: result.rows,
    });
  } catch (error) {
    console.error("Get user projects error:", error);
    next(error);
  }
};

// Get user projects with access control
const getUserProjectsWithAccess = async (req, res, next) => {
  try {
    const { userId } = req.params;
    const currentUserId = req.user ? req.user.id : null;



    // First check if the current user can view this user's projects
    const accessQuery = `
      SELECT u.is_profile_public,
             CASE WHEN f.follower_id IS NOT NULL THEN true ELSE false END AS is_following,
             CASE WHEN $2 IS NULL THEN false ELSE $2 = $1 END AS is_own_profile
      FROM ${schema}.users u
      LEFT JOIN ${schema}.follows f ON f.following_id = u.id AND f.follower_id = $2
      WHERE u.id = $1
    `;

    const accessResult = await db.query(accessQuery, [userId, currentUserId]);

    if (accessResult.rows.length === 0) {
      const error = new Error("User not found");
      error.status = 404;
      return next(error);
    }

    const access = accessResult.rows[0];
    const canViewProjects = access.is_profile_public || access.is_following || access.is_own_profile;

    if (!canViewProjects) {
      return res.status(403).json({
        success: false,
        error: {
          message: "Access denied. This profile is private and you are not following this user.",
          code: "ACCESS_DENIED"
        }
      });
    }

    // User can view projects - fetch them
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

    const result = await db.query(projectsQuery, [userId]);

    res.json({
      success: true,
      data: {
        projects: result.rows,
        canViewProjects: true
      }
    });
  } catch (error) {
    console.error("Get user projects with access control error:", error);
    next(error);
  }
};

// Delete a project
const deleteProject = async (req, res, next) => {
  try {
    const projectId = req.params.projectId;
    const userId = req.user.id;



    // First, get the project to check ownership and get image URLs
    const getQuery = `
      SELECT user_id, image_urls 
      FROM ${schema}.projects 
      WHERE id = $1
    `;

    const projectResult = await db.query(getQuery, [projectId]);

    if (projectResult.rows.length === 0) {
      const error = new Error("Project not found");
      error.status = 404;
      return next(error);
    }

    const project = projectResult.rows[0];

    if (project.user_id !== userId) {
      const error = new Error("Unauthorized to delete this project");
      error.status = 403;
      return next(error);
    }

    // Delete images from S3
    if (project.image_urls && project.image_urls.length > 0) {
      try {
        await Promise.all(
          project.image_urls.map((url) => s3Service.deleteFile(url))
        );
  
      } catch (s3Error) {
        console.error("S3 deletion error:", s3Error);
        // Continue with database deletion even if S3 deletion fails
      }
    }

    // Delete project from database
    const deleteQuery = `DELETE FROM ${schema}.projects WHERE id = $1`;
    await db.query(deleteQuery, [projectId]);



    res.json({
      success: true,
      message: "Project deleted successfully",
    });
  } catch (error) {
    console.error("Delete project error:", error);
    next(error);
  }
};

// Toggle like on a project
const toggleLike = async (req, res, next) => {
  try {
    const projectId = req.params.projectId;
    const userId = req.user.id;



    // Check if like already exists
    const checkQuery = `
      SELECT id FROM ${schema}.project_likes 
      WHERE user_id = $1 AND project_id = $2
    `;

    const existingLike = await db.query(checkQuery, [userId, projectId]);

    if (existingLike.rows.length > 0) {
      // Remove like
      const deleteQuery = `
        DELETE FROM ${schema}.project_likes 
        WHERE user_id = $1 AND project_id = $2
      `;
      await db.query(deleteQuery, [userId, projectId]);

      res.json({
        success: true,
        message: "Like removed",
        liked: false,
      });
    } else {
      // Add like
      const insertQuery = `
        INSERT INTO ${schema}.project_likes (user_id, project_id)
        VALUES ($1, $2)
      `;
      await db.query(insertQuery, [userId, projectId]);

      res.json({
        success: true,
        message: "Project liked",
        liked: true,
      });
    }
  } catch (error) {
    console.error("Toggle like error:", error);
    next(error);
  }
};

module.exports = {
  createProject,
  getProjects,
  getPublicProjectGallery,
  getUserProjects,
  getUserProjectsWithAccess,
  deleteProject,
  toggleLike,
};
