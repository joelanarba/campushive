const positiveInteger = (name, fallback) => {
  const value = Number(process.env[name] || fallback);
  if (!Number.isSafeInteger(value) || value <= 0 || value > 2147483) {
    throw new Error(
      `${name} must be a positive integer no greater than 2147483`,
    );
  }
  return value;
};

const jwtAccessSecret = process.env.JWT_ACCESS_SECRET;
if (!jwtAccessSecret?.trim()) throw new Error("JWT_ACCESS_SECRET is required");
const issuer = process.env.JWT_ISSUER?.trim() || "campushive-api";
const audience = process.env.JWT_AUDIENCE?.trim() || "campushive-client";
const accessLifetime = positiveInteger("JWT_ACCESS_TTL_SECONDS", 900);
const refreshLifetime = positiveInteger("REFRESH_TOKEN_TTL_SECONDS", 604800);
const cookieSameSite = (
  process.env.AUTH_COOKIE_SAME_SITE || "lax"
).toLowerCase();
if (!["lax", "none"].includes(cookieSameSite)) {
  throw new Error("AUTH_COOKIE_SAME_SITE must be lax or none");
}
const clientOrigins = (process.env.CLIENT_URL || "http://localhost:5173")
  .split(",")
  .map((origin) => origin.trim());
for (const origin of clientOrigins) {
  const parsed = new URL(origin);
  if (
    !["http:", "https:"].includes(parsed.protocol) ||
    parsed.origin !== origin
  ) {
    throw new Error(
      "CLIENT_URL must contain explicit comma-separated HTTP(S) origins",
    );
  }
}
const refreshCookieName = "campushive_refresh";
const refreshCookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production" || cookieSameSite === "none",
  sameSite: cookieSameSite,
  path: "/api/auth",
};
const loginRateLimit = positiveInteger("LOGIN_RATE_LIMIT_MAX", 10);
const loginRateWindow = positiveInteger("LOGIN_RATE_LIMIT_WINDOW_SECONDS", 900);

module.exports = {
  jwtAccessSecret,
  issuer,
  audience,
  accessLifetime,
  refreshLifetime,
  cookieSameSite,
  clientOrigins,
  refreshCookieName,
  refreshCookieOptions,
  loginRateLimit,
  loginRateWindow,
};
