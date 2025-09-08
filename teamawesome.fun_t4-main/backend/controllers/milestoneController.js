const db = require("../db/db");

const schema =
  process.env.NODE_ENV === "production"
    ? process.env.DB_SCHEMA
    : (process.env.DEV_SCHEMA || 'public');

// Get project milestones
const getProjectMilestones = async (req, res, next) => {
  try {
    const { projectId } = req.params;
    const currentUserId = req.user.id;

    // Check if user has access to view milestones (must be project collaborator)
    const accessQuery = `
      SELECT 1 FROM ${schema}.project_collaborators
      WHERE project_id = $1 AND user_id = $2 AND status = 'Active'
    `;

    const accessResult = await db.query(accessQuery, [projectId, currentUserId]);

    if (accessResult.rows.length === 0) {
      const error = new Error("Access denied to view project milestones");
      error.status = 403;
      return next(error);
    }

    // Get all milestones for the project
    const milestonesQuery = `
      SELECT 
        pm.*,
        u.first_name as completed_by_first_name,
        u.last_name as completed_by_last_name,
        u.user_name as completed_by_user_name
      FROM ${schema}.project_milestones pm
      LEFT JOIN ${schema}.users u ON pm.completed_by = u.id
      WHERE pm.project_id = $1
      ORDER BY pm.order_index ASC, pm.due_date ASC
    `;

    const result = await db.query(milestonesQuery, [projectId]);

    res.json({
      success: true,
      milestones: result.rows,
    });
  } catch (error) {
    console.error("Get project milestones error:", error);
    next(error);
  }
};

// Add milestone to project
const addMilestone = async (req, res, next) => {
  try {
    const { projectId } = req.params;
    const { name, description, due_date, order_index } = req.body;
    const currentUserId = req.user.id;

    // Validate required fields
    if (!name || !due_date) {
      const error = new Error("Milestone name and due date are required");
      error.status = 400;
      return next(error);
    }

    if (name.length > 200) {
      const error = new Error("Milestone name cannot exceed 200 characters");
      error.status = 400;
      return next(error);
    }

    // Check if user has permission to add milestones (must be project collaborator)
    const permissionQuery = `
      SELECT pc.role
      FROM ${schema}.project_collaborators pc
      WHERE pc.project_id = $1 AND pc.user_id = $2 AND pc.status = 'Active'
    `;

    const permissionResult = await db.query(permissionQuery, [projectId, currentUserId]);

    if (permissionResult.rows.length === 0) {
      const error = new Error("Access denied. You must be a project collaborator to add milestones.");
      error.status = 403;
      return next(error);
    }

    // Validate due date (should not be in the past)
    const dueDate = new Date(due_date);
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Set to start of today

    if (dueDate < today) {
      const error = new Error("Due date cannot be in the past");
      error.status = 400;
      return next(error);
    }

    // Get the next order index if not provided
    let finalOrderIndex = order_index;
    if (!finalOrderIndex) {
      const maxOrderQuery = `
        SELECT COALESCE(MAX(order_index), 0) + 1 as next_index
        FROM ${schema}.project_milestones
        WHERE project_id = $1
      `;

      const maxOrderResult = await db.query(maxOrderQuery, [projectId]);
      finalOrderIndex = maxOrderResult.rows[0].next_index;
    }

    // Add milestone
    const addMilestoneQuery = `
      INSERT INTO ${schema}.project_milestones (
        project_id, name, description, due_date, order_index
      )
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *
    `;

    const result = await db.query(addMilestoneQuery, [
      projectId,
      name.trim(),
      description?.trim() || null,
      due_date,
      finalOrderIndex
    ]);

    res.status(201).json({
      success: true,
      message: "Milestone added successfully",
      milestone: result.rows[0],
    });
  } catch (error) {
    console.error("Add milestone error:", error);
    next(error);
  }
};

