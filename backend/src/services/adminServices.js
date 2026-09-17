const {
  prisma,
} = require("../config/prismaConfig");
const {
  listAdminServices,
  getAdminService,
} = require("./serviceServices");
const {
  listCategories,
  getCategory,
  createCategory,
  patchCategory,
  deleteCategory,
} = require("./categoryServices");

const listUsers = async ({ page, limit, role }) => {
  const where = role ? { role: { has: role } } : {};
  const [total, users] = await prisma.$transaction(
    [
      prisma.user.count({ where }),
      prisma.user.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: [{ created_at: "desc" }, { id: "asc" }],
        select: {
          id: true,
          full_name: true,
          email: true,
          role: true,
          is_email_verified: true,
          created_at: true,
        },
      }),
    ],
    { isolationLevel: "RepeatableRead" },
  );
  return {
    users,
    pagination: { page, limit, total, total_pages: Math.ceil(total / limit) },
  };
};

module.exports = { listUsers, listAdminServices, getAdminService, listCategories, getCategory,
  createCategory, patchCategory, deleteCategory };
