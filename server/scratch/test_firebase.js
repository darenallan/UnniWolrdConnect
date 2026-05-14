require('dotenv').config();
const admin = require("firebase-admin");

try {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
    }),
  });
  console.log("Firebase initialized successfully!");
  const db = admin.firestore();
  db.collection("users").limit(1).get()
    .then(() => console.log("Firestore connection test: SUCCESS"))
    .catch((err) => console.error("Firestore connection test: FAILED", err))
    .finally(() => process.exit());
} catch (e) {
  console.error("Firebase init failed:", e);
  process.exit(1);
}
