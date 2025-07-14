import React, { useState, useRef, useEffect } from 'react'
import LabelMenu from './LabelMenu'
import Checklist from './Checklist'
import './CardDetailsModal.css'

interface Todo {
  id: number
  title: string
  description: string | null
  list_id: number
  assigned_to: number | null
  assigned_username: string | null
  assigned_members?: Member[]
  due_date: string | null
  due_time: string | null
  position: number
  created_at: string
  checklist_count: number
  completed_checklist_count: number
  labels: Label[]
  checklist_items?: ChecklistItem[]
  workspace_id: number
}

interface ChecklistItem {
  id: number
  title: string
  is_completed: boolean
  todo_id: number
  position: number
  created_at: string
}

interface Label {
  id: number
  name: string | null
  color: string
  workspace_id: number
  created_at: string
}

interface Member {
  id: number
  username: string
  email: string
  role: string
  joined_at: string
}

interface CardDetailsModalProps {
  isOpen: boolean
  onClose: () => void
  todo: Todo | null
  onUpdate: (todoId: number, updates: any) => void
  labels: Label[]
  members: Member[]
  listName: string
  onLabelsUpdated: () => void
  openChecklistByDefault?: boolean
}

const CardDetailsModal: React.FC<CardDetailsModalProps> = ({
  isOpen,
  onClose,
  todo,
  onUpdate,
  labels,
  members,
  listName,
  onLabelsUpdated,
  openChecklistByDefault = false
}) => {
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [showLabelMenu, setShowLabelMenu] = useState(false)
  const [showMemberMenu, setShowMemberMenu] = useState(false)
  const [checklistExpanded, setChecklistExpanded] = useState(false)
  const [currentTodoLabels, setCurrentTodoLabels] = useState<Label[]>([])
  const [currentChecklistItems, setCurrentChecklistItems] = useState<ChecklistItem[]>([])
  const [editingLabel, setEditingLabel] = useState<Label | null>(null)
  const titleRef = useRef<HTMLTextAreaElement>(null)
  const descriptionRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    if (todo && isOpen) {
      setTitle(todo.title)
      setDescription(todo.description || '')
      setCurrentTodoLabels(todo.labels || [])
      setCurrentChecklistItems(todo.checklist_items || [])
      setChecklistExpanded(openChecklistByDefault)
    }
  }, [todo, isOpen, openChecklistByDefault])

  // Sync checklist items when todo changes
  useEffect(() => {
    if (todo) {
      setCurrentChecklistItems(todo.checklist_items || [])
    }
  }, [todo?.checklist_items])

  // Sync labels when they change
  useEffect(() => {
    if (todo) {
      setCurrentTodoLabels(todo.labels || [])
    }
  }, [todo?.labels])

  if (!isOpen || !todo) return null


  const handleTitleChange = (newTitle: string) => {
    setTitle(newTitle)
    if (newTitle.trim() !== todo.title) {
      onUpdate(todo.id, { title: newTitle.trim() })
    }
  }

  const handleDescriptionChange = (newDescription: string) => {
    setDescription(newDescription)
    onUpdate(todo.id, { description: newDescription || null })
  }

  const handleAddLabel = async (labelId: number) => {
    try {
      const token = localStorage.getItem('accessToken')
      const response = await fetch(`/api/todos/${todo.id}/labels`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ labelId })
      })
      
      if (response.ok) {
        const labelToAdd = labels.find(l => l.id === labelId)
        if (labelToAdd) {
          setCurrentTodoLabels(prev => [...prev, labelToAdd])
        }
        onLabelsUpdated()
      }
    } catch (error) {
      console.error('Error adding label:', error)
    }
  }

  const handleRemoveLabel = async (labelId: number) => {
    try {
      const token = localStorage.getItem('accessToken')
      const response = await fetch(`/api/todos/${todo.id}/labels/${labelId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      })
      
      if (response.ok) {
        setCurrentTodoLabels(prev => prev.filter(label => label.id !== labelId))
        onLabelsUpdated()
      }
    } catch (error) {
      console.error('Error removing label:', error)
    }
  }

  const adjustTextareaHeight = (textarea: HTMLTextAreaElement) => {
    textarea.style.height = 'auto'
  }

  const handleAddChecklistItem = async (title: string) => {
    try {
      const token = localStorage.getItem('accessToken')
      const response = await fetch(`/api/todos/${todo.id}/checklist`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ title, position: currentChecklistItems.length })
      })
      
      if (response.ok) {
        const data = await response.json()
        // Immediate update to local state
        setCurrentChecklistItems(prev => [...prev, data.checklistItem])
        onLabelsUpdated() // Refresh the todo data
      }
    } catch (error) {
      console.error('Error adding checklist item:', error)
    }
  }

  const handleToggleChecklistItem = async (itemId: number, completed: boolean) => {
    // Immediate update to local state
    setCurrentChecklistItems(prev => 
      prev.map(item => 
        item.id === itemId ? { ...item, is_completed: completed } : item
      )
    )

    try {
      const token = localStorage.getItem('accessToken')
      const response = await fetch(`/api/todos/${todo.id}/checklist/${itemId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ is_completed: completed })
      })
      
      if (response.ok) {
        onLabelsUpdated() // Refresh the todo data
      } else {
        // Revert on error
        setCurrentChecklistItems(prev => 
          prev.map(item => 
            item.id === itemId ? { ...item, is_completed: !completed } : item
          )
        )
      }
    } catch (error) {
      console.error('Error toggling checklist item:', error)
      // Revert on error
      setCurrentChecklistItems(prev => 
        prev.map(item => 
          item.id === itemId ? { ...item, is_completed: !completed } : item
        )
      )
    }
  }

  const handleUpdateChecklistItem = async (itemId: number, title: string) => {
    // Immediate update to local state
    setCurrentChecklistItems(prev => 
      prev.map(item => 
        item.id === itemId ? { ...item, title } : item
      )
    )

    try {
      const token = localStorage.getItem('accessToken')
      const response = await fetch(`/api/todos/${todo.id}/checklist/${itemId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ title })
      })
      
      if (response.ok) {
        onLabelsUpdated() // Refresh the todo data
      }
    } catch (error) {
      console.error('Error updating checklist item:', error)
    }
  }

  const handleDeleteChecklistItem = async (itemId: number) => {
    // Immediate update to local state
    setCurrentChecklistItems(prev => prev.filter(item => item.id !== itemId))

    try {
      const token = localStorage.getItem('accessToken')
      const response = await fetch(`/api/todos/${todo.id}/checklist/${itemId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      })
      
      if (response.ok) {
        onLabelsUpdated() // Refresh the todo data
      }
    } catch (error) {
      console.error('Error deleting checklist item:', error)
    }
  }


  const handleAssignMember = async (member: Member) => {
    try {
      const token = localStorage.getItem('accessToken')
      const response = await fetch(`/api/todos/${todo.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ assignedTo: member.id })
      })
      
      if (response.ok) {
        setShowMemberMenu(false)
        onLabelsUpdated() // Refresh the todo data
      }
    } catch (error) {
      console.error('Error assigning member:', error)
    }
  }

  const handleRemoveMember = async () => {
    try {
      const token = localStorage.getItem('accessToken')
      const response = await fetch(`/api/todos/${todo.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ assignedTo: null })
      })
      
      if (response.ok) {
        onLabelsUpdated() // Refresh the todo data
      }
    } catch (error) {
      console.error('Error removing member:', error)
    }
  }

  const handleAssignMultipleMember = async (member: Member) => {
    try {
      const token = localStorage.getItem('accessToken')
      const response = await fetch(`/api/todos/${todo.id}/assignments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ userId: member.id })
      })
      
      if (response.ok) {
        onLabelsUpdated() // Refresh the todo data
      }
    } catch (error) {
      console.error('Error assigning member:', error)
    }
  }

  const handleRemoveMultipleMember = async (memberId: number) => {
    try {
      const token = localStorage.getItem('accessToken')
      const response = await fetch(`/api/todos/${todo.id}/assignments/${memberId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      })
      
      if (response.ok) {
        onLabelsUpdated() // Refresh the todo data
      }
    } catch (error) {
      console.error('Error removing member assignment:', error)
    }
  }

  const getChecklistProgress = () => {
    if (!currentChecklistItems || currentChecklistItems.length === 0) return 0
    const completedCount = currentChecklistItems.filter(item => item.is_completed).length
    return (completedCount / currentChecklistItems.length) * 100
  }

  const getChecklistColor = () => {
    if (!currentChecklistItems || currentChecklistItems.length === 0) return '#6b7280' // gris
    
    const completedCount = currentChecklistItems.filter(item => item.is_completed).length
    const totalCount = currentChecklistItems.length
    const percentage = (completedCount / totalCount) * 100
    
    if (percentage === 0) return '#6b7280' // gris
    if (percentage < 25) return '#ef4444' // rouge
    if (percentage < 50) return '#f59e0b' // jaune
    if (percentage < 100) return '#3b82f6' // bleu
    return '#10b981' // vert (100%)
  }

  return (
    <div className="card-details-overlay" onClick={onClose}>
      <div className="card-details-modal" onClick={(e) => e.stopPropagation()}>
        <button className="card-details-close" onClick={onClose}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
            <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
          </svg>
        </button>

        <div className="card-details-header">
          <div className="card-details-title-section">
            <div className="card-details-title-icon">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                <rect x="3" y="5" width="18" height="14" rx="2" stroke="currentColor" strokeWidth="2"/>
                <line x1="3" y1="10" x2="21" y2="10" stroke="currentColor" strokeWidth="2"/>
              </svg>
            </div>
            <div className="card-details-title-container">
              <textarea
                ref={titleRef}
                className="card-details-title"
                value={title}
                onChange={(e) => {
                  setTitle(e.target.value)
                  adjustTextareaHeight(e.target)
                }}
                onBlur={() => handleTitleChange(title)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault()
                    titleRef.current?.blur()
                  }
                }}
                rows={1}
              />
              <div className="card-details-list-info">
                in list <a href="#">{listName}</a>
              </div>
            </div>
          </div>
        </div>

        <div className="card-details-body">
          <div className="card-details-main">
            <div className="card-section">
              <div className="card-section-header">
                <div className="card-section-icon">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                    <path d="M20.59 13.41l-7.17 7.17a2 2 0 01-2.83 0L2 12V2h10l8.59 8.59a2 2 0 010 2.82z" stroke="currentColor" strokeWidth="2"/>
                    <circle cx="7" cy="7" r="1.5" fill="currentColor"/>
                  </svg>
                </div>
                <h3 className="card-section-title">Labels</h3>
              </div>
              <div className="card-labels-list">
                {currentTodoLabels && currentTodoLabels.map(label => (
                  <div
                    key={label.id}
                    className="card-label-item"
                    style={{ backgroundColor: label.color }}
                    onClick={() => {
                      setEditingLabel(label)
                      setShowLabelMenu(true)
                    }}
                  >
                    {label.name || ''}
                  </div>
                ))}
                <button
                  className="card-label-add-button"
                  onClick={() => {
                    setEditingLabel(null)
                    setShowLabelMenu(true)
                  }}
                >
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
                    <path d="M12 5v14m-7-7h14" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                  </svg>
                </button>
              </div>
            </div>


            <div className="card-section">
              <div className="card-section-header">
                <div className="card-section-icon">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                    <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" stroke="currentColor" strokeWidth="2"/>
                    <polyline points="14,2 14,8 20,8" stroke="currentColor" strokeWidth="2"/>
                    <line x1="16" y1="13" x2="8" y2="13" stroke="currentColor" strokeWidth="2"/>
                    <line x1="16" y1="17" x2="8" y2="17" stroke="currentColor" strokeWidth="2"/>
                    <polyline points="10,9 9,9 8,9" stroke="currentColor" strokeWidth="2"/>
                  </svg>
                </div>
                <h3 className="card-section-title">Description</h3>
              </div>
              <textarea
                ref={descriptionRef}
                className="card-description"
                placeholder="Add a more detailed description..."
                value={description}
                onChange={(e) => {
                  setDescription(e.target.value)
                  adjustTextareaHeight(e.target)
                }}
                onBlur={() => handleDescriptionChange(description)}
                rows={3}
              />
            </div>

            {currentChecklistItems && currentChecklistItems.length > 0 && (
              <div className="card-section">
                <div className="card-section-header clickable" onClick={() => setChecklistExpanded(!checklistExpanded)}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div className="card-section-icon" style={{ color: getChecklistColor() }}>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                        <path d="M9 11l3 3L22 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                        <path d="M21 12c0 4.97-4.03 9-9 9s-9-4.03-9-9 4.03-9 9-9c1.67 0 3.22.46 4.56 1.25" stroke="currentColor" strokeWidth="2"/>
                      </svg>
                    </div>
                    <h3 className="card-section-title">Checklist</h3>
                  </div>
                  <div className="checklist-summary">
                    <button className="checklist-expand-button">
                      <svg 
                        width="16" 
                        height="16" 
                        viewBox="0 0 24 24" 
                        fill="none"
                        style={{ transform: checklistExpanded ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s' }}
                      >
                        <path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </button>
                  </div>
                </div>
                
                <div className="checklist-progress-bar">
                  <div 
                    className="checklist-progress-fill"
                    style={{ 
                      width: `${getChecklistProgress()}%`,
                      backgroundColor: getChecklistColor()
                    }}
                  />
                </div>

                {checklistExpanded && (
                  <div className="checklist-items-container">
                    {currentChecklistItems.map(item => (
                      <div key={item.id} className="checklist-item">
                        <input
                          type="checkbox"
                          className="checklist-checkbox"
                          checked={item.is_completed}
                          onChange={(e) => handleToggleChecklistItem(item.id, e.target.checked)}
                        />
                        <input
                          type="text"
                          className="checklist-item-text"
                          value={item.title}
                          onChange={(e) => {
                            setCurrentChecklistItems(prev => 
                              prev.map(i => 
                                i.id === item.id ? { ...i, title: e.target.value } : i
                              )
                            )
                          }}
                          onBlur={(e) => handleUpdateChecklistItem(item.id, e.target.value)}
                          style={{ 
                            textDecoration: item.is_completed ? 'line-through' : 'none',
                            opacity: item.is_completed ? 0.6 : 1
                          }}
                        />
                        <button 
                          className="checklist-item-delete"
                          onClick={() => handleDeleteChecklistItem(item.id)}
                        >
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
                            <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2"/>
                          </svg>
                        </button>
                      </div>
                    ))}
                    
                    <button 
                      className="add-checklist-item-button"
                      onClick={() => handleAddChecklistItem('New item')}
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                        <path d="M12 5v14m-7-7h14" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                      </svg>
                      Add an item
                    </button>
                  </div>
                )}
              </div>
            )}

            {(todo.assigned_to || (todo.assigned_members && todo.assigned_members.length > 0)) && (
              <div className="card-section">
                <div className="card-section-header">
                  <div className="card-section-icon">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      <circle cx="12" cy="7" r="4" stroke="currentColor" strokeWidth="2"/>
                    </svg>
                  </div>
                  <h3 className="card-section-title">Membres assignés</h3>
                </div>
                <div className="assigned-members-list">
                  {/* Legacy single assignment */}
                  {todo.assigned_to && (
                    <div className="assigned-member-item">
                      <div className="member-avatar">
                        {todo.assigned_username?.charAt(0).toUpperCase()}
                      </div>
                      <span className="member-name">{todo.assigned_username}</span>
                      <button 
                        className="remove-assignment"
                        onClick={handleRemoveMember}
                        title="Retirer ce membre"
                      >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                          <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2"/>
                        </svg>
                      </button>
                    </div>
                  )}
                  
                  {/* Multiple assignments */}
                  {todo.assigned_members && todo.assigned_members.map(member => (
                    <div key={member.id} className="assigned-member-item">
                      <div className="member-avatar">
                        {member.username.charAt(0).toUpperCase()}
                      </div>
                      <span className="member-name">{member.username}</span>
                      <button 
                        className="remove-assignment"
                        onClick={() => handleRemoveMultipleMember(member.id)}
                        title="Retirer ce membre"
                      >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                          <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2"/>
                        </svg>
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="card-details-sidebar">
            <div className="sidebar-section">
              <div className="sidebar-section-title">Add to card</div>
              <button 
                className="sidebar-button"
                onClick={() => {
                  setEditingLabel(null)
                  setShowLabelMenu(true)
                }}
              >
                <svg className="sidebar-button-icon" viewBox="0 0 24 24" fill="none">
                  <path d="M20.59 13.41l-7.17 7.17a2 2 0 01-2.83 0L2 12V2h10l8.59 8.59a2 2 0 010 2.82z" stroke="currentColor" strokeWidth="2"/>
                  <circle cx="7" cy="7" r="1.5" fill="currentColor"/>
                </svg>
                Labels
              </button>
              <button 
                className="sidebar-button"
                onClick={() => {
                  handleAddChecklistItem('New item')
                }}
              >
                <svg className="sidebar-button-icon" viewBox="0 0 24 24" fill="none">
                  <path d="M9 11l3 3L22 4" stroke="currentColor" strokeWidth="2"/>
                  <path d="M21 12c0 4.97-4.03 9-9 9s-9-4.03-9-9 4.03-9 9-9c1.67 0 3.22.46 4.56 1.25" stroke="currentColor" strokeWidth="2"/>
                </svg>
                Checklist
              </button>
              <button className="sidebar-button">
                <svg className="sidebar-button-icon" viewBox="0 0 24 24" fill="none">
                  <rect x="3" y="4" width="18" height="18" rx="2" ry="2" stroke="currentColor" strokeWidth="2"/>
                  <line x1="16" y1="2" x2="16" y2="6" stroke="currentColor" strokeWidth="2"/>
                  <line x1="8" y1="2" x2="8" y2="6" stroke="currentColor" strokeWidth="2"/>
                  <line x1="3" y1="10" x2="21" y2="10" stroke="currentColor" strokeWidth="2"/>
                </svg>
                Dates
              </button>
              <button 
                className="sidebar-button"
                onClick={() => setShowMemberMenu(true)}
              >
                <svg className="sidebar-button-icon" viewBox="0 0 24 24" fill="none">
                  <path d="M16 21v-2a4 4 0 00-4-4H6a4 4 0 00-4 4v2" stroke="currentColor" strokeWidth="2"/>
                  <circle cx="9" cy="7" r="4" stroke="currentColor" strokeWidth="2"/>
                  <path d="M22 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" stroke="currentColor" strokeWidth="2"/>
                </svg>
                Members
              </button>
              <button className="sidebar-button">
                <svg className="sidebar-button-icon" viewBox="0 0 24 24" fill="none">
                  <path d="M21.44 11.05l-9.19 9.19a6 6 0 01-8.49-8.49l9.19-9.19a4 4 0 015.66 5.66l-9.2 9.19a2 2 0 01-2.83-2.83l8.49-8.48" stroke="currentColor" strokeWidth="2"/>
                </svg>
                Attachment
              </button>
            </div>

            <div className="sidebar-section">
              <div className="sidebar-section-title">Actions</div>
              <button className="sidebar-button">
                <svg className="sidebar-button-icon" viewBox="0 0 24 24" fill="none">
                  <path d="M16 4h2a2 2 0 012 2v14a2 2 0 01-2 2H6a2 2 0 01-2-2V6a2 2 0 012-2h2" stroke="currentColor" strokeWidth="2"/>
                  <rect x="8" y="2" width="8" height="4" rx="1" ry="1" stroke="currentColor" strokeWidth="2"/>
                </svg>
                Copy
              </button>
              <button className="sidebar-button">
                <svg className="sidebar-button-icon" viewBox="0 0 24 24" fill="none">
                  <polyline points="3,6 5,6 21,6" stroke="currentColor" strokeWidth="2"/>
                  <path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" stroke="currentColor" strokeWidth="2"/>
                </svg>
                Archive
              </button>
            </div>
          </div>
        </div>

        {showLabelMenu && (
          <LabelMenu
            isOpen={showLabelMenu}
            onClose={() => {
              setShowLabelMenu(false)
              setEditingLabel(null)
            }}
            labels={labels}
            selectedLabels={currentTodoLabels}
            onAddLabel={handleAddLabel}
            onRemoveLabel={handleRemoveLabel}
            onLabelsUpdated={onLabelsUpdated}
            workspaceId={todo.workspace_id.toString()}
            editingLabel={editingLabel}
          />
        )}

        {showMemberMenu && (
          <div className="member-menu-overlay" onClick={() => setShowMemberMenu(false)}>
            <div className="member-menu" onClick={(e) => e.stopPropagation()}>
              <div className="member-menu-header">
                <h3>Gérer les membres</h3>
                <button onClick={() => setShowMemberMenu(false)} className="close-button">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                    <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2"/>
                  </svg>
                </button>
              </div>
              <div className="member-menu-content">
                {members.map(member => {
                  const isAssigned = todo.assigned_to === member.id || 
                    (todo.assigned_members && todo.assigned_members.some(m => m.id === member.id))
                  
                  return (
                    <div 
                      key={member.id}
                      className={`member-option ${isAssigned ? 'member-option--selected' : ''}`}
                      onClick={() => {
                        if (isAssigned) {
                          if (todo.assigned_to === member.id) {
                            handleRemoveMember()
                          } else {
                            handleRemoveMultipleMember(member.id)
                          }
                        } else {
                          handleAssignMultipleMember(member)
                        }
                      }}
                    >
                      <div className="member-option-avatar">
                        {member.username.charAt(0).toUpperCase()}
                      </div>
                      <div className="member-option-info">
                        <span className="member-option-name">{member.username}</span>
                        <span className="member-option-email">{member.email}</span>
                      </div>
                      {isAssigned && (
                        <div className="member-option-check">
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                            <path d="M20 6L9 17l-5-5" stroke="currentColor" strokeWidth="2"/>
                          </svg>
                        </div>
                      )}
                    </div>
                  )
                })}
                {todo.assigned_to && (
                  <div className="member-menu-unassign">
                    <button 
                      className="unassign-button"
                      onClick={handleRemoveMember}
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                        <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2"/>
                      </svg>
                      Retirer l'assignation
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default CardDetailsModal