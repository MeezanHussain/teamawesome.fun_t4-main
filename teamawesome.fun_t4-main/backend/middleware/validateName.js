const { z } = require("zod");

const nameSchema = z
    .object({
        firstName: z
            .string()
            .min(1, { message: "First name is required" })
            .max(38, { message: "First name too long" })
            .regex(/^[A-Za-z\s-]+$/, {
                message: "First name contains invalid characters",
            }),

        lastName: z
            .string()
            .min(1, { message: "Last name is required" })
            .max(38, { message: "Last name too long" })
            .regex(/^[A-Za-z\s-]+$/, {
                message: "Last name contains invalid characters",
            }),
    })
    .passthrough();

const validateName = (req, res, next) => {
    const result = nameSchema.safeParse(req.body);

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

module.exports = validateName;
