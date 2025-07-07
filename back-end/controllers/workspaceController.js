const pool = require('../config/database');

const createWorkspace = async (req, res) => {
    const client = await pool.connect();
    try {
        await client.query('BEGIN');
        
        const { name, description } = req.body;
        const ownerId = req.user.id;

        const workspaceResult = await client.query(
            'INSERT INTO workspaces (name, description, owner_id) VALUES ($1, $2, $3) RETURNING *',
            [name, description || null, ownerId]
        );

        const workspace = workspaceResult.rows[0];

        await client.query(
            'INSERT INTO workspace_members (workspace_id, user_id, role) VALUES ($1, $2, $3)',
            [workspace.id, ownerId, 'owner']
        );

        await client.query('COMMIT');

        res.status(201).json({
            message: 'Workspace créé avec succès',
            workspace
        });

    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Erreur lors de la création du workspace:', error);
        res.status(500).json({
            error: 'Erreur interne du serveur'
        });
    } finally {
        client.release();
    }
};

const getUserWorkspaces = async (req, res) => {
    try {
        const userId = req.user.id;

        const result = await pool.query(`
            SELECT 
                w.id,
                w.name,
                w.description,
                w.created_at,
                w.owner_id,
                wm.role,
                u.username as owner_username,
                (SELECT COUNT(*) FROM workspace_members WHERE workspace_id = w.id) as member_count
            FROM workspaces w
            JOIN workspace_members wm ON w.id = wm.workspace_id
            JOIN users u ON w.owner_id = u.id
            WHERE wm.user_id = $1
            ORDER BY w.created_at DESC
        `, [userId]);

        res.json({
            workspaces: result.rows
        });

    } catch (error) {
        console.error('Erreur lors de la récupération des workspaces:', error);
        res.status(500).json({
            error: 'Erreur interne du serveur'
        });
    }
};

const getWorkspaceById = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.id;

        if (isNaN(id)) {
            return res.status(400).json({
                error: 'ID workspace invalide'
            });
        }

        const memberCheck = await pool.query(
            'SELECT role FROM workspace_members WHERE workspace_id = $1 AND user_id = $2',
            [id, userId]
        );

        if (memberCheck.rows.length === 0) {
            return res.status(403).json({
                error: 'Accès refusé à ce workspace'
            });
        }

        const result = await pool.query(`
            SELECT 
                w.id,
                w.name,
                w.description,
                w.created_at,
                w.owner_id,
                u.username as owner_username
            FROM workspaces w
            JOIN users u ON w.owner_id = u.id
            WHERE w.id = $1
        `, [id]);

        if (result.rows.length === 0) {
            return res.status(404).json({
                error: 'Workspace introuvable'
            });
        }

        const membersResult = await pool.query(`
            SELECT 
                u.id,
                u.username,
                u.email,
                wm.role,
                wm.joined_at
            FROM workspace_members wm
            JOIN users u ON wm.user_id = u.id
            WHERE wm.workspace_id = $1
            ORDER BY wm.role DESC, wm.joined_at ASC
        `, [id]);

        const workspace = result.rows[0];
        workspace.members = membersResult.rows;
        workspace.user_role = memberCheck.rows[0].role;

        res.json({
            workspace
        });

    } catch (error) {
        console.error('Erreur lors de la récupération du workspace:', error);
        res.status(500).json({
            error: 'Erreur interne du serveur'
        });
    }
};

const updateWorkspace = async (req, res) => {
    try {
        const { id } = req.params;
        const { name, description } = req.body;
        const userId = req.user.id;

        if (isNaN(id)) {
            return res.status(400).json({
                error: 'ID workspace invalide'
            });
        }

        const roleCheck = await pool.query(
            'SELECT role FROM workspace_members WHERE workspace_id = $1 AND user_id = $2',
            [id, userId]
        );

        if (roleCheck.rows.length === 0 || roleCheck.rows[0].role !== 'owner') {
            return res.status(403).json({
                error: 'Seul le propriétaire peut modifier ce workspace'
            });
        }

        if (!name && !description) {
            return res.status(400).json({
                error: 'Au moins un champ doit être fourni pour la mise à jour'
            });
        }

        const updates = [];
        const values = [];
        let paramCount = 1;

        if (name) {
            updates.push(`name = $${paramCount}`);
            values.push(name);
            paramCount++;
        }

        if (description !== undefined) {
            updates.push(`description = $${paramCount}`);
            values.push(description);
            paramCount++;
        }

        values.push(id);

        const result = await pool.query(
            `UPDATE workspaces SET ${updates.join(', ')} WHERE id = $${paramCount} RETURNING *`,
            values
        );

        res.json({
            message: 'Workspace mis à jour avec succès',
            workspace: result.rows[0]
        });

    } catch (error) {
        console.error('Erreur lors de la mise à jour du workspace:', error);
        res.status(500).json({
            error: 'Erreur interne du serveur'
        });
    }
};

