const {
  getServices,
  getService,
  getAvailability,
} = require("../controllers/serviceController");

const express = require("express");
const router = express.Router();

router.get("/", getServices);
router.get("/:serviceId", getService);

router.get("/:serviceId/availability", getAvailability);

module.exports = router;
