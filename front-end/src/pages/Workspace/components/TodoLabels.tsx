import React from 'react'
import './TodoLabels.css'

interface Label {
  id: number
  name: string | null
  color: string
  workspace_id: number
  created_at: string
}

interface TodoLabelsProps {
  labels: Label[]
  onLabelClick?: (labelId: number) => void
  showAddButton?: boolean
  onAddLabel?: (e: React.MouseEvent<HTMLButtonElement>) => void
}

const TodoLabels: React.FC<TodoLabelsProps> = ({
  labels,
  onLabelClick,
  showAddButton = false,
  onAddLabel
}) => {
  if (!labels || labels.length === 0) {
    if (!showAddButton) {
      return null
    }
    return (
      <div className="todo-labels">
        <button
          className="todo-label-add-button"
          onClick={onAddLabel}
          type="button"
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
            <path d="M12 5v14m-7-7h14" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
          </svg>
          Ajouter un label
        </button>
      </div>
    )
  }

  return (
    <div className="todo-labels">
      {labels.map(label => (
        <span
          key={label.id}
          className={`todo-label ${onLabelClick ? 'todo-label--clickable' : ''}`}
          style={{ backgroundColor: label.color || '#6b7280' }}
          title={label.name || 'Label sans nom'}
          onClick={() => onLabelClick && onLabelClick(label.id)}
        >
          {label.name && (
            <span className="todo-label-text">{label.name}</span>
          )}
        </span>
      ))}
      {showAddButton && (
        <button
          className="todo-label-add-button"
          onClick={onAddLabel}
          type="button"
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
            <path d="M12 5v14m-7-7h14" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
          </svg>
        </button>
      )}
    </div>
  )
}

export default TodoLabels 