const deleteWorkspace = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.id;

        if (isNaN(id)) {
            return res.status(400).json({
                error: 'ID workspace invalide'
            });
        }

        const ownerCheck = await pool.query(
            'SELECT owner_id FROM workspaces WHERE id = $1',
            [id]
        );

        if (ownerCheck.rows.length === 0) {
            return res.status(404).json({
                error: 'Workspace introuvable'
            });
        }

        if (ownerCheck.rows[0].owner_id !== userId) {
            return res.status(403).json({
                error: 'Seul le propriétaire peut supprimer ce workspace'
            });
        }

        await pool.query('DELETE FROM workspaces WHERE id = $1', [id]);

        res.json({
            message: 'Workspace supprimé avec succès'
        });

    } catch (error) {
        console.error('Erreur lors de la suppression du workspace:', error);
        res.status(500).json({
            error: 'Erreur interne du serveur'
        });
    }
};

const addMember = async (req, res) => {
    try {
        const { id } = req.params;
        const { userId: memberUserId, role = 'member' } = req.body;
        const currentUserId = req.user.id;

        if (isNaN(id) || isNaN(memberUserId)) {
            return res.status(400).json({
                error: 'IDs invalides'
            });
        }

        if (!['owner', 'member'].includes(role)) {
            return res.status(400).json({
                error: 'Rôle invalide'
            });
        }

        const roleCheck = await pool.query(
            'SELECT role FROM workspace_members WHERE workspace_id = $1 AND user_id = $2',
            [id, currentUserId]
        );

        if (roleCheck.rows.length === 0 || roleCheck.rows[0].role !== 'owner') {
            return res.status(403).json({
                error: 'Seul le propriétaire peut ajouter des membres'
            });
        }

        const userExists = await pool.query(
            'SELECT id FROM users WHERE id = $1',
            [memberUserId]
        );

        if (userExists.rows.length === 0) {
            return res.status(404).json({
                error: 'Utilisateur introuvable'
            });
        }

        const memberExists = await pool.query(
            'SELECT id FROM workspace_members WHERE workspace_id = $1 AND user_id = $2',
            [id, memberUserId]
        );

        if (memberExists.rows.length > 0) {
            return res.status(409).json({
                error: 'Cet utilisateur est déjà membre du workspace'
            });
        }

        await pool.query(
            'INSERT INTO workspace_members (workspace_id, user_id, role) VALUES ($1, $2, $3)',
            [id, memberUserId, role]
        );

        const newMember = await pool.query(`
            SELECT 
                u.id,
                u.username,
                u.email,
                wm.role,
                wm.joined_at
            FROM workspace_members wm
            JOIN users u ON wm.user_id = u.id
            WHERE wm.workspace_id = $1 AND wm.user_id = $2
        `, [id, memberUserId]);

        res.status(201).json({
            message: 'Membre ajouté avec succès',
            member: newMember.rows[0]
        });

    } catch (error) {
        console.error('Erreur lors de l\'ajout du membre:', error);
        res.status(500).json({
            error: 'Erreur interne du serveur'
        });
    }
};

const removeMember = async (req, res) => {
    try {
        const { id, memberId } = req.params;
        const currentUserId = req.user.id;

        if (isNaN(id) || isNaN(memberId)) {
            return res.status(400).json({
                error: 'IDs invalides'
            });
        }

        const roleCheck = await pool.query(
            'SELECT role FROM workspace_members WHERE workspace_id = $1 AND user_id = $2',
            [id, currentUserId]
        );

        if (roleCheck.rows.length === 0 || roleCheck.rows[0].role !== 'owner') {
            return res.status(403).json({
                error: 'Seul le propriétaire peut retirer des membres'
            });
        }

        if (parseInt(memberId) === currentUserId) {
            return res.status(400).json({
                error: 'Le propriétaire ne peut pas se retirer lui-même'
            });
        }

        const memberExists = await pool.query(
            'SELECT role FROM workspace_members WHERE workspace_id = $1 AND user_id = $2',
            [id, memberId]
        );

        if (memberExists.rows.length === 0) {
            return res.status(404).json({
                error: 'Membre introuvable dans ce workspace'
            });
        }

        await pool.query(
            'DELETE FROM workspace_members WHERE workspace_id = $1 AND user_id = $2',
            [id, memberId]
        );

        res.json({
            message: 'Membre retiré avec succès'
        });

    } catch (error) {
        console.error('Erreur lors du retrait du membre:', error);
        res.status(500).json({
            error: 'Erreur interne du serveur'
        });
    }
};

const leaveWorkspace = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.id;

        if (isNaN(id)) {
            return res.status(400).json({
                error: 'ID workspace invalide'
            });
        }

        const memberCheck = await pool.query(
            'SELECT role FROM workspace_members WHERE workspace_id = $1 AND user_id = $2',
            [id, userId]
        );

        if (memberCheck.rows.length === 0) {
            return res.status(404).json({
                error: 'Vous n\'êtes pas membre de ce workspace'
            });
        }

        if (memberCheck.rows[0].role === 'owner') {
            return res.status(400).json({
                error: 'Le propriétaire ne peut pas quitter son workspace. Supprimez-le ou transférez la propriété.'
            });
        }

        await pool.query(
            'DELETE FROM workspace_members WHERE workspace_id = $1 AND user_id = $2',
            [id, userId]
        );

        res.json({
            message: 'Vous avez quitté le workspace avec succès'
        });

    } catch (error) {
        console.error('Erreur lors du départ du workspace:', error);
        res.status(500).json({
            error: 'Erreur interne du serveur'
        });
    }
};

module.exports = {
    createWorkspace,
    getUserWorkspaces,
    getWorkspaceById,
    updateWorkspace,
    deleteWorkspace,
    addMember,
    removeMember,
    leaveWorkspace
};
