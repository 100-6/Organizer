import { useState } from 'react'
import { Modal, FormInput, Button } from '../../../components'
import './CreateLabelModal.css'

interface CreateLabelModalProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (labelData: { name: string; color: string }) => void
}

const CreateLabelModal = ({ 
  isOpen, 
  onClose, 
  onSubmit 
}: CreateLabelModalProps) => {
  const [formData, setFormData] = useState({
    name: '',
    color: '#10b981'
  })
  const [isSubmitting, setIsSubmitting] = useState(false)

  const predefinedColors = [
    '#ef4444', // Red
    '#f59e0b', // Orange
    '#eab308', // Yellow
    '#22c55e', // Green
    '#10b981', // Emerald
    '#06b6d4', // Cyan
    '#3b82f6', // Blue
    '#6366f1', // Indigo
    '#8b5cf6', // Violet
    '#a855f7', // Purple
    '#d946ef', // Fuchsia
    '#ec4899', // Pink
    '#64748b', // Gray
    '#1e293b', // Slate
    '#dc2626', // Dark Red
    '#7c3aed', // Dark Purple
  ]

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    
    try {
      await onSubmit({
        name: formData.name.trim(),
        color: formData.color
      })
      
      setFormData({
        name: '',
        color: '#10b981'
      })
    } catch (error) {
      console.error('Error creating label:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleClose = () => {
    setFormData({
      name: '',
      color: '#10b981'
    })
    onClose()
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Nouveau label"
      size="small"
    >
      <form onSubmit={handleSubmit} className="create-label-form">
        <FormInput
          label="Nom du label (optionnel)"
          type="text"
          id="name"
          name="name"
          value={formData.name}
          onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
          placeholder="ex: Urgent, En cours, Terminé..."
        />

        <div className="color-section">
          <label className="form-label">Couleur</label>
          
          <div className="color-preview">
            <div 
              className="color-preview-box"
              style={{ backgroundColor: formData.color }}
            >
              {formData.name && (
                <span className="color-preview-text">
                  {formData.name}
                </span>
              )}
            </div>
          </div>

          <div className="color-options">
            {predefinedColors.map(color => (
              <button
                key={color}
                type="button"
                className={`color-option ${formData.color === color ? 'color-option--selected' : ''}`}
                style={{ backgroundColor: color }}
                onClick={() => setFormData(prev => ({ ...prev, color }))}
                title={color}
              >
                {formData.color === color && (
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                    <path d="M20 6L9 17l-5-5" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                )}
              </button>
            ))}
          </div>

          <div className="custom-color-section">
            <label htmlFor="customColor" className="custom-color-label">
              Couleur personnalisée
            </label>
            <input
              type="color"
              id="customColor"
              value={formData.color}
              onChange={(e) => setFormData(prev => ({ ...prev, color: e.target.value }))}
              className="custom-color-input"
            />
          </div>
        </div>

        <div className="label-info">
          <p className="label-info-text">
            💡 Les labels sans nom apparaissent comme une barre de couleur sur les cartes.
          </p>
        </div>

        <div className="modal-actions">
          <Button 
            type="button" 
            variant="secondary" 
            onClick={handleClose}
          >
            Annuler
          </Button>
          <Button 
            type="submit" 
            variant="primary"
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Création...' : 'Créer le label'}
          </Button>
        </div>
      </form>
    </Modal>
  )
}

export default CreateLabelModal