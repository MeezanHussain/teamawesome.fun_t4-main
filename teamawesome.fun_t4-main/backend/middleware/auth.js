const jwt = require("jsonwebtoken");
const db = require("../db/db");

const schema = process.env.NODE_ENV == 'production' ? process.env.DB_SCHEMA : (process.env.DEV_SCHEMA || 'public');

module.exports = async (req, res, next) => {
    // Skip auth check if the route allows it
    if (req.skipAuth) {
        return next();
    }

    try {
        // Get token from header
        const token = req.header("Authorization")?.replace("Bearer ", "");
        if (!token) {
            const error = new Error("No token, authorization denied");
            error.status = 401;
            error.code = "UNAUTHORIZED";
            return next(error);
        }

        // Verify token
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        // Check if user exists
        const query = `SELECT id, user_name, email FROM ${schema}.users WHERE id = $1`;
        const result = await db.query(query, [decoded.userId]);

        if (result.rows.length === 0) {
            const error = new Error("User not found");
            error.status = 401;
            error.code = "UNAUTHORIZED";
            return next(error);
        }

        // Add user info to request object
        req.user = {
            id: result.rows[0].id,
            userName: result.rows[0].user_name,
            email: result.rows[0].email,
        };

        next();
    } catch (error) {
        console.error("Auth middleware error:", error);
        const err = new Error("Token is not valid");
        err.status = 401;
        err.code = "UNAUTHORIZED";
        return next(err);
    }
};
