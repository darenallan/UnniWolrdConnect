const OpenAI = require("openai");
const { Translate } = require("@google-cloud/translate").v2;
const aiSecurity = require("../services/security/aiSecurity");

// Initialisation OpenRouter (via SDK OpenAI)
const openai = new OpenAI({
  apiKey: process.env.OPENROUTER_API_KEY,
  baseURL: "https://openrouter.ai/api/v1",
  defaultHeaders: {
    "HTTP-Referer": "http://localhost:3001", // Requis par OpenRouter
    "X-Title": "StudentConnect Flourish AI",
  }
});

const translate = new Translate({ key: process.env.GOOGLE_TRANSLATE_API_KEY });

// Système prompt de l'assistant étudiant
const SYSTEM_PROMPT = `Tu es un assistant bienveillant et expert dédié à aider les étudiants internationaux à s'intégrer dans leur nouveau pays.

Tu peux les aider avec :
- Les démarches administratives (visa, titre de séjour, inscription universitaire)
- La vie pratique (logement, transport, banque, santé)
- Les ressources universitaires (bibliothèques, associations, bourses)
- L'intégration sociale (rencontrer des gens, activités culturelles)
- Les questions de langue et de culture

Réponds de manière claire, chaleureuse et pratique. Si tu ne connais pas une information spécifique à une ville ou institution, indique-le honnêtement et oriente l'étudiant vers les bons interlocuteurs.`;

/**
 * POST /api/ai/chat
 * Envoie un message à l'assistant IA et retourne sa réponse.
 */
exports.chat = async (req, res) => {
  try {
    const { message, history = [], userContext = {} } = req.body;

    if (!message || !message.trim()) {
      return res.status(400).json({ message: "Message is required" });
    }

    // Sécuriser le message
    const securityCheck = aiSecurity(message);
    if (!securityCheck.valid) {
      return res.status(400).json({ message: securityCheck.error });
    }

    // Contexte Utilisateur
    const userContextStr = userContext.name 
      ? `L'utilisateur s'appelle ${userContext.name}, vient de ${userContext.country || "inconnu"}, étudie en ${userContext.major || "inconnu"} et s'intéresse à : ${(userContext.interests || []).join(', ')}.`
      : "Aucun contexte utilisateur spécifique fourni.";

    // Préparer les messages pour OpenAI
    const messages = [
      { role: "system", content: `${SYSTEM_PROMPT}\n\nContexte Utilisateur: ${userContextStr}` },
      ...history.slice(-10).map(h => ({
        role: h.role.toLowerCase() === "assistant" ? "assistant" : "user",
        content: h.content
      })),
      { role: "user", content: securityCheck.message }
    ];

    // Appel à OpenRouter
    const completion = await openai.chat.completions.create({
      model: "nvidia/nemotron-3-nano-omni-30b-a3b-reasoning:free",
      messages: messages,
    });

    const reply = completion.choices[0].message.content;

    res.json({
      reply,
      usage: {
        promptTokens: completion.usage.prompt_tokens,
        completionTokens: completion.usage.completion_tokens,
        totalTokens: completion.usage.total_tokens
      }
    });
  } catch (error) {
    console.error("CRITICAL OpenAI error:", error);
    res.status(500).json({ message: "AI service unavailable", error: error.message });
  }
};

/**
 * POST /api/ai/translate
 * Traduit un texte vers une langue cible.
 * Body : { text: string, targetLanguage: string, sourceLanguage?: string }
 * targetLanguage : code ISO 639-1 (ex: "fr", "en", "es", "ar")
 */
exports.translateText = async (req, res) => {
  try {
    const { text, targetLanguage, sourceLanguage } = req.body;

    if (!text || !text.trim()) {
      return res.status(400).json({ message: "Text is required" });
    }

    if (!targetLanguage) {
      return res.status(400).json({ message: "targetLanguage is required" });
    }

    const options = { to: targetLanguage };
    if (sourceLanguage) {
      options.from = sourceLanguage;
    }

    const [translation, metadata] = await translate.translate(text.trim(), options);

    res.json({
      original: text.trim(),
      translated: translation,
      sourceLanguage: metadata.data?.translations?.[0]?.detectedSourceLanguage || sourceLanguage || "auto",
      targetLanguage,
    });
  } catch (error) {
    console.error("Translate error:", error);
    res.status(500).json({ message: "Translation service unavailable", error: error.message });
  }
};

/**
 * POST /api/ai/detect-language
 * Détecte automatiquement la langue d'un texte.
 * Body : { text: string }
 */
exports.detectLanguage = async (req, res) => {
  try {
    const { text } = req.body;

    if (!text || !text.trim()) {
      return res.status(400).json({ message: "Text is required" });
    }

    const [detections] = await translate.detect(text.trim());
    const detection = Array.isArray(detections) ? detections[0] : detections;

    res.json({
      language: detection.language,
      confidence: detection.confidence,
    });
  } catch (error) {
    console.error("Detect language error:", error);
    res.status(500).json({ message: "Detection service unavailable", error: error.message });
  }
};

/**
 * POST /api/ai/icebreakers
 * Génère des suggestions de conversation entre deux utilisateurs.
 */
exports.getIceBreakers = async (req, res) => {
  try {
    const { user1, user2 } = req.body;

    if (!user1 || !user2) {
      return res.status(400).json({ message: "Both users profiles are required" });
    }

    const prompt = `En tant qu'assistant de mise en relation étudiant, génère 3 phrases d'accroche (Ice Breakers) courtes et amicales pour aider ces deux étudiants à briser la glace.
    
    Étudiant 1 : ${user1.name}, vient de ${user1.country}, étudie ${user1.major}, s'intéresse à : ${(user1.interests || []).join(', ')}.
    Étudiant 2 : ${user2.name}, vient de ${user2.country}, étudie ${user2.major}, s'intéresse à : ${(user2.interests || []).join(', ')}.
    
    Réponds uniquement avec un tableau JSON de 3 chaînes de caractères en français.
    Format attendu: ["phrase 1", "phrase 2", "phrase 3"]`;

    const completion = await openai.chat.completions.create({
      model: "nvidia/nemotron-3-nano-omni-30b-a3b-reasoning:free",
      messages: [{ role: "user", content: prompt }],
    });

    let text = completion.choices[0].message.content;
    
    // Extraire le tableau si OpenAI l'entoure d'un objet
    let icebreakers;
    try {
      const parsed = JSON.parse(text);
      icebreakers = Array.isArray(parsed) ? parsed : Object.values(parsed)[0];
    } catch (e) {
      // Fallback simple si le parsing complexe échoue
      icebreakers = ["Salut ! Comment ça va ?", "J'ai vu qu'on a des intérêts communs !", "On étudie la même chose, non ?"];
    }

    res.json({ icebreakers });
  } catch (error) {
    console.error("Icebreakers error:", error);
    res.status(500).json({ message: "Failed to generate icebreakers", error: error.message });
  }
};
