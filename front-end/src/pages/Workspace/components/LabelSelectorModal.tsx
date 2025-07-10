import React, { useState, useEffect } from 'react'
import { Modal, Button, FormInput } from '../../../components'
import './LabelSelectorModal.css'

interface Label {
  id: number
  name: string | null
  color: string
  workspace_id: number
  created_at: string
}

interface LabelSelectorModalProps {
  isOpen: boolean
  onClose: () => void
  labels: Label[]
  selectedLabels: Label[]
  onToggleLabel: (labelId: number) => void
  onCreateLabel: (labelData: { name: string; color: string }) => void
  workspaceId: string
}

const LabelSelectorModal: React.FC<LabelSelectorModalProps> = ({
  isOpen,
  onClose,
  labels,
  selectedLabels,
  onToggleLabel,
  onCreateLabel,
  workspaceId
}) => {
  const [searchTerm, setSearchTerm] = useState('')
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [newLabel, setNewLabel] = useState({ name: '', color: '#10b981' })
  const [isCreating, setIsCreating] = useState(false)

  const predefinedColors = [
    '#ef4444', '#f59e0b', '#eab308', '#22c55e', '#10b981', '#06b6d4',
    '#3b82f6', '#6366f1', '#8b5cf6', '#a855f7', '#d946ef', '#ec4899',
    '#64748b', '#1e293b', '#dc2626', '#7c3aed'
  ]

  const filteredLabels = labels.filter(label =>
    (label.name || '').toLowerCase().includes(searchTerm.toLowerCase())
  )

  const isLabelSelected = (labelId: number) => {
    return selectedLabels.some(label => label.id === labelId)
  }

  const handleCreateLabel = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newLabel.name.trim()) return

    setIsCreating(true)
    try {
      await onCreateLabel({
        name: newLabel.name.trim(),
        color: newLabel.color
      })
      setNewLabel({ name: '', color: '#10b981' })
      setShowCreateForm(false)
    } catch (error) {
      console.error('Error creating label:', error)
    } finally {
      setIsCreating(false)
    }
  }

  const handleClose = () => {
    setSearchTerm('')
    setShowCreateForm(false)
    setNewLabel({ name: '', color: '#10b981' })
    onClose()
  }

  const handleLabelClick = (labelId: number) => {
    onToggleLabel(labelId)
  }

  useEffect(() => {
    if (!isOpen) {
      setSearchTerm('')
      setShowCreateForm(false)
      setNewLabel({ name: '', color: '#10b981' })
    }
  }, [isOpen])

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Labels"
      size="small"
    >
      <div className="label-selector-content">
        <div className="label-search-container">
          <input
            type="text"
            placeholder="Rechercher un label..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="label-search-input"
          />
        </div>

        <div className="label-list-container">
          <div className="label-list">
            {filteredLabels.length === 0 ? (
              <p className="no-labels-message">
                {searchTerm ? 'Aucun label trouvé' : 'Aucun label disponible'}
              </p>
            ) : (
              filteredLabels.map(label => (
                <div 
                  key={label.id} 
                  className={`label-item ${isLabelSelected(label.id) ? 'label-item--selected' : ''}`}
                  onClick={() => handleLabelClick(label.id)}
                >
                  <div
                    className="label-color-preview"
                    style={{ backgroundColor: label.color }}
                  />
                  <span className="label-name">
                    {label.name || 'Label sans nom'}
                  </span>
                  {isLabelSelected(label.id) && (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" className="label-check">
                      <path d="M20 6L9 17l-5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  )}
                </div>
              ))
            )}
          </div>
        </div>

        <div className="label-create-section">
          {!showCreateForm ? (
            <Button
              variant="secondary"
              size="small"
              onClick={() => setShowCreateForm(true)}
              className="create-label-button"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                <path d="M12 5v14m-7-7h14" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
              </svg>
              Créer un nouveau label
            </Button>
          ) : (
            <form onSubmit={handleCreateLabel} className="create-label-form">
              <h4 className="label-section-title">Créer un label</h4>
              <FormInput
                label="Nom du label"
                type="text"
                id="labelName"
                name="name"
                value={newLabel.name}
                onChange={(e) => setNewLabel(prev => ({ ...prev, name: e.target.value }))}
                placeholder="ex: Urgent, En cours..."
                required
              />
              
              <div className="color-selection">
                <label className="color-label">Couleur</label>
                <div className="color-grid">
                  {predefinedColors.map(color => (
                    <button
                      key={color}
                      type="button"
                      className={`color-option ${newLabel.color === color ? 'color-option--selected' : ''}`}
                      style={{ backgroundColor: color }}
                      onClick={() => setNewLabel(prev => ({ ...prev, color }))}
                    >
                      {newLabel.color === color && (
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
                          <path d="M20 6L9 17l-5-5" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      )}
                    </button>
                  ))}
                </div>
              </div>

              <div className="create-form-actions">
                <Button
                  type="button"
                  variant="secondary"
                  size="small"
                  onClick={() => setShowCreateForm(false)}
                  disabled={isCreating}
                >
                  Annuler
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  size="small"
                  disabled={isCreating || !newLabel.name.trim()}
                >
                  {isCreating ? 'Création...' : 'Créer'}
                </Button>
              </div>
            </form>
          )}
        </div>
      </div>
    </Modal>
  )
}

export default LabelSelectorModal