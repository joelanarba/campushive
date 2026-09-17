const {
  createOwnAvailability,
  listOwnAvailability,
  updateOwnAvailability,
  deleteOwnAvailability,
  updateProfile,
  createOwnService,
  listOwnServices,
  getOwnService,
  updateOwnService,
  deleteOwnService,
} = require("../controllers/entrepreneurController");
const {
  authenticate,
  authorizeRoles,
} = require("../middlewares/authMiddleware");

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

router.post("/me/services/:serviceId/availability", authenticate, authorizeRoles("entrepreneur"), createOwnAvailability);
router.get("/me/services/:serviceId/availability", authenticate, authorizeRoles("entrepreneur"), listOwnAvailability);
router.patch("/me/services/:serviceId/availability/:slotId", authenticate, authorizeRoles("entrepreneur"), updateOwnAvailability);
router.delete("/me/services/:serviceId/availability/:slotId", authenticate, authorizeRoles("entrepreneur"), deleteOwnAvailability);

module.exports = router;
