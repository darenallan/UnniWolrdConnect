const express = require("express");
const router = express.Router();
const messageController = require("../controllers/messageController");
const authMiddleware = require("../middleware/authMiddleware");
const uploadMiddleware = require("../middleware/uploadMiddleware");
const { validateMessage } = require("../middleware/validation");

router.use(authMiddleware);

// Conversations
router.get("/conversations", messageController.getMyConversations);
router.post("/conversations", messageController.getOrCreateConversation);
router.post("/upload-audio", uploadMiddleware.single("audio"), messageController.uploadAudio);

// Messages dans une conversation
router.get("/conversations/:conversationId", messageController.getMessages);
router.get("/conversations/:conversationId/meta", messageController.getConversationMeta);
router.post("/conversations/:conversationId", validateMessage, messageController.sendMessage);

module.exports = router;
