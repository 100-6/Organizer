import React, { useState, useRef, useEffect } from 'react'
import LabelMenu from './LabelMenu'
import './CardDetailsModal.css'

interface Todo {
  id: number
  title: string
  description: string | null
  list_id: number
  assigned_to: number | null
  assigned_username: string | null
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
  text: string
  completed: boolean
  position: number
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
}

const CardDetailsModal: React.FC<CardDetailsModalProps> = ({
  isOpen,
  onClose,
  todo,
  onUpdate,
  labels,
  members,
  listName,
  onLabelsUpdated
}) => {
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [showLabelMenu, setShowLabelMenu] = useState(false)
  const titleRef = useRef<HTMLTextAreaElement>(null)
  const descriptionRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    if (todo && isOpen) {
      setTitle(todo.title)
      setDescription(todo.description || '')
    }
  }, [todo, isOpen])

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

  const handleRemoveLabel = async (labelId: number) => {
    try {
      const token = localStorage.getItem('accessToken')
      await fetch(`/api/todos/${todo.id}/labels/${labelId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      })
      onLabelsUpdated()
    } catch (error) {
      console.error('Error removing label:', error)
    }
  }

  const handleAddLabel = async (labelId: number) => {
    try {
      const token = localStorage.getItem('accessToken')
      await fetch(`/api/todos/${todo.id}/labels`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ labelId })
      })
      onLabelsUpdated()
    } catch (error) {
      console.error('Error adding label:', error)
    }
  }

  const adjustTextareaHeight = (textarea: HTMLTextAreaElement) => {
    textarea.style.height = 'auto'
    textarea.style.height = `${textarea.scrollHeight}px`
  }

  const getChecklistProgress = () => {
    if (!todo.checklist_items || todo.checklist_items.length === 0) return 0
    return (todo.completed_checklist_count / todo.checklist_count) * 100
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
            {todo.labels && todo.labels.length > 0 && (
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
                  {todo.labels.map(label => (
                    <div
                      key={label.id}
                      className="card-label-item"
                      style={{ backgroundColor: label.color }}
                    >
                      {label.name || 'Label'}
                      <button
                        className="card-label-remove"
                        onClick={() => handleRemoveLabel(label.id)}
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

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

            {todo.checklist_items && todo.checklist_items.length > 0 && (
              <div className="card-section">
                <div className="card-section-header">
                  <div className="card-section-icon">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                      <path d="M9 11l3 3L22 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                      <path d="M21 12c0 4.97-4.03 9-9 9s-9-4.03-9-9 4.03-9 9-9c1.67 0 3.22.46 4.56 1.25" stroke="currentColor" strokeWidth="2"/>
                    </svg>
                  </div>
                  <h3 className="card-section-title">Checklist</h3>
                </div>
                <div className="checklist-section">
                  <div className="checklist-header">
                    <h4 className="checklist-title">Checklist</h4>
                    <span className="checklist-progress">
                      {todo.completed_checklist_count}/{todo.checklist_count}
                    </span>
                  </div>
                  <div className="checklist-progress-bar">
                    <div 
                      className="checklist-progress-fill"
                      style={{ width: `${getChecklistProgress()}%` }}
                    />
                  </div>
                  <div className="checklist-items">
                    {todo.checklist_items.map(item => (
                      <div key={item.id} className="checklist-item">
                        <input
                          type="checkbox"
                          className="checklist-checkbox"
                          checked={item.completed}
                          onChange={() => {
                            // Handle checklist item toggle
                          }}
                        />
                        <span className={`checklist-item-text ${item.completed ? 'checklist-item-text--completed' : ''}`}>
                          {item.text}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="card-details-sidebar">
            <div className="sidebar-section">
              <div className="sidebar-section-title">Add to card</div>
              <button 
                className="sidebar-button"
                onClick={() => setShowLabelMenu(true)}
              >
                <svg className="sidebar-button-icon" viewBox="0 0 24 24" fill="none">
                  <path d="M20.59 13.41l-7.17 7.17a2 2 0 01-2.83 0L2 12V2h10l8.59 8.59a2 2 0 010 2.82z" stroke="currentColor" strokeWidth="2"/>
                  <circle cx="7" cy="7" r="1.5" fill="currentColor"/>
                </svg>
                Labels
              </button>
              <button className="sidebar-button">
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
              <button className="sidebar-button">
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
            onClose={() => setShowLabelMenu(false)}
            labels={labels}
            selectedLabels={todo.labels}
            onAddLabel={handleAddLabel}
            onRemoveLabel={handleRemoveLabel}
            onLabelsUpdated={onLabelsUpdated}
            workspaceId={todo.workspace_id.toString()}
          />
        )}
      </div>
    </div>
  )
}

export default CardDetailsModal