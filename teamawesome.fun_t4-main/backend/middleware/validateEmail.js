const { z } = require('zod');

const emailSchema = z.object({
    email: z.string().email({ message: "Invalid email address" })
}).passthrough();

const validateEmail = (req, res, next) => {
    const result = emailSchema.safeParse(req.body);

    if (!result.success) {
        const error = new Error("Validation failed");
        error.status = 400;
        error.code = "VALIDATION_ERROR";
        error.message = result.error.issues.map((e) => ({
            field: e.path.join('.'),
            message: e.message
        }));

        return next(error);
    }

    req.body = result.data;
    next();
};

module.exports = validateEmail;