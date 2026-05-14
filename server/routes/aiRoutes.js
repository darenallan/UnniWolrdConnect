const express = require("express");
const router = express.Router();
const aiController = require("../controllers/aiController");
const authMiddleware = require("../middleware/authMiddleware");
const { validateAIChat } = require("../middleware/validation");

router.use(authMiddleware);

router.post("/chat", validateAIChat, aiController.chat);
router.post("/translate", aiController.translateText);
router.post("/detect-language", aiController.detectLanguage);
router.post("/icebreakers", aiController.getIceBreakers);

module.exports = router;
