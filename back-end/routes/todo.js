const express = require('express');
const router = express.Router();
const {
    createTodo,
    getListTodos,
    getTodoById,
    updateTodo,
    deleteTodo,
    moveTodo,
    updateTodosPositions,
    addLabelToTodo,
    removeLabelFromTodo
} = require('../controllers/todoController');
const { authenticateToken } = require('../middleware/auth');
const {
    validateTodoCreation,
    validateTodoUpdate,
    validateTodoMove
} = require('../middleware/validation');

router.post('/', authenticateToken, validateTodoCreation, createTodo);
router.get('/list/:listId', authenticateToken, getListTodos);
router.get('/:id', authenticateToken, getTodoById);
router.put('/:id', authenticateToken, validateTodoUpdate, updateTodo);
router.delete('/:id', authenticateToken, deleteTodo);
router.patch('/:id/move', authenticateToken, validateTodoMove, moveTodo);
router.patch('/positions', authenticateToken, updateTodosPositions);
router.post('/:todoId/labels', authenticateToken, addLabelToTodo);
router.delete('/:todoId/labels/:labelId', authenticateToken, removeLabelFromTodo);

module.exports = router;