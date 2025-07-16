const express = require('express');
const router = express.Router();
const {
    createList,
    getWorkspaceLists,
    getListById,
    updateList,
    deleteList,
    updateListsPositions
} = require('../controllers/listController');
const { authenticateToken } = require('../middleware/auth');
const {
    validateListCreation,
    validateListUpdate
} = require('../middleware/validation');

router.post('/', authenticateToken, validateListCreation, createList);
router.get('/workspace/:workspaceId', authenticateToken, getWorkspaceLists);
router.put('/positions', authenticateToken, updateListsPositions);
router.get('/:id', authenticateToken, getListById);
router.put('/:id', authenticateToken, validateListUpdate, updateList);
router.delete('/:id', authenticateToken, deleteList);

module.exports = router;
