const { getCategories } = require("../controllers/categoryController");

const express = require("express");
const router = express.Router();

router.get("/", getCategories);

module.exports = router;
