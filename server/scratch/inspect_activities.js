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
  const db = admin.firestore();
  db.collection("activities").get()
    .then((snap) => {
      console.log(`Total activities in DB: ${snap.size}`);
      snap.forEach(doc => {
        const d = doc.data();
        console.log(`- ID: ${doc.id}, Title: ${d.title}, Active: ${d.isActive}, EndDate: ${d.endDate?.toDate ? d.endDate.toDate() : d.endDate}`);
      });
    })
    .catch((err) => console.error("FAILED", err))
    .finally(() => process.exit());
} catch (e) {
  process.exit(1);
}
