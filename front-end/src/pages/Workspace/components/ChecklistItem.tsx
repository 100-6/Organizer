import React, { useState } from 'react'
import './ChecklistItem.css'

interface ChecklistItem {
  id: number
  text: string
  completed: boolean
  position: number
}

interface ChecklistItemProps {
  item: ChecklistItem
  onToggle: (itemId: number, completed: boolean) => void
  onUpdate: (itemId: number, text: string) => void
  onDelete: (itemId: number) => void
}

const ChecklistItem: React.FC<ChecklistItemProps> = ({
  item,
  onToggle,
  onUpdate,
  onDelete
}) => {
  const [isEditing, setIsEditing] = useState(false)
  const [editText, setEditText] = useState(item.text)

  const handleToggle = () => {
    onToggle(item.id, !item.completed)
  }

  const handleEdit = () => {
    setIsEditing(true)
  }

  const handleSave = () => {
    if (editText.trim()) {
      onUpdate(item.id, editText.trim())
    }
    setIsEditing(false)
  }

  const handleCancel = () => {
    setEditText(item.text)
    setIsEditing(false)
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSave()
    } else if (e.key === 'Escape') {
      handleCancel()
    }
  }

  return (
    <div className="checklist-item">
      <button
        className={`checklist-checkbox ${item.completed ? 'checklist-checkbox--checked' : ''}`}
        onClick={handleToggle}
        type="button"
      >
        {item.completed && (
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
            <path d="M20 6L9 17l-5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        )}
      </button>
      
      {isEditing ? (
        <input
          type="text"
          value={editText}
          onChange={(e) => setEditText(e.target.value)}
          onBlur={handleSave}
          onKeyDown={handleKeyPress}
          className="checklist-item-input"
          autoFocus
        />
      ) : (
        <span 
          className={`checklist-item-text ${item.completed ? 'checklist-item-text--completed' : ''}`}
          onClick={handleEdit}
        >
          {item.text}
        </span>
      )}
      
      <button
        className="checklist-item-delete"
        onClick={() => onDelete(item.id)}
        type="button"
      >
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
          <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
        </svg>
      </button>
    </div>
  )
}

export default ChecklistItem 