// Update milestone
const updateMilestone = async (req, res, next) => {
  try {
    const { projectId, milestoneId } = req.params;
    const updateData = req.body;
    const currentUserId = req.user.id;

    // Check if user has permission to update milestones
    const permissionQuery = `
      SELECT pc.role
      FROM ${schema}.project_collaborators pc
      WHERE pc.project_id = $1 AND pc.user_id = $2 AND pc.status = 'Active'
    `;

    const permissionResult = await db.query(permissionQuery, [projectId, currentUserId]);

    if (permissionResult.rows.length === 0) {
      const error = new Error("Access denied. You must be a project collaborator to update milestones.");
      error.status = 403;
      return next(error);
    }

    // Check if milestone exists and belongs to the project
    const milestoneExistsQuery = `
      SELECT * FROM ${schema}.project_milestones
      WHERE id = $1 AND project_id = $2
    `;

    const milestoneResult = await db.query(milestoneExistsQuery, [milestoneId, projectId]);

    if (milestoneResult.rows.length === 0) {
      const error = new Error("Milestone not found");
      error.status = 404;
      return next(error);
    }

    // Validate due date if provided
    if (updateData.due_date) {
      const dueDate = new Date(updateData.due_date);
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      if (dueDate < today) {
        const error = new Error("Due date cannot be in the past");
        error.status = 400;
        return next(error);
      }
    }

    // Validate name length if provided
    if (updateData.name && updateData.name.length > 200) {
      const error = new Error("Milestone name cannot exceed 200 characters");
      error.status = 400;
      return next(error);
    }

    // Build update query dynamically
    const updateFields = [];
    const updateValues = [];
    let paramCount = 1;

    const allowedFields = ['name', 'description', 'due_date', 'order_index'];

    for (const field of allowedFields) {
      if (updateData.hasOwnProperty(field)) {
        updateFields.push(`${field} = $${paramCount}`);
        updateValues.push(field === 'name' || field === 'description' 
          ? updateData[field]?.trim() 
          : updateData[field]);
        paramCount++;
      }
    }

    if (updateFields.length === 0) {
      return res.json({
        success: true,
        message: "No changes to update",
        milestone: milestoneResult.rows[0],
      });
    }

    // Add WHERE clause parameters
    updateValues.push(milestoneId, projectId);

    const updateQuery = `
      UPDATE ${schema}.project_milestones 
      SET ${updateFields.join(', ')}
      WHERE id = $${paramCount} AND project_id = $${paramCount + 1}
      RETURNING *
    `;

    const result = await db.query(updateQuery, updateValues);

    res.json({
      success: true,
      message: "Milestone updated successfully",
      milestone: result.rows[0],
    });
  } catch (error) {
    console.error("Update milestone error:", error);
    next(error);
  }
};

// Mark milestone as completed
const completeMilestone = async (req, res, next) => {
  try {
    const { projectId, milestoneId } = req.params;
    const currentUserId = req.user.id;

    // Check if user has permission to complete milestones
    const permissionQuery = `
      SELECT pc.role
      FROM ${schema}.project_collaborators pc
      WHERE pc.project_id = $1 AND pc.user_id = $2 AND pc.status = 'Active'
    `;

    const permissionResult = await db.query(permissionQuery, [projectId, currentUserId]);

    if (permissionResult.rows.length === 0) {
      const error = new Error("Access denied. You must be a project collaborator to complete milestones.");
      error.status = 403;
      return next(error);
    }

    // Check if milestone exists and is not already completed
    const milestoneQuery = `
      SELECT * FROM ${schema}.project_milestones
      WHERE id = $1 AND project_id = $2
    `;

    const milestoneResult = await db.query(milestoneQuery, [milestoneId, projectId]);

    if (milestoneResult.rows.length === 0) {
      const error = new Error("Milestone not found");
      error.status = 404;
      return next(error);
    }

    const milestone = milestoneResult.rows[0];

    if (milestone.is_completed) {
      const error = new Error("Milestone is already completed");
      error.status = 400;
      return next(error);
    }

    // Mark milestone as completed
    const completeQuery = `
      UPDATE ${schema}.project_milestones 
      SET is_completed = true, 
          completed_at = CURRENT_TIMESTAMP,
          completed_by = $1
      WHERE id = $2 AND project_id = $3
      RETURNING *
    `;

    const result = await db.query(completeQuery, [currentUserId, milestoneId, projectId]);

    // Update project progress percentage based on completed milestones
    await updateProjectProgress(projectId);

    res.json({
      success: true,
      message: "Milestone marked as completed",
      milestone: result.rows[0],
    });
  } catch (error) {
    console.error("Complete milestone error:", error);
    next(error);
  }
};

