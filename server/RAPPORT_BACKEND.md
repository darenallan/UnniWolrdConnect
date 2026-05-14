# Rapport backend - Base de données et sécurité

Ce rapport explique uniquement la partie backend du projet : connexion à la base de données, organisation des routes, accès Firestore, authentification, validation et protections de sécurité. La partie frontend n'est pas traitée ici.

## 1. Vue d'ensemble du backend

Le backend est une API Node.js/Express connectée à Firebase Firestore. Il expose des routes REST pour l'authentification, les utilisateurs, les conversations/messages, les suggestions de profils, les activités et l'IA. Il expose aussi un serveur Socket.io pour les messages en temps réel.

Fichiers principaux :

- **`server.js`** : démarre le serveur HTTP, initialise Socket.io et lance l'écoute du port.
- **`app.js`** : configure Express, les middlewares de sécurité et les routes REST.
- **`firebase/index.js`** : initialise Firebase Admin SDK et exporte l'objet Firestore `db`.
- **`routes/`** : définit les endpoints disponibles.
- **`controllers/`** : contient la logique métier et les accès Firestore.
- **`middleware/`** : authentification JWT, validation, rate limiting et gestion d'erreurs.
- **`utils/`** : fonctions utilitaires comme le hash des mots de passe et la génération JWT.
- **`sockets/`** : middleware d'authentification Socket.io.

## 2. Initialisation Firebase / Firestore

Fichier : **`firebase/index.js`**

```js
const admin = require("firebase-admin");
const serviceAccount = require("./firebaseConfig.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const db = admin.firestore();

module.exports = db;
```

Ce fichier initialise Firebase Admin SDK côté serveur. Il utilise une clé privée de service account stockée dans `firebaseConfig.json`. Cette clé ne doit jamais être publiée sur GitHub.

Le fichier exporte `db`, qui représente la connexion Firestore. Tous les contrôleurs backend l'utilisent ensuite avec :

```js
const db = require("../firebase");
```

Exemples de collections Firestore utilisées :

- **`users`** : comptes utilisateurs, profils, mots de passe hashés.
- **`conversations`** : conversations privées entre deux utilisateurs.
- **`conversations/{conversationId}/messages`** : sous-collection contenant les messages d'une conversation.
- **`activities`** : événements, clubs ou activités recommandées.

## 3. Configuration Express globale

Fichier : **`app.js`**

```js
const express = require("express");
const cors = require("cors");
const helmet = require("helmet");

const { generalLimiter, authLimiter, aiLimiter, messageLimiter } = require("./middleware/rateLimit");
const errorMiddleware = require("./middleware/errorMiddleware");
```

Le backend utilise plusieurs middlewares importants :

```js
app.use(helmet());
app.use(cors({ origin: "*" }));
app.use(express.json());
app.use(generalLimiter);
```

Rôle de chaque middleware :

- **`helmet()`** : ajoute des headers HTTP de sécurité.
- **`cors({ origin: "*" })`** : autorise les requêtes venant du frontend.
- **`express.json()`** : permet de lire le JSON envoyé dans le body des requêtes.
- **`generalLimiter`** : limite le nombre de requêtes par IP pour réduire les abus.

Les routes sont ensuite montées comme ceci :

```js
app.use("/api/auth", authLimiter, authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/match", matchRoutes);
app.use("/api/messages", messageLimiter, messageRoutes);
app.use("/api/ai", aiLimiter, aiRoutes);
app.use("/api/activities", activityRoutes);
```

Chaque groupe de routes a son rôle :

- **`/api/auth`** : inscription et connexion.
- **`/api/users`** : profil utilisateur.
- **`/api/match`** : suggestions et mentors.
- **`/api/messages`** : conversations et messages.
- **`/api/ai`** : endpoints IA.
- **`/api/activities`** : activités recommandées et inscriptions.

## 4. Démarrage serveur et Socket.io

Fichier : **`server.js`**

