const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const db = require("../db/db");

const schema = process.env.NODE_ENV == 'production' ? process.env.DB_SCHEMA : (process.env.DEV_SCHEMA || 'public');

// User signup
exports.signup = async (req, res, next) => {
    try {
        const { firstName, lastName, userName, email, password } = req.body;

        // Check if user already exists
        const existingUserQuery = `SELECT id FROM ${schema}.users WHERE email = $1`;
        const existingUser = await db.query(existingUserQuery, [email]);

        if (existingUser.rows.length > 0) {
            const error = new Error("Email already in use");
            error.status = 400;
            error.code = "EMAIL_IN_USE";
            return next(error);
        }

        // Hash password
        const saltRounds = 10;
        const hashedPassword = await bcrypt.hash(password, saltRounds);

        // Insert new user
        const insertUserQuery = `
      INSERT INTO ${schema}.users (id, first_name, last_name, user_name, email, password)
                VALUES (gen_random_uuid(), $1, $2, $3, $4, $5)
                RETURNING id, first_name, last_name, user_name, email
    `;
        const newUser = await db.query(insertUserQuery, [
            firstName,
            lastName,
            userName,
            email,
            hashedPassword,
        ]);

        return res.status(201).json({
            success: true,
            data: {
                user: {
                    id: newUser.rows[0].id,
                    firstName: newUser.rows[0].first_name,
                    lastName: newUser.rows[0].last_name,
                    userName: newUser.rows[0].user_name,
                    email: newUser.rows[0].email,
                    createdAt: newUser.rows[0].created_at,
                },
            },
            message: "User registered successfully",
        });
    } catch (error) {
        console.error("Signup error:", error);
        next(error);
    }
};

// User login
exports.login = async (req, res, next) => {
    try {
        const { email, password } = req.body;

        // Find user by email
        const userQuery = `SELECT * FROM ${schema}.users WHERE email = $1`;
        const userResult = await db.query(userQuery, [email]);

        if (userResult.rows.length === 0) {
            const error = new Error("Invalid credentials");
            error.status = 401;
            error.code = "INVALID_CREDENTIALS";
            return next(error);
        }

        const user = userResult.rows[0];

        // Verify password
        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) {
            const error = new Error("Invalid credentials");
            error.status = 401;
            error.code = "INVALID_CREDENTIALS";
            return next(error);
        }

        // Generate JWT token
        const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET, {
            expiresIn: process.env.JWT_EXPIRES_IN || "7h",
        });

        return res.status(200).json({
            success: true,
            data: {
                token,
                user: {
                    id: user.id,
                    firstName: user.first_name,
                    lastName: user.last_name,
                    email: user.email,
                },
            },
            message: "Login successful",
        });
    } catch (error) {
        console.error("Login error:", error);
        next(error);
    }
};

// Get current user
exports.getCurrentUser = async (req, res, next) => {
    try {
        const userId = req.user.id;

        const userQuery = `
      SELECT id, first_name, last_name, email, bio, profile_picture_url, is_profile_public, created_at 
      FROM ${schema}.users 
      WHERE id = $1
    `;
        const userResult = await db.query(userQuery, [userId]);

        if (userResult.rows.length === 0) {
            const error = new Error("User not found");
            error.status = 404;
            error.code = "USER_NOT_FOUND";
            return next(error);
        }

        const user = userResult.rows[0];

        return res.status(200).json({
            success: true,
            data: {
                user: {
                    id: user.id,
                    firstName: user.first_name,
                    lastName: user.last_name,
                    email: user.email,
                    bio: user.bio || null,
                    profilePictureUrl: user.profile_picture_url || null,
                    isProfilePublic: user.is_profile_public,
                    createdAt: user.created_at,
                },
            },
        });
    } catch (error) {
        console.error("Get current user error:", error);
        next(error);
    }
};
