import React, { useState } from 'react'
import './ChecklistItem.css'

interface ChecklistItemData {
  id: number
  title: string
  is_completed: boolean
  todo_id: number
  position: number
  created_at: string
}

interface ChecklistItemProps {
  item: ChecklistItemData
  onToggle: (itemId: number, completed: boolean) => void
  onUpdate: (itemId: number, title: string) => void
  onDelete: (itemId: number) => void
}

const ChecklistItem: React.FC<ChecklistItemProps> = ({
  item,
  onToggle,
  onUpdate,
  onDelete
}) => {
  const [isEditing, setIsEditing] = useState(false)
  const [editTitle, setEditTitle] = useState(item.title)

  const handleSave = () => {
    if (editTitle.trim() && editTitle !== item.title) {
      onUpdate(item.id, editTitle.trim())
    }
    setIsEditing(false)
  }

  const handleCancel = () => {
    setEditTitle(item.title)
    setIsEditing(false)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSave()
    } else if (e.key === 'Escape') {
      handleCancel()
    }
  }

  return (
    <div className="checklist-item">
      <div 
        className={`checklist-checkbox ${item.is_completed ? 'completed' : ''}`}
        onClick={() => onToggle(item.id, !item.is_completed)}
      />
      
      {isEditing ? (
        <div className="checklist-item-edit">
          <input
            type="text"
            value={editTitle}
            onChange={(e) => setEditTitle(e.target.value)}
            onBlur={handleSave}
            onKeyDown={handleKeyDown}
            className="checklist-item-input"
            autoFocus
          />
        </div>
      ) : (
        <div 
          className={`checklist-item-text ${item.is_completed ? 'completed' : ''}`}
          onClick={() => setIsEditing(true)}
        >
          {item.title}
        </div>
      )}

      <button
        className="checklist-item-delete"
        onClick={() => onDelete(item.id)}
        title="Delete item"
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
          <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2"/>
        </svg>
      </button>
    </div>
  )
}

export default ChecklistItem