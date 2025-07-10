import { useState } from 'react'
import { Modal, FormInput, Button } from '../../../components'
import './CreateTodoModal.css'

interface CreateLabelModalProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (labelData: { name: string; color: string }) => void
}

const CreateLabelModal = ({ isOpen, onClose, onSubmit }: CreateLabelModalProps) => {
  const [formData, setFormData] = useState({
    name: '',
    color: '#4b5563'
  })
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    try {
      await onSubmit({
        name: formData.name,
        color: formData.color
      })
      setFormData({ name: '', color: '#4b5563' })
      onClose()
    } catch (error) {
      console.error('Error creating label:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleClose = () => {
    setFormData({ name: '', color: '#4b5563' })
    onClose()
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Nouveau label"
      size="small"
    >
      <form onSubmit={handleSubmit} className="create-todo-form">
        <h3 className="section-title">Nom du label</h3>
        <FormInput
          label="Nom"
          type="text"
          id="labelName"
          name="name"
          value={formData.name}
          onChange={e => setFormData(prev => ({ ...prev, name: e.target.value }))}
          placeholder="Nom du label"
          required
        />
        <h3 className="section-title">Couleur</h3>
        <FormInput
          label="Couleur"
          type="color"
          id="labelColor"
          name="color"
          value={formData.color}
          onChange={e => setFormData(prev => ({ ...prev, color: e.target.value }))}
        />
        <div className="modal-actions">
          <Button type="button" variant="secondary" onClick={handleClose}>
            Annuler
          </Button>
          <Button type="submit" variant="primary" disabled={isSubmitting || !formData.name.trim()}>
            {isSubmitting ? 'Création...' : 'Créer le label'}
          </Button>
        </div>
      </form>
    </Modal>
  )
}

export default CreateLabelModal