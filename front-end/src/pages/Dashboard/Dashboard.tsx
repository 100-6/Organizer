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
  FormTextarea,
  TeamManagementModal,
  InviteMemberModal
} from '../../components'
import InvitationsPanel from '../../components/InvitationsPanel'
import WorkspaceCard from './components/WorkspaceCard'
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
  const [filteredWorkspaces, setFilteredWorkspaces] = useState<Workspace[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showRenameModal, setShowRenameModal] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [showTeamModal, setShowTeamModal] = useState(false)
  const [showInviteModal, setShowInviteModal] = useState(false)
  const [selectedWorkspace, setSelectedWorkspace] = useState<Workspace | null>(null)
  const [newWorkspace, setNewWorkspace] = useState({ name: '', description: '' })
  const [renameData, setRenameData] = useState({ name: '', description: '' })
  const [isCreating, setIsCreating] = useState(false)
  const [isRenaming, setIsRenaming] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const navigate = useNavigate()

  useEffect(() => {
    fetchWorkspaces()
  }, [])

  useEffect(() => {
    if (searchQuery.trim()) {
      const filtered = workspaces.filter(workspace =>
        workspace.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        workspace.description?.toLowerCase().includes(searchQuery.toLowerCase())
      )
      setFilteredWorkspaces(filtered)
    } else {
      setFilteredWorkspaces(workspaces)
    }
  }, [searchQuery, workspaces])

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
        setFilteredWorkspaces(data.workspaces)
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

  const handleRenameWorkspace = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedWorkspace) return
    
    setIsRenaming(true)
    
    try {
      const token = localStorage.getItem('accessToken')
      const response = await fetch(`/api/workspaces/${selectedWorkspace.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(renameData)
      })

      if (response.ok) {
        setShowRenameModal(false)
        setSelectedWorkspace(null)
        setRenameData({ name: '', description: '' })
        fetchWorkspaces()
      } else {
        const data = await response.json()
        setError(data.error || 'Erreur lors de la modification')
      }
    } catch (err) {
      setError('Erreur de connexion')
    } finally {
      setIsRenaming(false)
    }
  }

  const handleDeleteWorkspace = async () => {
    if (!selectedWorkspace) return
    
    setIsDeleting(true)
    
    try {
      const token = localStorage.getItem('accessToken')
      const response = await fetch(`/api/workspaces/${selectedWorkspace.id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (response.ok) {
        setShowDeleteModal(false)
        setSelectedWorkspace(null)
        fetchWorkspaces()
      } else {
        const data = await response.json()
        setError(data.error || 'Erreur lors de la suppression')
      }
    } catch (err) {
      setError('Erreur de connexion')
    } finally {
      setIsDeleting(false)
    }
  }

  const handleLogout = () => {
    logout()
    navigate('/')
  }

  const handleWorkspaceAction = (action: string, workspaceId: number) => {
    const workspace = workspaces.find(w => w.id === workspaceId)
    if (!workspace) return

    switch (action) {
      case 'open':
        navigate(`/workspace/${workspaceId}`)
        break
      case 'rename':
        setSelectedWorkspace(workspace)
        setRenameData({ 
          name: workspace.name, 
          description: workspace.description || '' 
        })
        setShowRenameModal(true)
        break
      case 'addMember':
        setSelectedWorkspace(workspace)
        setShowInviteModal(true)
        break
      case 'settings':
        console.log(`Paramètres du workspace ${workspaceId}`)
        // TODO: Implémenter page de paramètres
        break
      case 'delete':
        setSelectedWorkspace(workspace)
        setShowDeleteModal(true)
        break
      case 'teamAccess':
        setSelectedWorkspace(workspace)
        setShowTeamModal(true)
        break
    }
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
          </div>

          <div className="dashboard-controls">
            <div className="search-container">
              <svg className="search-icon" width="20" height="20" viewBox="0 0 24 24" fill="none">
                <circle cx="11" cy="11" r="8" stroke="#6b7280" strokeWidth="2"/>
                <path d="m21 21-4.35-4.35" stroke="#6b7280" strokeWidth="2" strokeLinecap="round"/>
              </svg>
              <input
                type="text"
                placeholder="Rechercher dans vos projets..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="search-input"
              />
            </div>
            <Button 
              variant="primary" 
              onClick={() => setShowCreateModal(true)}
              className="create-button"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                <path d="M12 5v14m-7-7h14" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
              </svg>
              Créer
            </Button>
          </div>

          {error && (
            <AlertMessage 
              type="error" 
              message={error} 
              onClose={() => setError('')}
            />
          )}

          <InvitationsPanel onInvitationHandled={fetchWorkspaces} />

          <div className="workspaces-grid">
            {filteredWorkspaces.length === 0 ? (
              <div className="empty-state">
                <div className="empty-icon">📋</div>
                <h3>
                  {searchQuery ? 'Aucun workspace trouvé' : 'Aucun workspace'}
                </h3>
                <p>
                  {searchQuery 
                    ? 'Essayez de modifier votre recherche'
                    : 'Créez votre premier workspace pour commencer à organiser vos tâches'
                  }
                </p>
                {!searchQuery && (
                  <Button variant="primary" onClick={() => setShowCreateModal(true)}>
                    Créer un workspace
                  </Button>
                )}
              </div>
            ) : (
              filteredWorkspaces.map(workspace => (
                <WorkspaceCard
                  key={workspace.id}
                  workspace={workspace}
                  color="#10b981" // Couleur par défaut, sera remplacée par la couleur du workspace
                  onOpen={() => handleWorkspaceAction('open', workspace.id)}
                  onRename={() => handleWorkspaceAction('rename', workspace.id)}
                  onAddMember={() => handleWorkspaceAction('addMember', workspace.id)}
                  onSettings={() => handleWorkspaceAction('settings', workspace.id)}
                  onDelete={() => handleWorkspaceAction('delete', workspace.id)}
                  onTeamAccess={() => handleWorkspaceAction('teamAccess', workspace.id)}
                />
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

      <Modal
        isOpen={showRenameModal}
        onClose={() => {
          setShowRenameModal(false)
          setSelectedWorkspace(null)
          setRenameData({ name: '', description: '' })
        }}
        title="Modifier le workspace"
      >
        <form onSubmit={handleRenameWorkspace} className="workspace-form">
          <FormInput
            label="Nom du workspace"
            type="text"
            id="rename-name"
            name="name"
            value={renameData.name}
            onChange={(e) => setRenameData(prev => ({ ...prev, name: e.target.value }))}
            placeholder="Nom du workspace"
            required
          />
          
          <FormTextarea
            label="Description (optionnelle)"
            id="rename-description"
            name="description"
            value={renameData.description}
            onChange={(e) => setRenameData(prev => ({ ...prev, description: e.target.value }))}
            placeholder="Décrivez votre workspace..."
            rows={3}
          />
          
          <div className="modal-actions">
            <Button 
              type="button" 
              variant="secondary" 
              onClick={() => {
                setShowRenameModal(false)
                setSelectedWorkspace(null)
                setRenameData({ name: '', description: '' })
              }}
            >
              Annuler
            </Button>
            <Button 
              type="submit" 
              variant="primary"
              disabled={isRenaming}
            >
              {isRenaming ? 'Modification...' : 'Modifier'}
            </Button>
          </div>
        </form>
      </Modal>

      <Modal
        isOpen={showDeleteModal}
        onClose={() => {
          setShowDeleteModal(false)
          setSelectedWorkspace(null)
        }}
        title="Supprimer le workspace"
      >
        <div className="delete-confirmation">
          <div className="delete-warning">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" className="warning-icon">
              <circle cx="12" cy="12" r="10" stroke="#dc2626" strokeWidth="2"/>
              <line x1="12" y1="8" x2="12" y2="12" stroke="#dc2626" strokeWidth="2"/>
              <line x1="12" y1="16" x2="12.01" y2="16" stroke="#dc2626" strokeWidth="2"/>
            </svg>
            <h3>Êtes-vous sûr ?</h3>
            <p>
              Vous êtes sur le point de supprimer le workspace <strong>"{selectedWorkspace?.name}"</strong>.
              Cette action est irréversible et supprimera toutes les données associées.
            </p>
          </div>
          
          <div className="modal-actions">
            <Button 
              type="button" 
              variant="secondary" 
              onClick={() => {
                setShowDeleteModal(false)
                setSelectedWorkspace(null)
              }}
            >
              Annuler
            </Button>
            <Button 
              variant="danger"
              onClick={handleDeleteWorkspace}
              disabled={isDeleting}
            >
              {isDeleting ? 'Suppression...' : 'Supprimer définitivement'}
            </Button>
          </div>
        </div>
      </Modal>

      {selectedWorkspace && (
        <>
          <TeamManagementModal
            isOpen={showTeamModal}
            onClose={() => {
              setShowTeamModal(false)
              setSelectedWorkspace(null)
            }}
            workspaceId={selectedWorkspace.id.toString()}
            workspaceName={selectedWorkspace.name}
            currentUserRole={selectedWorkspace.role}
          />
          
          <InviteMemberModal
            isOpen={showInviteModal}
            onClose={() => {
              setShowInviteModal(false)
              setSelectedWorkspace(null)
            }}
            workspaceId={selectedWorkspace.id.toString()}
            onInviteSent={() => {
              setShowInviteModal(false)
              setSelectedWorkspace(null)
            }}
          />
        </>
      )}
    </div>
  )
}

export default Dashboard