// Mark milestone as incomplete
const uncompleteMilestone = async (req, res, next) => {
  try {
    const { projectId, milestoneId } = req.params;
    const currentUserId = req.user.id;

    // Check if user has permission to uncomplete milestones
    const permissionQuery = `
      SELECT pc.role
      FROM ${schema}.project_collaborators pc
      WHERE pc.project_id = $1 AND pc.user_id = $2 AND pc.status = 'Active'
    `;

    const permissionResult = await db.query(permissionQuery, [projectId, currentUserId]);

    if (permissionResult.rows.length === 0) {
      const error = new Error("Access denied. You must be a project collaborator to modify milestones.");
      error.status = 403;
      return next(error);
    }

    // Check if milestone exists and is completed
    const milestoneQuery = `
      SELECT * FROM ${schema}.project_milestones
      WHERE id = $1 AND project_id = $2
    `;

    const milestoneResult = await db.query(milestoneQuery, [milestoneId, projectId]);

    if (milestoneResult.rows.length === 0) {
      const error = new Error("Milestone not found");
      error.status = 404;
      return next(error);
    }

    const milestone = milestoneResult.rows[0];

    if (!milestone.is_completed) {
      const error = new Error("Milestone is not completed");
      error.status = 400;
      return next(error);
    }

    // Mark milestone as incomplete
    const uncompleteQuery = `
      UPDATE ${schema}.project_milestones 
      SET is_completed = false, 
          completed_at = NULL,
          completed_by = NULL
      WHERE id = $1 AND project_id = $2
      RETURNING *
    `;

    const result = await db.query(uncompleteQuery, [milestoneId, projectId]);

    // Update project progress percentage based on completed milestones
    await updateProjectProgress(projectId);

    res.json({
      success: true,
      message: "Milestone marked as incomplete",
      milestone: result.rows[0],
    });
  } catch (error) {
    console.error("Uncomplete milestone error:", error);
    next(error);
  }
};

// Delete milestone
const deleteMilestone = async (req, res, next) => {
  try {
    const { projectId, milestoneId } = req.params;
    const currentUserId = req.user.id;

    // Check if user has permission to delete milestones (leaders and those who created the milestone)
    const permissionQuery = `
      SELECT pc.role
      FROM ${schema}.project_collaborators pc
      WHERE pc.project_id = $1 AND pc.user_id = $2 AND pc.status = 'Active'
    `;

    const permissionResult = await db.query(permissionQuery, [projectId, currentUserId]);

    if (permissionResult.rows.length === 0) {
      const error = new Error("Access denied. You must be a project collaborator to delete milestones.");
      error.status = 403;
      return next(error);
    }

    // Only leaders can delete milestones or if it's a more permissive policy, allow all collaborators
    const userRole = permissionResult.rows[0].role;
    if (userRole !== 'Leader') {
      const error = new Error("Only project leaders can delete milestones");
      error.status = 403;
      return next(error);
    }

    // Check if milestone exists
    const milestoneQuery = `
      SELECT * FROM ${schema}.project_milestones
      WHERE id = $1 AND project_id = $2
    `;

    const milestoneResult = await db.query(milestoneQuery, [milestoneId, projectId]);

    if (milestoneResult.rows.length === 0) {
      const error = new Error("Milestone not found");
      error.status = 404;
      return next(error);
    }

    // Delete milestone
    const deleteQuery = `
      DELETE FROM ${schema}.project_milestones 
      WHERE id = $1 AND project_id = $2
    `;

    await db.query(deleteQuery, [milestoneId, projectId]);

    // Update project progress percentage based on remaining milestones
    await updateProjectProgress(projectId);

    res.json({
      success: true,
      message: "Milestone deleted successfully",
    });
  } catch (error) {
    console.error("Delete milestone error:", error);
    next(error);
  }
};

