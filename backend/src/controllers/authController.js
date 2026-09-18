const {
  registrationSchema,
  loginSchema,
} = require("../validators/authValidators");
const {
  registerUser,
  loginUser,
  refreshSession,
  logoutSession,
  getCurrentUser: loadCurrentUser,
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
          message: detail.message.replace(/\"/g, ''),
        })),
      });
    }
    const result = await registerUser(value);
    setRefreshCookie(res, result.refreshToken);
    res.set("Cache-Control", "no-store");
    return res.status(201).json({ message: "Registration successful", data: result.data });
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
          message: detail.message.replace(/\"/g, ''),
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

const readRefreshCookie = (req) => {
  // Reject ambiguous duplicate cookies, just as refresh did before logout was added.
  const cookies = (req.headers.cookie || "")
    .split(";")
    .map((cookie) => cookie.trim())
    .filter((cookie) => cookie.startsWith(`${refreshCookieName}=`));
  return cookies.length === 1
    ? cookies[0].slice(refreshCookieName.length + 1)
    : undefined;
};

const refresh = async (req, res, next) => {
  try {
    const token = readRefreshCookie(req);
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

const logout = async (req, res, next) => {
  res.set("Cache-Control", "no-store");
  try {
    await logoutSession(readRefreshCookie(req));
    res.clearCookie(refreshCookieName, refreshCookieOptions);
    return res.status(204).end();
  } catch (error) {
    // Retain the cookie on failure so the caller can retry revocation.
    next(error);
  }
};

const getCurrentUser = async (req, res, next) => {
  res.set("Cache-Control", "no-store");
  try {
    const user = await loadCurrentUser(req.user.id);
    if (!user) return res.status(401).json({ message: "Invalid or missing access token" });
    return res.status(200).json({ message: "Authenticated user", data: { user } });
  } catch (error) { next(error); }
};

module.exports = { register, login, refresh, logout, getCurrentUser };
