const jwt = require("jsonwebtoken");
const admin = require("firebase-admin");
const db = require("../firebase");
const { hashPassword, comparePassword } = require("../utils/hashPassword");
const generateToken = require("../utils/generateToken");

/**
 * POST /api/auth/register
 */
exports.register = async (req, res) => {
  try {
    const { name, email, password, country, language, major } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ message: "name, email and password are required" });
    }

    // 1. Créer l'utilisateur dans Firebase Authentication
    let userRecord;
    try {
      userRecord = await admin.auth().createUser({
        email: email,
        password: password,
        displayName: name,
      });
    } catch (authError) {
      if (authError.code === 'auth/email-already-exists') {
        return res.status(400).json({ message: "User already exists in Firebase Auth" });
      }
      throw authError;
    }

    // 2. Préparer les données pour Firestore
    const hashedPassword = await hashPassword(password);
    const newUser = {
      uid: userRecord.uid, // Lien avec Firebase Auth
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

    // 3. Enregistrer dans Firestore en utilisant l'UID comme ID de document
    await db.collection("users").doc(userRecord.uid).set(newUser);

    const token = generateToken(userRecord.uid, email, newUser.role, newUser.name);

    res.status(201).json({ 
      token, 
      user: { id: userRecord.uid, ...newUser } 
    });
  } catch (error) {
    console.error("Register error:", error);
    res.status(500).json({ message: error.message });
  }
};

/**
 * POST /api/auth/login
 */
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: "email and password are required" });
    }

    const usersRef = db.collection("users");
    const userSnapshot = await usersRef.where("email", "==", email).get();

    if (userSnapshot.empty) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    const user = userSnapshot.docs[0].data();
    const userId = userSnapshot.docs[0].id;

    const isMatch = await comparePassword(password, user.password);

    if (!isMatch) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    const token = generateToken(userId, email, user.role, user.name);

    const { password: _, ...userWithoutPassword } = user;

    res.json({ token, user: { id: userId, ...userWithoutPassword } });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
