const multer = require("multer");
const path = require("path");

// Configure multer storage
const storage = multer.memoryStorage(); // Store files in memory for S3 upload

// File filter to allow only images
const fileFilter = (req, file, cb) => {
    // Accept images only
    if (!file.originalname.match(/\.(jpg|jpeg|png|gif)$/)) {
        return cb(new Error("Only image files are allowed!"), false);
    }
    cb(null, true);
};

// Create multer upload instance with limits
const upload = multer({
    storage: storage,
    limits: {
        fileSize: 5 * 1024 * 1024, // 5MB limit
    },
    fileFilter: fileFilter,
});

// Export middleware for single file upload with field name
const uploadProfilePicture = upload.single("profilePicture");

module.exports = {
    uploadProfilePicture,
};
