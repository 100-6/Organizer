import React, { useState, useEffect } from 'react'
import './TeamManagementModal.css'

interface Member {
  id: number
  username: string
  email: string
  role: string
  joined_at: string
}

interface Invitation {
  id: number
  email: string
  role: string
  status: string
  created_at: string
  invited_by_username: string
}

interface TeamManagementModalProps {
  isOpen: boolean
  onClose: () => void
  workspaceId: string
  workspaceName: string
  currentUserRole: string
}

const TeamManagementModal: React.FC<TeamManagementModalProps> = ({
  isOpen,
  onClose,
  workspaceId,
  workspaceName,
  currentUserRole
}) => {
  const [members, setMembers] = useState<Member[]>([])
  const [invitations, setInvitations] = useState<Invitation[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')

  const canManageMembers = ['owner', 'editor'].includes(currentUserRole)

  useEffect(() => {
    if (isOpen) {
      fetchMembers()
      if (canManageMembers) {
        fetchInvitations()
      }
    }
  }, [isOpen, workspaceId])

  const fetchMembers = async () => {
    try {
      const token = localStorage.getItem('accessToken')
      const response = await fetch(`/api/workspaces/${workspaceId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (response.ok) {
        const data = await response.json()
        setMembers(data.workspace.members || [])
      }
    } catch (error) {
      console.error('Error fetching members:', error)
    }
  }

  const fetchInvitations = async () => {
    try {
      const token = localStorage.getItem('accessToken')
      const response = await fetch(`/api/invitations/workspace/${workspaceId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (response.ok) {
        const data = await response.json()
        setInvitations(data.invitations || [])
      }
    } catch (error) {
      console.error('Error fetching invitations:', error)
    }
  }

  const handleRoleChange = async (memberId: number, newRole: string) => {
    setIsLoading(true)
    setError('')

    try {
      const token = localStorage.getItem('accessToken')
      const response = await fetch(`/api/workspaces/${workspaceId}/members/${memberId}/role`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ role: newRole })
      })

      const data = await response.json()

      if (response.ok) {
        setMembers(members.map(member => 
          member.id === memberId 
            ? { ...member, role: newRole }
            : member
        ))
      } else {
        setError(data.error || 'Erreur lors de la mise à jour du rôle')
      }
    } catch (error) {
      console.error('Error updating role:', error)
      setError('Erreur réseau. Veuillez réessayer.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleRemoveMember = async (memberId: number) => {
    if (!window.confirm('Êtes-vous sûr de vouloir retirer ce membre ?')) {
      return
    }

    setIsLoading(true)
    setError('')

    try {
      const token = localStorage.getItem('accessToken')
      const response = await fetch(`/api/workspaces/${workspaceId}/members/${memberId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (response.ok) {
        setMembers(members.filter(member => member.id !== memberId))
      } else {
        const data = await response.json()
        setError(data.error || 'Erreur lors de la suppression du membre')
      }
    } catch (error) {
      console.error('Error removing member:', error)
      setError('Erreur réseau. Veuillez réessayer.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleCancelInvitation = async (invitationId: number) => {
    if (!window.confirm('Êtes-vous sûr de vouloir annuler cette invitation ?')) {
      return
    }

    try {
      const token = localStorage.getItem('accessToken')
      const response = await fetch(`/api/invitations/${invitationId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (response.ok) {
        setInvitations(invitations.filter(inv => inv.id !== invitationId))
      }
    } catch (error) {
      console.error('Error cancelling invitation:', error)
    }
  }

  const getRoleBadgeClass = (role: string) => {
    switch (role) {
      case 'owner': return 'role-badge owner'
      case 'editor': return 'role-badge editor'
      case 'member': return 'role-badge member'
      case 'viewer': return 'role-badge viewer'
      default: return 'role-badge'
    }
  }

  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'owner': return 'Propriétaire'
      case 'editor': return 'Éditeur'
      case 'member': return 'Membre'
      case 'viewer': return 'Viewer'
      default: return role
    }
  }

  if (!isOpen) return null

  return (
      <div className="modal-overlay" onClick={onClose}>
        <div className="modal-content team-modal" onClick={(e) => e.stopPropagation()}>
          <div className="modal-header">
            <h2>Équipe - {workspaceName}</h2>
            <button className="modal-close" onClick={onClose}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
              </svg>
            </button>
          </div>

          <div className="team-content">
            {error && (
              <div className="error-message">
                {error}
              </div>
            )}


            <div className="members-section">
              <h3>Membres ({members.length})</h3>
              <div className="members-list">
                {members.map((member) => (
                  <div key={member.id} className="member-item">
                    <div className="member-info">
                      <div className="member-avatar">
                        {member.username.charAt(0).toUpperCase()}
                      </div>
                      <div className="member-details">
                        <div className="member-name">{member.username}</div>
                        <div className="member-email">{member.email}</div>
                      </div>
                    </div>

                    <div className="member-actions">
                      {canManageMembers && member.role !== 'owner' ? (
                        <select
                          value={member.role}
                          onChange={(e) => handleRoleChange(member.id, e.target.value)}
                          disabled={isLoading}
                          className="role-select-small"
                        >
                          <option value="viewer">Viewer</option>
                          <option value="member">Member</option>
                          {currentUserRole === 'owner' && (
                            <option value="editor">Editor</option>
                          )}
                        </select>
                      ) : (
                        <span className={getRoleBadgeClass(member.role)}>
                          {getRoleLabel(member.role)}
                        </span>
                      )}

                      {canManageMembers && member.role !== 'owner' && (
                        <button
                          className="btn-icon btn-danger"
                          onClick={() => handleRemoveMember(member.id)}
                          disabled={isLoading}
                          title="Retirer ce membre"
                        >
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                            <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2"/>
                          </svg>
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {canManageMembers && invitations.length > 0 && (
              <div className="invitations-section">
                <h3>Invitations en attente ({invitations.length})</h3>
                <div className="invitations-list">
                  {invitations.filter(inv => inv.status === 'pending').map((invitation) => (
                    <div key={invitation.id} className="invitation-item">
                      <div className="invitation-info">
                        <div className="invitation-email">{invitation.email}</div>
                        <div className="invitation-details">
                          Invité comme {getRoleLabel(invitation.role)} par {invitation.invited_by_username}
                        </div>
                      </div>

                      <div className="invitation-actions">
                        <span className="invitation-status pending">En attente</span>
                        <button
                          className="btn-icon btn-danger"
                          onClick={() => handleCancelInvitation(invitation.id)}
                          title="Annuler l'invitation"
                        >
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                            <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2"/>
                          </svg>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

  )
}

export default TeamManagementModal