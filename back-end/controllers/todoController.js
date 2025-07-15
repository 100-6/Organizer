const pool = require('../config/database');

const createTodo = async (req, res) => {
    const client = await pool.connect();
    try {
        const { title, description, listId, assignedTo, dueDate, dueTime, position = 0, labels } = req.body;
        const userId = req.user.id;
        const io = req.app.get('io');
        await client.query('BEGIN');

        const listResult = await client.query(
            'SELECT workspace_id FROM lists WHERE id = $1',
            [listId]
        );

        if (listResult.rows.length === 0) {
            await client.query('ROLLBACK');
            return res.status(404).json({ error: 'Liste introuvable' });
        }

        const memberCheck = await client.query(
            'SELECT role FROM workspace_members WHERE workspace_id = $1 AND user_id = $2',
            [listResult.rows[0].workspace_id, userId]
        );

        if (memberCheck.rows.length === 0) {
            await client.query('ROLLBACK');
            return res.status(403).json({ error: 'Accès refusé à cette liste' });
        }

        if (assignedTo) {
            const assignedMemberCheck = await client.query(
                'SELECT role FROM workspace_members WHERE workspace_id = $1 AND user_id = $2',
                [listResult.rows[0].workspace_id, assignedTo]
            );

            if (assignedMemberCheck.rows.length === 0) {
                await client.query('ROLLBACK');
                return res.status(400).json({ error: 'L\'utilisateur assigné n\'est pas membre du workspace' });
            }
        }

        const result = await client.query(
            'INSERT INTO todos (title, description, list_id, assigned_to, due_date, due_time, position) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *',
            [title, description || null, listId, assignedTo || null, dueDate || null, dueTime || null, position]
        );
        const todoId = result.rows[0].id;

        // Associer les labels si fournis
        if (Array.isArray(labels) && labels.length > 0) {
            for (let i = 0; i < labels.length; i++) {
                const labelId = labels[i];
                await client.query(
                    'INSERT INTO todo_labels (todo_id, label_id, assigned_order) VALUES ($1, $2, $3) ON CONFLICT (todo_id, label_id) DO UPDATE SET assigned_order = $3',
                    [todoId, labelId, i + 1]
                );
            }
        }

        // Récupérer la todo avec les labels associés
        const todoResult = await client.query(`
            SELECT 
                t.*,
                u.username as assigned_username
            FROM todos t
            LEFT JOIN users u ON t.assigned_to = u.id
            WHERE t.id = $1
        `, [todoId]);
        const todo = todoResult.rows[0];
        const labelsResult = await client.query(`
            SELECT l.id, l.name, l.color
            FROM labels l
            JOIN todo_labels tl ON l.id = tl.label_id
            WHERE tl.todo_id = $1
            ORDER BY tl.assigned_order ASC, tl.assigned_at ASC
        `, [todoId]);
        todo.labels = labelsResult.rows;

        await client.query('COMMIT');
        
        // Emit socket event
        if (io) {
            io.emitToWorkspace(listResult.rows[0].workspace_id, 'todo:created', todo);
        }
        
        res.status(201).json({
            message: 'Todo créé avec succès',
            todo
        });
    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Erreur lors de la création du todo:', error);
        res.status(500).json({ error: 'Erreur interne du serveur' });
    } finally {
        client.release();
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

        const todos = result.rows;

        // Pour chaque todo, on va chercher ses labels associés et les assignations multiples
        for (const todo of todos) {
            const labelsResult = await pool.query(`
                SELECT l.id, l.name, l.color
                FROM labels l
                JOIN todo_labels tl ON l.id = tl.label_id
                WHERE tl.todo_id = $1
                ORDER BY tl.assigned_order ASC, tl.assigned_at ASC
            `, [todo.id]);
            todo.labels = labelsResult.rows;

            // Récupérer les assignations multiples
            const assignmentsResult = await pool.query(`
                SELECT u.id, u.username, u.email, 'member' as role, ta.assigned_at as joined_at
                FROM users u
                JOIN todo_assignments ta ON u.id = ta.user_id
                WHERE ta.todo_id = $1
                ORDER BY ta.assigned_at ASC
            `, [todo.id]);
            todo.assigned_members = assignmentsResult.rows;
        }

        res.json({
            todos
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
            ORDER BY tl.assigned_order ASC, tl.assigned_at ASC
        `, [id]);

        // Récupérer les assignations multiples
        const assignmentsResult = await pool.query(`
            SELECT u.id, u.username, u.email, 'member' as role, ta.assigned_at as joined_at
            FROM users u
            JOIN todo_assignments ta ON u.id = ta.user_id
            WHERE ta.todo_id = $1
            ORDER BY ta.assigned_at ASC
        `, [id]);

        todo.checklist_items = checklistResult.rows;
        todo.labels = labelsResult.rows;
        todo.assigned_members = assignmentsResult.rows;

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
        const io = req.app.get('io');
        
        console.log('=== Todo Update Backend Debug ===');
        console.log('Request body:', req.body);
        console.log('Extracted assignedTo:', assignedTo);
        console.log('typeof assignedTo:', typeof assignedTo);

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
            console.log('Added assignedTo to updates:', assignedTo);
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

        console.log('Updates array:', updates);
        console.log('Values array:', values);
        
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

        const updatedTodo = updatedTodoResult.rows[0];
        
        // Emit socket event
        if (io) {
            io.emitToWorkspace(todo.workspace_id, 'todo:updated', updatedTodo);
        }

        res.json({
            message: 'Todo mis à jour avec succès',
            todo: updatedTodo
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
        const io = req.app.get('io');

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

        await pool.query('DELETE FROM todos WHERE id = $1', [id]);

        // Emit socket event
        if (io) {
            io.emitToWorkspace(todo.workspace_id, 'todo:deleted', {
                id: parseInt(id),
                list_id: todo.list_id
            });
        }

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
        const io = req.app.get('io');

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
                u.username as assigned_username,
                COUNT(ci.id) as checklist_count,
                COUNT(CASE WHEN ci.is_completed = true THEN 1 END) as completed_checklist_count
            FROM todos t
            LEFT JOIN users u ON t.assigned_to = u.id
            LEFT JOIN checklist_items ci ON t.id = ci.todo_id
            WHERE t.id = $1
            GROUP BY t.id, u.username
        `, [id]);

        const movedTodo = movedTodoResult.rows[0];
        
        // Récupérer les labels associés
        const labelsResult = await pool.query(`
            SELECT l.id, l.name, l.color
            FROM labels l
            JOIN todo_labels tl ON l.id = tl.label_id
            WHERE tl.todo_id = $1
            ORDER BY tl.assigned_order ASC, tl.assigned_at ASC
        `, [id]);
        movedTodo.labels = labelsResult.rows;

        // Récupérer les assignations multiples
        const assignmentsResult = await pool.query(`
            SELECT u.id, u.username, u.email, 'member' as role, ta.assigned_at as joined_at
            FROM users u
            JOIN todo_assignments ta ON u.id = ta.user_id
            WHERE ta.todo_id = $1
            ORDER BY ta.assigned_at ASC
        `, [id]);
        movedTodo.assigned_members = assignmentsResult.rows;
        
        // Emit socket event
        if (io) {
            io.emitToWorkspace(todoResult.rows[0].current_workspace_id, 'todo:moved', {
                id: parseInt(id),
                fromListId: todoResult.rows[0].list_id,
                toListId: parseInt(listId),
                todo: movedTodo
            });
        }

        res.json({
            message: 'Todo déplacé avec succès',
            todo: movedTodo
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

const addLabelToTodo = async (req, res) => {
    const client = await pool.connect()
    try {
      const { todoId } = req.params
      const { labelId } = req.body
      const userId = req.user.id
      const io = req.app.get('io')
  
      if (isNaN(todoId) || isNaN(labelId)) {
        return res.status(400).json({
          error: 'IDs invalides'
        })
      }
  
      await client.query('BEGIN')
  
      const todoResult = await client.query(`
        SELECT t.*, l.workspace_id
        FROM todos t
        JOIN lists l ON t.list_id = l.id
        WHERE t.id = $1
      `, [todoId])
  
      if (todoResult.rows.length === 0) {
        await client.query('ROLLBACK')
        return res.status(404).json({
          error: 'Todo introuvable'
        })
      }
  
      const todo = todoResult.rows[0]
  
      const memberCheck = await client.query(
        'SELECT role FROM workspace_members WHERE workspace_id = $1 AND user_id = $2',
        [todo.workspace_id, userId]
      )
  
      if (memberCheck.rows.length === 0) {
        await client.query('ROLLBACK')
        return res.status(403).json({
          error: 'Accès refusé'
        })
      }
  
      const labelResult = await client.query(
        'SELECT workspace_id FROM labels WHERE id = $1',
        [labelId]
      )
  
      if (labelResult.rows.length === 0) {
        await client.query('ROLLBACK')
        return res.status(404).json({
          error: 'Label introuvable'
        })
      }
  
      if (labelResult.rows[0].workspace_id !== todo.workspace_id) {
        await client.query('ROLLBACK')
        return res.status(400).json({
          error: 'Le label doit appartenir au même workspace que la todo'
        })
      }
  
      // Obtenir le prochain ordre d'assignation
      const orderResult = await client.query(
        'SELECT COALESCE(MAX(assigned_order), 0) + 1 as next_order FROM todo_labels WHERE todo_id = $1',
        [todoId]
      )
      const nextOrder = orderResult.rows[0].next_order

      await client.query(
        'INSERT INTO todo_labels (todo_id, label_id, assigned_order) VALUES ($1, $2, $3) ON CONFLICT (todo_id, label_id) DO UPDATE SET assigned_order = $3',
        [todoId, labelId, nextOrder]
      )
  
      await client.query('COMMIT')
      
      // Emit socket event
      if (io) {
        io.emitToWorkspace(todo.workspace_id, 'todo:label-added', { todoId, labelId });
      }
  
      res.json({
        message: 'Label associé à la todo avec succès'
      })
  
    } catch (error) {
      await client.query('ROLLBACK')
      console.error('Erreur lors de l\'association du label:', error)
      res.status(500).json({
        error: 'Erreur interne du serveur'
      })
    } finally {
      client.release()
    }
  }
  
  const removeLabelFromTodo = async (req, res) => {
    const client = await pool.connect()
    try {
      const { todoId, labelId } = req.params
      const userId = req.user.id
      const io = req.app.get('io')
  
      if (isNaN(todoId) || isNaN(labelId)) {
        return res.status(400).json({
          error: 'IDs invalides'
        })
      }
  
      await client.query('BEGIN')
  
      const todoResult = await client.query(`
        SELECT t.*, l.workspace_id
        FROM todos t
        JOIN lists l ON t.list_id = l.id
        WHERE t.id = $1
      `, [todoId])
  
      if (todoResult.rows.length === 0) {
        await client.query('ROLLBACK')
        return res.status(404).json({
          error: 'Todo introuvable'
        })
      }
  
      const todo = todoResult.rows[0]
  
      const memberCheck = await client.query(
        'SELECT role FROM workspace_members WHERE workspace_id = $1 AND user_id = $2',
        [todo.workspace_id, userId]
      )
  
      if (memberCheck.rows.length === 0) {
        await client.query('ROLLBACK')
        return res.status(403).json({
          error: 'Accès refusé'
        })
      }
  
      const result = await client.query(
        'DELETE FROM todo_labels WHERE todo_id = $1 AND label_id = $2',
        [todoId, labelId]
      )
  
      if (result.rowCount === 0) {
        await client.query('ROLLBACK')
        return res.status(404).json({
          error: 'Association label-todo introuvable'
        })
      }
  
      await client.query('COMMIT')
  
      // Émettre l'événement Socket.io
      io.emitToWorkspace(todo.workspace_id, 'todo:label-removed', { todoId: parseInt(todoId), labelId: parseInt(labelId) });
  
      res.json({
        message: 'Label retiré de la todo avec succès'
      })
  
    } catch (error) {
      await client.query('ROLLBACK')
      console.error('Erreur lors de la suppression du label:', error)
      res.status(500).json({
        error: 'Erreur interne du serveur'
      })
    } finally {
      client.release()
    }
  }

// =============================================
// FONCTIONS CHECKLIST
// =============================================

const createChecklistItem = async (req, res) => {
    try {
        const { todoId } = req.params;
        const { title, position = 0 } = req.body;
        const userId = req.user.id;
        const io = req.app.get('io');

        if (isNaN(todoId)) {
            return res.status(400).json({ error: 'ID todo invalide' });
        }

        if (!title || title.trim() === '') {
            return res.status(400).json({ error: 'Le titre est requis' });
        }

        // Vérifier l'accès au todo
        const todoResult = await pool.query(`
            SELECT t.*, l.workspace_id
            FROM todos t
            JOIN lists l ON t.list_id = l.id
            WHERE t.id = $1
        `, [todoId]);

        if (todoResult.rows.length === 0) {
            return res.status(404).json({ error: 'Todo introuvable' });
        }

        const todo = todoResult.rows[0];

        const memberCheck = await pool.query(
            'SELECT role FROM workspace_members WHERE workspace_id = $1 AND user_id = $2',
            [todo.workspace_id, userId]
        );

        if (memberCheck.rows.length === 0) {
            return res.status(403).json({ error: 'Accès refusé' });
        }

        const result = await pool.query(
            'INSERT INTO checklist_items (title, todo_id, position) VALUES ($1, $2, $3) RETURNING *',
            [title.trim(), todoId, position]
        );

        const checklistItem = result.rows[0];
        
        // Récupérer les compteurs mis à jour
        const countResult = await pool.query(`
            SELECT 
                COUNT(*) as checklist_count,
                COUNT(CASE WHEN is_completed = true THEN 1 END) as completed_checklist_count
            FROM checklist_items WHERE todo_id = $1
        `, [todoId]);
        
        const counts = countResult.rows[0];
        
        // Emit socket event
        if (io) {
            io.emitToWorkspace(todo.workspace_id, 'todo:checklist-item-created', {
                todoId: parseInt(todoId),
                checklistItem,
                checklist_count: parseInt(counts.checklist_count),
                completed_checklist_count: parseInt(counts.completed_checklist_count)
            });
        }

        res.status(201).json({
            message: 'Élément de checklist créé avec succès',
            checklistItem
        });
    } catch (error) {
        console.error('Erreur lors de la création de l\'élément de checklist:', error);
        res.status(500).json({ error: 'Erreur interne du serveur' });
    }
};

const updateChecklistItem = async (req, res) => {
    try {
        const { todoId, itemId } = req.params;
        const { title, is_completed } = req.body;
        const userId = req.user.id;
        const io = req.app.get('io');

        if (isNaN(todoId) || isNaN(itemId)) {
            return res.status(400).json({ error: 'IDs invalides' });
        }

        // Vérifier l'accès au todo
        const todoResult = await pool.query(`
            SELECT t.*, l.workspace_id
            FROM todos t
            JOIN lists l ON t.list_id = l.id
            WHERE t.id = $1
        `, [todoId]);

        if (todoResult.rows.length === 0) {
            return res.status(404).json({ error: 'Todo introuvable' });
        }

        const todo = todoResult.rows[0];

        const memberCheck = await pool.query(
            'SELECT role FROM workspace_members WHERE workspace_id = $1 AND user_id = $2',
            [todo.workspace_id, userId]
        );

        if (memberCheck.rows.length === 0) {
            return res.status(403).json({ error: 'Accès refusé' });
        }

        // Vérifier que l'élément appartient bien à ce todo
        const itemCheck = await pool.query(
            'SELECT id FROM checklist_items WHERE id = $1 AND todo_id = $2',
            [itemId, todoId]
        );

        if (itemCheck.rows.length === 0) {
            return res.status(404).json({ error: 'Élément de checklist introuvable' });
        }

        const updates = [];
        const values = [];
        let paramCount = 1;

        if (title !== undefined) {
            updates.push(`title = $${paramCount}`);
            values.push(title.trim());
            paramCount++;
        }

        if (is_completed !== undefined) {
            updates.push(`is_completed = $${paramCount}`);
            values.push(is_completed);
            paramCount++;
        }

        if (updates.length === 0) {
            return res.status(400).json({ error: 'Au moins un champ doit être fourni' });
        }

        values.push(itemId);

        const result = await pool.query(
            `UPDATE checklist_items SET ${updates.join(', ')} WHERE id = $${paramCount} RETURNING *`,
            values
        );

        // Récupérer les compteurs mis à jour
        const countResult = await pool.query(`
            SELECT 
                COUNT(*) as checklist_count,
                COUNT(CASE WHEN is_completed = true THEN 1 END) as completed_checklist_count
            FROM checklist_items WHERE todo_id = $1
        `, [todoId]);
        
        const counts = countResult.rows[0];
        
        // Émettre l'événement Socket.io
        io.emitToWorkspace(todo.workspace_id, 'todo:checklist-item-updated', {
            todoId: parseInt(todoId),
            checklistItem: result.rows[0],
            checklist_count: parseInt(counts.checklist_count),
            completed_checklist_count: parseInt(counts.completed_checklist_count)
        });

        res.json({
            message: 'Élément de checklist mis à jour avec succès',
            checklistItem: result.rows[0]
        });
    } catch (error) {
        console.error('Erreur lors de la mise à jour de l\'élément de checklist:', error);
        res.status(500).json({ error: 'Erreur interne du serveur' });
    }
};

const deleteChecklistItem = async (req, res) => {
    try {
        const { todoId, itemId } = req.params;
        const userId = req.user.id;
        const io = req.app.get('io');

        if (isNaN(todoId) || isNaN(itemId)) {
            return res.status(400).json({ error: 'IDs invalides' });
        }

        // Vérifier l'accès au todo
        const todoResult = await pool.query(`
            SELECT t.*, l.workspace_id
            FROM todos t
            JOIN lists l ON t.list_id = l.id
            WHERE t.id = $1
        `, [todoId]);

        if (todoResult.rows.length === 0) {
            return res.status(404).json({ error: 'Todo introuvable' });
        }

        const todo = todoResult.rows[0];

        const memberCheck = await pool.query(
            'SELECT role FROM workspace_members WHERE workspace_id = $1 AND user_id = $2',
            [todo.workspace_id, userId]
        );

        if (memberCheck.rows.length === 0) {
            return res.status(403).json({ error: 'Accès refusé' });
        }

        const result = await pool.query(
            'DELETE FROM checklist_items WHERE id = $1 AND todo_id = $2',
            [itemId, todoId]
        );

        if (result.rowCount === 0) {
            return res.status(404).json({ error: 'Élément de checklist introuvable' });
        }

        // Récupérer les compteurs mis à jour
        const countResult = await pool.query(`
            SELECT 
                COUNT(*) as checklist_count,
                COUNT(CASE WHEN is_completed = true THEN 1 END) as completed_checklist_count
            FROM checklist_items WHERE todo_id = $1
        `, [todoId]);
        
        const counts = countResult.rows[0];
        
        // Émettre l'événement Socket.io
        io.emitToWorkspace(todo.workspace_id, 'todo:checklist-item-deleted', {
            todoId: parseInt(todoId),
            itemId: parseInt(itemId),
            checklist_count: parseInt(counts.checklist_count),
            completed_checklist_count: parseInt(counts.completed_checklist_count)
        });

        res.json({ message: 'Élément de checklist supprimé avec succès' });
    } catch (error) {
        console.error('Erreur lors de la suppression de l\'élément de checklist:', error);
        res.status(500).json({ error: 'Erreur interne du serveur' });
    }
};

const deleteAllChecklistItems = async (req, res) => {
    try {
        const { todoId } = req.params;
        const userId = req.user.id;

        if (isNaN(todoId)) {
            return res.status(400).json({ error: 'ID todo invalide' });
        }

        // Vérifier l'accès au todo
        const todoResult = await pool.query(`
            SELECT t.*, l.workspace_id
            FROM todos t
            JOIN lists l ON t.list_id = l.id
            WHERE t.id = $1
        `, [todoId]);

        if (todoResult.rows.length === 0) {
            return res.status(404).json({ error: 'Todo introuvable' });
        }

        const todo = todoResult.rows[0];

        const memberCheck = await pool.query(
            'SELECT role FROM workspace_members WHERE workspace_id = $1 AND user_id = $2',
            [todo.workspace_id, userId]
        );

        if (memberCheck.rows.length === 0) {
            return res.status(403).json({ error: 'Accès refusé' });
        }

        const result = await pool.query(
            'DELETE FROM checklist_items WHERE todo_id = $1',
            [todoId]
        );

        res.json({ 
            message: `${result.rowCount} éléments de checklist supprimés avec succès`
        });
    } catch (error) {
        console.error('Erreur lors de la suppression de la checklist:', error);
        res.status(500).json({ error: 'Erreur interne du serveur' });
    }
};

// =============================================
// FONCTIONS ASSIGNMENTS MULTIPLES
// =============================================

const addTodoAssignment = async (req, res) => {
    try {
        const { todoId } = req.params;
        const { userId: assignedUserId } = req.body;
        const requestUserId = req.user.id;
        const io = req.app.get('io');

        if (isNaN(todoId) || isNaN(assignedUserId)) {
            return res.status(400).json({ error: 'IDs invalides' });
        }

        // Vérifier l'accès au todo
        const todoResult = await pool.query(`
            SELECT t.*, l.workspace_id
            FROM todos t
            JOIN lists l ON t.list_id = l.id
            WHERE t.id = $1
        `, [todoId]);

        if (todoResult.rows.length === 0) {
            return res.status(404).json({ error: 'Todo introuvable' });
        }

        const todo = todoResult.rows[0];

        // Vérifier que l'utilisateur qui fait la requête est membre du workspace
        const memberCheck = await pool.query(
            'SELECT role FROM workspace_members WHERE workspace_id = $1 AND user_id = $2',
            [todo.workspace_id, requestUserId]
        );

        if (memberCheck.rows.length === 0) {
            return res.status(403).json({ error: 'Accès refusé' });
        }

        // Vérifier que l'utilisateur à assigner est membre du workspace
        const assignedMemberCheck = await pool.query(
            'SELECT role FROM workspace_members WHERE workspace_id = $1 AND user_id = $2',
            [todo.workspace_id, assignedUserId]
        );

        if (assignedMemberCheck.rows.length === 0) {
            return res.status(400).json({ error: 'L\'utilisateur à assigner n\'est pas membre du workspace' });
        }

        // Créer ou mettre à jour l'assignation
        await pool.query(
            'INSERT INTO todo_assignments (todo_id, user_id) VALUES ($1, $2) ON CONFLICT (todo_id, user_id) DO NOTHING',
            [todoId, assignedUserId]
        );

        // Récupérer les infos de l'utilisateur assigné
        const assignedUser = await pool.query(
            'SELECT id, username, email FROM users WHERE id = $1',
            [assignedUserId]
        );

        // Émettre l'événement Socket.io
        io.emitToWorkspace(todo.workspace_id, 'todo:member-assigned', {
            todoId: parseInt(todoId),
            member: assignedUser.rows[0]
        });

        res.json({ message: 'Assignation ajoutée avec succès' });
    } catch (error) {
        console.error('Erreur lors de l\'ajout d\'assignation:', error);
        res.status(500).json({ error: 'Erreur interne du serveur' });
    }
};

const removeTodoAssignment = async (req, res) => {
    try {
        const { todoId, userId: assignedUserId } = req.params;
        const requestUserId = req.user.id;
        const io = req.app.get('io');

        if (isNaN(todoId) || isNaN(assignedUserId)) {
            return res.status(400).json({ error: 'IDs invalides' });
        }

        // Vérifier l'accès au todo
        const todoResult = await pool.query(`
            SELECT t.*, l.workspace_id
            FROM todos t
            JOIN lists l ON t.list_id = l.id
            WHERE t.id = $1
        `, [todoId]);

        if (todoResult.rows.length === 0) {
            return res.status(404).json({ error: 'Todo introuvable' });
        }

        const todo = todoResult.rows[0];

        const memberCheck = await pool.query(
            'SELECT role FROM workspace_members WHERE workspace_id = $1 AND user_id = $2',
            [todo.workspace_id, requestUserId]
        );

        if (memberCheck.rows.length === 0) {
            return res.status(403).json({ error: 'Accès refusé' });
        }

        const result = await pool.query(
            'DELETE FROM todo_assignments WHERE todo_id = $1 AND user_id = $2',
            [todoId, assignedUserId]
        );

        if (result.rowCount === 0) {
            return res.status(404).json({ error: 'Assignation introuvable' });
        }

        // Émettre l'événement Socket.io
        io.emitToWorkspace(todo.workspace_id, 'todo:member-unassigned', {
            todoId: parseInt(todoId),
            memberId: parseInt(assignedUserId)
        });

        res.json({ message: 'Assignation supprimée avec succès' });
    } catch (error) {
        console.error('Erreur lors de la suppression d\'assignation:', error);
        res.status(500).json({ error: 'Erreur interne du serveur' });
    }
};

module.exports = {
    createTodo,
    getListTodos,
    getTodoById,
    updateTodo,
    deleteTodo,
    moveTodo,
    updateTodosPositions,
    addLabelToTodo,
    removeLabelFromTodo,
    createChecklistItem,
    updateChecklistItem,
    deleteChecklistItem,
    deleteAllChecklistItems,
    addTodoAssignment,
    removeTodoAssignment
};
