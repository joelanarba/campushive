const dotenv = require("dotenv");
const { PrismaClient } = require("@prisma/client");

dotenv.config();

const prisma = new PrismaClient({
  log:
    process.env.NODE_ENV === "development"
      ? ["query", "info", "warn", "error"]
      : ["error"],
});

const checkDatabaseConnection = async () => {
  try {
    await prisma.$connect();
    console.log("PostgreSQL database connected successfully via Prisma");
  } catch (err) {
    console.error("Error connecting to PostgreSQL database:", err.message);
    throw err;
  }
};

module.exports = { prisma, checkDatabaseConnection };