```js
require("dotenv").config();

const http = require("http");
const { Server } = require("socket.io");

const app = require("./app");
const db = require("./firebase");
const socketAuth = require("./sockets/socketAuth");
```

Le serveur Express est transformé en serveur HTTP, puis Socket.io est branché dessus :

```js
const server = http.createServer(app);

const io = new Server(server, {
  cors: { origin: "*" },
});
```

Socket.io utilise un middleware d'authentification :

```js
io.use(socketAuth);
```

Cela signifie qu'un utilisateur doit envoyer un JWT valide au moment de la connexion socket.

Le serveur écoute ensuite sur le port défini dans `.env` ou `5000` par défaut :

```js
const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
```

## 5. Authentification REST avec JWT

### 5.1 Génération du token

Fichier : **`utils/generateToken.js`**

```js
const jwt = require("jsonwebtoken");

const generateToken = (userId, email = null) => {
    const payload = { 
        id: userId,
        email: email 
    };
    
    return jwt.sign(
        payload,
        process.env.JWT_SECRET,
        { expiresIn: "7d" }
    );
};
```

Lorsqu'un utilisateur s'inscrit ou se connecte, le backend crée un JWT contenant :

- **`id`** : identifiant Firestore de l'utilisateur.
- **`email`** : email de l'utilisateur.

Le token est signé avec `JWT_SECRET`, qui doit être dans le fichier `.env` du backend. La durée de validité est de 7 jours.

### 5.2 Vérification du token côté routes protégées

Fichier : **`middleware/authMiddleware.js`**

```js
const header = req.headers.authorization;

if (!header) {
  return res.status(401).json({ message: "No token provided" });
}

const token = header.split(" ")[1];
```

Le middleware lit le token depuis le header HTTP :

```http
Authorization: Bearer <token>
```

Ensuite, il vérifie le token :

```js
const decoded = jwt.verify(token, process.env.JWT_SECRET);
req.user = decoded;
next();
```

Si le token est valide, les informations de l'utilisateur sont attachées à `req.user`. Les contrôleurs peuvent ensuite utiliser `req.user.id` pour accéder au document Firestore de l'utilisateur connecté.

## 6. Inscription et connexion

Fichier : **`controllers/authController.js`**

### 6.1 Inscription

Endpoint : **`POST /api/auth/register`**

```js
const { name, email, password, country, language, major } = req.body;

const usersRef = db.collection("users");
const existingUser = await usersRef.where("email", "==", email).get();
```

Le backend vérifie d'abord si un utilisateur avec le même email existe déjà dans la collection `users`.

```js
if (!existingUser.empty) {
  return res.status(400).json({ message: "User already exists" });
}
```

Le mot de passe est ensuite hashé :

```js
const hashedPassword = await hashPassword(password);
```

Puis un nouvel utilisateur est créé :

```js
const newUser = {
  name,
  email,
  password: hashedPassword,
  country: country || "",
  language: language || "",
  major: major || "",
  interests: [],
  bio: "",
  avatar: "",
  role: "student",
  createdAt: new Date(),
};

const docRef = await usersRef.add(newUser);
```

La base de données stocke donc le mot de passe hashé, jamais le mot de passe en clair.

Avant de répondre au frontend, le mot de passe est supprimé de l'objet retourné :

```js
const { password: _, ...userWithoutPassword } = newUser;
res.status(201).json({ token, user: { id: docRef.id, ...userWithoutPassword } });
```

### 6.2 Connexion

Endpoint : **`POST /api/auth/login`**

```js
const userSnapshot = await usersRef.where("email", "==", email).get();

if (userSnapshot.empty) {
  return res.status(400).json({ message: "Invalid credentials" });
}
```

Le backend cherche l'utilisateur par email, puis compare le mot de passe envoyé avec le hash stocké :

```js
const isMatch = await comparePassword(password, user.password);

if (!isMatch) {
  return res.status(400).json({ message: "Invalid credentials" });
}
```

Si les identifiants sont corrects, un JWT est généré :

