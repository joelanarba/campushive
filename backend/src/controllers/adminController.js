const {
  entrepreneurIdSchema,
  emptyRequestSchema,
  rejectEntrepreneurSchema,
  listUsersSchema,
  serviceIdSchema,
  categoryIdSchema,
  paginationSchema,
  adminServiceQuerySchema,
  createCategorySchema,
  patchCategorySchema,
} = require("../validators/adminValidators");
const {
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
} = require("../services/adminServices");
const { validationFailure, serviceFailure } = require("./serviceResponses");

const getEntrepreneurs = async (req, res, next) => {
  res.set("Cache-Control", "no-store");
  try {
    const query = paginationSchema.validate(req.query, { abortEarly: false });
    if (query.error) return validationFailure(res, query.error);
    const body = emptyRequestSchema.validate(req.body, { abortEarly: false });
    if (body.error) return validationFailure(res, body.error);
    const data = await listPendingEntrepreneurs(query.value);
    return res
      .status(200)
      .json({ message: "Pending entrepreneurs retrieved successfully", data });
  } catch (error) {
    return serviceFailure(error, res, next);
  }
};

const getOneEntrepreneur = async (req, res, next) => {
  res.set("Cache-Control", "no-store");
  try {
    const params = entrepreneurIdSchema.validate(req.params, {
      abortEarly: false,
    });
    if (params.error) return validationFailure(res, params.error);
    const query = emptyRequestSchema.validate(req.query, { abortEarly: false });
    if (query.error) return validationFailure(res, query.error);
    const body = emptyRequestSchema.validate(req.body, { abortEarly: false });
    if (body.error) return validationFailure(res, body.error);
    const profile = await getEntrepreneur(params.value.entrepreneurId);
    return res
      .status(200)
      .json({
        message: "Entrepreneur retrieved successfully",
        data: { entrepreneur_profile: profile },
      });
  } catch (error) {
    return serviceFailure(error, res, next);
  }
};

const approveProfile = async (req, res, next) => {
  res.set("Cache-Control", "no-store");
  try {
    const params = entrepreneurIdSchema.validate(req.params, {
      abortEarly: false,
    });
    if (params.error) return validationFailure(res, params.error);
    const query = emptyRequestSchema.validate(req.query, { abortEarly: false });
    if (query.error) return validationFailure(res, query.error);
    const body = emptyRequestSchema.validate(req.body, { abortEarly: false });
    if (body.error) return validationFailure(res, body.error);
    const profile = await approveEntrepreneur(params.value.entrepreneurId);
    return res
      .status(200)
      .json({
        message: "Entrepreneur approved successfully",
        data: { entrepreneur_profile: profile },
      });
  } catch (error) {
    return serviceFailure(error, res, next);
  }
};

const rejectProfile = async (req, res, next) => {
  res.set("Cache-Control", "no-store");
  try {
    const params = entrepreneurIdSchema.validate(req.params, {
      abortEarly: false,
    });
    if (params.error) return validationFailure(res, params.error);
    const query = emptyRequestSchema.validate(req.query, { abortEarly: false });
    if (query.error) return validationFailure(res, query.error);
    const body = rejectEntrepreneurSchema.validate(req.body, {
      abortEarly: false,
    });
    if (body.error) return validationFailure(res, body.error);
    const profile = await rejectEntrepreneur(
      params.value.entrepreneurId,
      body.value.rejection_reason,
    );
    return res
      .status(200)
      .json({
        message: "Entrepreneur rejected successfully",
        data: { entrepreneur_profile: profile },
      });
  } catch (error) {
    return serviceFailure(error, res, next);
  }
};

const suspendProfile = async (req, res, next) => {
  res.set("Cache-Control", "no-store");
  try {
    const params = entrepreneurIdSchema.validate(req.params, {
      abortEarly: false,
    });
    if (params.error) return validationFailure(res, params.error);
    const query = emptyRequestSchema.validate(req.query, { abortEarly: false });
    if (query.error) return validationFailure(res, query.error);
    const body = emptyRequestSchema.validate(req.body, { abortEarly: false });
    if (body.error) return validationFailure(res, body.error);
    const profile = await suspendEntrepreneur(params.value.entrepreneurId);
    return res
      .status(200)
      .json({
        message: "Entrepreneur suspended successfully",
        data: { entrepreneur_profile: profile },
      });
  } catch (error) {
    return serviceFailure(error, res, next);
  }
};

