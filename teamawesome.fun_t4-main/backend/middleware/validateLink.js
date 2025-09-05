const { z } = require('zod');

const linkSchema = z.object({
  title: z.string()
    .min(1, { message: "Title is required" })
    .max(100, { message: "Title must be 100 characters or less" }),
  url: z.string()
    .url({ message: "Invalid URL format" })
    .max(500, { message: "URL must be 500 characters or less" })
}).passthrough();

const validateLink = (req, res, next) => {
  const result = linkSchema.safeParse(req.body);

  if (!result.success) {
    const error = new Error("Validation failed");
    error.status = 400;
    error.code = "VALIDATION_ERROR";
    error.details = result.error.issues.map((e) => ({
      field: e.path.join('.'),
      message: e.message
    }));

    return next(error);
  }

  req.body = result.data;
  next();
};

module.exports = validateLink;