const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const path = require("node:path");
const { checkDatabaseConnection } = require("./config/db");
const authRoutes = require("./routes/authRoutes");
const { errorHandler } = require("./middlewares/errorHandler");

dotenv.config({ path: path.resolve(__dirname, "../.env") });

if (!process.env.JWT_ACCESS_SECRET?.trim()) {
  if (process.env.NODE_ENV === "production") {
    throw new Error("JWT_ACCESS_SECRET is required in production");
  }
  console.warn(
    "⚠️  WARNING: JWT_ACCESS_SECRET is not set in .env. Using temporary development fallback.",
  );
  process.env.JWT_ACCESS_SECRET =
    "development_jwt_access_secret_32_bytes_long_key";
}

const app = express();
const PORT = process.env.PORT || 5000;
const CLIENT_URL = process.env.CLIENT_URL || "http://localhost:5173";

// Core Middlewares
app.use(
  cors({
    origin: CLIENT_URL,
    credentials: true,
  }),
);
app.use(express.json());

// Root test route
app.get("/", (req, res) => {
  res.json({
    message: "CampusHive Backend API is running",
  });
});

// API Routes
app.use("/api/auth", authRoutes);

// Centralized error handling
app.use(errorHandler);

checkDatabaseConnection()
  .then(() => {
    const server = app.listen(PORT, () => {
      console.log(`App is running on port ${PORT}`);
    });

    server.on("error", (err) => {
      if (err.code === "EACCES") {
        console.error(
          `Port ${PORT} is reserved by Windows. Please set PORT=5001 in your backend/.env file.`,
        );
      } else {
        console.error("Server error:", err);
      }
    });
  })
  .catch((err) => {
    console.error(
      "Failed to start the server due to database connection error:",
      err.message,
    );
    process.exit(1);
  });

module.exports = app;
