const {
  authenticate,
  authorizeRoles,
} = require("../middlewares/authMiddleware");
const {
  updateProfile,
  createOwnService,
  listOwnServices,
  getOwnService,
  updateOwnService,
  deleteOwnService,
} = require("../controllers/entrepreneurController");

const express = require("express");

const router = express.Router();
router.patch(
  "/me",
  authenticate,
  authorizeRoles("entrepreneur"),
  updateProfile,
);

router.post("/me/services", authenticate, authorizeRoles("entrepreneur"), createOwnService);
router.get("/me/services", authenticate, authorizeRoles("entrepreneur"), listOwnServices);
router.get("/me/services/:serviceId", authenticate, authorizeRoles("entrepreneur"), getOwnService);
router.patch("/me/services/:serviceId", authenticate, authorizeRoles("entrepreneur"), updateOwnService);
router.delete("/me/services/:serviceId", authenticate, authorizeRoles("entrepreneur"), deleteOwnService);

module.exports = router;
