const jwt = require("jsonwebtoken");

/**
 * Middleware d'authentification pour Socket.io
 * Vérifie le token JWT envoyé lors de la connexion socket
 */
const socketAuth = (socket, next) => {
    try {
        // Récupérer le token envoyé par le frontend
        const token = socket.handshake.auth?.token;

        if (!token) {
            return next(new Error("No token provided for socket connection"));
        }

        // Vérifier le token
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        // Attacher l'utilisateur authentifié au socket
        socket.user = decoded;
        socket.userId = decoded.id;

        next();
    } catch (error) {
        console.error("Socket authentication error:", error.message);
        return next(new Error("Unauthorized socket connection"));
    }
};

module.exports = socketAuth;
