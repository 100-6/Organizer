import React, { useState, useRef, useEffect } from 'react'
import { LABEL_COLORS, DEFAULT_LABEL_COLOR } from '../../../constants/labelColors'
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
}


const LabelMenu: React.FC<LabelMenuProps> = ({
  isOpen,
  onClose,
  labels,
  selectedLabels,
  onAddLabel,
  onRemoveLabel,
  onLabelsUpdated,
  workspaceId
}) => {
  const [searchTerm, setSearchTerm] = useState('')
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [newLabelName, setNewLabelName] = useState('')
  const [selectedColor, setSelectedColor] = useState(DEFAULT_LABEL_COLOR[0])
  const [isCreating, setIsCreating] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
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
  }, [isOpen, onClose])

  const filteredLabels = labels.filter(label =>
    (label.name || '').toLowerCase().includes(searchTerm.toLowerCase())
  )

  const isLabelSelected = (labelId: number) => {
    return selectedLabels.some(label => label.id === labelId)
  }

  const handleLabelClick = (label: Label) => {
    if (isLabelSelected(label.id)) {
      onRemoveLabel(label.id)
    } else {
      onAddLabel(label.id)
    }
  }

  const handleCreateLabel = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newLabelName.trim()) return

    setIsCreating(true)
    try {
      const token = localStorage.getItem('accessToken')
      const response = await fetch('/api/labels', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          name: newLabelName.trim(),
          color: selectedColor,
          workspaceId: workspaceId
        })
      })

      if (response.ok) {
        setNewLabelName('')
        setSelectedColor(LABEL_COLORS[0])
        setShowCreateForm(false)
        onLabelsUpdated()
      }
    } catch (error) {
      console.error('Error creating label:', error)
    } finally {
      setIsCreating(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="label-menu-overlay" onClick={onClose}>
      <div className="label-menu" ref={menuRef} onClick={(e) => e.stopPropagation()}>
        <div className="label-menu-header">
          <h3 className="label-menu-title">Labels</h3>
          <button className="label-menu-close" onClick={onClose}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
              <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            </svg>
          </button>
        </div>

        <div className="label-menu-search">
          <input
            type="text"
            className="label-search-input"
            placeholder="Search labels..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="label-menu-content">
          <div className="label-menu-section">
            <div className="label-section-title">Labels</div>
            <div className="label-list">
              {filteredLabels.length === 0 ? (
                <div className="no-labels">
                  {searchTerm ? 'No labels found' : 'No labels created yet'}
                </div>
              ) : (
                filteredLabels.map(label => (
                  <div
                    key={label.id}
                    className="label-item"
                    onClick={() => handleLabelClick(label)}
                  >
                    <div 
                      className="label-color"
                      style={{ backgroundColor: label.color }}
                    />
                    <span className="label-text">
                      {label.name || 'Unnamed label'}
                    </span>
                    {isLabelSelected(label.id) && (
                      <svg className="label-check" viewBox="0 0 24 24" fill="none">
                        <path d="M20 6L9 17l-5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                      </svg>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {!showCreateForm ? (
          <div className="create-label-section">
            <button 
              className="create-label-button"
              onClick={() => setShowCreateForm(true)}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                <path d="M12 5v14m-7-7h14" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
              </svg>
              Create a new label
            </button>
          </div>
        ) : (
          <form className="create-label-form" onSubmit={handleCreateLabel}>
            <div className="form-group">
              <label className="form-label">Name</label>
              <input
                type="text"
                className="form-input"
                value={newLabelName}
                onChange={(e) => setNewLabelName(e.target.value)}
                placeholder="Label name"
                autoFocus
              />
            </div>

            <div className="form-group">
              <label className="form-label">Select a color</label>
              <div className="color-palette">
                {LABEL_COLORS.map(color => (
                  <button
                    key={color}
                    type="button"
                    className={`color-option ${selectedColor === color ? 'color-option--selected' : ''}`}
                    style={{ backgroundColor: color }}
                    onClick={() => setSelectedColor(color)}
                  >
                    {selectedColor === color && (
                      <span className="color-option-check">✓</span>
                    )}
                  </button>
                ))}
              </div>
            </div>

            <div className="form-actions">
              <button
                type="submit"
                className="form-button form-button--primary"
                disabled={isCreating || !newLabelName.trim()}
              >
                {isCreating ? 'Creating...' : 'Create'}
              </button>
              <button
                type="button"
                className="form-button form-button--secondary"
                onClick={() => {
                  setShowCreateForm(false)
                  setNewLabelName('')
                  setSelectedColor(LABEL_COLORS[0])
                }}
              >
                Cancel
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}

export default LabelMenu