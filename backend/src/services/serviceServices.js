const {
  Prisma,
} = require("@prisma/client");
const {
  prisma,
} = require("../config/prismaConfig");

const domainError = (code) => Object.assign(new Error("Service operation failed"), { code });
const categorySelect = { id: true, category_name: true, tag: true, description: true, created_at: true };
const serviceSelect = {
  id: true, title: true, description: true, entrepreneur_id: true, category_id: true,
  is_active: true, location_type: true, price: true, duration_minutes: true,
  created_at: true, updated_at: true, category: { select: categorySelect },
};
const publicSelect = {
  ...serviceSelect,
  entrepreneur: { select: { id: true, business_name: true, location: true } },
};
const adminSelect = {
  ...serviceSelect,
  entrepreneur: { select: {
    id: true, business_name: true, location: true, verification_status: true,
    user: { select: { id: true, full_name: true, email: true } },
  } },
};
// Every public query uses this predicate, including exact-ID lookup.
const publicVisibility = { is_active: true, entrepreneur: { verification_status: "verified" } };
const serializeService = (service) => ({ ...service, price: service.price.toFixed(2) });
const serviceFilters = (query) => ({
  ...(query.category_id ? { category_id: query.category_id } : {}),
  ...(query.entrepreneur_id ? { entrepreneur_id: query.entrepreneur_id } : {}),
  ...(query.is_active !== undefined ? { is_active: query.is_active === "true" } : {}),
  ...(query.verification_status ? { entrepreneur: { verification_status: query.verification_status } } : {}),
});
const listServices = async (query, scope, select = serviceSelect) => {
  const { page, limit } = query;
  const where = { AND: [scope, serviceFilters(query)] };
  const [total, services] = await prisma.$transaction([
    prisma.service.count({ where }),
    prisma.service.findMany({ where, select, skip: (page - 1) * limit, take: limit,
      orderBy: [{ created_at: "desc" }, { id: "asc" }] }),
  ], { isolationLevel: "RepeatableRead" });
  return { services: services.map(serializeService),
    pagination: { page, limit, total, total_pages: Math.ceil(total / limit) } };
};
const findService = async (id, scope, select = serviceSelect) => {
  const service = await prisma.service.findFirst({ where: { AND: [{ id }, scope] }, select });
  if (!service) throw domainError("SERVICE_NOT_FOUND");
  return serializeService(service);
};
const editableData = (input) => {
  const data = {};
  for (const field of ["title", "description", "category_id", "location_type", "price", "duration_minutes", "is_active"]) {
    if (Object.hasOwn(input, field)) data[field] = field === "price" ? new Prisma.Decimal(input[field]) : input[field];
  }
  return data;
};
const requireCategory = async (id) => {
  if (!await prisma.serviceCategory.findUnique({ where: { id }, select: { id: true } })) {
    throw domainError("INVALID_CATEGORY");
  }
};
const createOwnedService = async (profileId, input) => {
  await requireCategory(input.category_id);
  try {
    return serializeService(await prisma.service.create({
      data: { ...editableData(input), entrepreneur_id: profileId }, select: serviceSelect,
    }));
  } catch (error) {
    if (error.code === "P2003") {
      await requireCategory(input.category_id);
      throw domainError("PROFILE_NOT_FOUND");
    }
    throw error;
  }
};
const patchOwnedService = async (id, scope, input) => {
  // Establish ownership before reporting category errors.
  await findService(id, scope);
  if (input.category_id !== undefined) await requireCategory(input.category_id);
  try {
    return serializeService(await prisma.service.update({
      where: { id, AND: [scope] }, data: editableData(input), select: serviceSelect,
    }));
  } catch (error) {
    if (error.code === "P2025") throw domainError("SERVICE_NOT_FOUND");
    if (error.code === "P2003") throw domainError("INVALID_CATEGORY");
    throw error;
  }
};
const listPublicServices = (query) => listServices(query, publicVisibility, publicSelect);
const getPublicService = (id) => findService(id, publicVisibility, publicSelect);
const listAdminServices = (query) => listServices(query, {}, adminSelect);
const getAdminService = (id) => findService(id, {}, adminSelect);
module.exports = { domainError, categorySelect, listServices, findService, createOwnedService,
  patchOwnedService, listPublicServices, getPublicService, listAdminServices, getAdminService };
