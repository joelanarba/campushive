const path = require("node:path");
const dotenv = require("dotenv");
const { defineConfig } = require("prisma/config");

dotenv.config({ path: path.join(__dirname, ".env") });

module.exports = defineConfig({
  schema: "prisma/schema.prisma",
  migrations: { path: "prisma/migrations" },
  datasource: {
    url:
      process.env.DATABASE_URL ||
      "postgresql://placeholder:placeholder@localhost:5432/campushive_db?schema=public",
  },
});
