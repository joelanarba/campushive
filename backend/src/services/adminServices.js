const { prisma } = require("../config/db");
const {
  domainError,
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

const entrepreneurSelect = {
  id: true,
  user_id: true,
  business_name: true,
  description: true,
  phone_number: true,
  location: true,
  created_at: true,
  verification_status: true,
  rejection_reason: true,
  user: { select: { id: true, full_name: true, email: true } },
};

const listPendingEntrepreneurs = async ({ page, limit }) => {
  const where = { verification_status: "pending" };
  const [total, entrepreneurs] = await prisma.$transaction(
    [
      prisma.entrepreneurProfile.count({ where }),
      prisma.entrepreneurProfile.findMany({
        where,
        select: entrepreneurSelect,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: [{ created_at: "asc" }, { id: "asc" }],
      }),
    ],
    { isolationLevel: "RepeatableRead" },
  );
  return {
    entrepreneurs,
    pagination: { page, limit, total, total_pages: Math.ceil(total / limit) },
  };
};

const getEntrepreneur = async (id) => {
  const profile = await prisma.entrepreneurProfile.findUnique({
    where: { id },
    select: entrepreneurSelect,
  });
  if (!profile) throw domainError("PROFILE_NOT_FOUND");
  return profile;
};

// The conditional UPDATE locks the same profile row used by booking transactions.
// Keep the response read in this transaction so a later decision cannot change it.
const transitionEntrepreneur = (
  id,
  currentStatus,
  verificationStatus,
  rejectionReason = null,
) =>
  prisma.$transaction(
    async (tx) => {
      const updated = await tx.entrepreneurProfile.updateMany({
        where: { id, verification_status: currentStatus },
        data: {
          verification_status: verificationStatus,
          rejection_reason: rejectionReason,
        },
      });
      if (updated.count !== 1) {
        const exists = await tx.entrepreneurProfile.findUnique({
          where: { id },
          select: { id: true },
        });
        throw domainError(
          exists ? "VERIFICATION_CONFLICT" : "PROFILE_NOT_FOUND",
        );
      }
      return tx.entrepreneurProfile.findUnique({
        where: { id },
        select: entrepreneurSelect,
      });
    },
    { isolationLevel: "ReadCommitted" },
  );

const approveEntrepreneur = (id) =>
  transitionEntrepreneur(id, "pending", "verified");
const rejectEntrepreneur = (id, reason) =>
  transitionEntrepreneur(id, "pending", "rejected", reason);
const suspendEntrepreneur = (id) =>
  transitionEntrepreneur(id, "verified", "suspended");
const reopenEntrepreneur = (id) =>
  transitionEntrepreneur(id, "suspended", "pending");
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

module.exports = {
  listPendingEntrepreneurs,
  getEntrepreneur,
  approveEntrepreneur,
  rejectEntrepreneur,
  suspendEntrepreneur,
  reopenEntrepreneur,
  listUsers,
  listAdminServices,
  getAdminService,
  listCategories,
  getCategory,
  createCategory,
  patchCategory,
  deleteCategory,
};
