import React, { useState } from 'react'
import ChecklistItem from './ChecklistItem'
import './Checklist.css'

interface ChecklistItemData {
  id: number
  text: string
  completed: boolean
  position: number
}

interface ChecklistProps {
  items: ChecklistItemData[]
  onItemToggle: (itemId: number, completed: boolean) => void
  onItemUpdate: (itemId: number, text: string) => void
  onItemDelete: (itemId: number) => void
  onItemAdd: (text: string) => void
}

const Checklist: React.FC<ChecklistProps> = ({
  items,
  onItemToggle,
  onItemUpdate,
  onItemDelete,
  onItemAdd
}) => {
  const [newItemText, setNewItemText] = useState('')
  const [isAdding, setIsAdding] = useState(false)

  const handleAddItem = () => {
    if (newItemText.trim()) {
      onItemAdd(newItemText.trim())
      setNewItemText('')
      setIsAdding(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleAddItem()
    } else if (e.key === 'Escape') {
      setNewItemText('')
      setIsAdding(false)
    }
  }

  const completedCount = items.filter(item => item.completed).length
  const totalCount = items.length

  return (
    <div className="checklist">
      <div className="checklist-header">
        <div className="checklist-title">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
            <path d="M9 11l3 3L22 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M21 12c0 4.97-4.03 9-9 9s-9-4.03-9-9 4.03-9 9-9c1.67 0 3.22.46 4.56 1.25" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          <span>Checklist</span>
        </div>
        {totalCount > 0 && (
          <span className="checklist-progress">
            {completedCount}/{totalCount}
          </span>
        )}
      </div>

      <div className="checklist-items">
        {items.map(item => (
          <ChecklistItem
            key={item.id}
            item={item}
            onToggle={onItemToggle}
            onUpdate={onItemUpdate}
            onDelete={onItemDelete}
          />
        ))}
      </div>

      {isAdding ? (
        <div className="checklist-add-item">
          <div className="checklist-checkbox-placeholder"></div>
          <input
            type="text"
            value={newItemText}
            onChange={(e) => setNewItemText(e.target.value)}
            onBlur={handleAddItem}
            onKeyDown={handleKeyPress}
            placeholder="Ajouter un élément..."
            className="checklist-add-input"
            autoFocus
          />
        </div>
      ) : (
        <button
          className="checklist-add-button"
          onClick={() => setIsAdding(true)}
          type="button"
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
            <path d="M12 5v14m-7-7h14" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
          </svg>
          Ajouter un élément
        </button>
      )}
    </div>
  )
}

export default Checklist 