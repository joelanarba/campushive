const {
  prisma,
} = require("../config/db");
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

const listEntrepreneurs = async ({ page, limit, status }) => {
  const where = status ? { verification_status: status } : {};
  const [total, entrepreneurs] = await prisma.$transaction([
    prisma.entrepreneurProfile.count({ where }),
    prisma.entrepreneurProfile.findMany({
      where,
      skip: (page - 1) * limit,
      take: limit,
      orderBy: [{ created_at: "desc" }, { id: "asc" }],
      include: {
        user: {
          select: {
            full_name: true,
            email: true,
            is_email_verified: true,
          }
        }
      }
    })
  ], { isolationLevel: "RepeatableRead" });

  return {
    entrepreneurs,
    pagination: {
      page,
      limit,
      total,
      total_pages: Math.ceil(total / limit),
    },
  };
};

const updateEntrepreneurVerification = async (id, { verification_status, rejection_reason }) => {
  const profile = await prisma.entrepreneurProfile.findUnique({ where: { id } });
  if (!profile) {
    const error = new Error("Entrepreneur not found");
    error.status = 404;
    throw error;
  }

  return await prisma.entrepreneurProfile.update({
    where: { id },
    data: {
      verification_status,
      rejection_reason: verification_status === "rejected" ? rejection_reason : null,
    },
    include: {
      user: {
        select: {
          full_name: true,
          email: true,
        }
      }
    }
  });
};

module.exports = { listUsers, listEntrepreneurs, updateEntrepreneurVerification, listAdminServices, getAdminService, listCategories, getCategory,
  createCategory, patchCategory, deleteCategory };
