const jwt = require("jsonwebtoken");

/**
 * Génère un token JWT pour un utilisateur
 * @param {string} userId - ID de l'utilisateur
 * @param {string} email - Email de l'utilisateur (optionnel)
 * @returns {string} Token JWT signé
 */
const generateToken = (userId, email = null, role = "student", name = null) => {
    const payload = { 
        id: userId,
        email: email,
        name: name,
        role: role
    };
    
    return jwt.sign(
        payload,
        process.env.JWT_SECRET,
        { expiresIn: "7d" }
    );
};

module.exports = generateToken;
