const db = require("../db/db");

const schema =
  process.env.NODE_ENV === "production"
    ? process.env.DB_SCHEMA
    : (process.env.DEV_SCHEMA || 'public');

// Add collaborator to project
const addCollaborator = async (req, res, next) => {
  try {
    const { projectId } = req.params;
    const { userId: targetUserId, role } = req.body;
    const currentUserId = req.user.id;

    // Validate inputs
    if (!targetUserId || !role) {
      const error = new Error("User ID and role are required");
      error.status = 400;
      return next(error);
    }

    const validRoles = ['Leader', 'Developer', 'Designer', 'Researcher', 'Writer'];
    if (!validRoles.includes(role)) {
      const error = new Error("Invalid role specified");
      error.status = 400;
      return next(error);
    }

    // Check if current user is project leader or has permission to add collaborators
    const permissionQuery = `
      SELECT pc.role, sp.collaboration_status
      FROM ${schema}.project_collaborators pc
      JOIN ${schema}.swinburne_projects sp ON pc.project_id = sp.id
      WHERE pc.project_id = $1 AND pc.user_id = $2 AND pc.status = 'Active'
    `;

    const permissionResult = await db.query(permissionQuery, [projectId, currentUserId]);

    if (permissionResult.rows.length === 0) {
      const error = new Error("Access denied to this project");
      error.status = 403;
      return next(error);
    }

    const userRole = permissionResult.rows[0].role;
    const collaborationStatus = permissionResult.rows[0].collaboration_status;

    // Only leaders can add collaborators, or if project is open for collaboration
    if (userRole !== 'Leader' && collaborationStatus !== 'Open') {
      const error = new Error("Only project leaders can add collaborators to this project");
      error.status = 403;
      return next(error);
    }

    // Check if target user exists
    const userExistsQuery = `
      SELECT id, first_name, last_name, email FROM ${schema}.users WHERE id = $1
    `;

    const userExistsResult = await db.query(userExistsQuery, [targetUserId]);

    if (userExistsResult.rows.length === 0) {
      const error = new Error("User not found");
      error.status = 404;
      return next(error);
    }

    const targetUser = userExistsResult.rows[0];

    // Validate Swinburne email for academic projects
    if (!targetUser.email.endsWith('@swin.edu.au') && !targetUser.email.endsWith('@student.swin.edu.au')) {
      const error = new Error("Only Swinburne University users can be added to academic projects");
      error.status = 400;
      return next(error);
    }

    // Check if user is already a collaborator
    const existingCollaboratorQuery = `
      SELECT id, status FROM ${schema}.project_collaborators
      WHERE project_id = $1 AND user_id = $2
    `;

    const existingResult = await db.query(existingCollaboratorQuery, [projectId, targetUserId]);

    if (existingResult.rows.length > 0) {
      const existingStatus = existingResult.rows[0].status;
      
      if (existingStatus === 'Active') {
        const error = new Error("User is already an active collaborator on this project");
        error.status = 400;
        return next(error);
      } else if (existingStatus === 'Invited') {
        const error = new Error("User already has a pending invitation for this project");
        error.status = 400;
        return next(error);
      }
    }

    // Add collaborator
    const addCollaboratorQuery = `
      INSERT INTO ${schema}.project_collaborators (project_id, user_id, role, status, invited_by)
      VALUES ($1, $2, $3, 'Invited', $4)
      RETURNING *
    `;

    const result = await db.query(addCollaboratorQuery, [
      projectId,
      targetUserId,
      role,
      currentUserId
    ]);

    res.status(201).json({
      success: true,
      message: "Collaborator invitation sent successfully",
      collaboration: {
        ...result.rows[0],
        user: {
          id: targetUser.id,
          first_name: targetUser.first_name,
          last_name: targetUser.last_name,
        }
      },
    });
  } catch (error) {
    console.error("Add collaborator error:", error);
    next(error);
  }
};

