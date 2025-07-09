import { useState, useEffect } from 'react'
import { Modal, FormInput, FormTextarea, Button } from '../../../components'
import './EditTodoModal.css'

interface Todo {
  id: number
  title: string
  description: string | null
  list_id: number
  assigned_to: number | null
  assigned_username: string | null
  due_date: string | null
  due_time: string | null
  position: number
  created_at: string
  checklist_count: number
  completed_checklist_count: number
  labels: Label[]
}

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

interface EditTodoModalProps {
  isOpen: boolean
  onClose: () => void
  todo: Todo | null
  onSubmit: (todoId: number, todoData: any) => void
  labels: Label[]
  members: Member[]
}

const EditTodoModal = ({ 
  isOpen, 
  onClose, 
  todo, 
  onSubmit, 
  labels, 
  members 
}: EditTodoModalProps) => {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    assignedTo: '',
    dueDate: '',
    dueTime: '',
    selectedLabels: [] as number[]
  })
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    if (todo && isOpen) {
      setFormData({
        title: todo.title,
        description: todo.description || '',
        assignedTo: todo.assigned_to ? todo.assigned_to.toString() : '',
        dueDate: todo.due_date || '',
        dueTime: todo.due_time || '',
        selectedLabels: todo.labels.map(label => label.id)
      })
    }
  }, [todo, isOpen])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!todo) return
    
    setIsSubmitting(true)
    
    try {
      await onSubmit(todo.id, {
        title: formData.title,
        description: formData.description || null,
        assignedTo: formData.assignedTo ? parseInt(formData.assignedTo) : null,
        dueDate: formData.dueDate || null,
        dueTime: formData.dueTime || null,
        labels: formData.selectedLabels
      })
    } catch (error) {
      console.error('Error updating todo:', error)
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

  if (!todo) return null

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Modifier la tâche"
      size="medium"
    >
      <form onSubmit={handleSubmit} className="edit-todo-form">
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

        <div className="todo-meta">
          <div className="todo-meta-item">
            <span className="todo-meta-label">Créé le</span>
            <span className="todo-meta-value">
              {new Date(todo.created_at).toLocaleDateString('fr-FR', {
                day: 'numeric',
                month: 'long',
                year: 'numeric'
              })}
            </span>
          </div>
          {todo.checklist_count > 0 && (
            <div className="todo-meta-item">
              <span className="todo-meta-label">Checklist</span>
              <span className="todo-meta-value">
                {todo.completed_checklist_count}/{todo.checklist_count} terminé(s)
              </span>
            </div>
          )}
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
            {isSubmitting ? 'Modification...' : 'Modifier la tâche'}
          </Button>
        </div>
      </form>
    </Modal>
  )
}

export default EditTodoModal