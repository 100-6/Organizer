import React from 'react'
import { useDrag } from 'react-dnd'
import './SimpleTodoCard.css'

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

interface SimpleTodoCardProps {
  todo: Todo
  onClick: () => void
}

const SimpleTodoCard: React.FC<SimpleTodoCardProps> = ({ todo, onClick }) => {
  const [{ isDragging }, drag] = useDrag({
    type: 'todo',
    item: { id: todo.id, listId: todo.list_id },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  })

  const formatDueDate = (date: string, time?: string | null) => {
    try {
      const dueDate = new Date(date)
      const today = new Date()
      const tomorrow = new Date(today)
      tomorrow.setDate(today.getDate() + 1)
      
      let dateStr = ''
      if (dueDate.toDateString() === today.toDateString()) {
        dateStr = 'Today'
      } else if (dueDate.toDateString() === tomorrow.toDateString()) {
        dateStr = 'Tomorrow'
      } else {
        dateStr = dueDate.toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric'
        })
      }
      
      if (time) {
        const [hours, minutes] = time.split(':')
        const hour12 = parseInt(hours) > 12 ? parseInt(hours) - 12 : parseInt(hours)
        const ampm = parseInt(hours) >= 12 ? 'PM' : 'AM'
        dateStr += ` ${hour12}:${minutes} ${ampm}`
      }
      
      return dateStr
    } catch (error) {
      return 'Invalid date'
    }
  }

  const isOverdue = (date: string, time?: string | null) => {
    try {
      const dueDate = new Date(date)
      if (time) {
        const [hours, minutes] = time.split(':')
        dueDate.setHours(parseInt(hours), parseInt(minutes))
      } else {
        dueDate.setHours(23, 59, 59)
      }
      return dueDate < new Date()
    } catch (error) {
      return false
    }
  }

  const hasLabels = todo.labels && todo.labels.length > 0
  const hasDueDate = todo.due_date
  const hasChecklist = todo.checklist_count > 0
  const hasAssignedUser = todo.assigned_username
  const hasDescription = todo.description && todo.description.trim().length > 0

  return (
    <div 
      ref={drag as any}
      className={`simple-todo-card ${isDragging ? 'simple-todo-card--dragging' : ''}`}
      onClick={onClick}
    >
      {hasLabels && (
        <div className="card-labels">
          {todo.labels.map(label => (
            <div
              key={label.id}
              className="card-label"
              style={{ backgroundColor: label.color }}
              title={label.name || 'Unnamed label'}
            />
          ))}
        </div>
      )}

      <h4 className="card-title">{todo.title}</h4>

      {(hasDueDate || hasChecklist || hasDescription || hasAssignedUser) && (
        <div className="card-badges">
          {hasDueDate && (
            <div className={`card-badge ${isOverdue(todo.due_date!, todo.due_time) ? 'card-badge--overdue' : ''}`}>
              <svg className="card-badge-icon" viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/>
                <path d="M12 6v6l4 2" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
              </svg>
              <span>{formatDueDate(todo.due_date!, todo.due_time)}</span>
            </div>
          )}

          {hasDescription && (
            <div className="card-badge">
              <svg className="card-badge-icon" viewBox="0 0 24 24" fill="none">
                <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" stroke="currentColor" strokeWidth="2"/>
                <polyline points="14,2 14,8 20,8" stroke="currentColor" strokeWidth="2"/>
                <line x1="16" y1="13" x2="8" y2="13" stroke="currentColor" strokeWidth="2"/>
                <line x1="16" y1="17" x2="8" y2="17" stroke="currentColor" strokeWidth="2"/>
              </svg>
            </div>
          )}

          {hasChecklist && (
            <div className="card-badge">
              <svg className="card-badge-icon" viewBox="0 0 24 24" fill="none">
                <path d="M9 11l3 3L22 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                <path d="M21 12c0 4.97-4.03 9-9 9s-9-4.03-9-9 4.03-9 9-9c1.67 0 3.22.46 4.56 1.25" stroke="currentColor" strokeWidth="2"/>
              </svg>
              <span>{todo.completed_checklist_count}/{todo.checklist_count}</span>
            </div>
          )}

          {hasAssignedUser && (
            <div className="card-members">
              <div className="card-member-avatar" title={todo.assigned_username!}>
                {todo.assigned_username!.charAt(0).toUpperCase()}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default SimpleTodoCard