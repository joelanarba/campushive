const { rateLimit } = require("express-rate-limit");
const { verifyAccessToken } = require("../services/tokenServices");
const { findAuthenticatedUser } = require("../services/authServices");
const {
  clientOrigins,
  cookieSameSite,
  loginRateLimit,
  loginRateWindow,
} = require("../config/authConfig");

const authenticate = async (req, res, next) => {
  const match = /^Bearer ([^\s]+)$/i.exec(req.get("authorization") || "");
  if (!match)
    return res.status(401).json({ message: "Invalid or missing access token" });
  let claims;
  try {
    claims = verifyAccessToken(match[1]);
  } catch (error) {
    if (
      ["JsonWebTokenError", "TokenExpiredError", "NotBeforeError"].includes(
        error.name,
      )
    ) {
      return res
        .status(401)
        .json({ message: "Invalid or missing access token" });
    }
    return next(error);
  }
  try {
    const user = await findAuthenticatedUser(claims.sub);
    if (!user)
      return res
        .status(401)
        .json({ message: "Invalid or missing access token" });
    req.user = user;
    next();
  } catch (error) {
    next(error);
  }
};

// A custom header plus exact Origin checking prevents cross-site cookie CSRF.
// Apply to login too, because login sets an authentication cookie.
const protectAuthCookies = (req, res, next) => {
  const origin = req.get("origin");
  if (
    (origin && !clientOrigins.includes(origin)) ||
    (cookieSameSite === "none" &&
      (!origin || req.get("x-csrf-protection") !== "1")) ||
    (cookieSameSite === "lax" && req.get("sec-fetch-site") === "cross-site")
  ) {
    return res
      .status(403)
      .json({ message: "Authentication request origin is not allowed" });
  }
  next();
};

const limitLogin = rateLimit({
  windowMs: loginRateWindow * 1000,
  limit: loginRateLimit,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  message: { message: "Too many login attempts. Please try again later." },
});

// Must follow authenticate: req.user contains current database roles.
const authorizeRoles =
  (...allowedRoles) =>
  (req, res, next) => {
    if (!req.user?.id) {
      return res
        .status(401)
        .json({ message: "Invalid or missing access token" });
    }
    const knownRoles = ["student", "entrepreneur", "admin"];
    const roles = req.user.role;
    if (
      !Array.isArray(roles) ||
      roles.length === 0 ||
      !roles.every((role) => knownRoles.includes(role)) ||
      allowedRoles.length === 0 ||
      !allowedRoles.every((role) => knownRoles.includes(role)) ||
      !roles.some((role) => allowedRoles.includes(role))
    ) {
      return res.status(403).json({ message: "Insufficient permissions" });
    }
    return next();
  };

module.exports = {
  authenticate,
  authorizeRoles,
  protectAuthCookies,
  limitLogin,
};
