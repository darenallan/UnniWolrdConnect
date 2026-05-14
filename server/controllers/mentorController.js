const db = require("../firebase");

/**
 * POST /api/mentors/request
 * Envoyer une demande de mentorat
 */
exports.sendRequest = async (req, res) => {
  try {
    const { mentorId, message } = req.body;
    const studentId = req.user.id;

    if (!mentorId) {
      return res.status(400).json({ message: "mentorId is required" });
    }

    // Récupérer les infos de l'étudiant pour garantir son nom
    const studentDoc = await db.collection("users").doc(studentId).get();
    if (!studentDoc.exists) {
      return res.status(404).json({ message: "Student profile not found" });
    }
    const studentData = studentDoc.data();

    // Vérifier si le mentor existe et est bien mentor
    const mentorDoc = await db.collection("users").doc(mentorId).get();
    if (!mentorDoc.exists || mentorDoc.data().role !== "mentor") {
      return res.status(400).json({ message: "User is not a mentor" });
    }

    // Vérifier si une demande existe déjà
    const existing = await db.collection("mentorRequests")
      .where("studentId", "==", studentId)
      .where("mentorId", "==", mentorId)
      .where("status", "==", "pending")
      .get();

    if (!existing.empty) {
      return res.status(400).json({ message: "A request is already pending" });
    }

    const newRequest = {
      studentId,
      studentName: studentData.name || req.user.name || "Étudiant",
      mentorId,
      message: message || "J'aimerais que vous soyez mon mentor.",
      status: "pending",
      createdAt: new Date(),
    };

    const docRef = await db.collection("mentorRequests").add(newRequest);

    res.status(201).json({ message: "Request sent successfully", id: docRef.id });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * GET /api/mentors/requests
 * Voir mes demandes (reçues si mentor, envoyées si étudiant)
 */
exports.getMyRequests = async (req, res) => {
  try {
    const userId = req.user.id;
    const role = req.user.role || "student";
    console.log(`[Mentor] Fetching requests for user ${userId} (role: ${role})`);

    let query;
    if (role === "mentor") {
      query = db.collection("mentorRequests").where("mentorId", "==", userId);
    } else {
      query = db.collection("mentorRequests").where("studentId", "==", userId);
    }

    const snapshot = await query.get();
    const requests = [];

    snapshot.forEach(doc => {
      requests.push({ id: doc.id, ...doc.data() });
    });

    // Tri manuel si nécessaire ou ajout d'index
    requests.sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));

    res.json({ requests });
  } catch (error) {
    console.error("[Mentor] Error fetching requests:", error);
    res.status(500).json({ message: error.message });
  }
};

/**
 * PUT /api/mentors/requests/:id
 * Répondre à une demande (Accepter/Refuser)
 */
exports.respondToRequest = async (req, res) => {
  try {
    const { status } = req.body; // 'accepted' or 'rejected'
    const requestId = req.params.id;

    if (!['accepted', 'rejected'].includes(status)) {
      return res.status(400).json({ message: "Invalid status" });
    }

    const requestRef = db.collection("mentorRequests").doc(requestId);
    const requestDoc = await requestRef.get();

    if (!requestDoc.exists) {
      return res.status(404).json({ message: "Request not found" });
    }

    if (requestDoc.data().mentorId !== req.user.id) {
      return res.status(403).json({ message: "Unauthorized" });
    }

    await requestRef.update({ 
      status,
      respondedAt: new Date()
    });

    res.json({ message: `Request ${status}` });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
