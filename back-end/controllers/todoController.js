const pool = require('../config/database');

const createTodo = async (req, res) => {
    try {
        const { title, description, listId, assignedTo, dueDate, dueTime, position = 0 } = req.body;
        const userId = req.user.id;

        const listResult = await pool.query(
            'SELECT workspace_id FROM lists WHERE id = $1',
            [listId]
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

        if (assignedTo) {
            const assignedMemberCheck = await pool.query(
                'SELECT role FROM workspace_members WHERE workspace_id = $1 AND user_id = $2',
                [listResult.rows[0].workspace_id, assignedTo]
            );

            if (assignedMemberCheck.rows.length === 0) {
                return res.status(400).json({
                    error: 'L\'utilisateur assigné n\'est pas membre du workspace'
                });
            }
        }

        const result = await pool.query(
            'INSERT INTO todos (title, description, list_id, assigned_to, due_date, due_time, position) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *',
            [title, description || null, listId, assignedTo || null, dueDate || null, dueTime || null, position]
        );

        const todoResult = await pool.query(`
            SELECT 
                t.*,
                u.username as assigned_username
            FROM todos t
            LEFT JOIN users u ON t.assigned_to = u.id
            WHERE t.id = $1
        `, [result.rows[0].id]);

        res.status(201).json({
            message: 'Todo créé avec succès',
            todo: todoResult.rows[0]
        });

    } catch (error) {
        console.error('Erreur lors de la création du todo:', error);
        res.status(500).json({
            error: 'Erreur interne du serveur'
        });
    }
};

const getListTodos = async (req, res) => {
    try {
        const { listId } = req.params;
        const userId = req.user.id;

        if (isNaN(listId)) {
            return res.status(400).json({
                error: 'ID liste invalide'
            });
        }

        const listResult = await pool.query(
            'SELECT workspace_id FROM lists WHERE id = $1',
            [listId]
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

        const result = await pool.query(`
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
        `, [listId]);

        res.json({
            todos: result.rows
        });

    } catch (error) {
        console.error('Erreur lors de la récupération des todos:', error);
        res.status(500).json({
            error: 'Erreur interne du serveur'
        });
    }
};

const getTodoById = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.id;

        if (isNaN(id)) {
            return res.status(400).json({
                error: 'ID todo invalide'
            });
        }

        const todoResult = await pool.query(`
            SELECT 
                t.*,
                u.username as assigned_username,
                l.name as list_name,
                l.workspace_id
            FROM todos t
            LEFT JOIN users u ON t.assigned_to = u.id
            JOIN lists l ON t.list_id = l.id
            WHERE t.id = $1
        `, [id]);

        if (todoResult.rows.length === 0) {
            return res.status(404).json({
                error: 'Todo introuvable'
            });
        }

        const todo = todoResult.rows[0];

        const memberCheck = await pool.query(
            'SELECT role FROM workspace_members WHERE workspace_id = $1 AND user_id = $2',
            [todo.workspace_id, userId]
        );

        if (memberCheck.rows.length === 0) {
            return res.status(403).json({
                error: 'Accès refusé à ce todo'
            });
        }

        const checklistResult = await pool.query(`
            SELECT id, title, is_completed, position, created_at
            FROM checklist_items
            WHERE todo_id = $1
            ORDER BY position ASC, created_at ASC
        `, [id]);

        const labelsResult = await pool.query(`
            SELECT l.id, l.name, l.color
            FROM labels l
            JOIN todo_labels tl ON l.id = tl.label_id
            WHERE tl.todo_id = $1
        `, [id]);

        todo.checklist_items = checklistResult.rows;
        todo.labels = labelsResult.rows;

        res.json({
            todo
        });

    } catch (error) {
        console.error('Erreur lors de la récupération du todo:', error);
        res.status(500).json({
            error: 'Erreur interne du serveur'
        });
    }
};

