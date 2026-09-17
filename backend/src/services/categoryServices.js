const { prisma } = require("../config/db");
const { domainError, categorySelect } = require("./serviceServices");

const listCategories = async ({ page, limit }) => {
  const [total, categories] = await prisma.$transaction(
    [
      prisma.serviceCategory.count(),
      prisma.serviceCategory.findMany({
        select: categorySelect,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: [{ category_name: "asc" }, { id: "asc" }],
      }),
    ],
    { isolationLevel: "RepeatableRead" },
  );
  return {
    categories,
    pagination: { page, limit, total, total_pages: Math.ceil(total / limit) },
  };
};
const getCategory = async (id) => {
  const category = await prisma.serviceCategory.findUnique({
    where: { id },
    select: categorySelect,
  });
  if (!category) throw domainError("CATEGORY_NOT_FOUND");
  return category;
};

const categoryData = (input) => {
  const data = {};
  for (const field of ["category_name", "tag", "description"]) {
    if (Object.hasOwn(input, field)) data[field] = input[field];
  }
  return data;
};

const createCategory = (input) =>
  prisma.serviceCategory.create({
    data: categoryData(input),
    select: categorySelect,
  });
const patchCategory = async (id, input) => {
  try {
    return await prisma.serviceCategory.update({
      where: { id },
      data: categoryData(input),
      select: categorySelect,
    });
  } catch (error) {
    if (error.code === "P2025") throw domainError("CATEGORY_NOT_FOUND");
    throw error;
  }
};
const deleteCategory = async (id) => {
  try {
    // Existing RESTRICT constraint protects all referencing services, including concurrent writes.
    return await prisma.serviceCategory.delete({
      where: { id },
      select: { id: true },
    });
  } catch (error) {
    if (error.code === "P2025") throw domainError("CATEGORY_NOT_FOUND");
    if (error.code === "P2003") throw domainError("CATEGORY_IN_USE");
    throw error;
  }
};
module.exports = {
  listCategories,
  getCategory,
  createCategory,
  patchCategory,
  deleteCategory,
};
