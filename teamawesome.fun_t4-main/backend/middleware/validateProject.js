const validateProject = (req, res, next) => {
    const { title, description } = req.body;
    const errors = [];

    // Validate title
    if (!title || typeof title !== "string") {
        errors.push("Title is required and must be a string");
    } else if (title.trim().length < 3) {
        errors.push("Title must be at least 3 characters long");
    } else if (title.length > 100) {
        errors.push("Title cannot exceed 100 characters");
    }

    // Validate description (optional)
    if (description && typeof description !== "string") {
        errors.push("Description must be a string");
    } else if (description && description.length > 500) {
        errors.push("Description cannot exceed 500 characters");
    }

    // Check if files are provided (at least some content should be provided)
    const files = req.files || [];
    if (
        files.length === 0 &&
        (!description || description.trim().length === 0)
    ) {
        errors.push("Project must have either images or description");
    }

    if (errors.length > 0) {
        const error = new Error("Validation failed");
        error.status = 400;
        error.details = errors;
        return next(error);
    }

    next();
};

module.exports = validateProject;
