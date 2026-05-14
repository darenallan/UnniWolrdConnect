const db = require("../firebase");

/**
 * POST /api/messages/conversations
 * Crée ou récupère une conversation existante entre deux utilisateurs.
 * Idempotent : si la conversation existe déjà, on la retourne.
 */
exports.getOrCreateConversation = async (req, res) => {
  try {
    const { otherUserId } = req.body;
    const myId = req.user.id;

    if (!otherUserId) {
      return res.status(400).json({ message: "otherUserId is required" });
    }

    if (otherUserId === myId) {
      return res.status(400).json({ message: "Cannot create conversation with yourself" });
    }

    // Vérifier que l'autre utilisateur existe
    const otherDoc = await db.collection("users").doc(otherUserId).get();
    if (!otherDoc.exists) {
      return res.status(404).json({ message: "User not found" });
    }

    // Chercher une conversation existante entre les deux
    // On stocke les participants triés pour garantir l'unicité
    const participants = [myId, otherUserId].sort();

    const existing = await db
      .collection("conversations")
      .where("participants", "==", participants)
      .limit(1)
      .get();

    if (!existing.empty) {
      const conv = existing.docs[0];
      return res.json({ id: conv.id, ...conv.data() });
    }

    // Créer la nouvelle conversation
    const otherUser = otherDoc.data();
    const myDoc = await db.collection("users").doc(myId).get();
    const myData = myDoc.data();

    const newConv = {
      participants,
      participantsInfo: {
        [myId]: { name: myData.name, avatar: myData.avatar || "" },
        [otherUserId]: { name: otherUser.name, avatar: otherUser.avatar || "" },
      },
      lastMessage: "",
      lastMessageAt: new Date(),
      lastSenderId: "",
      createdAt: new Date(),
    };

    const docRef = await db.collection("conversations").add(newConv);

    res.status(201).json({ id: docRef.id, ...newConv });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * GET /api/messages/conversations
 * Liste toutes les conversations de l'utilisateur connecté.
 */
exports.getMyConversations = async (req, res) => {
  try {
    const myId = req.user.id;

    const snapshot = await db
      .collection("conversations")
      .where("participants", "array-contains", myId)
      .orderBy("lastMessageAt", "desc")
      .get();

    const conversations = [];
    snapshot.forEach((doc) => {
      conversations.push({ id: doc.id, ...doc.data() });
    });

    res.json({ conversations });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * GET /api/messages/conversations/:conversationId
 * Retourne les messages d'une conversation (paginated, 50 par défaut).
 * Query params : limit, before (timestamp ISO pour la pagination)
 */
exports.getMessages = async (req, res) => {
  try {
    const { conversationId } = req.params;
    const myId = req.user.id;
    const limit = parseInt(req.query.limit) || 50;

    // Vérifier que l'utilisateur est bien membre de la conversation
    const convDoc = await db.collection("conversations").doc(conversationId).get();
    if (!convDoc.exists) {
      return res.status(404).json({ message: "Conversation not found" });
    }

    const conv = convDoc.data();
    if (!conv.participants.includes(myId)) {
      return res.status(403).json({ message: "Access denied" });
    }

    let query = db
      .collection("conversations")
      .doc(conversationId)
      .collection("messages")
      .orderBy("createdAt", "desc")
      .limit(limit);

    // Pagination : charger les messages avant un certain timestamp
    if (req.query.before) {
      const beforeDate = new Date(req.query.before);
      query = query.startAfter(beforeDate);
    }

    const snapshot = await query.get();
    const messages = [];
    snapshot.forEach((doc) => {
      messages.push({ id: doc.id, ...doc.data() });
    });

    // Retourner dans l'ordre chronologique
    messages.reverse();

    res.json({ messages });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * GET /api/messages/conversations/:conversationId/meta
 * Retourne les infos d'une conversation (participants, etc.)
 */
exports.getConversationMeta = async (req, res) => {
  try {
    const { conversationId } = req.params;
    const myId = req.user.id;

    const convDoc = await db.collection("conversations").doc(conversationId).get();
    if (!convDoc.exists) {
      return res.status(404).json({ message: "Conversation not found" });
    }

    const conv = convDoc.data();
    if (!conv.participants.includes(myId)) {
      return res.status(403).json({ message: "Access denied" });
    }

    res.json({ id: convDoc.id, ...conv });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * POST /api/messages/conversations/:conversationId
 * Envoie un message via HTTP (alternative à Socket.io).
 */
/**
 * POST /api/messages/conversations/:conversationId
 * Envoie un message via HTTP (alternative à Socket.io).
 */
exports.sendMessage = async (req, res) => {
  try {
    const { conversationId } = req.params;
    const { text, type, audioUrl } = req.body;
    const myId = req.user.id;

    if (!text && !audioUrl) {
      return res.status(400).json({ message: "Message text or audio is required" });
    }

    // Vérifier l'accès
    const convDoc = await db.collection("conversations").doc(conversationId).get();
    if (!convDoc.exists) {
      return res.status(404).json({ message: "Conversation not found" });
    }

    const conv = convDoc.data();
    if (!conv.participants.includes(myId)) {
      return res.status(403).json({ message: "Access denied" });
    }

    const message = {
      senderId: myId,
      text: text?.trim() || "",
      type: type || "text",
      audioUrl: audioUrl || null,
      createdAt: new Date(),
    };

    const docRef = await db
      .collection("conversations")
      .doc(conversationId)
      .collection("messages")
      .add(message);

    // Mettre à jour le lastMessage
    await db.collection("conversations").doc(conversationId).update({
      lastMessage: type === "audio" ? "🎤 Message vocal" : message.text,
      lastMessageAt: message.createdAt,
      lastSenderId: myId,
    });

    res.status(201).json({ id: docRef.id, ...message });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * POST /api/messages/upload-audio
 */
exports.uploadAudio = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "No audio file uploaded" });
    }

    const audioUrl = `/uploads/${req.file.filename}`;
    res.json({ message: "Audio uploaded successfully", audioUrl });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
