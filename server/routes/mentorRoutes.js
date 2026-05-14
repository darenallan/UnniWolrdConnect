const express = require("express");
const router = express.Router();
const mentorController = require("../controllers/mentorController");
const authMiddleware = require("../middleware/authMiddleware");

router.use(authMiddleware);

router.post("/request", mentorController.sendRequest);
router.get("/requests", mentorController.getMyRequests);
router.put("/requests/:id", mentorController.respondToRequest);

module.exports = router;