const updateTodo = async (req, res) => {
    try {
        const { id } = req.params;
        const { title, description, assignedTo, dueDate, dueTime, position } = req.body;
        const userId = req.user.id;

        if (isNaN(id)) {
            return res.status(400).json({
                error: 'ID todo invalide'
            });
        }

        const todoResult = await pool.query(`
            SELECT t.*, l.workspace_id
            FROM todos t
            JOIN lists l ON t.list_id = l.id
            WHERE t.id = $1
        `, [id]);

        if (todoResult.rows.length === 0) {
            return res.status(404).json({
                error: 'Todo introuvable'
            });
        }

        const todo = todoResult.rows[0];

        const memberCheck = await pool.query(
            'SELECT role FROM workspace_members WHERE workspace_id = $1 AND user_id = $2',
            [todo.workspace_id, userId]
        );

        if (memberCheck.rows.length === 0) {
            return res.status(403).json({
                error: 'Accès refusé à ce todo'
            });
        }

        if (assignedTo) {
            const assignedMemberCheck = await pool.query(
                'SELECT role FROM workspace_members WHERE workspace_id = $1 AND user_id = $2',
                [todo.workspace_id, assignedTo]
            );

            if (assignedMemberCheck.rows.length === 0) {
                return res.status(400).json({
                    error: 'L\'utilisateur assigné n\'est pas membre du workspace'
                });
            }
        }

        const updates = [];
        const values = [];
        let paramCount = 1;

        if (title) {
            updates.push(`title = $${paramCount}`);
            values.push(title);
            paramCount++;
        }

        if (description !== undefined) {
            updates.push(`description = $${paramCount}`);
            values.push(description);
            paramCount++;
        }

        if (assignedTo !== undefined) {
            updates.push(`assigned_to = $${paramCount}`);
            values.push(assignedTo);
            paramCount++;
        }

        if (dueDate !== undefined) {
            updates.push(`due_date = $${paramCount}`);
            values.push(dueDate);
            paramCount++;
        }

        if (dueTime !== undefined) {
            updates.push(`due_time = $${paramCount}`);
            values.push(dueTime);
            paramCount++;
        }

        if (position !== undefined) {
            updates.push(`position = $${paramCount}`);
            values.push(position);
            paramCount++;
        }

        if (updates.length === 0) {
            return res.status(400).json({
                error: 'Au moins un champ doit être fourni pour la mise à jour'
            });
        }

        values.push(id);

        const result = await pool.query(
            `UPDATE todos SET ${updates.join(', ')} WHERE id = $${paramCount} RETURNING *`,
            values
        );

        const updatedTodoResult = await pool.query(`
            SELECT 
                t.*,
                u.username as assigned_username
            FROM todos t
            LEFT JOIN users u ON t.assigned_to = u.id
            WHERE t.id = $1
        `, [id]);

        res.json({
            message: 'Todo mis à jour avec succès',
            todo: updatedTodoResult.rows[0]
        });

    } catch (error) {
        console.error('Erreur lors de la mise à jour du todo:', error);
        res.status(500).json({
            error: 'Erreur interne du serveur'
        });
    }
};

const deleteTodo = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.id;

        if (isNaN(id)) {
            return res.status(400).json({
                error: 'ID todo invalide'
            });
        }

        const todoResult = await pool.query(`
            SELECT l.workspace_id
            FROM todos t
            JOIN lists l ON t.list_id = l.id
            WHERE t.id = $1
        `, [id]);

        if (todoResult.rows.length === 0) {
            return res.status(404).json({
                error: 'Todo introuvable'
            });
        }

        const memberCheck = await pool.query(
            'SELECT role FROM workspace_members WHERE workspace_id = $1 AND user_id = $2',
            [todoResult.rows[0].workspace_id, userId]
        );

        if (memberCheck.rows.length === 0) {
            return res.status(403).json({
                error: 'Accès refusé à ce todo'
            });
        }

        await pool.query('DELETE FROM todos WHERE id = $1', [id]);

        res.json({
            message: 'Todo supprimé avec succès'
        });

    } catch (error) {
        console.error('Erreur lors de la suppression du todo:', error);
        res.status(500).json({
            error: 'Erreur interne du serveur'
        });
    }
};

