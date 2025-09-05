// This file now re-exports all functionality from separate controller files
const userController = require("./profile/userController");
const linkController = require("./profile/linkController");
const searchController = require("./profile/searchController");
const followController = require("./profile/followController");
const pictureController = require("./profile/pictureController");

// Re-export all controllers
module.exports = {
    // User profile controllers
    getProfile: userController.getProfile,
    updateName: userController.updateName,
    updateBio: userController.updateBio,
    updateProfileVisibility: userController.updateProfileVisibility,
    deleteAccount: userController.deleteAccount,

    // Link controllers
    addLink: linkController.addLink,
    updateLink: linkController.updateLink,
    deleteLink: linkController.deleteLink,

    // Search controllers
    searchUsers: searchController.searchUsers,
    getPublicProfile: searchController.getPublicProfile,

    // Follow controllers
    followUser: followController.followUser,
    unfollowUser: followController.unfollowUser,
    cancelFollowRequest: followController.cancelFollowRequest,
    removeFollower: followController.removeFollower,
    getPendingRequests: followController.getPendingRequests,
    respondToFollowRequest: followController.respondToFollowRequest,
    getFollowers: followController.getFollowers,
    getFollowing: followController.getFollowing,
    getUserFollowers: followController.getUserFollowers,
    getUserFollowing: followController.getUserFollowing,

    // Profile picture controllers
    uploadProfilePicture: pictureController.uploadProfilePicture,
    deleteProfilePicture: pictureController.deleteProfilePicture,
};
