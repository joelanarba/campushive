const {
  authenticate,
  authorizeRoles,
} = require("../middlewares/authMiddleware");
const {
  getEntrepreneurs,
  getOneEntrepreneur,
  approveProfile,
  rejectProfile,
  suspendProfile,
  reopenProfile,
  getUsers,
  getServices,
  getService,
  getCategories,
  getOneCategory,
  postCategory,
  updateCategory,
  removeCategory,
} = require("../controllers/adminController");

const express = require("express");

const router = express.Router();
router.get("/users", authenticate, authorizeRoles("admin"), getUsers);

router.get(
  "/entrepreneurs",
  authenticate,
  authorizeRoles("admin"),
  getEntrepreneurs,
);
router.get(
  "/entrepreneurs/:entrepreneurId",
  authenticate,
  authorizeRoles("admin"),
  getOneEntrepreneur,
);
router.patch(
  "/entrepreneurs/:entrepreneurId/approve",
  authenticate,
  authorizeRoles("admin"),
  approveProfile,
);
router.patch(
  "/entrepreneurs/:entrepreneurId/reject",
  authenticate,
  authorizeRoles("admin"),
  rejectProfile,
);
router.patch(
  "/entrepreneurs/:entrepreneurId/suspend",
  authenticate,
  authorizeRoles("admin"),
  suspendProfile,
);
router.patch(
  "/entrepreneurs/:entrepreneurId/reopen",
  authenticate,
  authorizeRoles("admin"),
  reopenProfile,
);

router.get("/services", authenticate, authorizeRoles("admin"), getServices);
router.get(
  "/services/:serviceId",
  authenticate,
  authorizeRoles("admin"),
  getService,
);
router.get("/categories", authenticate, authorizeRoles("admin"), getCategories);
router.get(
  "/categories/:categoryId",
  authenticate,
  authorizeRoles("admin"),
  getOneCategory,
);
router.post("/categories", authenticate, authorizeRoles("admin"), postCategory);
router.patch(
  "/categories/:categoryId",
  authenticate,
  authorizeRoles("admin"),
  updateCategory,
);
router.delete(
  "/categories/:categoryId",
  authenticate,
  authorizeRoles("admin"),
  removeCategory,
);

module.exports = router;
