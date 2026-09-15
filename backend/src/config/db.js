const dotenv = require("dotenv");
const { PrismaClient } = require("@prisma/client");
const { PrismaPg } = require("@prisma/adapter-pg");

dotenv.config();

const connectionString =
  process.env.DATABASE_URL ||
  "postgresql://placeholder:placeholder@localhost:5432/campushive_db?schema=public";

const adapter = new PrismaPg({ connectionString });

const prisma = new PrismaClient({
  adapter,
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
