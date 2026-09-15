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
    throw err;
  } finally {
    await client.end();
  }
};

module.exports = { checkDatabaseConnection };
