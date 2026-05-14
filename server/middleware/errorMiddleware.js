/**
 * Middleware de gestion des erreurs centralisé
 * Fournit des réponses d'erreur cohérentes et sécurisées
 */
const errorMiddleware = (err, req, res, next) => {
    console.error("ERROR:", {
        message: err.message,
        stack: err.stack,
        url: req.url,
        method: req.method,
        ip: req.ip,
        timestamp: new Date().toISOString()
    });

    // Déterminer le code de statut
    const statusCode = res.statusCode === 200 ? 500 : res.statusCode;

    // Construire la réponse d'erreur
    const errorResponse = {
        success: false,
        message: err.message || "Internal Server Error"
    };

    // Ajouter le stack trace uniquement en développement
    if (process.env.NODE_ENV === "development") {
        errorResponse.stack = err.stack;
        errorResponse.details = {
            url: req.url,
            method: req.method,
            body: req.body,
            params: req.params,
            query: req.query
        };
    }

    // Gérer les erreurs JWT spécifiques
    if (err.name === 'JsonWebTokenError') {
        errorResponse.message = "Invalid token";
        return res.status(401).json(errorResponse);
    }

    if (err.name === 'TokenExpiredError') {
        errorResponse.message = "Token expired";
        return res.status(401).json(errorResponse);
    }

    // Gérer les erreurs de validation
    if (err.name === 'ValidationError') {
        errorResponse.message = "Validation failed";
        return res.status(400).json(errorResponse);
    }

    // Gérer les erreurs de base de données
    if (err.code === 'ENOENT') {
        errorResponse.message = "Resource not found";
        return res.status(404).json(errorResponse);
    }

    res.status(statusCode).json(errorResponse);
};

module.exports = errorMiddleware;
