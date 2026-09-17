const express = require("express");
const { authenticate, authorizeRoles } = require("../middlewares/authMiddleware");
const {
  create,
  getMyBookings,
  getProviderBookings,
  patchBooking
} = require("../controllers/bookingController");

const router = express.Router();

router.post("/", authenticate, create);
router.get("/me", authenticate, getMyBookings);
router.get("/provider", authenticate, authorizeRoles("entrepreneur"), getProviderBookings);
router.patch("/:id", authenticate, patchBooking);

module.exports = router;
