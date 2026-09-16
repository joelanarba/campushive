const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const path = require("node:path");

dotenv.config({ path: path.resolve(__dirname, "../.env") });
if (!process.env.JWT_ACCESS_SECRET?.trim()) {
  throw new Error("JWT_ACCESS_SECRET is required");
}

const { checkDatabaseConnection } = require("./config/db");
const authRoutes = require("./routes/authRoutes");
const adminRoutes = require("./routes/adminRoutes");
const { errorHandler } = require("./middlewares/errorHandler");
const { clientOrigins } = require("./config/authConfig");

const app = express();
const PORT = process.env.PORT || 5000;

// Core Middlewares
app.use(
  cors({
    origin: clientOrigins,
    credentials: true,
  }),
);
app.use(express.json());

app.use("/api/auth", authRoutes);
app.use("/api/admin", adminRoutes);
app.use(errorHandler);

checkDatabaseConnection()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`App is running on localhost: ${PORT}`);
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
