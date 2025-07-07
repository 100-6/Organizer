const express = require('express');
const router = express.Router();
const {
    createWorkspace,
    getUserWorkspaces,
    getWorkspaceById,
    updateWorkspace,
    deleteWorkspace,
    addMember,
    removeMember,
    leaveWorkspace
} = require('../controllers/workspaceController');
const { authenticateToken } = require('../middleware/auth');
const {
    validateWorkspaceCreation,
    validateWorkspaceUpdate,
    validateMemberAdd
} = require('../middleware/validation');

router.post('/', authenticateToken, validateWorkspaceCreation, createWorkspace);
router.get('/', authenticateToken, getUserWorkspaces);
router.get('/:id', authenticateToken, getWorkspaceById);
router.put('/:id', authenticateToken, validateWorkspaceUpdate, updateWorkspace);
router.delete('/:id', authenticateToken, deleteWorkspace);
router.post('/:id/members', authenticateToken, validateMemberAdd, addMember);
router.delete('/:id/members/:memberId', authenticateToken, removeMember);
router.delete('/:id/leave', authenticateToken, leaveWorkspace);

module.exports = router;