const express = require("express");
const {
  register,
  login,
  refresh,
  getCurrentUser,
} = require("../controllers/authController");
const {
  authenticate,
  protectAuthCookies,
  limitLogin,
} = require("../middlewares/authMiddleware");

const router = express.Router();

router.post("/register", register);
router.post("/login", limitLogin, protectAuthCookies, login);
router.post("/refresh", protectAuthCookies, refresh);
router.get("/me", authenticate, getCurrentUser);

module.exports = router;
