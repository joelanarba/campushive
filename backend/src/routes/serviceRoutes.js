const { getServices, getService } = require("../controllers/serviceController");

const express = require("express");
const router = express.Router();

router.get("/", getServices);
router.get("/:serviceId", getService);

module.exports = router;
