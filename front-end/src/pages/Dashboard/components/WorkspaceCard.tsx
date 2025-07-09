import { useState, useRef, useEffect } from 'react'
import './WorkspaceCard.css'

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

interface WorkspaceCardProps {
  workspace: Workspace
  onOpen: () => void
  onRename: () => void
  onAddMember: () => void
  onSettings: () => void
  onDelete: () => void
  onTeamAccess: () => void
  color?: string
}

const WorkspaceCard = ({ 
  workspace, 
  onOpen, 
  onRename, 
  onAddMember, 
  onSettings, 
  onDelete, 
  onTeamAccess,
  color = '#10b981'
}: WorkspaceCardProps) => {
  const [showMenu, setShowMenu] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'short'
    })
  }

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowMenu(false)
      }
    }

    if (showMenu) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [showMenu])

  return (
    <div className="workspace-card-container">
      <div 
        className="workspace-card-new" 
        onClick={onOpen}
        style={
          {
            '--workspace-color': color,
            '--workspace-color-light': `${color}15`,
            '--workspace-color-medium': `${color}25`
          } as React.CSSProperties
        }
      >
        <div className="workspace-card-header">
          <div className="workspace-card-text">
            <span className="workspace-title">{workspace.name}</span>
          </div>
          <div className="workspace-card-icons">
            <button 
              className="workspace-menu-btn"
              onClick={(e) => {
                e.stopPropagation()
                setShowMenu(!showMenu)
              }}
            >
              <svg 
                width="20" 
                height="20" 
                viewBox="0 0 100 100" 
                className="menu-icon"
              >
                <path 
                  strokeWidth="8" 
                  strokeLinejoin="round" 
                  strokeLinecap="round" 
                  fill="none" 
                  d="M21.9,50h0M50,50h0m28.1,0h0M25.9,50a4,4,0,1,1-4-4A4,4,0,0,1,25.9,50ZM54,50a4,4,0,1,1-4-4A4,4,0,0,1,54,50Zm28.1,0a4,4,0,1,1-4-4A4,4,0,0,1,82.1,50Z"
                />
              </svg>
            </button>
          </div>
        </div>
        
        <div className="workspace-card-footer">
          <div className="workspace-info-row">
            <div className="workspace-meta-item">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <circle cx="9" cy="7" r="4" stroke="currentColor" strokeWidth="2"/>
                <path d="M22 21v-2a4 4 0 0 0-3-3.87" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M16 3.13a4 4 0 0 1 0 7.75" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              <span>{workspace.member_count}</span>
            </div>
            <div className="workspace-meta-item">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2" stroke="currentColor" strokeWidth="2"/>
                <line x1="16" y1="2" x2="16" y2="6" stroke="currentColor" strokeWidth="2"/>
                <line x1="8" y1="2" x2="8" y2="6" stroke="currentColor" strokeWidth="2"/>
                <line x1="3" y1="10" x2="21" y2="10" stroke="currentColor" strokeWidth="2"/>
              </svg>
              <span>{formatDate(workspace.created_at)}</span>
            </div>
          </div>
          {workspace.description && (
            <p className="workspace-description">{workspace.description}</p>
          )}
        </div>
      </div>

      {showMenu && (
        <div className="workspace-menu" ref={menuRef}>
          <ul className="menu-list">
            <li className="menu-element" onClick={onRename}>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="19"
                height="19"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#7e8590"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M21.174 6.812a1 1 0 0 0-3.986-3.987L3.842 16.174a2 2 0 0 0-.5.83l-1.321 4.352a.5.5 0 0 0 .623.622l4.353-1.32a2 2 0 0 0 .83-.497z"></path>
                <path d="m15 5 4 4"></path>
              </svg>
              <p className="menu-label">Renommer</p>
            </li>
            <li className="menu-element" onClick={onAddMember}>
              <svg
                strokeLinejoin="round"
                strokeLinecap="round"
                strokeWidth="2"
                stroke="#7e8590"
                fill="none"
                viewBox="0 0 24 24"
                height="19"
                width="19"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path d="M2 21a8 8 0 0 1 13.292-6"></path>
                <circle r="5" cy="8" cx="10"></circle>
                <path d="M19 16v6"></path>
                <path d="M22 19h-6"></path>
              </svg>
              <p className="menu-label">Ajouter membre</p>
            </li>
          </ul>
          <div className="menu-separator"></div>
          <ul className="menu-list">
            <li className="menu-element" onClick={onSettings}>
              <svg
                strokeLinejoin="round"
                strokeLinecap="round"
                strokeWidth="2"
                stroke="#7e8590"
                fill="none"
                viewBox="0 0 24 24"
                height="19"
                width="19"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"></path>
                <circle r="3" cy="12" cx="12"></circle>
              </svg>
              <p className="menu-label">Paramètres</p>
            </li>
            <li className="menu-element delete" onClick={onDelete}>
              <svg
                strokeLinejoin="round"
                strokeLinecap="round"
                strokeWidth="2"
                stroke="#dc2626"
                fill="none"
                viewBox="0 0 24 24"
                height="19"
                width="19"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path d="M3 6h18"></path>
                <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"></path>
                <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"></path>
                <line y2="17" y1="11" x2="10" x1="10"></line>
                <line y2="17" y1="11" x2="14" x1="14"></line>
              </svg>
              <p className="menu-label">Supprimer</p>
            </li>
          </ul>
          <div className="menu-separator"></div>
          <ul className="menu-list">
            <li className="menu-element team" onClick={onTeamAccess}>
              <svg
                strokeLinejoin="round"
                strokeLinecap="round"
                strokeWidth="2"
                stroke="#10b981"
                fill="none"
                viewBox="0 0 24 24"
                height="19"
                width="19"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path d="M18 21a8 8 0 0 0-16 0"></path>
                <circle r="5" cy="8" cx="10"></circle>
                <path d="M22 20c0-3.37-2-6.5-4-8a5 5 0 0 0-.45-8.3"></path>
              </svg>
              <p className="menu-label">Accès équipe</p>
            </li>
          </ul>
        </div>
      )}
    </div>
  )
}

export default WorkspaceCard