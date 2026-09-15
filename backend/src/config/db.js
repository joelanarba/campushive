const dotenv = require("dotenv");
const { Client } = require("pg");

dotenv.config();

const checkDatabaseConnection = async () => {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
  });
  try {
    await client.connect();
    console.log("PostgreSQL database connected successfully");
  } catch (err) {
    // console.error("Error connecting to PostgreSQL database:", err);
    throw err; // Rethrow the error to be handled in index.js
  } finally {
    await client.end();
  }
};

module.exports = { checkDatabaseConnection };