```js
const token = generateToken(userId, email);
```

## 7. Hash des mots de passe

Fichier : **`utils/hashPassword.js`**

```js
const bcrypt = require("bcryptjs");

const hashPassword = async (password) => {
    const salt = await bcrypt.genSalt(10);
    return await bcrypt.hash(password, salt);
};
```

Le backend utilise `bcryptjs` pour sécuriser les mots de passe. Un salt est généré avec un coût de 10, puis le mot de passe est hashé.

Pour la connexion :

```js
const comparePassword = async (password, hashedPassword) => {
    return await bcrypt.compare(password, hashedPassword);
};
```

Le mot de passe en clair n'est jamais stocké en base de données.

## 8. Validation et nettoyage des entrées

Fichier : **`middleware/validation.js`**

Le backend valide les données reçues avant d'appeler les contrôleurs. Il utilise :

- **`validator`** pour vérifier les emails, longueurs, formats.
- **`xss`** pour réduire les risques d'injection XSS.

Fonction de nettoyage :

```js
const sanitizeString = (str) => {
  if (typeof str !== 'string') return '';
  
  let clean = xss(str);
  clean = validator.escape(clean);
  
  return clean.trim();
};
```

### 8.1 Validation du mot de passe

```js
if (!validator.isLength(password, { min: 6, max: 128 })) {
  return { valid: false, message: "Password must be between 6 and 128 characters" };
}

if (!validator.matches(password, /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)) {
  return { valid: false, message: "Password must contain at least one uppercase letter, one lowercase letter, and one number" };
}
```

Le backend impose donc un mot de passe avec :

- au moins 6 caractères ;
- au moins une majuscule ;
- au moins une minuscule ;
- au moins un chiffre.

### 8.2 Validation du profil

```js
const allowedFields = ['name', 'country', 'language', 'major', 'interests', 'bio', 'avatar'];
const updates = {};
```

Seuls certains champs sont autorisés à être modifiés. Cela empêche un utilisateur de modifier des champs sensibles comme `password`, `role` ou `createdAt` via l'endpoint de profil.

### 8.3 Validation des messages

```js
if (!text || typeof text !== 'string') {
  return res.status(400).json({ 
    message: "Message text is required" 
  });
}

if (text.length > 1000) {
  return res.status(400).json({ 
    message: "Message must be less than 1000 characters" 
  });
}
```

Les messages vides ou trop longs sont refusés.

## 9. Rate limiting

Fichier : **`middleware/rateLimit.js`**

Le backend limite le nombre de requêtes pour réduire les abus, brute force et spam.

### 9.1 Limite générale

```js
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
});
```

Chaque IP est limitée à 100 requêtes par 15 minutes.

### 9.2 Limite authentification

```js
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
});
```

Les routes `/api/auth` sont limitées à 5 tentatives par 15 minutes, ce qui protège contre les attaques par force brute.

### 9.3 Limite messages

```js
const messageLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 30,
});
```

Les routes messages sont limitées à 30 requêtes par minute pour limiter le spam.

## 10. Gestion des utilisateurs

Fichier : **`controllers/userController.js`**

Toutes les routes utilisateur sont protégées par JWT dans **`routes/userRoutes.js`** :

```js
router.use(authMiddleware);

router.get("/me", userController.getMe);
router.put("/me", validateProfileUpdate, userController.updateMe);
router.get("/:id", userController.getUserById);
```

### 10.1 Profil personnel

```js
const doc = await db.collection("users").doc(req.user.id).get();
```

Le backend récupère le document Firestore correspondant à l'utilisateur connecté.

Avant de renvoyer la réponse, le mot de passe est retiré :

```js
const user = doc.data();
delete user.password;

res.json({ id: doc.id, ...user });
```

### 10.2 Profil public

Pour un autre utilisateur, seuls les champs publics sont exposés :

