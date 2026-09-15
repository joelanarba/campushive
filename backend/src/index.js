const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const { checkDatabaseConnection } = require("./config/db");

dotenv.config();

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
