import { Link } from 'react-router-dom'
import { Button, Avatar } from '../../../components'
import './WorkspaceHeader.css'

interface Workspace {
  id: number
  name: string
  description: string
  created_at: string
  owner_id: number
  members: Member[]
  user_role: string
}

interface Member {
  id: number
  username: string
  email: string
  role: string
  joined_at: string
}

interface WorkspaceHeaderProps {
  workspace: Workspace
  onAddMember: () => void
  onSettings: () => void
  onManageLabels: () => void
}

const WorkspaceHeader = ({
  workspace,
  onAddMember,
  onSettings
}: WorkspaceHeaderProps) => {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    })
  }

  return (
    <header className="workspace-header">
      <div className="workspace-header-content">
        <div className="workspace-header-left">
          <div className="workspace-breadcrumb">
            <Link to="/dashboard" className="breadcrumb-link">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                <path d="M19 12H5m7-7l-7 7 7 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              Dashboard
            </Link>
            <span className="breadcrumb-separator">/</span>
            <span className="breadcrumb-current">{workspace.name}</span>
          </div>

          <div className="workspace-info">
            <h1 className="workspace-title">{workspace.name}</h1>
            {workspace.description && (
              <p className="workspace-description">{workspace.description}</p>
            )}
            <div className="workspace-meta">
              <span className="workspace-created">
                Créé le {formatDate(workspace.created_at)}
              </span>
              <span className="workspace-members-count">
                {workspace.members.length} membre{workspace.members.length > 1 ? 's' : ''}
              </span>
            </div>
          </div>
        </div>

        <div className="workspace-header-right">
          <div className="workspace-members">
            {workspace.members.slice(0, 5).map(member => (
              <div key={member.id} className="member-avatar-container">
                <Avatar
                  name={member.username}
                  size="small"
                />
                <div className="member-tooltip">
                  <span className="member-name">{member.username}</span>
                  <span className="member-role">{member.role}</span>
                </div>
              </div>
            ))}
            {workspace.members.length > 5 && (
              <div className="members-overflow">
                <span>+{workspace.members.length - 5}</span>
              </div>
            )}
          </div>

          <div className="workspace-actions">
            <Button
              variant="secondary"
              size="small"
              onClick={onAddMember}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                <path d="M16 21v-2a4 4 0 00-4-4H6a4 4 0 00-4 4v2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                <circle cx="9" cy="7" r="4" stroke="currentColor" strokeWidth="2" />
                <path d="M22 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              Inviter
            </Button>

            <Button
              variant="secondary"
              size="small"
              onClick={onSettings}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                <path d="M12 15a3 3 0 100-6 3 3 0 000 6z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-2 2 2 2 0 01-2-2v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83 0 2 2 0 010-2.83l.06-.06a1.65 1.65 0 00.33-1.82 1.65 1.65 0 00-1.51-1H3a2 2 0 01-2-2 2 2 0 012-2h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 010-2.83 2 2 0 012.83 0l.06.06a1.65 1.65 0 001.82.33H9a1.65 1.65 0 001-1.51V3a2 2 0 012-2 2 2 0 012 2v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 0 2 2 0 010 2.83l-.06.06a1.65 1.65 0 00-.33 1.82V9a1.65 1.65 0 001.51 1H21a2 2 0 012 2 2 2 0 01-2 2h-.09a1.65 1.65 0 00-1.51 1z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              Paramètres
            </Button>
          </div>
        </div>
      </div>
    </header>
  )
}

export default WorkspaceHeader