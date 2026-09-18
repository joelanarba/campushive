const express = require("express");
const {
  register,
  login,
  refresh,
  logout,
  getCurrentUser,
} = require("../controllers/authController");
const {
  authenticate,
  protectAuthCookies,
  limitLogin,
} = require("../middlewares/authMiddleware");

const router = express.Router();

router.post("/register", protectAuthCookies, register);
router.post("/login", limitLogin, protectAuthCookies, login);
router.post("/refresh", protectAuthCookies, refresh);
router.post("/logout", protectAuthCookies, logout);
router.get("/me", authenticate, getCurrentUser);

module.exports = router;
