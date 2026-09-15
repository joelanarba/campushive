const path = require("node:path");
const dotenv = require("dotenv");
const { defineConfig, env } = require("prisma/config");

dotenv.config({ path: path.join(__dirname, ".env") });

module.exports = defineConfig({
  schema: "prisma/schema.prisma",
  migrations: { path: "prisma/migrations" },
  datasource: { url: env("DATABASE_URL") },
});