```js
const publicProfile = {
  id: doc.id,
  name: user.name,
  country: user.country,
  language: user.language,
  major: user.major,
  interests: user.interests,
  bio: user.bio,
  avatar: user.avatar,
  role: user.role,
};
```

Le password n'est jamais renvoyé.

### 10.3 Mise à jour du profil

```js
const updates = req.body.updates;
updates.updatedAt = new Date();

await db.collection("users").doc(req.user.id).update(updates);
```

La mise à jour se fait uniquement sur le document de l'utilisateur connecté, grâce à `req.user.id`.

## 11. Conversations et messages Firestore

Fichier : **`controllers/messageController.js`**

Toutes les routes messages sont protégées par JWT dans **`routes/messageRoutes.js`** :

```js
router.use(authMiddleware);

router.get("/conversations", messageController.getMyConversations);
router.post("/conversations", messageController.getOrCreateConversation);
router.get("/conversations/:conversationId", messageController.getMessages);
router.post("/conversations/:conversationId", validateMessage, messageController.sendMessage);
```

### 11.1 Création ou récupération d'une conversation

Endpoint : **`POST /api/messages/conversations`**

```js
const { otherUserId } = req.body;
const myId = req.user.id;
```

L'utilisateur connecté est identifié par le JWT. Le backend refuse une conversation avec soi-même :

```js
if (otherUserId === myId) {
  return res.status(400).json({ message: "Cannot create conversation with yourself" });
}
```

Il vérifie ensuite que l'autre utilisateur existe :

```js
const otherDoc = await db.collection("users").doc(otherUserId).get();
if (!otherDoc.exists) {
  return res.status(404).json({ message: "User not found" });
}
```

Les participants sont triés pour garantir une forme unique :

```js
const participants = [myId, otherUserId].sort();
```

Puis le backend cherche si la conversation existe déjà :

```js
const existing = await db
  .collection("conversations")
  .where("participants", "==", participants)
  .limit(1)
  .get();
```

Si elle n'existe pas, une nouvelle conversation est créée :

```js
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
```

### 11.2 Liste des conversations de l'utilisateur

Endpoint : **`GET /api/messages/conversations`**

```js
const snapshot = await db
  .collection("conversations")
  .where("participants", "array-contains", myId)
  .orderBy("lastMessageAt", "desc")
  .get();
```

Cette requête ne récupère que les conversations où l'utilisateur connecté est dans le tableau `participants`.

### 11.3 Lecture des messages

Endpoint : **`GET /api/messages/conversations/:conversationId`**

Avant de lire les messages, le backend vérifie que la conversation existe :

```js
const convDoc = await db.collection("conversations").doc(conversationId).get();
if (!convDoc.exists) {
  return res.status(404).json({ message: "Conversation not found" });
}
```

Puis il vérifie l'accès :

```js
const conv = convDoc.data();
if (!conv.participants.includes(myId)) {
  return res.status(403).json({ message: "Access denied" });
}
```

Les messages sont stockés dans une sous-collection :

```js
db
  .collection("conversations")
  .doc(conversationId)
  .collection("messages")
  .orderBy("createdAt", "desc")
  .limit(limit);
```

### 11.4 Envoi d'un message HTTP

Endpoint : **`POST /api/messages/conversations/:conversationId`**

Le backend vérifie que l'utilisateur est participant de la conversation avant d'écrire :

```js
const conv = convDoc.data();
if (!conv.participants.includes(myId)) {
  return res.status(403).json({ message: "Access denied" });
}
```

Puis il crée le message :

```js
const message = {
  senderId: myId,
  text: text.trim(),
  createdAt: new Date(),
};

const docRef = await db
  .collection("conversations")
  .doc(conversationId)
  .collection("messages")
  .add(message);
```

Enfin, il met à jour les métadonnées de conversation :

```js
await db.collection("conversations").doc(conversationId).update({
  lastMessage: message.text,
  lastMessageAt: message.createdAt,
  lastSenderId: myId,
});
```

## 12. Sécurité Socket.io pour les messages temps réel

