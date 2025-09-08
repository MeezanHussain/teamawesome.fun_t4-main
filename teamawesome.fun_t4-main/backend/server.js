require("dotenv").config();
const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const path = require("path");

// Import routes
const profileRoutes = require("./routes/profileRoutes");
const authRoutes = require("./routes/authRoutes");
const projectRoutes = require('./routes/projectRoutes');
const swinburneProjectRoutes = require('./routes/swinburneProjectRoutes');

// Import error handler
const errorHandler = require("./middleware/errorHandler");

// Initialize express app
const app = express();

// Middlewares
app.use(cors());
app.use(helmet());
app.use(morgan("dev"));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use("/api/profile", profileRoutes);
app.use("/api/auth", authRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/swinburne-projects', swinburneProjectRoutes);

// Custom error handling for multer
app.use((err, req, res, next) => {
    if (err.name === "MulterError") {
        if (err.code === "LIMIT_FILE_SIZE") {
            return res.status(400).json({
                success: false,
                message: "File too large. Maximum size is 5MB.",
            });
        }
        return res.status(400).json({
            success: false,
            message: err.message,
        });
    }
    next(err);
});


app.get('/health', (req, res) => {
    res.status(200).json({
        msg: "Backend running succesfully!"
    })
})

// Error handling middleware
app.use(errorHandler);

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});

module.exports = app;
