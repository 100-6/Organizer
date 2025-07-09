import { useState } from 'react'
import { Modal, FormInput, FormTextarea, Button } from '../../../components'
import './CreateTodoModal.css'

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

interface CreateTodoModalProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (todoData: any) => void
  labels: Label[]
  members: Member[]
}

const CreateTodoModal = ({ 
  isOpen, 
  onClose, 
  onSubmit, 
  labels, 
  members 
}: CreateTodoModalProps) => {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    assignedTo: '',
    dueDate: '',
    dueTime: '',
    selectedLabels: [] as number[]
  })
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    
    try {
      await onSubmit({
        title: formData.title,
        description: formData.description || null,
        assignedTo: formData.assignedTo ? parseInt(formData.assignedTo) : null,
        dueDate: formData.dueDate || null,
        dueTime: formData.dueTime || null,
        labels: formData.selectedLabels
      })
      
      setFormData({
        title: '',
        description: '',
        assignedTo: '',
        dueDate: '',
        dueTime: '',
        selectedLabels: []
      })
    } catch (error) {
      console.error('Error creating todo:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleLabelToggle = (labelId: number) => {
    setFormData(prev => ({
      ...prev,
      selectedLabels: prev.selectedLabels.includes(labelId)
        ? prev.selectedLabels.filter(id => id !== labelId)
        : [...prev.selectedLabels, labelId]
    }))
  }

  const handleClose = () => {
    setFormData({
      title: '',
      description: '',
      assignedTo: '',
      dueDate: '',
      dueTime: '',
      selectedLabels: []
    })
    onClose()
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Nouvelle tâche"
      size="medium"
    >
      <form onSubmit={handleSubmit} className="create-todo-form">
        <FormInput
          label="Titre"
          type="text"
          id="title"
          name="title"
          value={formData.title}
          onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
          placeholder="Qu'est-ce qui doit être fait ?"
          required
        />

        <FormTextarea
          label="Description (optionnelle)"
          id="description"
          name="description"
          value={formData.description}
          onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
          placeholder="Ajoutez une description détaillée..."
          rows={3}
        />

        <div className="form-row">
          <div className="form-group">
            <label htmlFor="assignedTo" className="form-label">
              Assigner à
            </label>
            <select
              id="assignedTo"
              name="assignedTo"
              value={formData.assignedTo}
              onChange={(e) => setFormData(prev => ({ ...prev, assignedTo: e.target.value }))}
              className="form-select"
            >
              <option value="">Personne</option>
              {members.map(member => (
                <option key={member.id} value={member.id}>
                  {member.username}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <FormInput
              label="Date d'échéance"
              type="date"
              id="dueDate"
              name="dueDate"
              value={formData.dueDate}
              onChange={(e) => setFormData(prev => ({ ...prev, dueDate: e.target.value }))}
            />
          </div>
          <div className="form-group">
            <FormInput
              label="Heure"
              type="time"
              id="dueTime"
              name="dueTime"
              value={formData.dueTime}
              onChange={(e) => setFormData(prev => ({ ...prev, dueTime: e.target.value }))}
            />
          </div>
        </div>

        {labels.length > 0 && (
          <div className="form-group">
            <label className="form-label">Labels</label>
            <div className="labels-grid">
              {labels.map(label => (
                <button
                  key={label.id}
                  type="button"
                  className={`label-option ${formData.selectedLabels.includes(label.id) ? 'label-option--selected' : ''}`}
                  onClick={() => handleLabelToggle(label.id)}
                  style={{ backgroundColor: label.color }}
                >
                  {label.name || 'Sans nom'}
                  {formData.selectedLabels.includes(label.id) && (
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
                      <path d="M20 6L9 17l-5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  )}
                </button>
              ))}
            </div>
          </div>
        )}

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
            disabled={isSubmitting || !formData.title.trim()}
          >
            {isSubmitting ? 'Création...' : 'Créer la tâche'}
          </Button>
        </div>
      </form>
    </Modal>
  )
}

export default CreateTodoModal  