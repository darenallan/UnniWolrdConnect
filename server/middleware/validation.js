const validator = require("validator");
const xss = require("xss");

/**
 * Middleware de validation avancé pour sécuriser les entrées utilisateur
 * Utilise validator et xss pour une protection complète
 */

// Nettoyer et valider les entrées de texte avec protection XSS
const sanitizeString = (str) => {
  if (typeof str !== 'string') return '';
  
  // Nettoyage XSS
  let clean = xss(str);
  
  // Échapper les caractères HTML
  clean = validator.escape(clean);
  
  return clean.trim();
};

// Valider un email avec validator
const validateEmail = (email) => {
  return validator.isEmail(email);
};

// Valider un mot de passe avec validator
const validatePassword = (password) => {
  if (!password || typeof password !== 'string') {
    return { valid: false, message: "Password is required" };
  }
  
  if (!validator.isLength(password, { min: 6, max: 128 })) {
    return { valid: false, message: "Password must be between 6 and 128 characters" };
  }
  
  // Vérifier la complexité minimale
  if (!validator.matches(password, /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)) {
    return { valid: false, message: "Password must contain at least one uppercase letter, one lowercase letter, and one number" };
  }
  
  return { valid: true };
};

// Validation pour l'inscription
const validateRegister = (req, res, next) => {
  const { name, email, password, country, language, major } = req.body;
  
  // Nom
  if (!name || typeof name !== 'string' || name.trim().length < 2) {
    return res.status(400).json({ 
      message: "Name must be at least 2 characters long" 
    });
  }
  
  if (name.length > 50) {
    return res.status(400).json({ 
      message: "Name must be less than 50 characters" 
    });
  }
  
  // Email
  if (!email || !validateEmail(email)) {
    return res.status(400).json({ 
      message: "Valid email is required" 
    });
  }
  
  // Mot de passe
  const passwordValidation = validatePassword(password);
  if (!passwordValidation.valid) {
    return res.status(400).json({ message: passwordValidation.message });
  }
  
  // Pays (optionnel mais si présent, doit être valide)
  if (country && (typeof country !== 'string' || country.length > 50)) {
    return res.status(400).json({ 
      message: "Country must be less than 50 characters" 
    });
  }
  
  // Langue (optionnel mais si présent, doit être valide)
  if (language && (typeof language !== 'string' || language.length > 30)) {
    return res.status(400).json({ 
      message: "Language must be less than 30 characters" 
    });
  }
  
  // Filière (optionnel mais si présent, doit être valide)
  if (major && (typeof major !== 'string' || major.length > 100)) {
    return res.status(400).json({ 
      message: "Major must be less than 100 characters" 
    });
  }
  
  // Nettoyer les entrées
  req.body.name = sanitizeString(name);
  req.body.email = email.toLowerCase().trim();
  req.body.country = country ? sanitizeString(country) : "";
  req.body.language = language ? sanitizeString(language) : "";
  req.body.major = major ? sanitizeString(major) : "";
  
  next();
};

// Validation pour la connexion
const validateLogin = (req, res, next) => {
  const { email, password } = req.body;
  
  if (!email || !validateEmail(email)) {
    return res.status(400).json({ 
      message: "Valid email is required" 
    });
  }
  
  if (!password || typeof password !== 'string') {
    return res.status(400).json({ 
      message: "Password is required" 
    });
  }
  
  req.body.email = email.toLowerCase().trim();
  
  next();
};

// Validation pour la mise à jour du profil avec sécurité renforcée
const validateProfileUpdate = (req, res, next) => {
  const allowedFields = ['name', 'country', 'language', 'major', 'interests', 'bio', 'avatar'];
  const updates = {};
  
  for (const field of allowedFields) {
    if (req.body[field] !== undefined) {
      switch (field) {
        case 'name':
          if (typeof req.body[field] !== 'string' || !validator.isLength(req.body[field], { min: 2, max: 50 })) {
            return res.status(400).json({ 
              message: "Name must be between 2 and 50 characters" 
            });
          }
          updates[field] = sanitizeString(req.body[field]);
          break;
          
        case 'country':
        case 'language':
          if (req.body[field] && (typeof req.body[field] !== 'string' || !validator.isLength(req.body[field], { max: 50 }))) {
            return res.status(400).json({ 
              message: `${field} must be less than 50 characters` 
            });
          }
          updates[field] = req.body[field] ? sanitizeString(req.body[field]) : "";
          break;
          
        case 'major':
          if (req.body[field] && (typeof req.body[field] !== 'string' || !validator.isLength(req.body[field], { max: 100 }))) {
            return res.status(400).json({ 
              message: "Major must be less than 100 characters" 
            });
          }
          updates[field] = req.body[field] ? sanitizeString(req.body[field]) : "";
          break;
          
        case 'interests':
          if (!Array.isArray(req.body[field])) {
            return res.status(400).json({ 
              message: "Interests must be an array" 
            });
          }
          if (req.body[field].length > 20) {
            return res.status(400).json({ 
              message: "Too many interests (max 20)" 
            });
          }
          updates[field] = req.body[field].map(interest => sanitizeString(interest)).filter(Boolean);
          break;
          
        case 'bio':
          if (req.body[field] && (typeof req.body[field] !== 'string' || !validator.isLength(req.body[field], { max: 500 }))) {
            return res.status(400).json({ 
              message: "Bio must be less than 500 characters" 
            });
          }
          updates[field] = req.body[field] ? sanitizeString(req.body[field]) : "";
          break;
          
        case 'avatar':
          if (req.body[field] && (typeof req.body[field] !== 'string' || !validator.isLength(req.body[field], { max: 500 }))) {
            return res.status(400).json({ 
              message: "Avatar URL must be less than 500 characters" 
            });
          }
          // Validation supplémentaire pour les URLs
          if (req.body[field] && !validator.isURL(req.body[field])) {
            return res.status(400).json({ 
              message: "Avatar must be a valid URL" 
            });
          }
          updates[field] = req.body[field] || "";
          break;
      }
    }
  }
  
  if (Object.keys(updates).length === 0) {
    return res.status(400).json({ message: "No valid fields to update" });
  }
  
  req.body.updates = updates;
  next();
};

// Validation pour les messages
const validateMessage = (req, res, next) => {
  const { text } = req.body;
  
  if (!text || typeof text !== 'string') {
    return res.status(400).json({ 
      message: "Message text is required" 
    });
  }
  
  if (text.trim().length === 0) {
    return res.status(400).json({ 
      message: "Message cannot be empty" 
    });
  }
  
  if (text.length > 1000) {
    return res.status(400).json({ 
      message: "Message must be less than 1000 characters" 
    });
  }
  
  req.body.text = sanitizeString(text);
  
  next();
};

// Validation pour le chat IA
const validateAIChat = (req, res, next) => {
  const { message } = req.body;
  
  if (!message || typeof message !== 'string') {
    return res.status(400).json({ 
      message: "Message is required" 
    });
  }
  
  if (message.trim().length === 0) {
    return res.status(400).json({ 
      message: "Message cannot be empty" 
    });
  }
  
  if (message.length > 2000) {
    return res.status(400).json({ 
      message: "Message must be less than 2000 characters" 
    });
  }
  
  req.body.message = sanitizeString(message);
  
  next();
};

module.exports = {
  validateRegister,
  validateLogin,
  validateProfileUpdate,
  validateMessage,
  validateAIChat,
};
