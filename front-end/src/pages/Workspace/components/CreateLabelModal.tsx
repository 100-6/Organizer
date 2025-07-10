import { useState } from 'react'
import { Modal, FormInput, FormTextarea, Button } from '../../../components'
import LabelSelectorModal from './LabelSelectorModal'
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
  workspaceId: string
  onLabelsUpdated: () => void
}

const CreateTodoModal = ({ 
  isOpen, 
  onClose, 
  onSubmit, 
  labels, 
  members,
  workspaceId,
  onLabelsUpdated
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
  const [showLabelSelector, setShowLabelSelector] = useState(false)

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

  const handleToggleLabel = (labelId: number) => {
    setFormData(prev => ({
      ...prev,
      selectedLabels: prev.selectedLabels.includes(labelId)
        ? prev.selectedLabels.filter(id => id !== labelId)
        : [...prev.selectedLabels, labelId]
    }))
  }

  const handleCreateLabel = async (labelData: { name: string; color: string }) => {
    try {
      const token = localStorage.getItem('accessToken')
      const response = await fetch('/api/labels', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          name: labelData.name,
          color: labelData.color,
          workspaceId: workspaceId
        })
      })
      
      if (response.ok) {
        const newLabel = await response.json()
        if (newLabel.label && newLabel.label.id) {
          setFormData(prev => ({
            ...prev,
            selectedLabels: [...prev.selectedLabels, newLabel.label.id]
          }))
        }
        onLabelsUpdated()
      }
    } catch (error) {
      console.error('Error creating label:', error)
    }
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

  const selectedLabels = labels.filter(label => formData.selectedLabels.includes(label.id))

  return (
    <>
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

          <div className="form-group">
            <div className="labels-section">
              <div className="labels-header">
                <label className="form-label">Labels</label>
                <Button
                  type="button"
                  variant="secondary"
                  size="small"
                  onClick={() => setShowLabelSelector(true)}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                    <path d="M20.59 13.41l-7.17 7.17a2 2 0 01-2.83 0L2 12V2h10l8.59 8.59a2 2 0 010 2.82z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    <circle cx="7" cy="7" r="1.5" fill="currentColor"/>
                  </svg>
                  Labels
                </Button>
              </div>
              {selectedLabels.length > 0 && (
                <div className="current-labels">
                  {selectedLabels.map(label => (
                    <span
                      key={label.id}
                      className="current-label"
                      style={{ backgroundColor: label.color }}
                    >
                      {label.name || 'Sans nom'}
                    </span>
                  ))}
                </div>
              )}
            </div>
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
              disabled={isSubmitting || !formData.title.trim()}
            >
              {isSubmitting ? 'Création...' : 'Créer la tâche'}
            </Button>
          </div>
        </form>
      </Modal>

      <LabelSelectorModal
        isOpen={showLabelSelector}
        onClose={() => setShowLabelSelector(false)}
        labels={labels}
        selectedLabels={selectedLabels}
        onToggleLabel={handleToggleLabel}
        onCreateLabel={handleCreateLabel}
        workspaceId={workspaceId}
      />
    </>
  )
}

export default CreateTodoModal