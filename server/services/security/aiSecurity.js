const xss = require("xss");
const validator = require("validator");

/**
 * Service de sécurité spécialisé pour les interactions avec l'IA
 * Nettoie et valide les messages envoyés à l'API IA
 */
const aiSecurity = (message) => {
    if (!message) {
        return {
            valid: false,
            error: "Empty message"
        };
    }

    // Limiter la taille du message pour éviter les abus
    if (message.length > 2000) {
        return {
            valid: false,
            error: "Message too long (max 2000 characters)"
        };
    }

    // Nettoyage XSS pour prévenir les attaques par injection
    let cleanMessage = xss(message);

    // Note: On ne fait pas validator.escape() ici car l'IA a besoin du texte brut 
    // (ex: l'apostrophe devient &#x27; ce qui perturbe l'IA). 
    // La protection XSS est déjà gérée par React à l'affichage.

    // Validation supplémentaire : détecter les tentatives d'injection de code
    const dangerousPatterns = [
        /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
        /javascript:/gi,
        /on\w+\s*=/gi,
        /eval\s*\(/gi,
        /exec\s*\(/gi
    ];

    for (const pattern of dangerousPatterns) {
        if (pattern.test(cleanMessage)) {
            return {
                valid: false,
                error: "Message contains potentially dangerous content"
            };
        }
    }

    return {
        valid: true,
        message: cleanMessage
    };
};

module.exports = aiSecurity;
