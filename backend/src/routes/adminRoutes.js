const express = require("express");
const {
  authenticate,
  authorizeRoles,
} = require("../middlewares/authMiddleware");
const { getUsers } = require("../controllers/adminController");

const router = express.Router();
router.get("/users", authenticate, authorizeRoles("admin"), getUsers);

module.exports = router;