const reopenProfile = async (req, res, next) => {
  res.set("Cache-Control", "no-store");
  try {
    const params = entrepreneurIdSchema.validate(req.params, {
      abortEarly: false,
    });
    if (params.error) return validationFailure(res, params.error);
    const query = emptyRequestSchema.validate(req.query, { abortEarly: false });
    if (query.error) return validationFailure(res, query.error);
    const body = emptyRequestSchema.validate(req.body, { abortEarly: false });
    if (body.error) return validationFailure(res, body.error);
    const profile = await reopenEntrepreneur(params.value.entrepreneurId);
    return res
      .status(200)
      .json({
        message: "Entrepreneur review reopened successfully",
        data: { entrepreneur_profile: profile },
      });
  } catch (error) {
    return serviceFailure(error, res, next);
  }
};

const getUsers = async (req, res, next) => {
  res.set("Cache-Control", "no-store");
  try {
    const { value, error } = listUsersSchema.validate(req.query, {
      abortEarly: false,
    });
    if (error) {
      return res.status(400).json({
        message: "Invalid user-list query",
        errors: error.details.map((detail) => ({
          field:
            detail.type === "object.unknown"
              ? "unknown_field"
              : detail.path.join("."),
          message: "Field is invalid or not allowed",
        })),
      });
    }
    const data = await listUsers(value);
    return res
      .status(200)
      .json({ message: "Users retrieved successfully", data });
  } catch (error) {
    next(error);
  }
};

const getServices = async (req, res, next) => {
  res.set("Cache-Control", "no-store");
  try {
    const query = adminServiceQuerySchema.validate(req.query, {
      abortEarly: false,
    });
    if (query.error) return validationFailure(res, query.error);
    const result = await listAdminServices(query.value);
    return res
      .status(200)
      .json({ message: "Services retrieved successfully", data: result });
  } catch (error) {
    return serviceFailure(error, res, next);
  }
};

const getService = async (req, res, next) => {
  res.set("Cache-Control", "no-store");
  try {
    const params = serviceIdSchema.validate(req.params, { abortEarly: false });
    if (params.error) return validationFailure(res, params.error);
    const result = await getAdminService(params.value.serviceId);
    return res.status(200).json({
      message: "Service retrieved successfully",
      data: { service: result },
    });
  } catch (error) {
    return serviceFailure(error, res, next);
  }
};

const getCategories = async (req, res, next) => {
  res.set("Cache-Control", "no-store");
  try {
    const query = paginationSchema.validate(req.query, { abortEarly: false });
    if (query.error) return validationFailure(res, query.error);
    const result = await listCategories(query.value);
    return res
      .status(200)
      .json({ message: "Categories retrieved successfully", data: result });
  } catch (error) {
    return serviceFailure(error, res, next);
  }
};

const getOneCategory = async (req, res, next) => {
  res.set("Cache-Control", "no-store");
  try {
    const params = categoryIdSchema.validate(req.params, { abortEarly: false });
    if (params.error) return validationFailure(res, params.error);
    const result = await getCategory(params.value.categoryId);
    return res.status(200).json({
      message: "Category retrieved successfully",
      data: { category: result },
    });
  } catch (error) {
    return serviceFailure(error, res, next);
  }
};

const postCategory = async (req, res, next) => {
  res.set("Cache-Control", "no-store");
  try {
    const body = createCategorySchema.validate(req.body, { abortEarly: false });
    if (body.error) return validationFailure(res, body.error);
    const result = await createCategory(body.value);
    return res.status(201).json({
      message: "Category created successfully",
      data: { category: result },
    });
  } catch (error) {
    return serviceFailure(error, res, next);
  }
};

const updateCategory = async (req, res, next) => {
  res.set("Cache-Control", "no-store");
  try {
    const params = categoryIdSchema.validate(req.params, { abortEarly: false });
    if (params.error) return validationFailure(res, params.error);
    const body = patchCategorySchema.validate(req.body, { abortEarly: false });
    if (body.error) return validationFailure(res, body.error);
    const result = await patchCategory(params.value.categoryId, body.value);
    return res.status(200).json({
      message: "Category updated successfully",
      data: { category: result },
    });
  } catch (error) {
    return serviceFailure(error, res, next);
  }
};

const removeCategory = async (req, res, next) => {
  res.set("Cache-Control", "no-store");
  try {
    const params = categoryIdSchema.validate(req.params, { abortEarly: false });
    if (params.error) return validationFailure(res, params.error);
    const result = await deleteCategory(params.value.categoryId);
    return res.status(200).json({
      message: "Category deleted successfully",
      data: { category: result },
    });
  } catch (error) {
    return serviceFailure(error, res, next);
  }
};

module.exports = {
  getEntrepreneurs,
  getOneEntrepreneur,
  approveProfile,
  rejectProfile,
  suspendProfile,
  reopenProfile,
  getUsers,
  getServices,
  getService,
  getCategories,
  getOneCategory,
  postCategory,
  updateCategory,
  removeCategory,
};
