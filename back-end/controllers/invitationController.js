const pool = require('../config/database');
const crypto = require('crypto');

// Créer une invitation
const createInvitation = async (req, res) => {
  const client = await pool.connect();
  try {
    const { workspaceId } = req.params;
    const { email, role = 'member' } = req.body;
    const invitedBy = req.user.id;

    await client.query('BEGIN');

    // Vérifier que l'utilisateur est owner ou editor du workspace
    const memberCheck = await client.query(`
      SELECT role FROM workspace_members 
      WHERE workspace_id = $1 AND user_id = $2
    `, [workspaceId, invitedBy]);

    if (memberCheck.rows.length === 0 || 
        !['owner', 'editor'].includes(memberCheck.rows[0].role)) {
      await client.query('ROLLBACK');
      return res.status(403).json({
        error: 'Insufficient permissions to invite members'
      });
    }

    // Vérifier que l'utilisateur n'est pas déjà membre
    const existingMember = await client.query(`
      SELECT id FROM workspace_members 
      WHERE workspace_id = $1 AND user_id = (
        SELECT id FROM users WHERE email = $2
      )
    `, [workspaceId, email]);

    if (existingMember.rows.length > 0) {
      await client.query('ROLLBACK');
      return res.status(409).json({
        error: 'User is already a member of this workspace'
      });
    }

    // Vérifier qu'il n'y a pas déjà une invitation en attente
    const existingInvitation = await client.query(`
      SELECT id FROM workspace_invitations 
      WHERE workspace_id = $1 AND email = $2 AND status = 'pending'
    `, [workspaceId, email]);

    if (existingInvitation.rows.length > 0) {
      await client.query('ROLLBACK');
      return res.status(409).json({
        error: 'An invitation is already pending for this email'
      });
    }

    // Générer un token unique
    const token = crypto.randomBytes(32).toString('hex');

    // Créer l'invitation
    const result = await client.query(`
      INSERT INTO workspace_invitations (workspace_id, invited_by, email, role, token)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *
    `, [workspaceId, invitedBy, email, role, token]);

    await client.query('COMMIT');

    // Récupérer les infos complètes de l'invitation
    const invitationData = await client.query(`
      SELECT 
        wi.*,
        w.name as workspace_name,
        u.username as invited_by_username
      FROM workspace_invitations wi
      JOIN workspaces w ON wi.workspace_id = w.id
      JOIN users u ON wi.invited_by = u.id
      WHERE wi.id = $1
    `, [result.rows[0].id]);

    res.status(201).json({
      message: 'Invitation created successfully',
      invitation: invitationData.rows[0]
    });

  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error creating invitation:', error);
    res.status(500).json({
      error: 'Internal server error'
    });
  } finally {
    client.release();
  }
};

// Accepter une invitation
const acceptInvitation = async (req, res) => {
  const client = await pool.connect();
  try {
    const { token } = req.params;
    const userId = req.user.id;

    await client.query('BEGIN');

    // Vérifier l'invitation
    const invitation = await client.query(`
      SELECT * FROM workspace_invitations 
      WHERE token = $1 AND status = 'pending' AND expires_at > NOW()
    `, [token]);

    if (invitation.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({
        error: 'Invalid or expired invitation'
      });
    }

    const inv = invitation.rows[0];

    // Vérifier que l'email correspond à l'utilisateur connecté
    const user = await client.query(`
      SELECT email FROM users WHERE id = $1
    `, [userId]);

    if (user.rows[0].email !== inv.email) {
      await client.query('ROLLBACK');
      return res.status(403).json({
        error: 'This invitation is not for your email address'
      });
    }

    // Vérifier que l'utilisateur n'est pas déjà membre
    const existingMember = await client.query(`
      SELECT id FROM workspace_members 
      WHERE workspace_id = $1 AND user_id = $2
    `, [inv.workspace_id, userId]);

    if (existingMember.rows.length > 0) {
      await client.query('ROLLBACK');
      return res.status(409).json({
        error: 'You are already a member of this workspace'
      });
    }

    // Ajouter l'utilisateur au workspace
    await client.query(`
      INSERT INTO workspace_members (workspace_id, user_id, role)
      VALUES ($1, $2, $3)
    `, [inv.workspace_id, userId, inv.role]);

    // Marquer l'invitation comme acceptée
    await client.query(`
      UPDATE workspace_invitations 
      SET status = 'accepted', accepted_at = NOW(), user_id = $1
      WHERE id = $2
    `, [userId, inv.id]);

    await client.query('COMMIT');

    res.json({
      message: 'Invitation accepted successfully',
      workspace_id: inv.workspace_id,
      role: inv.role
    });

  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error accepting invitation:', error);
    res.status(500).json({
      error: 'Internal server error'
    });
  } finally {
    client.release();
  }
};

