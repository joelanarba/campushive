const path = require("node:path");
require("dotenv").config({ path: path.resolve(__dirname, "../.env") });
const { prisma } = require("../src/config/db");
const {
  auditAdminRoles,
  grantAdminRole,
  revokeAdminRole,
} = require("../src/services/adminRoleServices");

const run = async () => {
  const [command, ...args] = process.argv.slice(2);
  if (command === "audit" && args.length === 0) {
    const users = await auditAdminRoles();
    console.log(
      JSON.stringify(
        {
          message:
            "Read-only audit. Review candidates are not proof of incorrect admin assignment.",
          total_admins: users.length,
          review_candidates: users.filter((user) => user.review_candidate)
            .length,
          users,
        },
        null,
        2,
      ),
    );
    return;
  }
  const validCommand = command === "grant" || command === "revoke";
  const apply =
    command === "revoke" && args.length === 3 && args[2] === "--apply";
  const id = args[1];
  if (
    !validCommand ||
    args[0] !== "--user-id" ||
    !(args.length === 2 || apply) ||
    !/^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i.test(
      id || "",
    )
  ) {
    throw new Error(
      "Usage: audit | grant --user-id <UUID> | revoke --user-id <UUID> [--apply]",
    );
  }
  const result =
    command === "grant"
      ? await grantAdminRole(id)
      : await revokeAdminRole(id, apply);
  console.log(JSON.stringify(result, null, 2));
};

const timeout = setTimeout(() => {
  console.error(
    "Admin command timed out; check database connectivity. If applying changes, audit before retrying.",
  );
  process.exit(1);
}, 20000);

run()
  .catch((error) => {
    // Database errors can contain connection details; do not print them.
    const safeMessages = [
      "Account not found",
      "Refusing to leave an account without roles",
      "Account not found or removal would leave no roles",
      "Usage: audit | grant --user-id <UUID> | revoke --user-id <UUID> [--apply]",
    ];
    console.error(
      safeMessages.includes(error.message)
        ? error.message
        : "Admin command failed; check database configuration and connectivity.",
    );
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
    clearTimeout(timeout);
  });
