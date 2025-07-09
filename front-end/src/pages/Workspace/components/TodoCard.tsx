import { useState, useRef } from 'react'
import { useDrag } from 'react-dnd'
import { Avatar } from '../../../components'
import './TodoCard.css'

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

interface TodoCardProps {
  todo: Todo
  labels: Label[]
  onEdit: () => void
  onDelete: () => void
}

const TodoCard = ({ todo, labels, onEdit, onDelete }: TodoCardProps) => {
  const [showMenu, setShowMenu] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  const [{ isDragging }, drag] = useDrag({
    type: 'todo',
    item: { id: todo.id, listId: todo.list_id },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  })

  const formatDueDate = (date: string, time?: string | null) => {
    const dueDate = new Date(date)
    const today = new Date()
    const tomorrow = new Date(today)
    tomorrow.setDate(today.getDate() + 1)
    
    let dateStr = ''
    if (dueDate.toDateString() === today.toDateString()) {
      dateStr = 'Aujourd\'hui'
    } else if (dueDate.toDateString() === tomorrow.toDateString()) {
      dateStr = 'Demain'
    } else {
      dateStr = dueDate.toLocaleDateString('fr-FR', { 
        day: 'numeric', 
        month: 'short' 
      })
    }
    
    if (time) {
      const [hours, minutes] = time.split(':')
      dateStr += ` à ${hours}:${minutes}`
    }
    
    return dateStr
  }

  const isOverdue = (date: string, time?: string | null) => {
    const dueDate = new Date(date)
    if (time) {
      const [hours, minutes] = time.split(':')
      dueDate.setHours(parseInt(hours), parseInt(minutes))
    }
    return dueDate < new Date()
  }

  const getChecklistProgress = () => {
    if (todo.checklist_count === 0) return null
    return `${todo.completed_checklist_count}/${todo.checklist_count}`
  }

  return (
    <div 
      ref={drag}
      className={`todo-card ${isDragging ? 'todo-card--dragging' : ''}`}
      onClick={onEdit}
    >
      {todo.labels.length > 0 && (
        <div className="todo-labels">
          {todo.labels.map(label => (
            <span
              key={label.id}
              className="todo-label"
              style={{ backgroundColor: label.color }}
              title={label.name || 'Label sans nom'}
            >
              {label.name && (
                <span className="todo-label-text">{label.name}</span>
              )}
            </span>
          ))}
        </div>
      )}

      <div className="todo-content">
        <h4 className="todo-title">{todo.title}</h4>
        {todo.description && (
          <p className="todo-description">{todo.description}</p>
        )}
      </div>

      <div className="todo-footer">
        <div className="todo-footer-left">
          {todo.due_date && (
            <div className={`todo-due-date ${isOverdue(todo.due_date, todo.due_time) ? 'todo-due-date--overdue' : ''}`}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/>
                <path d="M12 6v6l4 2" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
              </svg>
              <span>{formatDueDate(todo.due_date, todo.due_time)}</span>
            </div>
          )}
          
          {getChecklistProgress() && (
            <div className="todo-checklist">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
                <path d="M9 11l3 3L22 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M21 12c0 4.97-4.03 9-9 9s-9-4.03-9-9 4.03-9 9-9c1.67 0 3.22.46 4.56 1.25" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              <span>{getChecklistProgress()}</span>
            </div>
          )}
        </div>

        <div className="todo-footer-right">
          {todo.assigned_username && (
            <Avatar 
              name={todo.assigned_username} 
              size="small" 
            />
          )}
          
          <div className="todo-menu" ref={menuRef}>
            <button 
              className="todo-menu-button"
              onClick={(e) => {
                e.stopPropagation()
                setShowMenu(!showMenu)
              }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                <path d="M12 13a1 1 0 100-2 1 1 0 000 2zM12 6a1 1 0 100-2 1 1 0 000 2zM12 20a1 1 0 100-2 1 1 0 000 2z" fill="currentColor"/>
              </svg>
            </button>
            
            {showMenu && (
              <div className="todo-menu-dropdown">
                <button 
                  className="todo-menu-item"
                  onClick={(e) => {
                    e.stopPropagation()
                    onEdit()
                    setShowMenu(false)
                  }}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                    <path d="M21.174 6.812a1 1 0 00-3.986-3.987L3.842 16.174a2 2 0 00-.5.83l-1.321 4.352a.5.5 0 00.623.622l4.353-1.32a2 2 0 00.83-.497z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M15 5l4 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  Modifier
                </button>
                <button 
                  className="todo-menu-item todo-menu-item--danger"
                  onClick={(e) => {
                    e.stopPropagation()
                    onDelete()
                    setShowMenu(false)
                  }}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                    <path d="M3 6h18M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    <line x1="10" y1="11" x2="10" y2="17" stroke="currentColor" strokeWidth="2"/>
                    <line x1="14" y1="11" x2="14" y2="17" stroke="currentColor" strokeWidth="2"/>
                  </svg>
                  Supprimer
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default TodoCard