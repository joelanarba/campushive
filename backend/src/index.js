const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const path = require("node:path");
const { checkDatabaseConnection } = require("./config/db");
const authRoutes = require("./routes/authRoutes");
const { errorHandler } = require("./middlewares/errorHandler");

dotenv.config({ path: path.resolve(__dirname, "../.env") });
if (!process.env.JWT_ACCESS_SECRET?.trim()) {
  throw new Error("JWT_ACCESS_SECRET is required");
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

app.use("/api/auth", authRoutes);
app.use(errorHandler);

checkDatabaseConnection()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`App is running on port ${PORT}`);
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
