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
}

const TodoLabels: React.FC<TodoLabelsProps> = ({ labels }) => {
  if (!labels || labels.length === 0) {
    return null
  }

  return (
    <div className="todo-labels">
      {labels.map(label => (
        <span
          key={label.id}
          className="todo-label"
          style={{ backgroundColor: label.color || '#6b7280' }}
          title={label.name || 'Label sans nom'}
        >
          {label.name && (
            <span className="todo-label-text">{label.name}</span>
          )}
        </span>
      ))}
    </div>
  )
}

export default TodoLabels