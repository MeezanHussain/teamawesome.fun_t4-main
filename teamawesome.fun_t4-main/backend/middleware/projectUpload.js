const multer = require("multer");

// Configure multer storage for project images
const storage = multer.memoryStorage();

// File filter to allow only images
const fileFilter = (req, file, cb) => {
    if (!file.originalname.match(/\.(jpg|jpeg|png|gif|webp)$/i)) {
        return cb(
            new Error("Only image files are allowed for projects!"),
            false
        );
    }
    cb(null, true);
};

// Create multer upload instance for multiple files
const upload = multer({
    storage: storage,
    limits: {
        fileSize: 10 * 1024 * 1024, // 10MB limit per file
        files: 5, // Maximum 5 files per upload
    },
    fileFilter: fileFilter,
});

// Export middleware for multiple project images
const uploadProjectImages = upload.array("projectImages", 5);

module.exports = {
    uploadProjectImages,
};
