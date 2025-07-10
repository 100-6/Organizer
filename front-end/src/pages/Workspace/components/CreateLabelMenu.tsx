import React, { useState, useRef, useEffect } from 'react'
import { Button } from '../../../components'
import './CreateLabelMenu.css'

interface CreateLabelMenuProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (labelData: { name: string; color: string }) => void
  position?: { x: number; y: number }
  error?: string
}

const CreateLabelMenu: React.FC<CreateLabelMenuProps> = ({
  isOpen,
  onClose,
  onSubmit,
  position,
  error
}) => {
  const [labelName, setLabelName] = useState('')
  const [selectedColor, setSelectedColor] = useState('#10b981')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    
    try {
      await onSubmit({
        name: labelName.trim(),
        color: selectedColor
      })
      
      setLabelName('')
      setSelectedColor('#10b981')
      onClose()
    } catch (error) {
      console.error('Error creating label:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleClose = () => {
    setLabelName('')
    setSelectedColor('#10b981')
    onClose()
  }

  if (!isOpen) return null

  return (
    <div 
      className="create-label-menu-overlay"
      onClick={onClose}
    >
      <div 
        ref={menuRef}
        className="create-label-menu"
        style={position ? {
          position: 'absolute',
          top: position.y,
          left: position.x
        } : undefined}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="create-label-menu-header">
          <h3>Créer un label</h3>
          <button 
            className="create-label-menu-close"
            onClick={handleClose}
            type="button"
          >
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit} className="create-label-form">
          <div className="form-group">
            <label className="form-label">Nom (optionnel)</label>
            <input
              type="text"
              value={labelName}
              onChange={(e) => setLabelName(e.target.value)}
              placeholder="Nom du label..."
              className="form-input"
              maxLength={50}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Couleur</label>
            <div className="color-grid">
              {predefinedColors.map(color => (
                <button
                  key={color}
                  type="button"
                  className={`color-option ${selectedColor === color ? 'color-option--selected' : ''}`}
                  style={{ backgroundColor: color }}
                  onClick={() => setSelectedColor(color)}
                >
                  {selectedColor === color && (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                      <path d="M20 6L9 17l-5-5" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  )}
                </button>
              ))}
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Aperçu</label>
            <div className="label-preview">
              <span
                className="label-preview-item"
                style={{ backgroundColor: selectedColor }}
              >
                {labelName || 'Label sans nom'}
              </span>
            </div>
          </div>

          {error && (
            <div className="form-error">
              {error}
            </div>
          )}

          <div className="create-label-actions">
            <Button
              type="button"
              variant="secondary"
              size="small"
              onClick={handleClose}
              disabled={isSubmitting}
            >
              Annuler
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="small"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Création...' : 'Créer'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default CreateLabelMenu 