const moveTodo = async (req, res) => {
    try {
        const { id } = req.params;
        const { listId, position } = req.body;
        const userId = req.user.id;

        if (isNaN(id) || isNaN(listId)) {
            return res.status(400).json({
                error: 'IDs invalides'
            });
        }

        const todoResult = await pool.query(`
            SELECT t.*, l.workspace_id as current_workspace_id
            FROM todos t
            JOIN lists l ON t.list_id = l.id
            WHERE t.id = $1
        `, [id]);

        if (todoResult.rows.length === 0) {
            return res.status(404).json({
                error: 'Todo introuvable'
            });
        }

        const targetListResult = await pool.query(
            'SELECT workspace_id FROM lists WHERE id = $1',
            [listId]
        );

        if (targetListResult.rows.length === 0) {
            return res.status(404).json({
                error: 'Liste de destination introuvable'
            });
        }

        if (todoResult.rows[0].current_workspace_id !== targetListResult.rows[0].workspace_id) {
            return res.status(400).json({
                error: 'Le todo ne peut être déplacé que dans le même workspace'
            });
        }

        const memberCheck = await pool.query(
            'SELECT role FROM workspace_members WHERE workspace_id = $1 AND user_id = $2',
            [todoResult.rows[0].current_workspace_id, userId]
        );

        if (memberCheck.rows.length === 0) {
            return res.status(403).json({
                error: 'Accès refusé'
            });
        }

        const updates = ['list_id = $1'];
        const values = [listId];
        let paramCount = 2;

        if (position !== undefined) {
            updates.push(`position = $${paramCount}`);
            values.push(position);
            paramCount++;
        }

        values.push(id);

        const result = await pool.query(
            `UPDATE todos SET ${updates.join(', ')} WHERE id = $${paramCount} RETURNING *`,
            values
        );

        const movedTodoResult = await pool.query(`
            SELECT 
                t.*,
                u.username as assigned_username
            FROM todos t
            LEFT JOIN users u ON t.assigned_to = u.id
            WHERE t.id = $1
        `, [id]);

        res.json({
            message: 'Todo déplacé avec succès',
            todo: movedTodoResult.rows[0]
        });

    } catch (error) {
        console.error('Erreur lors du déplacement du todo:', error);
        res.status(500).json({
            error: 'Erreur interne du serveur'
        });
    }
};

const updateTodosPositions = async (req, res) => {
    const client = await pool.connect();
    try {
        await client.query('BEGIN');

        const { todos } = req.body;
        const userId = req.user.id;

        if (!Array.isArray(todos) || todos.length === 0) {
            return res.status(400).json({
                error: 'Un tableau de todos avec leurs positions est requis'
            });
        }

        const firstTodoId = todos[0].id;
        const workspaceResult = await client.query(`
            SELECT l.workspace_id
            FROM todos t
            JOIN lists l ON t.list_id = l.id
            WHERE t.id = $1
        `, [firstTodoId]);

        if (workspaceResult.rows.length === 0) {
            return res.status(404).json({
                error: 'Todo introuvable'
            });
        }

        const memberCheck = await client.query(
            'SELECT role FROM workspace_members WHERE workspace_id = $1 AND user_id = $2',
            [workspaceResult.rows[0].workspace_id, userId]
        );

        if (memberCheck.rows.length === 0) {
            return res.status(403).json({
                error: 'Accès refusé'
            });
        }

        for (let i = 0; i < todos.length; i++) {
            const { id, position, listId } = todos[i];
            if (isNaN(id) || position === undefined) {
                throw new Error(`Données invalides pour le todo ${id}`);
            }

            const updates = ['position = $1'];
            const values = [position];
            let paramCount = 2;

            if (listId) {
                updates.push(`list_id = $${paramCount}`);
                values.push(listId);
                paramCount++;
            }

            values.push(id);

            await client.query(
                `UPDATE todos SET ${updates.join(', ')} WHERE id = $${paramCount}`,
                values
            );
        }

        await client.query('COMMIT');

        res.json({
            message: 'Positions des todos mises à jour avec succès'
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
    createTodo,
    getListTodos,
    getTodoById,
    updateTodo,
    deleteTodo,
    moveTodo,
    updateTodosPositions
};
