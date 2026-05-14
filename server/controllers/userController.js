const db = require("../firebase");

/**
 * GET /api/users/me
 * Retourne le profil de l'utilisateur connecté
 */
exports.getMe = async (req, res) => {
  try {
    const doc = await db.collection("users").doc(req.user.id).get();

    if (!doc.exists) {
      return res.status(404).json({ message: "User not found" });
    }

    const user = doc.data();
    delete user.password;

    res.json({ id: doc.id, ...user });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * GET /api/users/:id
 * Retourne le profil public d'un autre utilisateur
 */
exports.getUserById = async (req, res) => {
  try {
    const doc = await db.collection("users").doc(req.params.id).get();

    if (!doc.exists) {
      return res.status(404).json({ message: "User not found" });
    }

    const user = doc.data();
    // On expose uniquement les champs publics
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

    res.json(publicProfile);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * PUT /api/users/me
 * Met à jour le profil de l'utilisateur connecté
 * Champs autorisés : name, country, language, major, interests, bio, avatar
 */
exports.updateMe = async (req, res) => {
  try {
    const updates = req.body.updates;
    updates.updatedAt = new Date();

    await db.collection("users").doc(req.user.id).update(updates);

    res.json({ message: "Profile updated", updates });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * POST /api/users/me/avatar
 * Upload et met à jour l'avatar de l'utilisateur connecté
 */
exports.uploadAvatar = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "Please upload a file" });
    }

    const avatarUrl = `/uploads/${req.file.filename}`;
    
    await db.collection("users").doc(req.user.id).update({
      avatar: avatarUrl,
      updatedAt: new Date()
    });

    res.json({ 
      message: "Avatar uploaded successfully", 
      avatarUrl 
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * GET /api/users/me/stats
 * Retourne les statistiques de l'utilisateur (nombre de matches, activités, etc.)
 */
exports.getUserStats = async (req, res) => {
  try {
    const myId = req.user.id;
    const db = require("../firebase");

    // Compter les matches
    const matchesSnap = await db.collection("matches")
      .where("userIds", "array-contains", myId)
      .get();
    
    // Compter les groupes et événements rejoints
    const activitiesSnap = await db.collection("activities")
      .where("participants", "array-contains", myId)
      .get();

    const groups = activitiesSnap.docs.filter(d => d.data().type === "group").length;
    const events = activitiesSnap.docs.filter(d => d.data().type === "event").length;

    res.json({
      matches: matchesSnap.size,
      groups,
      events,
      totalActivities: activitiesSnap.size
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.searchUsers = async (req, res) => {
  try {
    const { q } = req.query;
    if (!q) return res.json({ users: [] });
    const query = q.toLowerCase();
    const snapshot = await db.collection("users").get();
    const results = [];
    snapshot.forEach(doc => {
      if (doc.id === req.user.id) return;
      const data = doc.data();
      if (data.name?.toLowerCase().includes(query) || data.major?.toLowerCase().includes(query)) {
        results.push({ id: doc.id, ...data });
      }
    });
    res.json({ users: results.slice(0, 10) });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
