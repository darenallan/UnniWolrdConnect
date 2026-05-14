const db = require("../firebase");

/**
 * Calcule un score de compatibilité entre l'utilisateur courant et un candidat.
 * Score max : 100
 *
 * Critères :
 * - Centres d'intérêt en commun  → 40 pts (proportionnel)
 * - Même langue                  → 20 pts
 * - Même pays d'origine          → 20 pts
 * - Même filière d'étude         → 20 pts
 */
function computeScore(currentUser, candidate) {
  let score = 0;

  // Intérêts communs
  const myInterests = new Set(currentUser.interests || []);
  const theirInterests = candidate.interests || [];
  if (myInterests.size > 0 && theirInterests.length > 0) {
    const common = theirInterests.filter((i) => myInterests.has(i)).length;
    const maxPossible = Math.max(myInterests.size, theirInterests.length);
    score += Math.round((common / maxPossible) * 40);
  }

  // Langue
  if (
    currentUser.language &&
    candidate.language &&
    currentUser.language.toLowerCase() === candidate.language.toLowerCase()
  ) {
    score += 20;
  }

  // Pays
  if (
    currentUser.country &&
    candidate.country &&
    currentUser.country.toLowerCase() === candidate.country.toLowerCase()
  ) {
    score += 20;
  }

  // Filière
  if (
    currentUser.major &&
    candidate.major &&
    currentUser.major.toLowerCase() === candidate.major.toLowerCase()
  ) {
    score += 20;
  }

  return score;
}

/**
 * GET /api/match/suggestions
 * Retourne les 10 meilleurs profils compatibles pour l'utilisateur connecté,
 * triés par score décroissant.
 */
exports.getSuggestions = async (req, res) => {
  try {
    const currentDoc = await db.collection("users").doc(req.user.id).get();

    if (!currentDoc.exists) {
      return res.status(404).json({ message: "User not found" });
    }

    const currentUser = currentDoc.data();

    // Récupérer tous les autres utilisateurs
    const snapshot = await db.collection("users").get();

    const suggestions = [];

    snapshot.forEach((doc) => {
      if (doc.id === req.user.id) return; // exclure soi-même

      const candidate = doc.data();
      const score = computeScore(currentUser, candidate);

      suggestions.push({
        id: doc.id,
        name: candidate.name,
        country: candidate.country,
        language: candidate.language,
        major: candidate.major,
        interests: candidate.interests,
        bio: candidate.bio,
        avatar: candidate.avatar,
        role: candidate.role,
        compatibilityScore: score,
      });
    });

    // Trier par score décroissant, garder le top 10
    suggestions.sort((a, b) => b.compatibilityScore - a.compatibilityScore);
    const top10 = suggestions.slice(0, 10);

    res.json({ suggestions: top10 });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * GET /api/match/mentors
 * Retourne uniquement les mentors compatibles (role === "mentor")
 */
exports.getMentors = async (req, res) => {
  try {
    const currentDoc = await db.collection("users").doc(req.user.id).get();

    if (!currentDoc.exists) {
      return res.status(404).json({ message: "User not found" });
    }

    const currentUser = currentDoc.data();

    const snapshot = await db
      .collection("users")
      .where("role", "==", "mentor")
      .get();

    const mentors = [];

    snapshot.forEach((doc) => {
      if (doc.id === req.user.id) return;

      const candidate = doc.data();
      const score = computeScore(currentUser, candidate);

      mentors.push({
        id: doc.id,
        name: candidate.name,
        country: candidate.country,
        language: candidate.language,
        major: candidate.major,
        interests: candidate.interests,
        bio: candidate.bio,
        avatar: candidate.avatar,
        compatibilityScore: score,
      });
    });

    mentors.sort((a, b) => b.compatibilityScore - a.compatibilityScore);

    res.json({ mentors });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
/**
 * GET /api/match/ai-suggestions
 * Utilise l'IA pour affiner les suggestions et expliquer pourquoi elles sont pertinentes.
 */
exports.getAISuggestions = async (req, res) => {
  try {
    const { GoogleGenerativeAI } = require("@google/generative-ai");
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    const currentDoc = await db.collection("users").doc(req.user.id).get();
    if (!currentDoc.exists) return res.status(404).json({ message: "User not found" });
    const currentUser = currentDoc.data();

    const snapshot = await db.collection("users").get();
    let candidates = [];

    snapshot.forEach((doc) => {
      if (doc.id === req.user.id) return;
      const candidate = doc.data();
      const score = computeScore(currentUser, candidate);
      candidates.push({ id: doc.id, ...candidate, compatibilityScore: score });
    });

    // Prendre le top 15 pour l'analyse IA
    candidates.sort((a, b) => b.compatibilityScore - a.compatibilityScore);
    const topCandidates = candidates.slice(0, 15);

    const prompt = `En tant qu'expert en psychologie sociale et intégration étudiante, analyse le profil de l'utilisateur principal et compare-le à 15 candidats.
    
    UTILISATEUR PRINCIPAL:
    Nom: ${currentUser.name}, Pays: ${currentUser.country}, Filière: ${currentUser.major}, Intérêts: ${(currentUser.interests || []).join(", ")}, Bio: ${currentUser.bio || "N/A"}
    
    CANDIDATS:
    ${topCandidates.map((c, i) => `${i + 1}. Nom: ${c.name}, Intérêts: ${(c.interests || []).join(", ")}, Bio: ${c.bio || "N/A"}`).join("\n")}
    
    Sélectionne les 5 meilleurs matchs. Pour chaque match, fournis :
    1. L'index du candidat (1-15).
    2. Une courte explication (max 15 mots) de pourquoi ils devraient se rencontrer (ex: "Tous deux passionnés de design et de voyages").
    
    Réponds uniquement au format JSON : [{"index": 1, "reason": "..."}, ...]`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    let text = response.text().replace(/```json|```/g, "").trim();
    const aiResults = JSON.parse(text);

    const finalSuggestions = aiResults.map(ai => {
      const candidate = topCandidates[ai.index - 1];
      return {
        ...candidate,
        matchReason: ai.reason,
        isAIRecommended: true
      };
    });

    res.json({ suggestions: finalSuggestions });
  } catch (error) {
    console.error("AI Matchmaking error:", error);
    // Fallback sur les suggestions classiques si l'IA échoue
    return exports.getSuggestions(req, res);
  }
};
