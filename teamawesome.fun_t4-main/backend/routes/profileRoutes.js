const express = require("express");
const router = express.Router();
const profileController = require("../controllers/profileController");
const auth = require("../middleware/auth");
const validateName = require("../middleware/validateName");
const validateBio = require("../middleware/validateBio");
const validateLink = require("../middleware/validateLink");
const { uploadProfilePicture } = require("../middleware/fileUpload");

// Apply auth middleware to all profile routes (except those that are public)
router.use(function (req, res, next) {
    // For public routes, try to authenticate but don't require it
    if (req.path === "/search" || req.path.startsWith("/public/")) {
      // Try to authenticate but don't fail if no token
      if (req.headers.authorization) {
        // Create a custom auth check that won't fail the request
        try {
          const token = req.header("Authorization")?.replace("Bearer ", "");
          if (token) {
            const jwt = require("jsonwebtoken");
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            const db = require("../db/db");
            const schema = process.env.NODE_ENV == 'production' ? process.env.DB_SCHEMA : (process.env.DEV_SCHEMA || 'public');
            
            // Check if user exists
            const query = `SELECT id, email FROM ${schema}.users WHERE id = $1`;
            db.query(query, [decoded.userId]).then(result => {
              if (result.rows.length > 0) {
                req.user = {
                  id: result.rows[0].id,
                  email: result.rows[0].email,
                };
              } else {
                req.user = null;
              }
              next();
            }).catch(err => {
              req.user = null;
              next();
            });
          } else {
            req.user = null;
            next();
          }
        } catch (err) {
          req.user = null;
          next();
        }
      } else {
        req.user = null;
        next();
      }
    } else {
      auth(req, res, next);
    }
  });
  

// Public routes
router.get("/search", profileController.searchUsers);
router.get("/public/:userName", profileController.getPublicProfile);

// Protected routes
router.get("/", profileController.getProfile);
router.put("/name", validateName, profileController.updateName);
router.put("/bio", validateBio, profileController.updateBio);
router.put("/visibility", profileController.updateProfileVisibility);

// Profile picture routes
router.post(
  "/picture",
  uploadProfilePicture,
  profileController.uploadProfilePicture
);
router.delete("/picture", profileController.deleteProfilePicture);

// Links management
router.post("/links", validateLink, profileController.addLink);
router.put("/links/:linkId", validateLink, profileController.updateLink);
router.delete("/links/:linkId", profileController.deleteLink);

// Follow functionality
router.post("/follow/:targetUserName", profileController.followUser);
router.delete("/follow/:targetUserName", profileController.unfollowUser);
router.delete(
  "/follow-request/:targetUserName",
  profileController.cancelFollowRequest
);
router.delete("/followers/:followerUserName", profileController.removeFollower);
router.get("/follow-requests", profileController.getPendingRequests);
router.put(
  "/follow-requests/:requestId",
  profileController.respondToFollowRequest
);
router.get("/followers", profileController.getFollowers);
router.get("/following", profileController.getFollowing);

// Get another user's followers and following lists
router.get("/followers/:userId", profileController.getUserFollowers);
router.get("/following/:userId", profileController.getUserFollowing);

// Delete account
router.delete("/", profileController.deleteAccount);

module.exports = router;
