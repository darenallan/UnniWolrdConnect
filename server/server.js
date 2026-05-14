require("dotenv").config();
// Redémarrage forcé par Antigravity - OpenRouter NVIDIA

const http = require("http");
const { Server } = require("socket.io");

const app = require("./app");
const db = require("./firebase");
const socketAuth = require("./sockets/socketAuth");

const server = http.createServer(app);

/* =======================
   SOCKET.IO
======================= */

const io = new Server(server, {
  cors: { origin: "*" },
});

// Middleware d'authentification pour Socket.io
io.use(socketAuth);

io.on("connection", (socket) => {
  console.log(`User ${socket.user?.id || 'unknown'} connected:`, socket.id);

  // Rejoindre sa propre room pour les notifications globales
  if (socket.user?.id) {
    socket.join(`user_${socket.user.id}`);
  }

  // Rejoindre une conversation
  socket.on("joinRoom", (conversationId) => {
    socket.join(conversationId);
    console.log(`Socket ${socket.id} (user: ${socket.user?.id}) joined room ${conversationId}`);
  });

  // Quitter une conversation
  socket.on("leaveRoom", (conversationId) => {
    socket.leave(conversationId);
  });

  // Envoyer un message — on persiste en Firestore puis on broadcast
  socket.on("sendMessage", async (data) => {
    const { conversationId, message } = data;
    console.log(`[Socket] Received sendMessage from ${socket.user?.id} for conv ${conversationId}`);

    try {
      if (!socket.user || !socket.user.id) {
        console.error("[Socket] Unauthorized sendMessage attempt");
        return socket.emit("messageError", { error: "Unauthorized" });
      }

      const conversationRef = db.collection("conversations").doc(conversationId);
      const conversationDoc = await conversationRef.get();

      if (!conversationDoc.exists) {
        console.error(`[Socket] Conversation ${conversationId} not found`);
        return socket.emit("messageError", { error: "Conversation not found" });
      }

      const conversation = conversationDoc.data();
      console.log(`[Socket] Participants in ${conversationId}:`, conversation.participants);

      if (!conversation.participants || !conversation.participants.includes(socket.user.id)) {
        console.error(`[Socket] User ${socket.user.id} is not a participant in ${conversationId}`);
        return socket.emit("messageError", { error: "Access denied" });
      }

      // Persister le message
      const msgRef = db
        .collection("conversations")
        .doc(conversationId)
        .collection("messages");

      const docRef = await msgRef.add({
        ...message,
        createdAt: new Date(),
      });

      // Mettre à jour le lastMessage de la conversation
      await conversationRef.update({
        lastMessage: message.text,
        lastMessageAt: new Date(),
        lastSenderId: message.senderId,
      });

      const savedMessage = { id: docRef.id, ...message, createdAt: new Date() };

      // Broadcast à tous les membres du room de conversation
      io.to(conversationId).emit("receiveMessage", savedMessage);
      console.log(`[Socket] Message broadcasted to room ${conversationId}`);

      // Envoyer une notification individuelle aux autres participants
      conversation.participants.forEach(participantId => {
        if (participantId !== socket.user.id) {
          io.to(`user_${participantId}`).emit("newNotification", {
            type: "MESSAGE",
            senderName: conversation.participantsInfo?.[socket.user.id]?.name || "Un utilisateur",
            text: message.text,
            conversationId
          });
        }
      });

    } catch (error) {
      console.error("[Socket] Error saving/sending message:", error);
      socket.emit("messageError", { error: "Failed to send message", details: error.message });
    }
  });

  // Indicateur de frappe
  socket.on("typing", ({ conversationId, userId }) => {
    socket.to(conversationId).emit("typing", { userId });
  });

  socket.on("stopTyping", ({ conversationId, userId }) => {
    socket.to(conversationId).emit("stopTyping", { userId });
  });

  socket.on("disconnect", () => {
    console.log("User disconnected:", socket.id);
  });
});

/* =======================
   START SERVER
======================= */

const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
