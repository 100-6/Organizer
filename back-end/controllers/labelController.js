const pool = require('../config/database');

const createLabel = async (req, res) => {
    try {
        const { name, color, workspaceId } = req.body;
        const userId = req.user.id;

        const memberCheck = await pool.query(
            'SELECT role FROM workspace_members WHERE workspace_id = $1 AND user_id = $2',
            [workspaceId, userId]
        );

        if (memberCheck.rows.length === 0) {
            return res.status(403).json({
                error: 'Accès refusé à ce workspace'
            });
        }

        const result = await pool.query(
            'INSERT INTO labels (name, color, workspace_id) VALUES ($1, $2, $3) RETURNING *',
            [name || null, color, workspaceId]
        );

        res.status(201).json({
            message: 'Label créé avec succès',
            label: result.rows[0]
        });

    } catch (error) {
        console.error('Erreur lors de la création du label:', error);
        if (error.code === '23505') {
            return res.status(409).json({
                error: 'Un label avec ce nom existe déjà dans ce workspace'
            });
        }
        res.status(500).json({
            error: 'Erreur interne du serveur'
        });
    }
};

const getWorkspaceLabels = async (req, res) => {
    try {
        const { workspaceId } = req.params;
        const userId = req.user.id;

        if (isNaN(workspaceId)) {
            return res.status(400).json({
                error: 'ID workspace invalide'
            });
        }

        const memberCheck = await pool.query(
            'SELECT role FROM workspace_members WHERE workspace_id = $1 AND user_id = $2',
            [workspaceId, userId]
        );

        if (memberCheck.rows.length === 0) {
            return res.status(403).json({
                error: 'Accès refusé à ce workspace'
            });
        }

        const result = await pool.query(
            'SELECT * FROM labels WHERE workspace_id = $1 ORDER BY name ASC, created_at ASC',
            [workspaceId]
        );

        res.json({
            labels: result.rows
        });

    } catch (error) {
        console.error('Erreur lors de la récupération des labels:', error);
        res.status(500).json({
            error: 'Erreur interne du serveur'
        });
    }
};

const updateLabel = async (req, res) => {
    try {
        const { id } = req.params;
        const { name, color } = req.body;
        const userId = req.user.id;

        if (isNaN(id)) {
            return res.status(400).json({
                error: 'ID label invalide'
            });
        }

        const labelResult = await pool.query(
            'SELECT workspace_id FROM labels WHERE id = $1',
            [id]
        );

        if (labelResult.rows.length === 0) {
            return res.status(404).json({
                error: 'Label introuvable'
            });
        }

        const memberCheck = await pool.query(
            'SELECT role FROM workspace_members WHERE workspace_id = $1 AND user_id = $2',
            [labelResult.rows[0].workspace_id, userId]
        );

        if (memberCheck.rows.length === 0) {
            return res.status(403).json({
                error: 'Accès refusé à ce label'
            });
        }

        if (!name && !color) {
            return res.status(400).json({
                error: 'Au moins un champ doit être fourni pour la mise à jour'
            });
        }

        const updates = [];
        const values = [];
        let paramCount = 1;

        if (name !== undefined) {
            updates.push(`name = $${paramCount}`);
            values.push(name);
            paramCount++;
        }

        if (color) {
            updates.push(`color = $${paramCount}`);
            values.push(color);
            paramCount++;
        }

        values.push(id);

        const result = await pool.query(
            `UPDATE labels SET ${updates.join(', ')} WHERE id = $${paramCount} RETURNING *`,
            values
        );

        res.json({
            message: 'Label mis à jour avec succès',
            label: result.rows[0]
        });

    } catch (error) {
        console.error('Erreur lors de la mise à jour du label:', error);
        if (error.code === '23505') {
            return res.status(409).json({
                error: 'Un label avec ce nom existe déjà dans ce workspace'
            });
        }
        res.status(500).json({
            error: 'Erreur interne du serveur'
        });
    }
};

const deleteLabel = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.id;

        if (isNaN(id)) {
            return res.status(400).json({
                error: 'ID label invalide'
            });
        }

        const labelResult = await pool.query(
            'SELECT workspace_id FROM labels WHERE id = $1',
            [id]
        );

        if (labelResult.rows.length === 0) {
            return res.status(404).json({
                error: 'Label introuvable'
            });
        }

        const memberCheck = await pool.query(
            'SELECT role FROM workspace_members WHERE workspace_id = $1 AND user_id = $2',
            [labelResult.rows[0].workspace_id, userId]
        );

        if (memberCheck.rows.length === 0) {
            return res.status(403).json({
                error: 'Accès refusé à ce label'
            });
        }

        await pool.query('DELETE FROM labels WHERE id = $1', [id]);

        res.json({
            message: 'Label supprimé avec succès'
        });

    } catch (error) {
        console.error('Erreur lors de la suppression du label:', error);
        res.status(500).json({
            error: 'Erreur interne du serveur'
        });
    }
};

module.exports = {
    createLabel,
    getWorkspaceLabels,
    updateLabel,
    deleteLabel
};