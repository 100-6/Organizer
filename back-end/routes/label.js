const express = require('express');
const router = express.Router();
const {
    createLabel,
    getWorkspaceLabels,
    updateLabel,
    deleteLabel
} = require('../controllers/labelController');
const { authenticateToken } = require('../middleware/auth');
const {
    validateLabelCreation,
    validateLabelUpdate
} = require('../middleware/validation');

router.post('/', authenticateToken, validateLabelCreation, createLabel);
router.get('/workspace/:workspaceId', authenticateToken, getWorkspaceLabels);
router.put('/:id', authenticateToken, validateLabelUpdate, updateLabel);
router.delete('/:id', authenticateToken, deleteLabel);

module.exports = router;