### 12.1 Authentification Socket.io

Fichier : **`sockets/socketAuth.js`**

```js
const token = socket.handshake.auth?.token;

if (!token) {
    return next(new Error("No token provided for socket connection"));
}
```

Le frontend doit envoyer un token dans `socket.handshake.auth.token`. Le backend le vérifie avec le même `JWT_SECRET` que les routes REST :

```js
const decoded = jwt.verify(token, process.env.JWT_SECRET);

socket.user = decoded;
socket.userId = decoded.id;
```

Ainsi, dans `server.js`, chaque socket connecté possède l'utilisateur authentifié.

### 12.2 Contrôle d'accès avant persistance d'un message Socket.io

Fichier : **`server.js`**

Dans l'événement `sendMessage`, le backend vérifie d'abord que l'utilisateur est authentifié :

```js
if (!socket.user || !socket.user.id) {
  return socket.emit("messageError", { error: "Unauthorized" });
}
```

Il vérifie ensuite que le `senderId` du message correspond bien à l'utilisateur authentifié :

```js
if (message.senderId !== socket.user.id) {
  return socket.emit("messageError", { error: "Unauthorized sender" });
}
```

Puis il lit la conversation dans Firestore :

```js
const conversationRef = db.collection("conversations").doc(conversationId);
const conversationDoc = await conversationRef.get();

if (!conversationDoc.exists) {
  return socket.emit("messageError", { error: "Access denied" });
}
```

Enfin, il vérifie que l'utilisateur connecté fait partie des participants :

```js
const conversation = conversationDoc.data();

if (!conversation.participants || !conversation.participants.includes(socket.user.id)) {
  return socket.emit("messageError", { error: "Access denied" });
}
```

Ce contrôle est essentiel : il empêche un utilisateur authentifié d'envoyer un message dans une conversation qui ne lui appartient pas.

Si tout est correct, le message est persisté :

```js
const msgRef = db
  .collection("conversations")
  .doc(conversationId)
  .collection("messages");

const docRef = await msgRef.add({
  ...message,
  createdAt: new Date(),
});
```

Puis la conversation est mise à jour :

```js
await conversationRef.update({
  lastMessage: message.text,
  lastMessageAt: new Date(),
  lastSenderId: message.senderId,
});
```

Et le message est envoyé aux clients dans la room :

```js
io.to(conversationId).emit("receiveMessage", savedMessage);
```

## 13. Système de matching

Fichier : **`controllers/matchController.js`**

Les routes match sont protégées par JWT :

```js
router.use(authMiddleware);
```

Le backend récupère l'utilisateur connecté :

```js
const currentDoc = await db.collection("users").doc(req.user.id).get();
```

Puis il récupère les autres utilisateurs dans Firestore :

```js
const snapshot = await db.collection("users").get();
```

Le score est calculé selon plusieurs critères :

```js
if (currentUser.language && candidate.language && currentUser.language.toLowerCase() === candidate.language.toLowerCase()) {
  score += 20;
}

if (currentUser.country && candidate.country && currentUser.country.toLowerCase() === candidate.country.toLowerCase()) {
  score += 20;
}

if (currentUser.major && candidate.major && currentUser.major.toLowerCase() === candidate.major.toLowerCase()) {
  score += 20;
}
```

Le backend ne renvoie que des informations publiques : nom, pays, langue, filière, centres d'intérêt, bio, avatar et score.

## 14. Activités et recommandations

Fichier : **`controllers/activityController.js`**

Les routes activités sont protégées par JWT :

```js
router.use(authMiddleware);
```

### 14.1 Recommandations

Le backend récupère les activités actives :

```js
const snapshot = await db
  .collection("activities")
  .where("isActive", "==", true)
  .where("endDate", ">=", new Date())
  .get();
```

Il calcule un score selon les intérêts, la localisation et la langue :

