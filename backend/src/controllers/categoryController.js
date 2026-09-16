const { paginationSchema } = require("../validators/categoryValidators");
const { listCategories } = require("../services/categoryServices");
const { validationFailure, serviceFailure } = require("./serviceResponses");

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

module.exports = { getCategories };
