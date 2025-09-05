const { z } = require("zod");

const passwordField = z
    .string()
    .trim()
    .max(128, { message: "Password is too long" })
    .min(8, { message: "Password must be at least 8 characters long" })
    .refine((val) => /[a-z]/.test(val), {
        message: "Password must contain at least one lowercase letter"
    })
    .refine((val) => /[A-Z]/.test(val), {
        message: "Password must contain at least one uppercase letter"
    })
    .refine((val) => /\d/.test(val), {
        message: "Password must contain at least one number"
    })
    .refine((val) => /[\W_]/.test(val), {
        message: "Password must contain at least one special character"
    });
    

const passwordSchema = z.object({
    password: passwordField
}).passthrough();

const validatePassword = (req, res, next) => {
    const result = passwordSchema.safeParse(req.body);

    if (!result.success) {
        const error = new Error("Validation failed");
        error.status = 400;
        error.code = "VALIDATION_ERROR";
        error.details = result.error.issues.map((e) => ({
            field: e.path.join("."),
            message: e.message,
        }));

        return next(error);
    }

    req.body = result.data;
    next();
};

module.exports = validatePassword;
