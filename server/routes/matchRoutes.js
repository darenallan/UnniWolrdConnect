const express = require("express");
const router = express.Router();
const matchController = require("../controllers/matchController");
const authMiddleware = require("../middleware/authMiddleware");

router.use(authMiddleware);

router.get("/suggestions", matchController.getSuggestions);
router.get("/ai-suggestions", matchController.getAISuggestions);
router.get("/mentors", matchController.getMentors);

module.exports = router;
