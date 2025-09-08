const db = require("../db/db");
const s3Service = require("../utils/s3Service");

const schema =
  process.env.NODE_ENV === "production"
    ? process.env.DB_SCHEMA
    : (process.env.DEV_SCHEMA || 'public');

// Create a new Swinburne project
const createSwinburneProject = async (req, res, next) => {
  try {
    const {
      title,
      description,
      unit_code,
      unit_name,
      semester,
      academic_year,
      campus,
      project_type,
      assessment_weight,
      due_date,
      collaboration_status,
      visibility,
      instructor_code,
      tags
    } = req.body;
    
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

    if (description && description.length > 1000) {
      const error = new Error("Description cannot exceed 1000 characters");
      error.status = 400;
      return next(error);
    }

    if (!unit_code || !unit_name || !semester || !academic_year || !campus || !project_type) {
      const error = new Error("All course and project details are required");
      error.status = 400;
      return next(error);
    }

    // Validate Swinburne email for academic projects
    const userEmail = req.user.email;
    if (!userEmail.endsWith('@swin.edu.au') && !userEmail.endsWith('@student.swin.edu.au')) {
      const error = new Error("Swinburne academic projects require a Swinburne University email address");
      error.status = 403;
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

    // Begin transaction
    const client = await db.pool.connect();
    
    try {
      await client.query('BEGIN');

      // First create the base project
      const baseProjectQuery = `
        INSERT INTO ${schema}.projects (user_id, title, description, image_urls)
        VALUES ($1, $2, $3, $4)
        RETURNING id, created_at
      `;

      const baseProjectResult = await client.query(baseProjectQuery, [
        userId,
        title.trim(),
        description?.trim() || null,
        imageUrls,
      ]);

      const baseProject = baseProjectResult.rows[0];

      // Then create the Swinburne project extension
      const swinburneProjectQuery = `
        INSERT INTO ${schema}.swinburne_projects (
          base_project_id, unit_code, unit_name, semester, academic_year, 
          campus, project_type, assessment_weight, due_date, 
          collaboration_status, visibility, instructor_code, tags
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
        RETURNING id, status, progress_percentage, created_at
      `;

      const swinburneProjectResult = await client.query(swinburneProjectQuery, [
        baseProject.id,
        unit_code,
        unit_name,
        semester,
        parseInt(academic_year),
        campus,
        project_type,
        assessment_weight || null,
        due_date || null,
        collaboration_status || 'Open',
        visibility || 'Swinburne Only',
        instructor_code || null,
        tags || []
      ]);

      // Add project creator as the leader in collaborators table
      const collaboratorQuery = `
        INSERT INTO ${schema}.project_collaborators (project_id, user_id, role, status)
        VALUES ($1, $2, 'Leader', 'Active')
      `;

      await client.query(collaboratorQuery, [
        swinburneProjectResult.rows[0].id,
        userId
      ]);

      await client.query('COMMIT');

      const swinburneProject = swinburneProjectResult.rows[0];

      res.status(201).json({
        success: true,
        message: "Swinburne project created successfully",
        project: {
          id: swinburneProject.id,
          base_project_id: baseProject.id,
          title,
          description: description?.trim() || null,
          image_urls: imageUrls,
          unit_code,
          unit_name,
          semester,
          academic_year: parseInt(academic_year),
          campus,
          project_type,
          assessment_weight,
          due_date,
          collaboration_status: collaboration_status || 'Open',
          visibility: visibility || 'Swinburne Only',
          instructor_code,
          tags: tags || [],
          status: swinburneProject.status,
          progress_percentage: swinburneProject.progress_percentage,
          created_at: swinburneProject.created_at,
        },
      });
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }

  } catch (error) {
    console.error("Create Swinburne project error:", error);

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

// Get user's Swinburne projects
const getUserSwinburneProjects = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;

    const query = `
      SELECT 
        sp.*,
        p.title,
        p.description,
        p.image_urls,
        p.user_id,
        p.created_at as base_created_at,
        COUNT(pc.user_id) as collaborators_count,
        COUNT(pm.id) as milestones_count,
        COUNT(CASE WHEN pm.is_completed THEN 1 END) as completed_milestones_count
      FROM ${schema}.swinburne_projects sp
      JOIN ${schema}.projects p ON sp.base_project_id = p.id
      LEFT JOIN ${schema}.project_collaborators pc ON sp.id = pc.project_id AND pc.status = 'Active'
      LEFT JOIN ${schema}.project_milestones pm ON sp.id = pm.project_id
      WHERE p.user_id = $1
      GROUP BY sp.id, p.id
      ORDER BY sp.created_at DESC
      LIMIT $2 OFFSET $3
    `;

    const result = await db.query(query, [userId, limit, offset]);

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
    console.error("Get user Swinburne projects error:", error);
    next(error);
  }
};

// Get specific Swinburne project details
const getSwinburneProject = async (req, res, next) => {
  try {
    const { projectId } = req.params;
    const currentUserId = req.user ? req.user.id : null;

    // Get project details with collaborators and milestones
    const projectQuery = `
      SELECT 
        sp.*,
        p.title,
        p.description,
        p.image_urls,
        p.user_id,
        p.created_at as base_created_at,
        u.first_name,
        u.last_name,
        u.user_name,
        u.profile_picture_url,
        COUNT(pl.id) as likes_count,
        CASE WHEN user_likes.user_id IS NOT NULL THEN true ELSE false END as is_liked
      FROM ${schema}.swinburne_projects sp
      JOIN ${schema}.projects p ON sp.base_project_id = p.id
      JOIN ${schema}.users u ON p.user_id = u.id
      LEFT JOIN ${schema}.project_likes pl ON p.id = pl.project_id
      LEFT JOIN ${schema}.project_likes user_likes ON p.id = user_likes.project_id AND user_likes.user_id = $2
      WHERE sp.id = $1
      GROUP BY sp.id, p.id, u.id, user_likes.user_id
    `;

    const projectResult = await db.query(projectQuery, [projectId, currentUserId]);

    if (projectResult.rows.length === 0) {
      const error = new Error("Project not found");
      error.status = 404;
      return next(error);
    }

    const project = projectResult.rows[0];

    // Check if user has access to view this project
    const canViewProject = await checkProjectAccess(project, currentUserId);
    
    if (!canViewProject) {
      const error = new Error("Access denied to this project");
      error.status = 403;
      return next(error);
    }

    // Get collaborators
    const collaboratorsQuery = `
      SELECT 
        pc.*,
        u.first_name,
        u.last_name,
        u.user_name,
        u.profile_picture_url
      FROM ${schema}.project_collaborators pc
      JOIN ${schema}.users u ON pc.user_id = u.id
      WHERE pc.project_id = $1
      ORDER BY 
        CASE WHEN pc.role = 'Leader' THEN 0 ELSE 1 END,
        pc.joined_at ASC
    `;

    const collaboratorsResult = await db.query(collaboratorsQuery, [projectId]);

    // Get milestones
    const milestonesQuery = `
      SELECT *
      FROM ${schema}.project_milestones
      WHERE project_id = $1
      ORDER BY order_index ASC, due_date ASC
    `;

    const milestonesResult = await db.query(milestonesQuery, [projectId]);

    res.json({
      success: true,
      project: {
        ...project,
        collaborators: collaboratorsResult.rows,
        milestones: milestonesResult.rows,
      },
    });
  } catch (error) {
    console.error("Get Swinburne project error:", error);
    next(error);
  }
};

// Helper function to check project access
async function checkProjectAccess(project, userId) {
  // Public projects are accessible to everyone
  if (project.visibility === 'Public') return true;
  
  // Private projects only accessible to project members
  if (project.visibility === 'Private') {
    if (!userId) return false;
    
    const memberQuery = `
      SELECT 1 FROM ${schema}.project_collaborators 
      WHERE project_id = $1 AND user_id = $2 AND status = 'Active'
    `;
    const memberResult = await db.query(memberQuery, [project.id, userId]);
    return memberResult.rows.length > 0;
  }
  
  // Team Only projects accessible to team members
  if (project.visibility === 'Team Only') {
    if (!userId) return false;
    
    const memberQuery = `
      SELECT 1 FROM ${schema}.project_collaborators 
      WHERE project_id = $1 AND user_id = $2 AND status = 'Active'
    `;
    const memberResult = await db.query(memberQuery, [project.id, userId]);
    return memberResult.rows.length > 0;
  }
  
  // Swinburne Only projects accessible to Swinburne users
  if (project.visibility === 'Swinburne Only') {
    if (!userId) return false;
    
    const userQuery = `
      SELECT email FROM ${schema}.users WHERE id = $1
    `;
    const userResult = await db.query(userQuery, [userId]);
    
    if (userResult.rows.length === 0) return false;
    
    const email = userResult.rows[0].email;
    return email.endsWith('@swin.edu.au') || email.endsWith('@student.swin.edu.au');
  }
  
  return false;
}

// Update Swinburne project
const updateSwinburneProject = async (req, res, next) => {
  try {
    const { projectId } = req.params;
    const userId = req.user.id;
    const updateData = req.body;

    // Check if user has permission to update (must be project leader or collaborator)
    const accessQuery = `
      SELECT pc.role, sp.base_project_id
      FROM ${schema}.project_collaborators pc
      JOIN ${schema}.swinburne_projects sp ON pc.project_id = sp.id
      WHERE pc.project_id = $1 AND pc.user_id = $2 AND pc.status = 'Active'
    `;

    const accessResult = await db.query(accessQuery, [projectId, userId]);
    
    if (accessResult.rows.length === 0) {
      const error = new Error("Access denied to update this project");
      error.status = 403;
      return next(error);
    }

    const userRole = accessResult.rows[0].role;
    const baseProjectId = accessResult.rows[0].base_project_id;

    // Begin transaction
    const client = await db.pool.connect();
    
    try {
      await client.query('BEGIN');

      // Update base project if title or description changed
      if (updateData.title || updateData.description) {
        const baseUpdateQuery = `
          UPDATE ${schema}.projects 
          SET title = COALESCE($1, title), 
              description = COALESCE($2, description),
              updated_at = CURRENT_TIMESTAMP
          WHERE id = $3
        `;
        
        await client.query(baseUpdateQuery, [
          updateData.title?.trim(),
          updateData.description?.trim(),
          baseProjectId
        ]);
      }

      // Update Swinburne project details
      const swinburneUpdateFields = [
        'unit_code', 'unit_name', 'semester', 'academic_year', 'campus',
        'project_type', 'assessment_weight', 'due_date', 'collaboration_status',
        'visibility', 'instructor_code', 'tags', 'status', 'progress_percentage',
        'final_grade'
      ];

      const updateFields = [];
      const updateValues = [];
      let paramCount = 1;

      for (const field of swinburneUpdateFields) {
        if (updateData.hasOwnProperty(field)) {
          updateFields.push(`${field} = $${paramCount}`);
          updateValues.push(updateData[field]);
          paramCount++;
        }
      }

      if (updateFields.length > 0) {
        updateFields.push(`updated_at = CURRENT_TIMESTAMP`);
        updateValues.push(projectId);

        const swinburneUpdateQuery = `
          UPDATE ${schema}.swinburne_projects 
          SET ${updateFields.join(', ')}
          WHERE id = $${paramCount}
          RETURNING *
        `;

        const result = await client.query(swinburneUpdateQuery, updateValues);

        await client.query('COMMIT');

        res.json({
          success: true,
          message: "Project updated successfully",
          project: result.rows[0],
        });
      } else {
        await client.query('ROLLBACK');
        res.json({
          success: true,
          message: "No changes to update",
        });
      }

    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }

  } catch (error) {
    console.error("Update Swinburne project error:", error);
    next(error);
  }
};

// Delete Swinburne project
const deleteSwinburneProject = async (req, res, next) => {
  try {
    const { projectId } = req.params;
    const userId = req.user.id;

    // Check if user is the project leader
    const leaderQuery = `
      SELECT sp.base_project_id, p.image_urls
      FROM ${schema}.swinburne_projects sp
      JOIN ${schema}.projects p ON sp.base_project_id = p.id
      JOIN ${schema}.project_collaborators pc ON sp.id = pc.project_id
      WHERE sp.id = $1 AND pc.user_id = $2 AND pc.role = 'Leader' AND pc.status = 'Active'
    `;

    const leaderResult = await db.query(leaderQuery, [projectId, userId]);

    if (leaderResult.rows.length === 0) {
      const error = new Error("Only project leaders can delete projects");
      error.status = 403;
      return next(error);
    }

    const baseProjectId = leaderResult.rows[0].base_project_id;
    const imageUrls = leaderResult.rows[0].image_urls;

    // Delete images from S3
    if (imageUrls && imageUrls.length > 0) {
      try {
        await Promise.all(
          imageUrls.map((url) => s3Service.deleteFile(url))
        );
      } catch (s3Error) {
        console.error("S3 deletion error:", s3Error);
        // Continue with database deletion even if S3 deletion fails
      }
    }

    // Delete Swinburne project (cascade will delete related records)
    const deleteQuery = `DELETE FROM ${schema}.swinburne_projects WHERE id = $1`;
    await db.query(deleteQuery, [projectId]);

    // Delete base project
    const deleteBaseQuery = `DELETE FROM ${schema}.projects WHERE id = $1`;
    await db.query(deleteBaseQuery, [baseProjectId]);

    res.json({
      success: true,
      message: "Swinburne project deleted successfully",
    });
  } catch (error) {
    console.error("Delete Swinburne project error:", error);
    next(error);
  }
};

// Get all Swinburne units
const getSwinburneUnits = async (req, res, next) => {
  try {
    const query = `
      SELECT * FROM ${schema}.swinburne_units 
      WHERE is_active = true 
      ORDER BY unit_code ASC
    `;

    const result = await db.query(query);

    res.json({
      success: true,
      units: result.rows,
    });
  } catch (error) {
    console.error("Get Swinburne units error:", error);
    next(error);
  }
};

// Get public Swinburne projects for team finder
const getSwinburneTeamFinder = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;
    const currentUserId = req.user ? req.user.id : null;

    const query = `
      SELECT 
        sp.*,
        p.title,
        p.description,
        p.image_urls,
        p.user_id,
        u.first_name,
        u.last_name,
        u.user_name,
        u.profile_picture_url,
        COUNT(pc.user_id) as current_collaborators_count
      FROM ${schema}.swinburne_projects sp
      JOIN ${schema}.projects p ON sp.base_project_id = p.id
      JOIN ${schema}.users u ON p.user_id = u.id
      LEFT JOIN ${schema}.project_collaborators pc ON sp.id = pc.project_id AND pc.status = 'Active'
      WHERE sp.collaboration_status = 'Open' 
        AND (sp.visibility = 'Public' OR sp.visibility = 'Swinburne Only')
        AND sp.status IN ('Not Started', 'Planning', 'In Progress')
      GROUP BY sp.id, p.id, u.id
      ORDER BY sp.created_at DESC
      LIMIT $1 OFFSET $2
    `;

    const result = await db.query(query, [limit, offset]);

    // Filter Swinburne Only projects for non-Swinburne users
    let filteredProjects = result.rows;
    
    if (currentUserId) {
      const userQuery = `SELECT email FROM ${schema}.users WHERE id = $1`;
      const userResult = await db.query(userQuery, [currentUserId]);
      
      if (userResult.rows.length > 0) {
        const email = userResult.rows[0].email;
        const isSwinburneUser = email.endsWith('@swin.edu.au') || email.endsWith('@student.swin.edu.au');
        
        if (!isSwinburneUser) {
          filteredProjects = result.rows.filter(project => project.visibility === 'Public');
        }
      }
    } else {
      // Non-authenticated users can only see public projects
      filteredProjects = result.rows.filter(project => project.visibility === 'Public');
    }

    res.json({
      success: true,
      projects: filteredProjects,
      pagination: {
        page,
        limit,
        hasMore: result.rows.length === limit,
      },
    });
  } catch (error) {
    console.error("Get Swinburne team finder error:", error);
    next(error);
  }
};

module.exports = {
  createSwinburneProject,
  getUserSwinburneProjects,
  getSwinburneProject,
  updateSwinburneProject,
  deleteSwinburneProject,
  getSwinburneUnits,
  getSwinburneTeamFinder,
};