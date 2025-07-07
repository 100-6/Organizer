const bcrypt = require('bcrypt');
const pool = require('../config/database');

const getProfile = async (req, res) => {
    try {
        const result = await pool.query(
            'SELECT id, username, email, created_at FROM users WHERE id = $1',
            [req.user.id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                error: 'Utilisateur introuvable'
            });
        }

        res.json({
            user: result.rows[0]
        });
    } catch (error) {
        console.error('Erreur lors de la récupération du profil:', error);
        res.status(500).json({
            error: 'Erreur interne du serveur'
        });
    }
};

const updateProfile = async (req, res) => {
    try {
        const { username, email } = req.body;
        const userId = req.user.id;

        if (!username && !email) {
            return res.status(400).json({
                error: 'Au moins un champ doit être fourni pour la mise à jour'
            });
        }

        if (email) {
            const emailExists = await pool.query(
                'SELECT id FROM users WHERE email = $1 AND id != $2',
                [email, userId]
            );

            if (emailExists.rows.length > 0) {
                return res.status(409).json({
                    error: 'Cet email est déjà utilisé par un autre utilisateur'
                });
            }
        }

        if (username) {
            const usernameExists = await pool.query(
                'SELECT id FROM users WHERE username = $1 AND id != $2',
                [username, userId]
            );

            if (usernameExists.rows.length > 0) {
                return res.status(409).json({
                    error: 'Ce nom d\'utilisateur est déjà pris'
                });
            }
        }

        const updates = [];
        const values = [];
        let paramCount = 1;

        if (username) {
            updates.push(`username = $${paramCount}`);
            values.push(username);
            paramCount++;
        }

        if (email) {
            updates.push(`email = $${paramCount}`);
            values.push(email);
            paramCount++;
        }

        values.push(userId);

        const result = await pool.query(
            `UPDATE users SET ${updates.join(', ')} WHERE id = $${paramCount} RETURNING id, username, email, created_at`,
            values
        );

        res.json({
            message: 'Profil mis à jour avec succès',
            user: result.rows[0]
        });

    } catch (error) {
        console.error('Erreur lors de la mise à jour du profil:', error);
        res.status(500).json({
            error: 'Erreur interne du serveur'
        });
    }
};

const changePassword = async (req, res) => {
    try {
        const { currentPassword, newPassword } = req.body;
        const userId = req.user.id;

        const userResult = await pool.query(
            'SELECT password_hash FROM users WHERE id = $1',
            [userId]
        );

        if (userResult.rows.length === 0) {
            return res.status(404).json({
                error: 'Utilisateur introuvable'
            });
        }

        const isValidPassword = await bcrypt.compare(currentPassword, userResult.rows[0].password_hash);

        if (!isValidPassword) {
            return res.status(401).json({
                error: 'Mot de passe actuel incorrect'
            });
        }

        const saltRounds = 12;
        const newPasswordHash = await bcrypt.hash(newPassword, saltRounds);

        await pool.query(
            'UPDATE users SET password_hash = $1 WHERE id = $2',
            [newPasswordHash, userId]
        );

        res.json({
            message: 'Mot de passe modifié avec succès'
        });

    } catch (error) {
        console.error('Erreur lors du changement de mot de passe:', error);
        res.status(500).json({
            error: 'Erreur interne du serveur'
        });
    }
};

const deleteAccount = async (req, res) => {
    try {
        const { password } = req.body;
        const userId = req.user.id;

        if (!password) {
            return res.status(400).json({
                error: 'Mot de passe requis pour supprimer le compte'
            });
        }

        const userResult = await pool.query(
            'SELECT password_hash FROM users WHERE id = $1',
            [userId]
        );

        if (userResult.rows.length === 0) {
            return res.status(404).json({
                error: 'Utilisateur introuvable'
            });
        }

        const isValidPassword = await bcrypt.compare(password, userResult.rows[0].password_hash);

        if (!isValidPassword) {
            return res.status(401).json({
                error: 'Mot de passe incorrect'
            });
        }

        await pool.query('DELETE FROM users WHERE id = $1', [userId]);

        res.json({
            message: 'Compte supprimé avec succès'
        });

    } catch (error) {
        console.error('Erreur lors de la suppression du compte:', error);
        res.status(500).json({
            error: 'Erreur interne du serveur'
        });
    }
};

const searchUsers = async (req, res) => {
    try {
        const { query, limit = 10 } = req.query;

        if (!query || query.trim().length < 2) {
            return res.status(400).json({
                error: 'La recherche doit contenir au moins 2 caractères'
            });
        }

        const searchTerm = `%${query.trim()}%`;
        const result = await pool.query(
            'SELECT id, username, email FROM users WHERE (username ILIKE $1 OR email ILIKE $1) AND id != $2 ORDER BY username LIMIT $3',
            [searchTerm, req.user.id, Math.min(parseInt(limit), 50)]
        );

        res.json({
            users: result.rows
        });

    } catch (error) {
        console.error('Erreur lors de la recherche d\'utilisateurs:', error);
        res.status(500).json({
            error: 'Erreur interne du serveur'
        });
    }
};

const getUserById = async (req, res) => {
    try {
        const { id } = req.params;

        if (isNaN(id)) {
            return res.status(400).json({
                error: 'ID utilisateur invalide'
            });
        }

        const result = await pool.query(
            'SELECT id, username, email, created_at FROM users WHERE id = $1',
            [id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                error: 'Utilisateur introuvable'
            });
        }

        res.json({
            user: result.rows[0]
        });

    } catch (error) {
        console.error('Erreur lors de la récupération de l\'utilisateur:', error);
        res.status(500).json({
            error: 'Erreur interne du serveur'
        });
    }
};

module.exports = {
    getProfile,
    updateProfile,
    changePassword,
    deleteAccount,
    searchUsers,
    getUserById
};
