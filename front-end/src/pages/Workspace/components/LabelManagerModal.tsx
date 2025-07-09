import { useState } from 'react'
import { Modal, FormInput, Button } from '../../../components'
import './LabelManagerModal.css'

interface Label {
  id: number
  name: string | null
  color: string
  workspace_id: number
  created_at: string
}

interface LabelManagerModalProps {
  isOpen: boolean
  onClose: () => void
  labels: Label[]
  onLabelUpdated: () => void
  onLabelDeleted: () => void
  workspaceId: string | undefined
}

const LabelManagerModal = ({
  isOpen,
  onClose,
  labels,
  onLabelUpdated,
  onLabelDeleted,
  workspaceId
}: LabelManagerModalProps) => {
  const [editingLabel, setEditingLabel] = useState<Label | null>(null)
  const [editForm, setEditForm] = useState({ name: '', color: '#10b981' })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')

  const handleEditClick = (label: Label) => {
    setEditingLabel(label)
    setEditForm({ name: label.name || '', color: label.color })
  }

  const handleEditChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEditForm(prev => ({ ...prev, [e.target.name]: e.target.value }))
  }

  const handleColorChange = (color: string) => {
    setEditForm(prev => ({ ...prev, color }))
  }

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingLabel) return
    setIsSubmitting(true)
    setError('')
    try {
      const token = localStorage.getItem('accessToken')
      const response = await fetch(`/api/labels/${editingLabel.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          name: editForm.name.trim(),
          color: editForm.color
        })
      })
      if (response.ok) {
        setEditingLabel(null)
        onLabelUpdated()
      } else {
        const data = await response.json()
        setError(data.error || 'Erreur lors de la modification du label')
      }
    } catch (err) {
      setError('Erreur de connexion')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDeleteLabel = async (labelId: number) => {
    if (!window.confirm('Supprimer ce label ?')) return
    setIsSubmitting(true)
    setError('')
    try {
      const token = localStorage.getItem('accessToken')
      const response = await fetch(`/api/labels/${labelId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      })
      if (response.ok) {
        if (editingLabel && editingLabel.id === labelId) setEditingLabel(null)
        onLabelDeleted()
      } else {
        const data = await response.json()
        setError(data.error || 'Erreur lors de la suppression du label')
      }
    } catch (err) {
      setError('Erreur de connexion')
    } finally {
      setIsSubmitting(false)
    }
  }

  const predefinedColors = [
    '#ef4444', '#f59e0b', '#eab308', '#22c55e', '#10b981', '#06b6d4',
    '#3b82f6', '#6366f1', '#8b5cf6', '#a855f7', '#d946ef', '#ec4899',
    '#64748b', '#1e293b', '#dc2626', '#7c3aed'
  ]

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Gérer les labels" size="small">
      {error && <div className="alert alert-error">{error}</div>}
      <div className="label-manager-list">
        {labels.length === 0 && <p>Aucun label pour ce workspace.</p>}
        {labels.map(label => (
          <div key={label.id} className="label-manager-item">
            <span className="label-color-preview" style={{ backgroundColor: label.color }} />
            <span className="label-name">{label.name || <em>Sans nom</em>}</span>
            <Button size="small" variant="secondary" onClick={() => handleEditClick(label)}>
              Modifier
            </Button>
            <Button size="small" variant="danger" onClick={() => handleDeleteLabel(label.id)}>
              Supprimer
            </Button>
          </div>
        ))}
      </div>
      {editingLabel && (
        <form onSubmit={handleEditSubmit} className="edit-label-form">
          <h4>Modifier le label</h4>
          <FormInput
            label="Nom du label (optionnel)"
            type="text"
            id="editLabelName"
            name="name"
            value={editForm.name}
            onChange={handleEditChange}
            placeholder="ex: Urgent, En cours, Terminé..."
          />
          <div className="color-section">
            <label className="form-label">Couleur</label>
            <div className="color-options">
              {predefinedColors.map(color => (
                <button
                  key={color}
                  type="button"
                  className={`color-option ${editForm.color === color ? 'color-option--selected' : ''}`}
                  style={{ backgroundColor: color }}
                  onClick={() => handleColorChange(color)}
                  title={color}
                >
                  {editForm.color === color && (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                      <path d="M20 6L9 17l-5-5" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  )}
                </button>
              ))}
            </div>
            <div className="custom-color-section">
              <label htmlFor="editCustomColor" className="custom-color-label">
                Couleur personnalisée
              </label>
              <input
                type="color"
                id="editCustomColor"
                value={editForm.color}
                onChange={e => handleColorChange(e.target.value)}
                className="custom-color-input"
              />
            </div>
          </div>
          <div className="modal-actions">
            <Button type="button" variant="secondary" onClick={() => setEditingLabel(null)}>
              Annuler
            </Button>
            <Button type="submit" variant="primary" disabled={isSubmitting}>
              {isSubmitting ? 'Modification...' : 'Modifier'}
            </Button>
          </div>
        </form>
      )}
    </Modal>
  )
}

export default LabelManagerModal 