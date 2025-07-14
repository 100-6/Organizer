const express = require('express');
const router = express.Router();
const {
  createInvitation,
  acceptInvitation,
  declineInvitation,
  getWorkspaceInvitations,
  getUserInvitations,
  cancelInvitation
} = require('../controllers/invitationController');
const { authenticateToken } = require('../middleware/auth');

// Routes pour les invitations

// Créer une invitation
router.post('/workspace/:workspaceId', authenticateToken, createInvitation);

// Accepter une invitation
router.post('/accept/:token', authenticateToken, acceptInvitation);

// Décliner une invitation
router.post('/decline/:token', authenticateToken, declineInvitation);

// Lister les invitations d'un workspace
router.get('/workspace/:workspaceId', authenticateToken, getWorkspaceInvitations);

// Lister les invitations reçues par l'utilisateur
router.get('/user', authenticateToken, getUserInvitations);

// Annuler une invitation
router.delete('/:invitationId', authenticateToken, cancelInvitation);

module.exports = router;