const express = require('express');
const router = express.Router();

// Import controllers
const swinburneProjectController = require('../controllers/swinburneProjectController');
const collaborationController = require('../controllers/collaborationController');
const milestoneController = require('../controllers/milestoneController');

// Import middleware
const auth = require('../middleware/auth');
const projectUpload = require('../middleware/projectUpload');

// Swinburne Project Routes
router.post('/create', auth, projectUpload, swinburneProjectController.createSwinburneProject);
router.get('/my-projects', auth, swinburneProjectController.getUserSwinburneProjects);
router.get('/team-finder', swinburneProjectController.getSwinburneTeamFinder);
router.get('/units', swinburneProjectController.getSwinburneUnits);
router.get('/:projectId', auth, swinburneProjectController.getSwinburneProject);
router.put('/:projectId', auth, swinburneProjectController.updateSwinburneProject);
router.delete('/:projectId', auth, swinburneProjectController.deleteSwinburneProject);

// Collaboration Routes
router.get('/:projectId/collaborators', auth, collaborationController.getProjectCollaborators);
router.post('/:projectId/collaborators', auth, collaborationController.addCollaborator);
router.put('/:projectId/collaborators/:userId', auth, collaborationController.updateCollaboratorRole);
router.delete('/:projectId/collaborators/:userId', auth, collaborationController.removeCollaborator);

// Collaboration invitation routes
router.post('/:projectId/accept-invite', auth, collaborationController.acceptCollaborationInvite);
router.post('/:projectId/reject-invite', auth, collaborationController.rejectCollaborationInvite);
router.get('/invitations/pending', auth, collaborationController.getUserCollaborationInvites);

// Milestone Routes
router.get('/:projectId/milestones', auth, milestoneController.getProjectMilestones);
router.post('/:projectId/milestones', auth, milestoneController.addMilestone);
router.put('/:projectId/milestones/:milestoneId', auth, milestoneController.updateMilestone);
router.delete('/:projectId/milestones/:milestoneId', auth, milestoneController.deleteMilestone);
router.post('/:projectId/milestones/:milestoneId/complete', auth, milestoneController.completeMilestone);
router.post('/:projectId/milestones/:milestoneId/uncomplete', auth, milestoneController.uncompleteMilestone);
router.put('/:projectId/milestones/reorder', auth, milestoneController.reorderMilestones);

module.exports = router;