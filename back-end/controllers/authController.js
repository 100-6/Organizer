const bcrypt = require('bcrypt');
const pool = require('../config/database');
const { generateTokens, verifyRefreshToken } = require('../middleware/auth');

const register = async (req, res) => {
    try {
        const { username, email, password } = req.body;

        if (!username || !email || !password) {
            return res.status(400).json({
                error: 'Tous les champs sont requis'
            });
        }

        if (password.length < 6) {
            return res.status(400).json({
                error: 'Le mot de passe doit contenir au moins 6 caractères'
            });
        }

        const existingUser = await pool.query(
            'SELECT id FROM users WHERE email = $1 OR username = $2',
            [email, username]
        );

        if (existingUser.rows.length > 0) {
            return res.status(409).json({
                error: 'Email ou nom d\'utilisateur déjà utilisé'
            });
        }

        const saltRounds = 12;
        const passwordHash = await bcrypt.hash(password, saltRounds);

        const result = await pool.query(
            'INSERT INTO users (username, email, password_hash) VALUES ($1, $2, $3) RETURNING id, username, email, created_at',
            [username, email, passwordHash]
        );

        const user = result.rows[0];
        const { accessToken, refreshToken } = generateTokens(user.id);

        res.status(201).json({
            message: 'Utilisateur créé avec succès',
            user: {
                id: user.id,
                username: user.username,
                email: user.email,
                created_at: user.created_at
            },
            accessToken,
            refreshToken
        });

    } catch (error) {
        console.error('Erreur lors de l\'inscription:', error);
        res.status(500).json({
            error: 'Erreur interne du serveur'
        });
    }
};

const login = async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({
                error: 'Email et mot de passe requis'
            });
        }

        const result = await pool.query(
            'SELECT id, username, email, password_hash FROM users WHERE email = $1',
            [email]
        );

        if (result.rows.length === 0) {
            return res.status(401).json({
                error: 'Email ou mot de passe incorrect'
            });
        }

        const user = result.rows[0];
        const isValidPassword = await bcrypt.compare(password, user.password_hash);

        if (!isValidPassword) {
            return res.status(401).json({
                error: 'Email ou mot de passe incorrect'
            });
        }

        const { accessToken, refreshToken } = generateTokens(user.id);

        res.json({
            message: 'Connexion réussie',
            user: {
                id: user.id,
                username: user.username,
                email: user.email
            },
            accessToken,
            refreshToken
        });

    } catch (error) {
        console.error('Erreur lors de la connexion:', error);
        res.status(500).json({
            error: 'Erreur interne du serveur'
        });
    }
};

const refreshToken = async (req, res) => {
    try {
        const { refreshToken: token } = req.body;

        if (!token) {
            return res.status(401).json({
                error: 'Refresh token requis'
            });
        }

        const decoded = verifyRefreshToken(token);
        
        const userResult = await pool.query(
            'SELECT id, username, email FROM users WHERE id = $1',
            [decoded.userId]
        );

        if (userResult.rows.length === 0) {
            return res.status(401).json({
                error: 'Utilisateur introuvable'
            });
        }

        const { accessToken, refreshToken: newRefreshToken } = generateTokens(decoded.userId);

        res.json({
            accessToken,
            refreshToken: newRefreshToken
        });

    } catch (error) {
        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({
                error: 'Refresh token expiré'
            });
        }
        if (error.name === 'JsonWebTokenError') {
            return res.status(401).json({
                error: 'Refresh token invalide'
            });
        }
        
        console.error('Erreur lors du refresh:', error);
        res.status(500).json({
            error: 'Erreur interne du serveur'
        });
    }
};

const getProfile = async (req, res) => {
    try {
        res.json({
            user: req.user
        });
    } catch (error) {
        console.error('Erreur lors de la récupération du profil:', error);
        res.status(500).json({
            error: 'Erreur interne du serveur'
        });
    }
};

const logout = async (req, res) => {
    res.json({
        message: 'Déconnexion réussie'
    });
};

module.exports = {
    register,
    login,
    refreshToken,
    getProfile,
    logout
};