const rateLimit = require('express-rate-limit');

// Limite générale pour toutes les API
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limite chaque IP à 100 requêtes par fenêtre de 15 minutes
  message: {
    message: "Too many requests from this IP, please try again later."
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Limite stricte pour l'authentification
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limite augmentée pour le développement
  message: {
    message: "Too many authentication attempts, please try again later."
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Limite pour l'API IA (plus restrictive car coûteuse)
const aiLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 10, // limite chaque IP à 10 requêtes IA par minute
  message: {
    message: "Too many AI requests, please try again later."
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Limite pour les messages (pour prévenir le spam)
const messageLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 30, // limite chaque IP à 30 messages par minute
  message: {
    message: "Too many messages, please slow down."
  },
  standardHeaders: true,
  legacyHeaders: false,
});

module.exports = {
  generalLimiter,
  authLimiter,
  aiLimiter,
  messageLimiter,
};
