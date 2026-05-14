const express = require("express");
const router = express.Router();
const userController = require("../controllers/userController");
const authMiddleware = require("../middleware/authMiddleware");
const { validateProfileUpdate } = require("../middleware/validation");

const uploadMiddleware = require("../middleware/uploadMiddleware");

// Toutes les routes nécessitent une authentification
router.use(authMiddleware);

router.get("/me", userController.getMe);
router.get("/me/stats", userController.getUserStats);
router.get("/search", userController.searchUsers);
router.put("/me", validateProfileUpdate, userController.updateMe);
router.post("/me/avatar", uploadMiddleware.single("avatar"), userController.uploadAvatar);
router.get("/:id", userController.getUserById);

module.exports = router;
