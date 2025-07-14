import React, { useState, useEffect } from 'react'
import './InvitationsPanel.css'

interface Invitation {
  id: number
  workspace_id: number
  workspace_name: string
  workspace_description: string | null
  invited_by_username: string
  role: string
  created_at: string
  token: string
}

interface InvitationsPanelProps {
  onInvitationHandled: () => void
}

const InvitationsPanel: React.FC<InvitationsPanelProps> = ({ onInvitationHandled }) => {
  const [invitations, setInvitations] = useState<Invitation[]>([])
  const [loading, setLoading] = useState(true)
  const [processingId, setProcessingId] = useState<number | null>(null)

  const fetchInvitations = async () => {
    try {
      const token = localStorage.getItem('accessToken')
      const response = await fetch('/api/invitations/user', {
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
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchInvitations()
  }, [])

  const handleInvitation = async (invitationToken: string, action: 'accept' | 'decline', invitationId: number) => {
    setProcessingId(invitationId)
    
    try {
      const token = localStorage.getItem('accessToken')
      const response = await fetch(`/api/invitations/${action}/${invitationToken}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (response.ok) {
        // Retirer l'invitation de la liste
        setInvitations(prev => prev.filter(inv => inv.id !== invitationId))
        onInvitationHandled()
        
        if (action === 'accept') {
          // Optionnel: Rediriger vers le workspace ou afficher un message de succès
          console.log('Invitation accepted successfully')
        }
      } else {
        const errorData = await response.json()
        console.error('Error handling invitation:', errorData.error)
      }
    } catch (error) {
      console.error('Error handling invitation:', error)
    } finally {
      setProcessingId(null)
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    })
  }

  const getRoleDisplayName = (role: string) => {
    switch (role) {
      case 'owner': return 'Propriétaire'
      case 'editor': return 'Éditeur'
      case 'member': return 'Membre'
      case 'viewer': return 'Visualiseur'
      default: return role
    }
  }

  if (loading) {
    return (
      <div className="invitations-panel">
        <div className="invitations-header">
          <h3>Invitations en attente</h3>
        </div>
        <div className="loading-state">
          <div className="loading-spinner"></div>
          <span>Chargement des invitations...</span>
        </div>
      </div>
    )
  }

  if (invitations.length === 0) {
    return null // Ne pas afficher le panel s'il n'y a pas d'invitations
  }

  return (
    <div className="invitations-panel">
      <div className="invitations-header">
        <h3>
          <svg className="invitation-icon" width="20" height="20" viewBox="0 0 24 24" fill="none">
            <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2M12.5 7.5a4 4 0 1 1-8 0 4 4 0 0 1 8 0zM20 8v6M23 11h-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          Invitations en attente ({invitations.length})
        </h3>
      </div>
      
      <div className="invitations-list">
        {invitations.map((invitation) => (
          <div key={invitation.id} className="invitation-card">
            <div className="invitation-info">
              <div className="invitation-workspace">
                <h4>{invitation.workspace_name}</h4>
                {invitation.workspace_description && (
                  <p className="workspace-description">{invitation.workspace_description}</p>
                )}
              </div>
              <div className="invitation-details">
                <span className="invited-by">
                  Invité par <strong>@{invitation.invited_by_username}</strong>
                </span>
                <span className="invitation-role">
                  en tant que <strong>{getRoleDisplayName(invitation.role)}</strong>
                </span>
                <span className="invitation-date">
                  {formatDate(invitation.created_at)}
                </span>
              </div>
            </div>
            
            <div className="invitation-actions">
              <button
                className="btn btn-accept"
                onClick={() => handleInvitation(invitation.token, 'accept', invitation.id)}
                disabled={processingId === invitation.id}
              >
                {processingId === invitation.id ? '...' : 'Accepter'}
              </button>
              <button
                className="btn btn-decline"
                onClick={() => handleInvitation(invitation.token, 'decline', invitation.id)}
                disabled={processingId === invitation.id}
              >
                {processingId === invitation.id ? '...' : 'Décliner'}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default InvitationsPanel