// Update collaborator role
const updateCollaboratorRole = async (req, res, next) => {
  try {
    const { projectId, userId: targetUserId } = req.params;
    const { role } = req.body;
    const currentUserId = req.user.id;

    // Validate role
    const validRoles = ['Leader', 'Developer', 'Designer', 'Researcher', 'Writer'];
    if (!validRoles.includes(role)) {
      const error = new Error("Invalid role specified");
      error.status = 400;
      return next(error);
    }

    // Check if current user is project leader
    const leaderQuery = `
      SELECT 1 FROM ${schema}.project_collaborators
      WHERE project_id = $1 AND user_id = $2 AND role = 'Leader' AND status = 'Active'
    `;

    const leaderResult = await db.query(leaderQuery, [projectId, currentUserId]);

    if (leaderResult.rows.length === 0) {
      const error = new Error("Only project leaders can update collaborator roles");
      error.status = 403;
      return next(error);
    }

    // Prevent removing the last leader
    if (role !== 'Leader') {
      const leadersCountQuery = `
        SELECT COUNT(*) as count FROM ${schema}.project_collaborators
        WHERE project_id = $1 AND role = 'Leader' AND status = 'Active'
      `;

      const leadersCountResult = await db.query(leadersCountQuery, [projectId]);
      const leadersCount = parseInt(leadersCountResult.rows[0].count);

      const targetIsLeaderQuery = `
        SELECT 1 FROM ${schema}.project_collaborators
        WHERE project_id = $1 AND user_id = $2 AND role = 'Leader' AND status = 'Active'
      `;

      const targetIsLeaderResult = await db.query(targetIsLeaderQuery, [projectId, targetUserId]);

      if (leadersCount === 1 && targetIsLeaderResult.rows.length > 0) {
        const error = new Error("Cannot remove the last project leader. Assign another leader first.");
        error.status = 400;
        return next(error);
      }
    }

    // Update collaborator role
    const updateQuery = `
      UPDATE ${schema}.project_collaborators 
      SET role = $1
      WHERE project_id = $2 AND user_id = $3 AND status = 'Active'
      RETURNING *
    `;

    const result = await db.query(updateQuery, [role, projectId, targetUserId]);

    if (result.rows.length === 0) {
      const error = new Error("Collaborator not found or not active");
      error.status = 404;
      return next(error);
    }

    res.json({
      success: true,
      message: "Collaborator role updated successfully",
      collaboration: result.rows[0],
    });
  } catch (error) {
    console.error("Update collaborator role error:", error);
    next(error);
  }
};

// Remove collaborator from project
const removeCollaborator = async (req, res, next) => {
  try {
    const { projectId, userId: targetUserId } = req.params;
    const currentUserId = req.user.id;

    // Check if current user is project leader or removing themselves
    const canRemoveQuery = `
      SELECT 
        CASE 
          WHEN $2 = $3 THEN true  -- User removing themselves
          WHEN EXISTS (
            SELECT 1 FROM ${schema}.project_collaborators
            WHERE project_id = $1 AND user_id = $2 AND role = 'Leader' AND status = 'Active'
          ) THEN true  -- Current user is leader
          ELSE false 
        END as can_remove
    `;

    const canRemoveResult = await db.query(canRemoveQuery, [projectId, currentUserId, targetUserId]);

    if (!canRemoveResult.rows[0].can_remove) {
      const error = new Error("Access denied. Only project leaders can remove collaborators, or users can remove themselves.");
      error.status = 403;
      return next(error);
    }

    // Check if target user is a leader and prevent removing last leader
    const targetRoleQuery = `
      SELECT role FROM ${schema}.project_collaborators
      WHERE project_id = $1 AND user_id = $2 AND status = 'Active'
    `;

    const targetRoleResult = await db.query(targetRoleQuery, [projectId, targetUserId]);

    if (targetRoleResult.rows.length === 0) {
      const error = new Error("Collaborator not found");
      error.status = 404;
      return next(error);
    }

    const targetRole = targetRoleResult.rows[0].role;

    if (targetRole === 'Leader') {
      const leadersCountQuery = `
        SELECT COUNT(*) as count FROM ${schema}.project_collaborators
        WHERE project_id = $1 AND role = 'Leader' AND status = 'Active'
      `;

      const leadersCountResult = await db.query(leadersCountQuery, [projectId]);
      const leadersCount = parseInt(leadersCountResult.rows[0].count);

      if (leadersCount === 1) {
        const error = new Error("Cannot remove the last project leader");
        error.status = 400;
        return next(error);
      }
    }

    // Remove collaborator (set status to inactive rather than delete for audit trail)
    const removeQuery = `
      UPDATE ${schema}.project_collaborators 
      SET status = 'Inactive'
      WHERE project_id = $1 AND user_id = $2 AND status = 'Active'
      RETURNING *
    `;

    const result = await db.query(removeQuery, [projectId, targetUserId]);

    res.json({
      success: true,
      message: "Collaborator removed successfully",
      collaboration: result.rows[0],
    });
  } catch (error) {
    console.error("Remove collaborator error:", error);
    next(error);
  }
};

