import React, { useState, useRef, useEffect } from 'react'
import CreateLabelModal from './CreateLabelModal'
import './LabelMenu.css'

interface Label {
  id: number
  name: string | null
  color: string
  workspace_id: number
  created_at: string
}

interface LabelMenuProps {
  isOpen: boolean
  onClose: () => void
  labels: Label[]
  selectedLabels: Label[]
  onAddLabel: (labelId: number) => void
  onRemoveLabel: (labelId: number) => void
  onLabelsUpdated: () => void
  workspaceId: string
  editLabelId?: number
  editingLabel?: Label | null
}

const BASE_LABELS = [
  { color: '#10B981', id: 'green' },
  { color: '#3B82F6', id: 'blue' }, 
  { color: '#8B5CF6', id: 'purple' },
  { color: '#FBBF24', id: 'yellow' },
  { color: '#F59E0B', id: 'orange' },
  { color: '#EF4444', id: 'red' }
]

const LabelMenu: React.FC<LabelMenuProps> = ({
  isOpen,
  onClose,
  labels,
  selectedLabels,
  onAddLabel,
  onRemoveLabel,
  onLabelsUpdated,
  workspaceId,
  editLabelId,
  editingLabel
}) => {
  const [searchTerm, setSearchTerm] = useState('')
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [editingLabelId, setEditingLabelId] = useState<number | null>(null)
  const [editName, setEditName] = useState('')
  const [isUpdating, setIsUpdating] = useState(false)
  const [error, setError] = useState('')
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      // Ne pas fermer si le modal de création de label est ouvert
      if (showCreateModal) {
        return
      }
      
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        onClose()
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen, onClose, showCreateModal]) // Ajout de showCreateModal dans les dépendances

  useEffect(() => {
    if (isOpen && labels.length >= 0) {
      createMissingBaseLabels()
    }
  }, [isOpen, labels.length])

  useEffect(() => {
    if (editingLabel) {
      setEditingLabelId(editingLabel.id)
      setEditName(editingLabel.name || '')
    }
  }, [editingLabel])

  useEffect(() => {
    if (isOpen) {
      setSearchTerm('')
      setError('')
      if (editLabelId && !editingLabelId) {
        setEditingLabelId(editLabelId)
        const labelToEdit = labels.find(l => l.id === editLabelId)
        setEditName(labelToEdit?.name || '')
      }
    }
  }, [isOpen, editLabelId])


  const createMissingBaseLabels = async () => {
    const token = localStorage.getItem('accessToken')
    
    for (const baseLabel of BASE_LABELS) {
      const existingLabel = labels.find(label => label.color === baseLabel.color)
      
      if (!existingLabel) {
        try {
          await fetch('/api/labels', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
              name: null,
              color: baseLabel.color,
              workspaceId: workspaceId
            })
          })
        } catch (error) {
          console.error('Error creating base label:', error)
        }
      }
    }
    
    onLabelsUpdated()
  }

  const getAllLabels = () => {
    const baseColors = BASE_LABELS.map(base => base.color)
    const baseLabels = BASE_LABELS.map(baseLabel => {
      return labels.find(label => label.color === baseLabel.color)
    }).filter(Boolean) as Label[]
    
    const customLabels = labels.filter(label => !baseColors.includes(label.color))
    
    return [...baseLabels, ...customLabels]
  }

  const filteredLabels = getAllLabels().filter(label =>
    searchTerm === '' || (label.name && label.name.toLowerCase().includes(searchTerm.toLowerCase()))
  )

  const isLabelSelected = (labelId: number) => {
    return selectedLabels.some(label => label.id === labelId)
  }

  const handleLabelToggle = async (label: Label) => {
    const isSelected = isLabelSelected(label.id)
    
    if (isSelected) {
      await onRemoveLabel(label.id)
    } else {
      await onAddLabel(label.id)
    }
  }

  const handleEditName = (label: Label) => {
    setEditingLabelId(label.id)
    setEditName(label.name || '')
    setError('')
  }

  const handleSaveName = async () => {
    if (!editingLabelId) return

    setIsUpdating(true)
    setError('')

    try {
      const token = localStorage.getItem('accessToken')
      const labelToUpdate = labels.find(l => l.id === editingLabelId)
      const response = await fetch(`/api/labels/${editingLabelId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          name: editName.trim() === '' ? null : editName.trim(),
          color: labelToUpdate?.color
        })
      })

      const data = await response.json()

      if (response.ok) {
        setEditingLabelId(null)
        setEditName('')
        setError('')
        onLabelsUpdated()
      } else {
        if (response.status === 409 || data.error?.includes('already exists')) {
          setError(`A label named "${editName.trim()}" already exists`)
        } else {
          setError(data.error || 'Failed to update label')
        }
      }
    } catch (error) {
      console.error('Error updating label:', error)
      setError('Network error. Please try again.')
    } finally {
      setIsUpdating(false)
    }
  }

  const handleCancelEdit = () => {
    setEditingLabelId(null)
    setEditName('')
    setError('')
  }

  // Unused function - remove if not needed
  // const handleDeleteLabel = async (labelId: number) => {
  //   const label = labels.find(l => l.id === labelId)
  //   const isBaseLabel = label && BASE_LABELS.some(base => base.color === label.color)
  //   
  //   if (isBaseLabel) {
  //     setEditingLabelId(labelId)
  //     setEditName('')
  //     await handleSaveName()
  //     return
  //   }

  //   if (!window.confirm('Are you sure you want to delete this label?')) {
  //     return
  //   }

  //   try {
  //     const token = localStorage.getItem('accessToken')
  //     const response = await fetch(`/api/labels/${labelId}`, {
  //       method: 'DELETE',
  //       headers: {
  //         'Authorization': `Bearer ${token}`
  //       }
  //     })

  //     if (response.ok) {
  //       onLabelsUpdated()
  //     }
  //   } catch (error) {
  //     console.error('Error deleting label:', error)
  //   }
  // }

  const handleCreateModalClose = () => {
    setShowCreateModal(false)
  }

  if (!isOpen) return null

  return (
    <>
      <div className="label-menu-overlay" onClick={onClose}>
        <div className="label-menu-trello" ref={menuRef} onClick={(e) => e.stopPropagation()}>
          <div className="label-menu-header">
            <h3 className="label-menu-title">Labels</h3>
            <button className="label-menu-close" onClick={onClose}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
              </svg>
            </button>
          </div>

          <div className="label-search-container">
            <input
              type="text"
              className="label-search-input"
              placeholder="Search labels..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div className="labels-section">
            <div className="labels-section-title">Labels</div>
            
            {error && (
              <div className="error-message">
                {error}
              </div>
            )}

            <div className="labels-list">
              {filteredLabels.map(label => {
                const isSelected = isLabelSelected(label.id)
                
                return (
                  <div key={label.id} className="label-item-row">
                    <label className="label-checkbox-container">
                      <input
                        type="checkbox"
                        className="label-checkbox"
                        checked={isSelected}
                        onChange={() => handleLabelToggle(label)}
                        key={`${label.id}-${isSelected}`}
                      />
                    </label>

                    {editingLabelId === label.id ? (
                      <div className="label-edit-container">
                        <input
                          type="text"
                          value={editName}
                          onChange={(e) => {
                            setEditName(e.target.value)
                            setError('')
                          }}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              handleSaveName()
                            } else if (e.key === 'Escape') {
                              handleCancelEdit()
                            }
                          }}
                          className="label-name-input"
                          placeholder="Enter label name..."
                          autoFocus
                        />
                        <div className="label-edit-actions">
                          <button
                            className="label-save-btn"
                            onClick={handleSaveName}
                            disabled={isUpdating}
                          >
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                              <path d="M20 6L9 17l-5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                            </svg>
                          </button>
                          <button
                            className="label-cancel-btn"
                            onClick={handleCancelEdit}
                          >
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                              <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                            </svg>
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div 
                        className="label-display"
                        style={{ backgroundColor: label.color }}
                        onClick={() => handleEditName(label)}
                      >
                        <span className="label-name">
                          {label.name || ''}
                        </span>
                        <div className="label-actions">
                          <button
                            className="label-edit-btn"
                            onClick={(e) => {
                              e.stopPropagation()
                              handleEditName(label)
                            }}
                          >
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                              <path d="M21.174 6.812a1 1 0 00-3.986-3.987L3.842 16.174a2 2 0 00-.5.83l-1.321 4.352a.5.5 0 00.623.622l4.353-1.32a2 2 0 00.83-.497z" stroke="currentColor" strokeWidth="2"/>
                              <path d="M15 5l4 4" stroke="currentColor" strokeWidth="2"/>
                            </svg>
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>

          <div className="create-label-section">
            <button 
              className="create-label-btn"
              onClick={() => setShowCreateModal(true)}
            >
              Create a new label
            </button>
          </div>

          <div className="colorblind-section">
            <button className="colorblind-btn">
              Enable colorblind friendly mode
            </button>
          </div>
        </div>
      </div>

      <CreateLabelModal
        isOpen={showCreateModal}
        onClose={handleCreateModalClose}
        onLabelsUpdated={onLabelsUpdated}
        workspaceId={workspaceId}
        existingLabels={labels}
      />
    </>
  )
}

export default LabelMenu