// Reorder milestones
const reorderMilestones = async (req, res, next) => {
  try {
    const { projectId } = req.params;
    const { milestones } = req.body; // Array of {id, order_index}
    const currentUserId = req.user.id;

    // Validate input
    if (!Array.isArray(milestones) || milestones.length === 0) {
      const error = new Error("Milestones array is required");
      error.status = 400;
      return next(error);
    }

    // Check if user has permission to reorder milestones
    const permissionQuery = `
      SELECT pc.role
      FROM ${schema}.project_collaborators pc
      WHERE pc.project_id = $1 AND pc.user_id = $2 AND pc.status = 'Active'
    `;

    const permissionResult = await db.query(permissionQuery, [projectId, currentUserId]);

    if (permissionResult.rows.length === 0) {
      const error = new Error("Access denied. You must be a project collaborator to reorder milestones.");
      error.status = 403;
      return next(error);
    }

    // Begin transaction for atomic updates
    const client = await db.pool.connect();
    
    try {
      await client.query('BEGIN');

      // Update each milestone's order_index
      for (const milestone of milestones) {
        if (!milestone.id || milestone.order_index === undefined) {
          throw new Error("Each milestone must have id and order_index");
        }

        const updateQuery = `
          UPDATE ${schema}.project_milestones 
          SET order_index = $1
          WHERE id = $2 AND project_id = $3
        `;

        await client.query(updateQuery, [milestone.order_index, milestone.id, projectId]);
      }

      await client.query('COMMIT');

      // Get updated milestones
      const milestonesQuery = `
        SELECT * FROM ${schema}.project_milestones
        WHERE project_id = $1
        ORDER BY order_index ASC, due_date ASC
      `;

      const result = await client.query(milestonesQuery, [projectId]);

      res.json({
        success: true,
        message: "Milestones reordered successfully",
        milestones: result.rows,
      });

    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }

  } catch (error) {
    console.error("Reorder milestones error:", error);
    next(error);
  }
};

// Helper function to update project progress based on completed milestones
async function updateProjectProgress(projectId) {
  try {
    const progressQuery = `
      SELECT 
        COUNT(*) as total_milestones,
        COUNT(CASE WHEN is_completed THEN 1 END) as completed_milestones
      FROM ${schema}.project_milestones
      WHERE project_id = $1
    `;

    const progressResult = await db.query(progressQuery, [projectId]);
    const { total_milestones, completed_milestones } = progressResult.rows[0];

    let progressPercentage = 0;
    if (parseInt(total_milestones) > 0) {
      progressPercentage = Math.round((parseInt(completed_milestones) / parseInt(total_milestones)) * 100);
    }

    const updateProgressQuery = `
      UPDATE ${schema}.swinburne_projects 
      SET progress_percentage = $1
      WHERE id = $2
    `;

    await db.query(updateProgressQuery, [progressPercentage, projectId]);

  } catch (error) {
    console.error("Update project progress error:", error);
    // Don't throw error here as it's a helper function
  }
}

module.exports = {
  getProjectMilestones,
  addMilestone,
  updateMilestone,
  completeMilestone,
  uncompleteMilestone,
  deleteMilestone,
  reorderMilestones,
};