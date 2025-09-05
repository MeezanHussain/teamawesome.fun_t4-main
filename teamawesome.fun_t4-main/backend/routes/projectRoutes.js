const express = require('express');
const router = express.Router();
const projectController = require('../controllers/projectController');
const auth = require('../middleware/auth');
const { uploadProjectImages } = require('../middleware/projectUpload');

// Public routes
router.get('/gallery', projectController.getPublicProjectGallery);
router.get('/user/:userId/public', projectController.getUserProjectsWithAccess);

// Apply auth middleware to all other project routes
router.use(auth);

// Project routes
router.post('/', uploadProjectImages, projectController.createProject);
router.get('/', projectController.getProjects);
router.get('/user/:userId?', projectController.getUserProjects);
router.delete('/:projectId', projectController.deleteProject);
router.post('/:projectId/like', projectController.toggleLike);

module.exports = router;