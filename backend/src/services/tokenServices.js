const jwt = require("jsonwebtoken");
const { randomBytes, createHash } = require("node:crypto");
const {
  jwtAccessSecret,
  issuer,
  audience,
  accessLifetime,
  refreshLifetime,
} = require("../config/authConfig");

const issueAccessToken = (user) => ({
  access_token: jwt.sign(
    { role: user.role, token_type: "access" },
    jwtAccessSecret,
    {
      algorithm: "HS256",
      subject: user.id,
      issuer,
      audience,
      expiresIn: accessLifetime,
    },
  ),
  token_type: "Bearer",
  expires_in: accessLifetime,
});

const verifyAccessToken = (token) => {
  const claims = jwt.verify(token, jwtAccessSecret, {
    algorithms: ["HS256"],
    issuer,
    audience,
  });
  if (
    typeof claims !== "object" ||
    claims.token_type !== "access" ||
    typeof claims.sub !== "string" ||
    !/^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i.test(
      claims.sub,
    ) ||
    !Number.isSafeInteger(claims.exp) ||
    !Number.isSafeInteger(claims.iat)
  ) {
    throw new jwt.JsonWebTokenError("Invalid access token claims");
  }
  return claims;
};

const hashRefreshToken = (token) =>
  createHash("sha256").update(token).digest("hex");
const createRefreshToken = () => {
  const token = randomBytes(32).toString("hex");
  return {
    token,
    token_hash: hashRefreshToken(token),
    expires_at: new Date(Date.now() + refreshLifetime * 1000),
  };
};

module.exports = {
  issueAccessToken,
  verifyAccessToken,
  hashRefreshToken,
  createRefreshToken,
};
