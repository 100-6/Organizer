const pool = require('../config/database');

const createList = async (req, res) => {
    try {
        const { name, workspaceId, position = 0 } = req.body;
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
            'INSERT INTO lists (name, workspace_id, position) VALUES ($1, $2, $3) RETURNING *',
            [name, workspaceId, position]
        );

        res.status(201).json({
            message: 'Liste créée avec succès',
            list: result.rows[0]
        });

    } catch (error) {
        console.error('Erreur lors de la création de la liste:', error);
        res.status(500).json({
            error: 'Erreur interne du serveur'
        });
    }
};

const getWorkspaceLists = async (req, res) => {
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

        const result = await pool.query(`
            SELECT 
                l.*,
                COUNT(t.id) as todo_count
            FROM lists l
            LEFT JOIN todos t ON l.id = t.list_id
            WHERE l.workspace_id = $1
            GROUP BY l.id
            ORDER BY l.position ASC, l.created_at ASC
        `, [workspaceId]);

        res.json({
            lists: result.rows
        });

    } catch (error) {
        console.error('Erreur lors de la récupération des listes:', error);
        res.status(500).json({
            error: 'Erreur interne du serveur'
        });
    }
};

const getListById = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.id;

        if (isNaN(id)) {
            return res.status(400).json({
                error: 'ID liste invalide'
            });
        }

        const listResult = await pool.query(`
            SELECT 
                l.*,
                w.name as workspace_name
            FROM lists l
            JOIN workspaces w ON l.workspace_id = w.id
            WHERE l.id = $1
        `, [id]);

        if (listResult.rows.length === 0) {
            return res.status(404).json({
                error: 'Liste introuvable'
            });
        }

        const list = listResult.rows[0];

        const memberCheck = await pool.query(
            'SELECT role FROM workspace_members WHERE workspace_id = $1 AND user_id = $2',
            [list.workspace_id, userId]
        );

        if (memberCheck.rows.length === 0) {
            return res.status(403).json({
                error: 'Accès refusé à cette liste'
            });
        }

        const todosResult = await pool.query(`
            SELECT 
                t.*,
                u.username as assigned_username,
                COUNT(ci.id) as checklist_count,
                COUNT(CASE WHEN ci.is_completed = true THEN 1 END) as completed_checklist_count
            FROM todos t
            LEFT JOIN users u ON t.assigned_to = u.id
            LEFT JOIN checklist_items ci ON t.id = ci.todo_id
            WHERE t.list_id = $1
            GROUP BY t.id, u.username
            ORDER BY t.position ASC, t.created_at ASC
        `, [id]);

        list.todos = todosResult.rows;

        res.json({
            list
        });

    } catch (error) {
        console.error('Erreur lors de la récupération de la liste:', error);
        res.status(500).json({
            error: 'Erreur interne du serveur'
        });
    }
};

const updateList = async (req, res) => {
    try {
        const { id } = req.params;
        const { name, position } = req.body;
        const userId = req.user.id;

        if (isNaN(id)) {
            return res.status(400).json({
                error: 'ID liste invalide'
            });
        }

        const listResult = await pool.query(
            'SELECT workspace_id FROM lists WHERE id = $1',
            [id]
        );

        if (listResult.rows.length === 0) {
            return res.status(404).json({
                error: 'Liste introuvable'
            });
        }

        const memberCheck = await pool.query(
            'SELECT role FROM workspace_members WHERE workspace_id = $1 AND user_id = $2',
            [listResult.rows[0].workspace_id, userId]
        );

        if (memberCheck.rows.length === 0) {
            return res.status(403).json({
                error: 'Accès refusé à cette liste'
            });
        }

        if (!name && position === undefined) {
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

        if (position !== undefined) {
            updates.push(`position = $${paramCount}`);
            values.push(position);
            paramCount++;
        }

        values.push(id);

        const result = await pool.query(
            `UPDATE lists SET ${updates.join(', ')} WHERE id = $${paramCount} RETURNING *`,
            values
        );

        res.json({
            message: 'Liste mise à jour avec succès',
            list: result.rows[0]
        });

    } catch (error) {
        console.error('Erreur lors de la mise à jour de la liste:', error);
        res.status(500).json({
            error: 'Erreur interne du serveur'
        });
    }
};

const deleteList = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.id;

        if (isNaN(id)) {
            return res.status(400).json({
                error: 'ID liste invalide'
            });
        }

        const listResult = await pool.query(
            'SELECT workspace_id FROM lists WHERE id = $1',
            [id]
        );

        if (listResult.rows.length === 0) {
            return res.status(404).json({
                error: 'Liste introuvable'
            });
        }

        const memberCheck = await pool.query(
            'SELECT role FROM workspace_members WHERE workspace_id = $1 AND user_id = $2',
            [listResult.rows[0].workspace_id, userId]
        );

        if (memberCheck.rows.length === 0) {
            return res.status(403).json({
                error: 'Accès refusé à cette liste'
            });
        }

        await pool.query('DELETE FROM lists WHERE id = $1', [id]);

        res.json({
            message: 'Liste supprimée avec succès'
        });

    } catch (error) {
        console.error('Erreur lors de la suppression de la liste:', error);
        res.status(500).json({
            error: 'Erreur interne du serveur'
        });
    }
};

const updateListsPositions = async (req, res) => {
    const client = await pool.connect();
    try {
        await client.query('BEGIN');

        const { lists } = req.body;
        const userId = req.user.id;

        if (!Array.isArray(lists) || lists.length === 0) {
            return res.status(400).json({
                error: 'Un tableau de listes avec leurs positions est requis'
            });
        }

        const firstListId = lists[0].id;
        const workspaceResult = await client.query(
            'SELECT workspace_id FROM lists WHERE id = $1',
            [firstListId]
        );

        if (workspaceResult.rows.length === 0) {
            return res.status(404).json({
                error: 'Liste introuvable'
            });
        }

        const memberCheck = await client.query(
            'SELECT role FROM workspace_members WHERE workspace_id = $1 AND user_id = $2',
            [workspaceResult.rows[0].workspace_id, userId]
        );

        if (memberCheck.rows.length === 0) {
            return res.status(403).json({
                error: 'Accès refusé à ce workspace'
            });
        }

        for (let i = 0; i < lists.length; i++) {
            const { id, position } = lists[i];
            if (isNaN(id) || position === undefined) {
                throw new Error(`Données invalides pour la liste ${id}`);
            }

            await client.query(
                'UPDATE lists SET position = $1 WHERE id = $2',
                [position, id]
            );
        }

        await client.query('COMMIT');

        res.json({
            message: 'Positions des listes mises à jour avec succès'
        });

    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Erreur lors de la mise à jour des positions:', error);
        res.status(500).json({
            error: 'Erreur interne du serveur'
        });
    } finally {
        client.release();
    }
};

module.exports = {
    createList,
    getWorkspaceLists,
    getListById,
    updateList,
    deleteList,
    updateListsPositions
};
