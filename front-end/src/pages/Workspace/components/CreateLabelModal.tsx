import React, { useState, useRef } from 'react'
import './CreateLabelModal.css'

interface Label {
  id: number
  name: string | null
  color: string
  workspace_id: number
  created_at: string
}

interface CreateLabelModalProps {
  isOpen: boolean
  onClose: () => void
  onLabelsUpdated: () => void
  workspaceId: string
  existingLabels: Label[]
}

const AVAILABLE_COLORS = [
  '#EF4444', '#F59E0B', '#FBBF24', '#10B981', '#059669', '#06B6D4',
  '#3B82F6', '#1D4ED8', '#6366F1', '#8B5CF6', '#7C3AED', '#A855F7',
  '#D946EF', '#EC4899', '#6B7280', '#000000', '#92400E', '#B45309',
  '#D97706', '#DC2626', '#991B1B', '#7C2D12', '#1F2937', '#374151',
  '#4B5563', '#9CA3AF', '#D1D5DB', '#F3F4F6'
]

const CreateLabelModal: React.FC<CreateLabelModalProps> = ({
  isOpen,
  onClose,
  onLabelsUpdated,
  workspaceId,
  existingLabels
}) => {
  const [labelName, setLabelName] = useState('')
  const [selectedColor, setSelectedColor] = useState(AVAILABLE_COLORS[0])
  const [isCreating, setIsCreating] = useState(false)
  const [error, setError] = useState('')
  const modalRef = useRef<HTMLDivElement>(null)

  const getUsedColors = () => {
    // Si on veut créer un label sans nom, vérifier si une couleur est déjà utilisée par un label sans nom
    if (!labelName.trim()) {
      return existingLabels
        .filter(label => !label.name || label.name.trim() === '')
        .map(label => label.color)
    }
    // Si on a un nom, on peut utiliser n'importe quelle couleur (même si utilisée par un label sans nom)
    return existingLabels
      .filter(label => label.name && label.name.trim() !== '')
      .map(label => label.color)
  }

  const handleCreateLabel = async (e: React.FormEvent) => {
    e.preventDefault()

    setIsCreating(true)
    setError('')

    try {
      const token = localStorage.getItem('accessToken')
      const response = await fetch('/api/labels', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          name: labelName.trim() || null, // null si pas de nom
          color: selectedColor,
          workspaceId: workspaceId
        })
      })

      const data = await response.json()

      if (response.ok) {
        setLabelName('')
        setSelectedColor(AVAILABLE_COLORS[0])
        setError('')
        onLabelsUpdated()
        onClose()
      } else {
        if (response.status === 409 || data.error?.includes('already exists') || data.error?.includes('duplicate')) {
          if (labelName.trim()) {
            setError(`A label named "${labelName.trim()}" already exists in this workspace`)
          } else {
            setError('A label with this color already exists in this workspace')
          }
        } else {
          setError(data.error || 'Failed to create label')
        }
      }
    } catch (error) {
      console.error('Error creating label:', error)
      setError('Network error. Please try again.')
    } finally {
      setIsCreating(false)
    }
  }

  const handleClose = () => {
    if (!isCreating) {
      setLabelName('')
      setSelectedColor(AVAILABLE_COLORS[0])
      setError('')
      onClose()
    }
  }

  const handleOverlayClick = (e: React.MouseEvent) => {
    // Ne fermer que si on clique directement sur l'overlay, pas sur le modal
    if (modalRef.current && !modalRef.current.contains(e.target as Node)) {
      handleClose()
    }
  }

  const handleModalClick = (e: React.MouseEvent) => {
    // Empêcher la propagation pour éviter de déclencher handleOverlayClick
    e.stopPropagation()
  }

  if (!isOpen) return null

  const usedColors = getUsedColors()

  return (
    <div className="create-label-overlay" onClick={handleOverlayClick}>
      <div className="create-label-modal" ref={modalRef} onClick={handleModalClick}>
        <div className="create-label-header">
          <h3 className="create-label-title">Create New Label</h3>
          <button className="create-label-close" onClick={handleClose}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
              <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            </svg>
          </button>
        </div>

        <form onSubmit={handleCreateLabel} className="create-label-form">
          {error && (
            <div className="create-error-message">
              {error}
            </div>
          )}

          <div className="create-form-group">
            <label className="create-form-label">Label Name (Optional)</label>
            <input
              type="text"
              className="create-form-input"
              value={labelName}
              onChange={(e) => {
                setLabelName(e.target.value)
                setError('')
              }}
              placeholder="Enter label name (optional)..."
              autoFocus
            />
          </div>

          <div className="create-form-group">
            <label className="create-form-label">Select Color</label>
            <div className="create-color-preview">
              <div 
                className="create-selected-color"
                style={{ backgroundColor: selectedColor }}
              />
              <span className="create-color-code">{selectedColor}</span>
            </div>
            
            <div className="create-color-palette">
              {AVAILABLE_COLORS.map(color => {
                const isUsed = usedColors.includes(color)
                return (
                  <button
                    key={color}
                    type="button"
                    className={`create-color-option ${selectedColor === color ? 'create-color-option--selected' : ''} ${isUsed ? 'create-color-option--used' : ''}`}
                    style={{ backgroundColor: color }}
                    onClick={() => !isUsed && setSelectedColor(color)}
                    disabled={isUsed}
                    title={isUsed ? 'Color already used' : `Select ${color}`}
                  >
                    {selectedColor === color && !isUsed && (
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                        <path d="M20 6L9 17l-5-5" stroke="white" strokeWidth="2" strokeLinecap="round"/>
                      </svg>
                    )}
                    {isUsed && (
                      <span className="create-color-used-indicator">✗</span>
                    )}
                  </button>
                )
              })}
            </div>
          </div>

          <div className="create-form-actions">
            <button
              type="button"
              className="create-cancel-button"
              onClick={handleClose}
              disabled={isCreating}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="create-submit-button"
              disabled={isCreating}
            >
              {isCreating ? 'Creating...' : 'Create Label'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default CreateLabelModal