const AWS = require("aws-sdk");
const { v4: uuidv4 } = require("uuid");

const isProd = process.env.NODE_ENV === "production";

// Configure AWS S3
const s3 = new AWS.S3({
    accessKeyId: isProd
        ? process.env.AWS_ACCESS_KEY_ID
        : process.env.DEV_AWS_ACCESS_KEY_ID,
    secretAccessKey: isProd
        ? process.env.AWS_SECRET_ACCESS_KEY
        : process.env.DEV_AWS_SECRET_ACCESS_KEY,
    region: isProd
        ? process.env.AWS_REGION
        : process.env.DEV_AWS_REGION || "us-east-1",
    endpoint: isProd ? undefined : process.env.DEV_S3_ENDPOINT, // required for LocalStack
    s3ForcePathStyle: !isProd, // required for LocalStack
});

const bucketName = isProd
    ? process.env.S3_BUCKET_NAME
    : process.env.DEV_S3_BUCKET_NAME;

/**
 * Upload file to S3 bucket
 * @param {Buffer} fileBuffer - File buffer to upload
 * @param {string} fileName - Original file name
 * @param {string} mimeType - File MIME type
 * @returns {Promise<string>} - URL of uploaded file
 */
const uploadFile = async (fileBuffer, fileName, mimeType) => {
    const fileExtension = fileName.split(".").pop();
    const uniqueFileName = `${uuidv4()}.${fileExtension}`;
    const key = `profile-pictures/${uniqueFileName}`;

    const params = {
        Bucket: bucketName,
        Key: key,
        Body: fileBuffer,
        ContentType: mimeType,
        ACL: "public-read",
    };

    try {
        const result = await s3.upload(params).promise();

        // Return public-accessible URL (browser-friendly)
        if (isProd) {
            return result.Location; // e.g. https://bucket.s3.amazonaws.com/...
        } else {
            // Browser should use localhost even though backend uses localstack DNS
            return `http://localhost:4566/${bucketName}/${key}`;
        }
    } catch (error) {
        console.error("S3 upload error:", error);
        throw new Error("Failed to upload file to S3");
    }
};

/**
 * Delete file from S3 bucket
 * @param {string} fileUrl - URL of file to delete
 * @returns {Promise<void>}
 */
const deleteFile = async (fileUrl) => {
    if (!fileUrl) return;

    // Extract the key from the URL
    // Format: https://bucket-name.s3.region.amazonaws.com/folder/filename
    const urlParts = fileUrl.split("/");
    const key = urlParts.slice(3).join("/");

    const params = {
        Bucket: bucketName,
        Key: key,
    };

    try {
        await s3.deleteObject(params).promise();
    } catch (error) {
        console.error("S3 delete error:", error);
        throw new Error("Failed to delete file from S3");
    }
};


/**
 * Upload project image to S3 bucket
 * @param {Buffer} fileBuffer - File buffer to upload
 * @param {string} fileName - Original file name
 * @param {string} mimeType - File MIME type
 * @returns {Promise<string>} - URL of uploaded file
 */
const uploadProjectImage = async (fileBuffer, fileName, mimeType) => {
  // Create a unique file name to prevent overwriting
  const fileExtension = fileName.split('.').pop();
  const uniqueFileName = `${uuidv4()}.${fileExtension}`;
  const key = `project-images/${uniqueFileName}`;

  const params = {
    Bucket: bucketName,
    Key: `project-images/${uniqueFileName}`,
    Body: fileBuffer,
    ContentType: mimeType,
    ACL: 'public-read' // Make the file publicly accessible
  };

  try {
    const uploadResult = await s3.upload(params).promise();
    if (isProd) {
        return uploadResult.Location; // e.g. https://bucket.s3.amazonaws.com/...
    } else {
        // Browser should use localhost even though backend uses localstack DNS
        return `http://localhost:4566/${bucketName}/${key}`;
    }
  } catch (error) {
    console.error('S3 project image upload error:', error);
    throw new Error('Failed to upload project image to S3');
  }
};


module.exports = {
    uploadFile,
    deleteFile,
    uploadProjectImage,
};
