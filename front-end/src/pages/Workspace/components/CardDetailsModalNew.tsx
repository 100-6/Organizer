import React, { useState, useRef, useEffect } from 'react'
import { useWorkspaceData, type Member } from '../../../contexts/WorkspaceDataContext'
import LabelMenu from './LabelMenu'
import Checklist from './Checklist'
import './CardDetailsModal.css'

interface CardDetailsModalProps {
  isOpen: boolean
  onClose: () => void
  todoId: number | null
  listName: string
}

const CardDetailsModal: React.FC<CardDetailsModalProps> = ({
  isOpen,
  onClose,
  todoId,
  listName
}) => {
  const { state, actions } = useWorkspaceData()
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [showLabelMenu, setShowLabelMenu] = useState(false)
  const [editingLabelId, setEditingLabelId] = useState<number | undefined>()
  const [showMemberMenu, setShowMemberMenu] = useState(false)
  const titleRef = useRef<HTMLTextAreaElement>(null)
  const descriptionRef = useRef<HTMLTextAreaElement>(null)

  // Find the current todo from the workspace state
  const todo = todoId ? state.lists.flatMap(list => list.todos).find(t => t.id === todoId) : null

  // Initialize form fields when todo changes
  useEffect(() => {
    if (todo && isOpen) {
      setTitle(todo.title)
      setDescription(todo.description || '')
    }
  }, [todo?.id, isOpen])

  // Reset state when modal closes
  useEffect(() => {
    if (!isOpen) {
      setShowLabelMenu(false)
      setShowMemberMenu(false)
      setEditingLabelId(undefined)
    }
  }, [isOpen])

  if (!isOpen || !todo) return null

  // Get assigned members (for now just one, but ready for multiple)
  const assignedMembers = todo.assigned_to
    ? state.members.filter(m => m.id === todo.assigned_to)
    : []

  const handleTitleChange = (newTitle: string) => {
    setTitle(newTitle)
    if (newTitle.trim() !== todo.title) {
      actions.updateTodo(todo.id, { title: newTitle.trim() })
    }
  }

  const handleDescriptionChange = (newDescription: string) => {
    setDescription(newDescription)
    actions.updateTodo(todo.id, { description: newDescription || null })
  }

  const handleAddLabel = async (labelId: number) => {
    await actions.addLabelToTodo(todo.id, labelId)
  }

  const handleRemoveLabel = async (labelId: number) => {
    await actions.removeLabelFromTodo(todo.id, labelId)
  }

  const handleAssignMember = async (member: Member) => {
    if (assignedMembers.some(m => m.id === member.id)) return

    await actions.assignMemberToTodo(todo.id, member.id)
    setShowMemberMenu(false)
  }

  const handleRemoveMember = async (memberId: number) => {
    await actions.removeMemberFromTodo(todo.id, memberId)
  }

  const handleAddChecklistItem = async (title: string) => {
    await actions.addChecklistItem(todo.id, title)
  }

  const handleToggleChecklistItem = async (itemId: number, completed: boolean) => {
    await actions.updateChecklistItem(todo.id, itemId, { is_completed: completed })
  }

  const handleUpdateChecklistItem = async (itemId: number, title: string) => {
    await actions.updateChecklistItem(todo.id, itemId, { title })
  }

  const handleDeleteChecklistItem = async (itemId: number) => {
    await actions.removeChecklistItem(todo.id, itemId)
  }

  const handleDeleteChecklist = async () => {
    if (!todo.checklist_items) return

    for (const item of todo.checklist_items) {
      await actions.removeChecklistItem(todo.id, item.id)
    }
  }

  const adjustTextareaHeight = (textarea: HTMLTextAreaElement) => {
    textarea.style.height = 'auto'
  }

  return (
    <div className="card-details-overlay" onClick={onClose}>
      <div className="card-details-modal" onClick={(e) => e.stopPropagation()}>
        <button className="card-details-close" onClick={onClose}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
            <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          </svg>
        </button>

        <div className="card-details-header">
          <div className="card-details-title-section">
            <svg className="card-details-title-icon" width="20" height="20" viewBox="0 0 24 24" fill="none">
              <path d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
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
                  if (e.key === 'Enter') {
                    e.preventDefault()
                    handleTitleChange(title)
                      ; (e.target as HTMLTextAreaElement).blur()
                  }
                }}
                rows={1}
              />
              <div className="card-details-list-info">
                in list <span className="list-name">{listName}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="card-details-body">
          <div className="card-details-main">
            {todo.labels.length > 0 && (
              <div className="card-section">
                <div className="card-section-header">
                  <svg className="card-section-icon" width="16" height="16" viewBox="0 0 24 24" fill="none">
                    <path d="M20.59 13.41l-7.17 7.17a2 2 0 01-2.83 0L2 12V2h10l8.59 8.59a2 2 0 010 2.82z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    <path d="M7 7h.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  <h3 className="card-section-title">Labels</h3>
                </div>
                <div className="card-labels-list">
                  {todo.labels.map(label => (
                    <div
                      key={label.id}
                      className="card-label-item clickable"
                      style={{ backgroundColor: label.color }}
                      title={label.name || 'Unnamed label'}
                      onClick={() => {
                        setEditingLabelId(label.id)
                        setShowLabelMenu(true)
                      }}
                    >
                      {label.name || ''}
                    </div>
                  ))}
                  <button
                    className="card-label-add-button"
                    onClick={() => setShowLabelMenu(true)}
                    title="Add label"
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                      <path d="M12 5v14m-7-7h14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                    </svg>
                  </button>
                </div>
              </div>
            )}

            {assignedMembers.length > 0 && (
              <div className="card-section">
                <div className="card-section-header">
                  <svg className="card-section-icon" width="16" height="16" viewBox="0 0 24 24" fill="none">
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    <circle cx="12" cy="7" r="4" stroke="currentColor" strokeWidth="2" />
                  </svg>
                  <h3 className="card-section-title">Membres assignés</h3>
                </div>
                <div className="assigned-members-list">
                  {assignedMembers.map(member => (
                    <div key={member.id} className="assigned-member-item">
                      <div className="member-avatar">
                        {member.username.charAt(0).toUpperCase()}
                      </div>
                      <span className="member-name">{member.username}</span>
                      <button
                        className="remove-assignment"
                        onClick={() => handleRemoveMember(member.id)}
                        title="Retirer ce membre"
                      >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                          <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2" />
                        </svg>
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="card-section">
              <div className="card-section-header">
                <svg className="card-section-icon" width="16" height="16" viewBox="0 0 24 24" fill="none">
                  <path d="M4 6h16M4 12h16M4 18h7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                <h3 className="card-section-title">Description</h3>
              </div>
              <textarea
                ref={descriptionRef}
                className="card-description"
                value={description}
                onChange={(e) => {
                  setDescription(e.target.value)
                  adjustTextareaHeight(e.target)
                }}
                onBlur={() => handleDescriptionChange(description)}
                placeholder="Add a more detailed description..."
                rows={3}
              />
            </div>

            {todo.checklist_items && todo.checklist_items.length > 0 && (
              <div className="card-section">
                <Checklist
                  todoId={todo.id}
                  items={todo.checklist_items}
                  onAddItem={handleAddChecklistItem}
                  onToggleItem={handleToggleChecklistItem}
                  onUpdateItem={handleUpdateChecklistItem}
                  onDeleteItem={handleDeleteChecklistItem}
                  onDeleteChecklist={handleDeleteChecklist}
                />
              </div>
            )}
          </div>

          <div className="card-details-sidebar">
            <div className="sidebar-section">
              <h4 className="sidebar-section-title">Add to card</h4>
              <button
                className="sidebar-button"
                onClick={() => setShowLabelMenu(true)}
              >
                <svg className="sidebar-button-icon" width="16" height="16" viewBox="0 0 24 24" fill="none">
                  <path d="M20.59 13.41l-7.17 7.17a2 2 0 01-2.83 0L2 12V2h10l8.59 8.59a2 2 0 010 2.82z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  <path d="M7 7h.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                Labels
              </button>

              <button
                className="sidebar-button"
                onClick={() => {
                  if (!todo.checklist_items || todo.checklist_items.length === 0) {
                    handleAddChecklistItem('New item')
                  }
                }}
              >
                <svg className="sidebar-button-icon" width="16" height="16" viewBox="0 0 24 24" fill="none">
                  <path d="M9 12l2 2 4-4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  <path d="M21 12c0 4.97-4.03 9-9 9s-9-4.03-9-9 4.03-9 9-9c1.67 0 3.22.46 4.56 1.25" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                Checklist
              </button>

              <button className="sidebar-button">
                <svg className="sidebar-button-icon" width="16" height="16" viewBox="0 0 24 24" fill="none">
                  <path d="M12 2c0 5.523-4.477 10-10 10s10 4.477 10 10 4.477-10 10-10-10-4.477-10-10z" stroke="currentColor" strokeWidth="2" />
                  <path d="M16 8l-8 8M8 8l8 8" stroke="currentColor" strokeWidth="2" />
                </svg>
                Due date
              </button>

              <button className="sidebar-button">
                <svg className="sidebar-button-icon" width="16" height="16" viewBox="0 0 24 24" fill="none">
                  <path d="M9 12h6M9 16h6M9 8h6M7 20H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v12a2 2 0 01-2 2h-2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                </svg>
                Attachment
              </button>

              <button
                className="sidebar-button"
                onClick={() => setShowMemberMenu(true)}
              >
                <svg className="sidebar-button-icon" width="16" height="16" viewBox="0 0 24 24" fill="none">
                  <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2M12 3a4 4 0 100 8 4 4 0 000-8z" stroke="currentColor" strokeWidth="2" />
                </svg>
                Members
              </button>
            </div>

            <div className="sidebar-section">
              <h4 className="sidebar-section-title">Actions</h4>
              <button className="sidebar-button">
                <svg className="sidebar-button-icon" width="16" height="16" viewBox="0 0 24 24" fill="none">
                  <path d="M16 4h2a2 2 0 012 2v14a2 2 0 01-2 2H6a2 2 0 01-2-2V6a2 2 0 012-2h2M15 2H9a1 1 0 00-1 1v2a1 1 0 001 1h6a1 1 0 001-1V3a1 1 0 00-1-1z" stroke="currentColor" strokeWidth="2" />
                </svg>
                Copy
              </button>

              <button className="sidebar-button">
                <svg className="sidebar-button-icon" width="16" height="16" viewBox="0 0 24 24" fill="none">
                  <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" stroke="currentColor" strokeWidth="2" />
                  <polyline points="14,2 14,8 20,8" stroke="currentColor" strokeWidth="2" />
                </svg>
                Make template
              </button>

              <button className="sidebar-button">
                <svg className="sidebar-button-icon" width="16" height="16" viewBox="0 0 24 24" fill="none">
                  <path d="M21 4H8l-7 8 7 8h13a2 2 0 002-2V6a2 2 0 00-2-2z" stroke="currentColor" strokeWidth="2" />
                  <polyline points="18,9 12,15 10,13" stroke="currentColor" strokeWidth="2" />
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
              setEditingLabelId(undefined)
            }}
            labels={state.labels}
            selectedLabels={todo.labels}
            onAddLabel={handleAddLabel}
            onRemoveLabel={handleRemoveLabel}
            onLabelsUpdated={() => { }} // No longer needed with unified state
            workspaceId={todo.workspace_id.toString()}
            editLabelId={editingLabelId}
          />
        )}

        {showMemberMenu && (
          <div className="member-menu-overlay" onClick={() => setShowMemberMenu(false)}>
            <div className="member-menu" onClick={(e) => e.stopPropagation()}>
              <div className="member-menu-header">
                <h3>Assigner un membre</h3>
                <button onClick={() => setShowMemberMenu(false)} className="close-button">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                    <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2" />
                  </svg>
                </button>
              </div>
              <div className="member-menu-content">
                {/* Membres actuellement assignés */}
                {assignedMembers.length > 0 && (
                  <div className="assigned-members-section">
                    <h4 style={{ margin: '0 0 8px 0', padding: '0 12px', fontSize: '14px', color: '#1f2937', fontWeight: '600' }}>
                      Membres assignés:
                    </h4>
                    <div className="assigned-members-in-menu">
                      {assignedMembers.map(member => (
                        <div key={member.id} className="member-option assigned">
                          <div className="member-option-avatar">
                            {member.username.charAt(0).toUpperCase()}
                          </div>
                          <div className="member-option-info">
                            <span className="member-option-name">{member.username}</span>
                            <span className="member-option-email">{member.email}</span>
                          </div>
                          <button
                            className="remove-member-btn"
                            onClick={() => handleRemoveMember(member.id)}
                            title="Retirer ce membre"
                          >
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                              <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2" />
                            </svg>
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Liste des membres disponibles à assigner */}
                <div className="member-list">
                  <h4 style={{ margin: assignedMembers.length > 0 ? '16px 0 8px 0' : '0 0 8px 0', padding: '0 12px', fontSize: '14px', color: '#6b7280' }}>
                    {assignedMembers.length > 0 ? 'Ajouter un membre' : 'Assigner un membre'} ({state.members.filter(m => !assignedMembers.some(am => am.id === m.id)).length} disponible{state.members.filter(m => !assignedMembers.some(am => am.id === m.id)).length > 1 ? 's' : ''}):
                  </h4>
                  {state.members.filter(m => !assignedMembers.some(am => am.id === m.id)).length === 0 ? (
                    <div style={{ padding: '12px', textAlign: 'center', color: '#6b7280', fontStyle: 'italic' }}>
                      {state.members.length === 0 ? 'Aucun membre dans ce workspace' : 'Tous les membres sont déjà assignés'}
                    </div>
                  ) : (
                    state.members
                      .filter(member => !assignedMembers.some(am => am.id === member.id))
                      .map(member => (
                        <div
                          key={member.id}
                          className="member-option"
                          onClick={() => handleAssignMember(member)}
                        >
                          <div className="member-option-avatar">
                            {member.username.charAt(0).toUpperCase()}
                          </div>
                          <div className="member-option-info">
                            <span className="member-option-name">{member.username}</span>
                            <span className="member-option-email">{member.email}</span>
                          </div>
                          <div className="add-member-btn">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                              <path d="M12 5v14m-7-7h14" stroke="currentColor" strokeWidth="2" />
                            </svg>
                          </div>
                        </div>
                      ))
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  )
}

export default CardDetailsModal