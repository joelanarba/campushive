const express = require("express");
const {
  authenticate,
  authorizeRoles,
} = require("../middlewares/authMiddleware");
const { updateProfile } = require("../controllers/entrepreneurController");

const router = express.Router();
router.patch(
  "/me",
  authenticate,
  authorizeRoles("entrepreneur"),
  updateProfile,
);

module.exports = router;
