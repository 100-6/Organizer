import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import { 
  LoadingSpinner, 
  AlertMessage, 
  Button, 
  Avatar, 
  Modal, 
  FormInput,
  FormTextarea
} from '../../components'
import './Dashboard.css'

interface Workspace {
  id: number
  name: string
  description: string
  created_at: string
  owner_id: number
  role: string
  owner_username: string
  member_count: number
}

const Dashboard = () => {
  const { user, logout } = useAuth()
  const [workspaces, setWorkspaces] = useState<Workspace[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [newWorkspace, setNewWorkspace] = useState({ name: '', description: '' })
  const [isCreating, setIsCreating] = useState(false)
  const navigate = useNavigate()

  useEffect(() => {
    fetchWorkspaces()
  }, [])

  const fetchWorkspaces = async () => {
    try {
      const token = localStorage.getItem('accessToken')
      const response = await fetch('/api/workspaces', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (response.ok) {
        const data = await response.json()
        setWorkspaces(data.workspaces)
      } else if (response.status === 401) {
        logout()
        navigate('/login')
      } else {
        setError('Erreur lors du chargement des workspaces')
      }
    } catch (err) {
      setError('Erreur de connexion')
    } finally {
      setIsLoading(false)
    }
  }

  const handleCreateWorkspace = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsCreating(true)
    
    try {
      const token = localStorage.getItem('accessToken')
      const response = await fetch('/api/workspaces', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(newWorkspace)
      })

      if (response.ok) {
        setShowCreateModal(false)
        setNewWorkspace({ name: '', description: '' })
        fetchWorkspaces()
      } else {
        const data = await response.json()
        setError(data.error || 'Erreur lors de la création')
      }
    } catch (err) {
      setError('Erreur de connexion')
    } finally {
      setIsCreating(false)
    }
  }

  const handleLogout = () => {
    logout()
    navigate('/')
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    })
  }

  if (isLoading) {
    return <LoadingSpinner message="Chargement des workspaces..." fullScreen />
  }

  return (
    <div className="dashboard-page">
      <header className="dashboard-header">
        <div className="dashboard-header-content">
          <div className="header-left">
            <Link to="/" className="dashboard-logo">Organizer</Link>
            <div className="user-welcome">
              <span>Bonjour, {user?.username}</span>
            </div>
          </div>
          <div className="header-right">
            <Link to="/profile" className="profile-link">
              <Avatar name={user?.username || ''} size="small" />
              <span>Profil</span>
            </Link>
            <Button variant="secondary" size="small" onClick={handleLogout}>
              Déconnexion
            </Button>
          </div>
        </div>
      </header>

      <main className="dashboard-main">
        <div className="dashboard-container">
          <div className="dashboard-hero">
            <h1>Vos Workspaces</h1>
            <p>Organisez vos projets et collaborez avec votre équipe</p>
            <Button variant="primary" onClick={() => setShowCreateModal(true)}>
              + Nouveau Workspace
            </Button>
          </div>

          {error && (
            <AlertMessage 
              type="error" 
              message={error} 
              onClose={() => setError('')}
            />
          )}

          <div className="workspaces-grid">
            {workspaces.length === 0 ? (
              <div className="empty-state">
                <div className="empty-icon">📋</div>
                <h3>Aucun workspace</h3>
                <p>Créez votre premier workspace pour commencer à organiser vos tâches</p>
                <Button variant="primary" onClick={() => setShowCreateModal(true)}>
                  Créer un workspace
                </Button>
              </div>
            ) : (
              workspaces.map(workspace => (
                <div key={workspace.id} className="workspace-card">
                  <div className="workspace-header">
                    <h3>{workspace.name}</h3>
                    <div className={`role-badge ${workspace.role}`}>
                      {workspace.role === 'owner' ? 'Propriétaire' : 'Membre'}
                    </div>
                  </div>
                  {workspace.description && (
                    <p className="workspace-description">{workspace.description}</p>
                  )}
                  <div className="workspace-meta">
                    <div className="workspace-info">
                      <span className="member-count">{workspace.member_count} membre(s)</span>
                      <span className="created-date">Créé le {formatDate(workspace.created_at)}</span>
                    </div>
                    <div className="workspace-actions">
                      <Button 
                        variant="primary" 
                        size="small"
                        onClick={() => navigate(`/workspace/${workspace.id}`)}
                      >
                        Ouvrir
                      </Button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </main>

      <Modal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        title="Nouveau Workspace"
      >
        <form onSubmit={handleCreateWorkspace} className="workspace-form">
          <FormInput
            label="Nom du workspace"
            type="text"
            id="name"
            name="name"
            value={newWorkspace.name}
            onChange={(e) => setNewWorkspace(prev => ({ ...prev, name: e.target.value }))}
            placeholder="Mon nouveau projet"
            required
          />
          
          <FormTextarea
            label="Description (optionnelle)"
            id="description"
            name="description"
            value={newWorkspace.description}
            onChange={(e) => setNewWorkspace(prev => ({ ...prev, description: e.target.value }))}
            placeholder="Décrivez votre workspace..."
            rows={3}
          />
          
          <div className="modal-actions">
            <Button 
              type="button" 
              variant="secondary" 
              onClick={() => setShowCreateModal(false)}
            >
              Annuler
            </Button>
            <Button 
              type="submit" 
              variant="primary"
              disabled={isCreating}
            >
              {isCreating ? 'Création...' : 'Créer'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}

export default Dashboard