function errorHandler(err, req, res, next) {
    console.error(err); // For debugging/server logs

    const status = err.status || 500;

    const errorResponse = {
        success: false,
        error: {
            message: err.message || "Something went wrong",
            code: err.code || "INTERNAL_SERVER_ERROR",
        },
    };

    if (err.details) {
        errorResponse.error.details = err.details;
    }

    res.status(status).json(errorResponse);
}

module.exports = errorHandler;
