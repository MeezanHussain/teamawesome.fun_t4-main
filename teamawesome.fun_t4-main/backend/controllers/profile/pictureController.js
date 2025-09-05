const db = require("../../db/db");
const s3Service = require("../../utils/s3Service");

const schema =
    process.env.NODE_ENV === "production"
        ? process.env.DB_SCHEMA
        : (process.env.DEV_SCHEMA || 'public');

/**
 * Upload profile picture to S3 and update user profile
 */
const uploadProfilePicture = async (req, res, next) => {
    try {
        // Check if file was uploaded
        if (!req.file) {
            const error = new Error("No image file provided");
            error.status = 400;
            return next(error);
        }

        const userId = req.user.id;

        // Get current profile picture URL if exists
        const userQuery = `SELECT profile_picture_url FROM ${schema}.users WHERE id = $1`;
        const userResult = await db.query(userQuery, [userId]);

        if (userResult.rows.length === 0) {
            const error = new Error("User not found");
            error.status = 404;
            return next(error);
        }

        const oldPictureUrl = userResult.rows[0].profile_picture_url;

        // Upload new picture to S3
        const fileBuffer = req.file.buffer;
        const fileName = req.file.originalname;
        const mimeType = req.file.mimetype;

        const pictureUrl = await s3Service.uploadFile(
            fileBuffer,
            fileName,
            mimeType
        );

        // Update user profile with new picture URL
        const updateQuery = `UPDATE ${schema}.users SET profile_picture_url = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 RETURNING profile_picture_url`;
        const updateResult = await db.query(updateQuery, [pictureUrl, userId]);

        // Delete old picture from S3 if exists
        if (oldPictureUrl) {
            await s3Service
                .deleteFile(oldPictureUrl)
                .catch((err) =>
                    console.error("Error deleting old profile picture:", err)
                );
        }

        // Return success response
        res.status(200).json({
            success: true,
            data: {
                profilePictureUrl: updateResult.rows[0].profile_picture_url,
            },
            message: "Profile picture updated successfully",
        });
    } catch (error) {
        console.error("Profile picture upload error:", error);
        next(error);
    }
};

/**
 * Delete profile picture from S3 and update user profile
 */
const deleteProfilePicture = async (req, res, next) => {
    try {
        const userId = req.user.id;

        // Get current profile picture URL
        const userQuery = `SELECT profile_picture_url FROM ${schema}.users WHERE id = $1`;
        const userResult = await db.query(userQuery, [userId]);

        if (userResult.rows.length === 0) {
            const error = new Error("User not found");
            error.status = 404;
            return next(error);
        }

        const pictureUrl = userResult.rows[0].profile_picture_url;

        if (!pictureUrl) {
            const error = new Error("No profile picture to delete");
            error.status = 400;
            return next(error);
        }

        // Delete picture from S3
        await s3Service.deleteFile(pictureUrl);

        // Update user profile to remove picture URL
        const updateQuery = `UPDATE ${schema}.users SET profile_picture_url = NULL, updated_at = CURRENT_TIMESTAMP WHERE id = $1`;
        await db.query(updateQuery, [userId]);

        // Return success response
        res.status(200).json({
            success: true,
            message: "Profile picture deleted successfully",
        });
    } catch (error) {
        console.error("Profile picture delete error:", error);
        next(error);
    }
};

module.exports = {
    uploadProfilePicture,
    deleteProfilePicture,
};
