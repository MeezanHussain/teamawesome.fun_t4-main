const { z } = require("zod");

const bioSchema = z
  .string()
  .trim() 
  .max(1000, { message: "Bio must be 1000 characters or less" }) 
  .or(z.literal("")); // allow clearing bio

const validateBioAnything = (req, res, next) => {
  const bio = req.body.bio;

  if (bio === undefined) return next();

  if (typeof bio !== "string") {
    const error = new Error("Bio must be a string");
    error.status = 400;
    error.code = "INVALID_TYPE";
    error.details = [{ field: "bio", message: "Bio must be a string" }];
    return next(error);
  }

  const result = bioSchema.safeParse(bio);

  if (!result.success) {
    const error = new Error("Validation failed");
    error.status = 400;
    error.code = "VALIDATION_ERROR";
    error.details = result.error.issues.map((e) => ({
      field: "bio",
      message: e.message,
    }));
    return next(error);
  }

  req.body.bio = result.data;
  next();
};

module.exports = validateBioAnything;
