const { listUsersSchema } = require("../validators/adminValidators");
const { listUsers } = require("../services/adminServices");

const getUsers = async (req, res, next) => {
  res.set("Cache-Control", "no-store");
  try {
    const { value, error } = listUsersSchema.validate(req.query, { abortEarly: false });
    if (error) {
      return res.status(400).json({
        message: "Invalid user-list query",
        errors: error.details.map((detail) => ({
          field: detail.type === "object.unknown" ? "unknown_field" : detail.path.join("."),
          message: "Field is invalid or not allowed",
        })),
      });
    }
    const data = await listUsers(value);
    return res.status(200).json({ message: "Users retrieved successfully", data });
  } catch (error) {
    next(error);
  }
};

module.exports = { getUsers };
