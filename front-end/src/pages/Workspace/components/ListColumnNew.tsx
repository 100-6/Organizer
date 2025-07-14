import React, { useState, useRef } from 'react'
import { useDrag, useDrop } from 'react-dnd'
import { useWorkspaceData, type List } from '../../../contexts/WorkspaceDataContext'
import SimpleTodoCardNew from './SimpleTodoCardNew'
import './ListColumn.css'

interface ListColumnProps {
  list: List
  index: number
  onCardClick: (todoId: number) => void
  onChecklistClick: (todoId: number) => void
  moveCard: (dragIndex: number, hoverIndex: number, sourceListId: number, targetListId: number) => void
  moveList: (dragIndex: number, hoverIndex: number) => void
  labelsExpanded: boolean
  setLabelsExpanded: (expanded: boolean) => void
}

const ListColumn: React.FC<ListColumnProps> = ({
  list,
  index,
  onCardClick,
  onChecklistClick,
  moveCard,
  moveList,
  labelsExpanded,
  setLabelsExpanded
}) => {
  const { actions } = useWorkspaceData()
  const [showAddCard, setShowAddCard] = useState(false)
  const [newCardTitle, setNewCardTitle] = useState('')
  const [isCreatingCard, setIsCreatingCard] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  const [{ isDragging }, drag] = useDrag({
    type: 'list',
    item: { id: list.id, index, type: 'list' },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  })

  const [{ isOver, canDrop }, drop] = useDrop({
    accept: ['list', 'card'],
    hover: (draggedItem: any) => {
      if (draggedItem.type === 'list') {
        if (draggedItem.index !== index) {
          moveList(draggedItem.index, index)
          draggedItem.index = index
        }
      }
    },
    drop: (draggedItem: any) => {
      if (draggedItem.type === 'card' && draggedItem.listId !== list.id) {
        // Card dropped on this list from another list
        moveCard(draggedItem.index, list.todos.length, draggedItem.listId, list.id)
      }
    },
    collect: (monitor) => ({
      isOver: monitor.isOver(),
      canDrop: monitor.canDrop(),
    }),
  })

  drag(drop(ref))

  const handleAddCard = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newCardTitle.trim()) return

    setIsCreatingCard(true)
    try {
      const token = localStorage.getItem('accessToken')
      const response = await fetch('/api/todos', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          title: newCardTitle.trim(),
          listId: list.id,
          position: list.todos.length
        })
      })

      if (response.ok) {
        setNewCardTitle('')
        setShowAddCard(false)
        // Reload workspace to get the new todo
        await actions.loadWorkspace(list.workspace_id.toString())
      } else {
        const data = await response.json()
        console.error('Error creating todo:', data.error)
      }
    } catch (error) {
      console.error('Error creating todo:', error)
    } finally {
      setIsCreatingCard(false)
    }
  }

  return (
    <div
      ref={ref}
      className={`list-column ${isDragging ? 'list-column--dragging' : ''} ${isOver && canDrop ? 'list-column--drop-target' : ''}`}
    >
      <div className="list-header">
        <h3 className="list-title" title={list.name}>
          {list.name}
        </h3>
        <div className="list-actions">
          <button className="list-action-button" title="List options">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
              <circle cx="12" cy="12" r="1" stroke="currentColor" strokeWidth="2"/>
              <circle cx="19" cy="12" r="1" stroke="currentColor" strokeWidth="2"/>
              <circle cx="5" cy="12" r="1" stroke="currentColor" strokeWidth="2"/>
            </svg>
          </button>
        </div>
      </div>

      <div className="list-content">
        <div className="todos-container">
          {list.todos.map((todo, todoIndex) => (
            <SimpleTodoCardNew
              key={todo.id}
              todo={todo}
              onClick={() => onCardClick(todo.id)}
              onChecklistClick={() => onChecklistClick(todo.id)}
              index={todoIndex}
              listId={list.id}
              moveCard={moveCard}
              labelsExpanded={labelsExpanded}
              setLabelsExpanded={setLabelsExpanded}
            />
          ))}
        </div>

        {showAddCard ? (
          <form onSubmit={handleAddCard} className="add-card-form">
            <textarea
              value={newCardTitle}
              onChange={(e) => setNewCardTitle(e.target.value)}
              placeholder="Enter a title for this card..."
              autoFocus
              rows={3}
              className="add-card-textarea"
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault()
                  handleAddCard(e)
                } else if (e.key === 'Escape') {
                  setShowAddCard(false)
                  setNewCardTitle('')
                }
              }}
            />
            <div className="add-card-actions">
              <button
                type="submit"
                disabled={isCreatingCard || !newCardTitle.trim()}
                className="btn-add-card"
              >
                {isCreatingCard ? 'Adding...' : 'Add card'}
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowAddCard(false)
                  setNewCardTitle('')
                }}
                className="btn-cancel-card"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                  <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                </svg>
              </button>
            </div>
          </form>
        ) : (
          <button
            className="add-card-button"
            onClick={() => setShowAddCard(true)}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
              <path d="M12 5v14m-7-7h14" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            </svg>
            Add a card
          </button>
        )}
      </div>
    </div>
  )
}

export default ListColumn