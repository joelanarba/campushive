const {
  registrationSchema,
  loginSchema,
} = require("../validators/authValidators");
const {
  registerUser,
  loginUser,
  refreshSession,
} = require("../services/authServices");
const {
  refreshCookieName,
  refreshCookieOptions,
  refreshLifetime,
} = require("../config/authConfig");

const validateRegistration = (input) =>
  registrationSchema.validate(input, { abortEarly: false });

const register = async (req, res, next) => {
  try {
    const { value, error } = validateRegistration(req.body);
    if (error) {
      return res.status(400).json({
        message: "Invalid registration input",
        errors: error.details.map((detail) => ({
          field:
            detail.type === "object.unknown"
              ? "unknown_field"
              : detail.path.join("."),
          message: "Field is missing, invalid, or not allowed",
        })),
      });
    }
    const data = await registerUser(value);
    return res.status(201).json({ message: "Registration successful", data });
  } catch (error) {
    next(error);
  }
};

const setRefreshCookie = (res, token) =>
  res.cookie(refreshCookieName, token, {
    ...refreshCookieOptions,
    maxAge: refreshLifetime * 1000,
  });

const login = async (req, res, next) => {
  try {
    const { value, error } = loginSchema.validate(req.body, {
      abortEarly: false,
    });
    if (error)
      return res.status(400).json({
        message: "Invalid login input",
        errors: error.details.map((detail) => ({
          field:
            detail.type === "object.unknown"
              ? "unknown_field"
              : detail.path.join("."),
          message: "Field is missing, invalid, or not allowed",
        })),
      });
    const result = await loginUser(value);
    setRefreshCookie(res, result.refreshToken);
    res.set("Cache-Control", "no-store");
    return res
      .status(200)
      .json({ message: "Login successful", data: result.data });
  } catch (error) {
    next(error);
  }
};

const refresh = async (req, res, next) => {
  try {
    // Opaque hex tokens need no decoding. Reject ambiguous duplicate cookies.
    const cookies = (req.headers.cookie || "")
      .split(";")
      .map((cookie) => cookie.trim())
      .filter((cookie) => cookie.startsWith(`${refreshCookieName}=`));
    const token =
      cookies.length === 1
        ? cookies[0].slice(refreshCookieName.length + 1)
        : undefined;
    const result = await refreshSession(token);
    setRefreshCookie(res, result.refreshToken);
    res.set("Cache-Control", "no-store");
    return res
      .status(200)
      .json({ message: "Token refreshed", data: result.data });
  } catch (error) {
    if (error.code === "INVALID_REFRESH_TOKEN")
      res.clearCookie(refreshCookieName, refreshCookieOptions);
    next(error);
  }
};

const getCurrentUser = (req, res) => {
  res.set("Cache-Control", "no-store");
  return res
    .status(200)
    .json({ message: "Authenticated user", data: { user: req.user } });
};

module.exports = { register, login, refresh, getCurrentUser };