```js
const userInterests = new Set(user.interests || []);
const activityTags = activity.tags || [];

if (userInterests.size > 0 && activityTags.length > 0) {
  const matchingTags = activityTags.filter(tag => userInterests.has(tag)).length;
  const maxPossible = Math.max(userInterests.size, activityTags.length);
  score += Math.round((matchingTags / maxPossible) * 70);
}
```

### 14.2 Rejoindre une activité

Avant d'ajouter un participant, le backend vérifie que l'utilisateur n'est pas déjà inscrit :

```js
if (activity.participants && activity.participants.includes(userId)) {
  return res.status(400).json({ message: "Already registered for this activity" });
}
```

Il vérifie aussi la capacité maximale :

```js
const currentCount = activity.currentParticipants || 0;
if (activity.maxParticipants && currentCount >= activity.maxParticipants) {
  return res.status(400).json({ message: "Activity is full" });
}
```

Puis il met à jour Firestore :

```js
await db.collection("activities").doc(req.params.id).update({
  participants: [...(activity.participants || []), userId],
  currentParticipants: currentCount + 1,
});
```

### 14.3 Quitter une activité

Le backend vérifie que l'utilisateur est bien inscrit :

```js
if (!activity.participants || !activity.participants.includes(userId)) {
  return res.status(400).json({ message: "Not registered for this activity" });
}
```

Puis il le retire du tableau :

```js
const updatedParticipants = activity.participants.filter(id => id !== userId);
await db.collection("activities").doc(req.params.id).update({
  participants: updatedParticipants,
  currentParticipants: Math.max(0, (activity.currentParticipants || 0) - 1),
});
```

## 15. Gestion centralisée des erreurs

Fichier : **`middleware/errorMiddleware.js`**

Ce middleware log les erreurs côté serveur :

```js
console.error("ERROR:", {
    message: err.message,
    stack: err.stack,
    url: req.url,
    method: req.method,
    ip: req.ip,
    timestamp: new Date().toISOString()
});
```

Il renvoie ensuite une réponse structurée :

```js
const errorResponse = {
    success: false,
    message: err.message || "Internal Server Error"
};
```

En développement, il peut renvoyer plus de détails :

```js
if (process.env.NODE_ENV === "development") {
    errorResponse.stack = err.stack;
    errorResponse.details = {
        url: req.url,
        method: req.method,
        body: req.body,
        params: req.params,
        query: req.query
    };
}
```

Cela permet de debug en local tout en évitant d'exposer trop d'informations en production.

## 16. Résumé des protections sécurité

Le backend applique plusieurs couches de sécurité :

- **Firebase Admin SDK** côté serveur uniquement, avec une clé privée non publiée.
- **JWT** pour authentifier les utilisateurs REST.
- **JWT Socket.io** pour authentifier les connexions temps réel.
- **Hash bcrypt** des mots de passe.
- **Validation stricte** des champs d'inscription, connexion, profil et messages.
- **Nettoyage XSS** des chaînes entrantes.
- **Rate limiting** général, auth, messages et IA.
- **Helmet** pour renforcer les headers HTTP.
- **Contrôle d'accès Firestore** sur les conversations via `participants`.
- **Masquage du password** dans les réponses utilisateur.
- **Champs autorisés uniquement** pour les mises à jour de profil.

## 17. Points sensibles à ne jamais publier

Les fichiers suivants doivent rester locaux :

```text
server/.env
server/firebase/firebaseConfig.json
```

Ils sont ignorés par Git grâce au `.gitignore`. Le premier contient les variables d'environnement comme `JWT_SECRET`; le second contient la clé privée Firebase Admin.

## 18. Conclusion

Le backend est structuré autour d'une API Express sécurisée et d'une base Firestore. Les contrôleurs centralisent les accès à la base de données, les routes appliquent les middlewares d'authentification et de validation, et les données sensibles sont protégées par hash, JWT, nettoyage des entrées et contrôle d'accès. La partie messagerie est sécurisée à la fois en HTTP et en Socket.io grâce à la vérification des participants dans Firestore avant toute lecture ou écriture de messages.