// Décliner une invitation
const declineInvitation = async (req, res) => {
  const client = await pool.connect();
  try {
    const { token } = req.params;
    const userId = req.user.id;

    // Vérifier l'invitation
    const invitation = await client.query(`
      SELECT * FROM workspace_invitations 
      WHERE token = $1 AND status = 'pending'
    `, [token]);

    if (invitation.rows.length === 0) {
      return res.status(404).json({
        error: 'Invalid invitation'
      });
    }

    const inv = invitation.rows[0];

    // Vérifier que l'email correspond à l'utilisateur connecté
    const user = await client.query(`
      SELECT email FROM users WHERE id = $1
    `, [userId]);

    if (user.rows[0].email !== inv.email) {
      return res.status(403).json({
        error: 'This invitation is not for your email address'
      });
    }

    // Marquer l'invitation comme déclinée
    await client.query(`
      UPDATE workspace_invitations 
      SET status = 'declined'
      WHERE id = $1
    `, [inv.id]);

    res.json({
      message: 'Invitation declined successfully'
    });

  } catch (error) {
    console.error('Error declining invitation:', error);
    res.status(500).json({
      error: 'Internal server error'
    });
  } finally {
    client.release();
  }
};

// Lister les invitations d'un workspace
const getWorkspaceInvitations = async (req, res) => {
  try {
    const { workspaceId } = req.params;
    const userId = req.user.id;

    // Vérifier les permissions
    const memberCheck = await pool.query(`
      SELECT role FROM workspace_members 
      WHERE workspace_id = $1 AND user_id = $2
    `, [workspaceId, userId]);

    if (memberCheck.rows.length === 0 || 
        !['owner', 'editor'].includes(memberCheck.rows[0].role)) {
      return res.status(403).json({
        error: 'Insufficient permissions to view invitations'
      });
    }

    // Récupérer les invitations
    const invitations = await pool.query(`
      SELECT 
        wi.*,
        u.username as invited_by_username
      FROM workspace_invitations wi
      JOIN users u ON wi.invited_by = u.id
      WHERE wi.workspace_id = $1
      ORDER BY wi.created_at DESC
    `, [workspaceId]);

    res.json({
      invitations: invitations.rows
    });

  } catch (error) {
    console.error('Error getting workspace invitations:', error);
    res.status(500).json({
      error: 'Internal server error'
    });
  }
};

// Lister les invitations reçues par l'utilisateur
const getUserInvitations = async (req, res) => {
  try {
    const userId = req.user.id;

    // Récupérer l'email de l'utilisateur
    const user = await pool.query(`
      SELECT email FROM users WHERE id = $1
    `, [userId]);

    if (user.rows.length === 0) {
      return res.status(404).json({
        error: 'User not found'
      });
    }

    const userEmail = user.rows[0].email;

    // Récupérer les invitations en attente
    const invitations = await pool.query(`
      SELECT 
        wi.*,
        w.name as workspace_name,
        w.description as workspace_description,
        u.username as invited_by_username
      FROM workspace_invitations wi
      JOIN workspaces w ON wi.workspace_id = w.id
      JOIN users u ON wi.invited_by = u.id
      WHERE wi.email = $1 AND wi.status = 'pending' AND wi.expires_at > NOW()
      ORDER BY wi.created_at DESC
    `, [userEmail]);

    res.json({
      invitations: invitations.rows
    });

  } catch (error) {
    console.error('Error getting user invitations:', error);
    res.status(500).json({
      error: 'Internal server error'
    });
  }
};

// Annuler une invitation
const cancelInvitation = async (req, res) => {
  try {
    const { invitationId } = req.params;
    const userId = req.user.id;

    // Vérifier que l'utilisateur peut annuler cette invitation
    const invitation = await pool.query(`
      SELECT wi.*, wm.role as user_role
      FROM workspace_invitations wi
      JOIN workspace_members wm ON wi.workspace_id = wm.workspace_id
      WHERE wi.id = $1 AND wm.user_id = $2
    `, [invitationId, userId]);

    if (invitation.rows.length === 0 || 
        !['owner', 'editor'].includes(invitation.rows[0].user_role)) {
      return res.status(403).json({
        error: 'Insufficient permissions to cancel this invitation'
      });
    }

    // Supprimer l'invitation
    await pool.query(`
      DELETE FROM workspace_invitations WHERE id = $1
    `, [invitationId]);

    res.json({
      message: 'Invitation cancelled successfully'
    });

  } catch (error) {
    console.error('Error cancelling invitation:', error);
    res.status(500).json({
      error: 'Internal server error'
    });
  }
};

module.exports = {
  createInvitation,
  acceptInvitation,
  declineInvitation,
  getWorkspaceInvitations,
  getUserInvitations,
  cancelInvitation
};