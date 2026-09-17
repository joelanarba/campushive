const { prisma } = require("../config/prismaConfig");

const auditAdminRoles = async () => {
  const users = await prisma.user.findMany({
    where: { role: { has: "admin" } },
    orderBy: [{ created_at: "desc" }, { id: "asc" }],
    select: {
      id: true, full_name: true, email: true, role: true, created_at: true,
      _count: { select: { entrepreneur_profiles: true } },
    },
  });
  return users.map(({ _count, ...user }) => ({
    ...user,
    has_entrepreneur_role: user.role.includes("entrepreneur"),
    entrepreneur_profile_count: _count.entrepreneur_profiles,
    review_candidate: user.role.includes("entrepreneur") || _count.entrepreneur_profiles > 0,
  }));
};

const grantAdminRole = async (id) => {
  // Parameterized, atomic array update preserves concurrent role changes.
  const users = await prisma.$queryRaw`
    UPDATE users
    SET role = CASE WHEN 'admin'::"Role" = ANY(role) THEN role
      ELSE array_append(role, 'admin'::"Role") END
    WHERE id = ${id}::uuid
    RETURNING id, role`;
  if (!users.length) throw new Error("Account not found");
  return users[0];
};

const revokeAdminRole = async (id, apply) => {
  if (!apply) {
    const user = await prisma.user.findUnique({ where: { id }, select: { id: true, role: true } });
    if (!user) throw new Error("Account not found");
    const remaining = user.role.filter((role) => role !== "admin");
    if (!remaining.length) throw new Error("Refusing to leave an account without roles");
    return { id, current_roles: user.role, proposed_roles: remaining, applied: false };
  }
  // The guard and removal happen in one statement, including under concurrency.
  const users = await prisma.$queryRaw`
    UPDATE users SET role = array_remove(role, 'admin'::"Role")
    WHERE id = ${id}::uuid
      AND cardinality(array_remove(role, 'admin'::"Role")) > 0
    RETURNING id, role`;
  if (!users.length) throw new Error("Account not found or removal would leave no roles");
  return { ...users[0], applied: true };
};

module.exports = { auditAdminRoles, grantAdminRole, revokeAdminRole };