// Get project collaborators
const getProjectCollaborators = async (req, res, next) => {
  try {
    const { projectId } = req.params;
    const currentUserId = req.user.id;

    // Check if user has access to view collaborators
    const accessQuery = `
      SELECT 1 FROM ${schema}.project_collaborators
      WHERE project_id = $1 AND user_id = $2 AND status = 'Active'
    `;

    const accessResult = await db.query(accessQuery, [projectId, currentUserId]);

    if (accessResult.rows.length === 0) {
      const error = new Error("Access denied to view project collaborators");
      error.status = 403;
      return next(error);
    }

    // Get all active collaborators
    const collaboratorsQuery = `
      SELECT 
        pc.*,
        u.first_name,
        u.last_name,
        u.user_name,
        u.profile_picture_url,
        u.email
      FROM ${schema}.project_collaborators pc
      JOIN ${schema}.users u ON pc.user_id = u.id
      WHERE pc.project_id = $1 AND pc.status = 'Active'
      ORDER BY 
        CASE WHEN pc.role = 'Leader' THEN 0 ELSE 1 END,
        pc.joined_at ASC
    `;

    const result = await db.query(collaboratorsQuery, [projectId]);

    res.json({
      success: true,
      collaborators: result.rows,
    });
  } catch (error) {
    console.error("Get project collaborators error:", error);
    next(error);
  }
};

// Accept collaboration invitation
const acceptCollaborationInvite = async (req, res, next) => {
  try {
    const { projectId } = req.params;
    const userId = req.user.id;

    // Check if user has a pending invitation
    const inviteQuery = `
      SELECT * FROM ${schema}.project_collaborators
      WHERE project_id = $1 AND user_id = $2 AND status = 'Invited'
    `;

    const inviteResult = await db.query(inviteQuery, [projectId, userId]);

    if (inviteResult.rows.length === 0) {
      const error = new Error("No pending invitation found for this project");
      error.status = 404;
      return next(error);
    }

    // Update status to active
    const acceptQuery = `
      UPDATE ${schema}.project_collaborators 
      SET status = 'Active', joined_at = CURRENT_TIMESTAMP
      WHERE project_id = $1 AND user_id = $2 AND status = 'Invited'
      RETURNING *
    `;

    const result = await db.query(acceptQuery, [projectId, userId]);

    res.json({
      success: true,
      message: "Collaboration invitation accepted successfully",
      collaboration: result.rows[0],
    });
  } catch (error) {
    console.error("Accept collaboration invite error:", error);
    next(error);
  }
};

// Reject collaboration invitation
const rejectCollaborationInvite = async (req, res, next) => {
  try {
    const { projectId } = req.params;
    const userId = req.user.id;

    // Check if user has a pending invitation
    const inviteQuery = `
      SELECT * FROM ${schema}.project_collaborators
      WHERE project_id = $1 AND user_id = $2 AND status = 'Invited'
    `;

    const inviteResult = await db.query(inviteQuery, [projectId, userId]);

    if (inviteResult.rows.length === 0) {
      const error = new Error("No pending invitation found for this project");
      error.status = 404;
      return next(error);
    }

    // Delete the invitation
    const rejectQuery = `
      DELETE FROM ${schema}.project_collaborators 
      WHERE project_id = $1 AND user_id = $2 AND status = 'Invited'
    `;

    await db.query(rejectQuery, [projectId, userId]);

    res.json({
      success: true,
      message: "Collaboration invitation rejected",
    });
  } catch (error) {
    console.error("Reject collaboration invite error:", error);
    next(error);
  }
};

// Get user's collaboration invitations
const getUserCollaborationInvites = async (req, res, next) => {
  try {
    const userId = req.user.id;

    const invitesQuery = `
      SELECT 
        pc.*,
        sp.unit_code,
        sp.unit_name,
        sp.semester,
        sp.academic_year,
        sp.project_type,
        p.title,
        p.description,
        u.first_name as inviter_first_name,
        u.last_name as inviter_last_name,
        u.user_name as inviter_user_name
      FROM ${schema}.project_collaborators pc
      JOIN ${schema}.swinburne_projects sp ON pc.project_id = sp.id
      JOIN ${schema}.projects p ON sp.base_project_id = p.id
      LEFT JOIN ${schema}.users u ON pc.invited_by = u.id
      WHERE pc.user_id = $1 AND pc.status = 'Invited'
      ORDER BY pc.joined_at DESC
    `;

    const result = await db.query(invitesQuery, [userId]);

    res.json({
      success: true,
      invitations: result.rows,
    });
  } catch (error) {
    console.error("Get user collaboration invites error:", error);
    next(error);
  }
};

module.exports = {
  addCollaborator,
  updateCollaboratorRole,
  removeCollaborator,
  getProjectCollaborators,
  acceptCollaborationInvite,
  rejectCollaborationInvite,
  getUserCollaborationInvites,
};