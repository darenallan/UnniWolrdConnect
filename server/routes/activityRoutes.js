const express = require("express");
const router = express.Router();
const activityController = require("../controllers/activityController");
const authMiddleware = require("../middleware/authMiddleware");
const uploadMiddleware = require("../middleware/uploadMiddleware");

router.use(authMiddleware);

router.get("/recommendations", activityController.getRecommendations);
router.get("/", activityController.getAllActivities);
router.get("/:id", activityController.getActivityById);
router.post("/", activityController.createActivity);
router.post("/:id/join", activityController.joinActivity);
router.post("/:id/leave", activityController.leaveActivity);
router.post("/:id/image", uploadMiddleware.single("image"), activityController.uploadActivityImage);

module.exports = router;
