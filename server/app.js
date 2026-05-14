const express = require("express");
const cors = require("cors");
const helmet = require("helmet");

const { generalLimiter, authLimiter, aiLimiter, messageLimiter } = require("./middleware/rateLimit");
const errorMiddleware = require("./middleware/errorMiddleware");

const authRoutes = require("./routes/authRoutes");
const userRoutes = require("./routes/userRoutes");
const matchRoutes = require("./routes/matchRoutes");
const messageRoutes = require("./routes/messageRoutes");
const aiRoutes = require("./routes/aiRoutes");
const activityRoutes = require("./routes/activityRoutes");
const mentorRoutes = require("./routes/mentorRoutes");

const app = express();

/* =======================
   MIDDLEWARE
======================= */

// Logging des requêtes pour le débogage + Forçage CORS
app.use((req, res, next) => {
  const origin = req.headers.origin;
  if (origin && origin.includes("localhost")) {
    res.setHeader("Access-Control-Allow-Origin", origin);
  }
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
  res.setHeader("Access-Control-Allow-Credentials", "true");
  
  if (req.method === "OPTIONS") {
    return res.sendStatus(200);
  }
  
  console.log(`${req.method} ${req.url} - Origin: ${origin}`);
  next();
});

// Sécurité HTTP avec Helmet (configuré pour autoriser le cross-origin en développement)
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" },
  contentSecurityPolicy: false, // Désactivé pour le développement
}));

app.use(express.json());
app.use("/uploads", express.static("uploads"));

// Appliquer le rate limiting général
app.use(generalLimiter);

/* =======================
   ROUTES
======================= */

app.get("/", (req, res) => {
  res.json({ message: "API is running 🚀" });
});

app.use("/api/auth", authLimiter, authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/match", matchRoutes);
app.use("/api/messages", messageLimiter, messageRoutes);
app.use("/api/ai", aiLimiter, aiRoutes);
app.use("/api/activities", activityRoutes);
app.use("/api/mentors", mentorRoutes);

/* =======================
   ERROR HANDLER GLOBAL
======================= */

app.use(errorMiddleware);

module.exports = app;
