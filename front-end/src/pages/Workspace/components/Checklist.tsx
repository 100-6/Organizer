import React, { useState, useEffect } from 'react'
import ChecklistItem from './ChecklistItem'
import AddChecklistItem from './AddChecklistItem'
import './Checklist.css'

interface ChecklistItemData {
  id: number
  title: string
  is_completed: boolean
  todo_id: number
  position: number
  created_at: string
}

interface ChecklistProps {
  todoId: number
  items: ChecklistItemData[]
  onAddItem: (title: string) => void
  onToggleItem: (itemId: number, completed: boolean) => void
  onUpdateItem: (itemId: number, title: string) => void
  onDeleteItem: (itemId: number) => void
  onDeleteChecklist: () => void
}

const Checklist: React.FC<ChecklistProps> = ({
  items,
  onAddItem,
  onToggleItem,
  onUpdateItem,
  onDeleteItem,
  onDeleteChecklist
}) => {
  const [showAddItem, setShowAddItem] = useState(false)
  const [isExpanded, setIsExpanded] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

  // Écouter l'événement pour déplier automatiquement
  useEffect(() => {
    const handleExpandChecklist = () => {
      setIsExpanded(true)
    }

    window.addEventListener('expandChecklist', handleExpandChecklist)
    return () => {
      window.removeEventListener('expandChecklist', handleExpandChecklist)
    }
  }, [])

  const completedCount = items.filter(item => item.is_completed).length
  const totalCount = items.length
  const progressPercentage = totalCount > 0 ? (completedCount / totalCount) * 100 : 0
  
  const getProgressColor = () => {
    if (progressPercentage === 0) return '#d1d5db'
    if (progressPercentage < 30) return '#ef4444'
    if (progressPercentage < 70) return '#f59e0b'
    if (progressPercentage < 100) return '#3b82f6'
    return '#10b981'
  }

  const sortedItems = [...items].sort((a, b) => a.position - b.position)

  return (
    <>
      <div className="card-section-header" onClick={() => setIsExpanded(!isExpanded)}>
        <div className="checklist-title-section">
          <svg className="card-section-icon" width="16" height="16" viewBox="0 0 24 24" fill="none">
            <path d="M9 12l2 2 4-4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M21 12c0 4.97-4.03 9-9 9s-9-4.03-9-9 4.03-9 9-9c1.67 0 3.22.46 4.56 1.25" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          <h3 className="card-section-title">Checklist</h3>
        </div>
        <div className="checklist-progress-section">
          <div className="checklist-progress-text">
            {completedCount}/{totalCount}
          </div>
          <svg 
            className={`checklist-expand-icon ${isExpanded ? 'expanded' : ''}`} 
            width="16" 
            height="16" 
            viewBox="0 0 24 24" 
            fill="none"
          >
            <path d="M9 18l6-6-6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </div>
        <button 
          className="checklist-delete-button"
          onClick={(e) => {
            e.stopPropagation()
            setShowDeleteConfirm(true)
          }}
          title="Supprimer la checklist"
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
            <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
          </svg>
        </button>
      </div>

      <div className="checklist-progress-bar">
        <div 
          className="checklist-progress-fill" 
          style={{ 
            width: `${progressPercentage}%`,
            backgroundColor: getProgressColor()
          }}
        />
      </div>

      {isExpanded && (
        <div className="checklist-content">
          <div className="checklist-items">
            {sortedItems.map((item) => (
              <ChecklistItem
                key={item.id}
                item={item}
                onToggle={onToggleItem}
                onUpdate={onUpdateItem}
                onDelete={onDeleteItem}
              />
            ))}
          </div>

          {showAddItem ? (
            <div className="add-checklist-item-container">
              <AddChecklistItem
                onAdd={(title) => {
                  onAddItem(title)
                  setShowAddItem(false)
                }}
                placeholder="Add an item..."
              />
              <button 
                className="cancel-add-item"
                onClick={(e) => {
                  e.stopPropagation()
                  setShowAddItem(false)
                }}
              >
                Cancel
              </button>
            </div>
          ) : (
            <button 
              className="add-checklist-item-button"
              onClick={(e) => {
                e.stopPropagation()
                setShowAddItem(true)
              }}
            >
              Add an item
            </button>
          )}
        </div>
      )}
      
      {showDeleteConfirm && (
        <div className="delete-confirm-overlay" onClick={() => setShowDeleteConfirm(false)}>
          <div className="delete-confirm-modal" onClick={(e) => e.stopPropagation()}>
            <h3>Supprimer la checklist</h3>
            <p>Êtes-vous sûr de vouloir supprimer cette checklist ? Cette action est irréversible.</p>
            <div className="delete-confirm-buttons">
              <button 
                className="btn-cancel"
                onClick={() => setShowDeleteConfirm(false)}
              >
                Annuler
              </button>
              <button 
                className="btn-delete"
                onClick={() => {
                  setShowDeleteConfirm(false)
                  onDeleteChecklist()
                }}
              >
                Supprimer
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

export default Checklist