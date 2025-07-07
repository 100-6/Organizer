const errorHandler = (err, req, res, next) => {
    console.error('Error:', err);

    if (err.code === '23505') {
        return res.status(409).json({
            error: 'Violation de contrainte d\'unicité'
        });
    }

    if (err.code === '23503') {
        return res.status(400).json({
            error: 'Référence invalide'
        });
    }

    if (err.code === '23502') {
        return res.status(400).json({
            error: 'Champ requis manquant'
        });
    }

    if (err.name === 'ValidationError') {
        return res.status(400).json({
            error: err.message
        });
    }

    if (err.name === 'TokenExpiredError') {
        return res.status(401).json({
            error: 'Token expiré'
        });
    }

    if (err.name === 'JsonWebTokenError') {
        return res.status(401).json({
            error: 'Token invalide'
        });
    }

    res.status(500).json({
        error: 'Erreur interne du serveur'
    });
};

const notFound = (req, res) => {
    res.status(404).json({
        error: 'Route non trouvée'
    });
};

module.exports = {
    errorHandler,
    notFound
};
