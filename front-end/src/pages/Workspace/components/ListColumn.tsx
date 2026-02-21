import React, { useState, useRef, useCallback } from 'react'
import { useDrop, useDrag } from 'react-dnd'
import { Button } from '../../../components'
import SimpleTodoCard from './SimpleTodoCard'
import AddCardInline from './AddCardInline'
import update from 'immutability-helper'
import './ListColumn.css'

interface List {
  id: number
  name: string
  workspace_id: number
  position: number
  created_at: string
  todo_count: number
}

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

interface ListColumnProps {
  list: List
  todos: Todo[]
  labels: Label[]
  onCreateTodo: (title: string) => void
  onEditTodo: (todo: Todo) => void
  onChecklistClick?: (todo: Todo) => void
  onDeleteTodo: (todoId: number) => void
  onDeleteList: () => void
  onMoveTodo: (todoId: number, targetListId: number) => void
  onListNameUpdated?: () => void
  onUpdateTodosOrder?: (todos: Todo[]) => void
  index: number
  moveList: (from: number, to: number) => void
  globalExpandedLabels: boolean
  setGlobalExpandedLabels: (expanded: boolean) => void
}

type DragListItem = { index: number }

const ListColumn = ({
  list,
  todos,
  onCreateTodo,
  onEditTodo,
  onChecklistClick,
  onDeleteList,
  onMoveTodo,
  onListNameUpdated,
  onUpdateTodosOrder,
  index,
  moveList,
  globalExpandedLabels,
  setGlobalExpandedLabels
}: ListColumnProps) => {
  const [showMenu, setShowMenu] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [editName, setEditName] = useState(list.name)
  const [showAddCard, setShowAddCard] = useState(false)
  const [localTodos, setLocalTodos] = useState(todos)
  const menuRef = useRef<HTMLDivElement>(null)
  const refCol = useRef<HTMLDivElement>(null)

  // Mettre à jour les todos locaux quand les props changent
  React.useEffect(() => {
    setLocalTodos(todos)
  }, [todos])

  const moveTodoWithinList = useCallback((dragIndex: number, hoverIndex: number) => {
    setLocalTodos((prevTodos) => {
      // S'assurer que les indices sont valides
      const maxIndex = prevTodos.length - 1
      const clampedHoverIndex = Math.min(Math.max(0, hoverIndex), maxIndex)

      if (dragIndex === clampedHoverIndex || dragIndex < 0 || dragIndex > maxIndex) {
        return prevTodos
      }

      const updatedTodos = update(prevTodos, {
        $splice: [
          [dragIndex, 1],
          [clampedHoverIndex, 0, prevTodos[dragIndex]]
        ]
      })

      // Optionnel: mettre à jour les positions sur le serveur
      if (onUpdateTodosOrder) {
        onUpdateTodosOrder(updatedTodos)
      }

      return updatedTodos
    })
  }, [onUpdateTodosOrder])

  // Drop pour les cartes (todos)
  const [, drop] = useDrop({
    accept: 'todo',
    drop: (item: { id: number; listId: number }) => {
      if (item.listId !== list.id) {
        onMoveTodo(item.id, list.id)
      }
    }
  })

  // Drop pour les cartes dans la zone de drop en fin de liste
  const [{ isOverDropZone }, dropZone] = useDrop({
    accept: 'todo',
    drop: (item: { id: number; listId: number; index: number }) => {
      if (item.listId === list.id) {
        // Réorganiser dans la même liste - mettre à la fin
        const currentIndex = localTodos.findIndex(t => t.id === item.id)
        if (currentIndex !== -1 && currentIndex !== localTodos.length - 1) {
          moveTodoWithinList(currentIndex, localTodos.length - 1)
        }
      } else {
        // Déplacer vers une autre liste
        onMoveTodo(item.id, list.id)
      }
    },
    collect: (monitor) => ({
      isOverDropZone: monitor.isOver(),
    }),
  })

  // Drop pour les listes (colonnes)
  const [{ handlerId }, dropList] = useDrop<DragListItem, void, { handlerId?: any }>({
    accept: 'list',
    collect(monitor) {
      return {
        handlerId: monitor.getHandlerId(),
      }
    },
    hover(item) {
      if (!refCol.current) return
      const dragIndex = item.index
      const hoverIndex = index
      if (dragIndex === hoverIndex) return
      moveList(dragIndex, hoverIndex)
      item.index = hoverIndex
    },
  })

  // Drag pour la colonne
  const [{ isDragging }, drag] = useDrag<DragListItem, void, { isDragging: boolean }>({
    type: 'list',
    item: { index },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  })

  drag(dropList(drop(refCol)))

  const handleSaveName = async () => {
    if (editName.trim() && editName !== list.name) {
      try {
        const token = localStorage.getItem('accessToken')
        const response = await fetch(`/api/lists/${list.id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({ name: editName })
        })
        if (response.ok && onListNameUpdated) {
          onListNameUpdated()
        }
      } catch (err) {
        // Optionally handle error
      }
    }
    setIsEditing(false)
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSaveName()
    } else if (e.key === 'Escape') {
      setEditName(list.name)
      setIsEditing(false)
    }
  }

  const handleCreateCard = async (title: string) => {
    try {
      await onCreateTodo(title)
      setShowAddCard(false)
    } catch (error) {
      console.error('Error creating card:', error)
    }
  }

  const handleCancelAddCard = () => {
    setShowAddCard(false)
  }

  return (
    <div
      ref={refCol}
      className={`list-column ${isDragging ? 'list-column--dragging' : ''}`}
      data-handler-id={handlerId}
    >
      <div className="list-header">
        <div className="list-title-container">
          {isEditing ? (
            <input
              type="text"
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              onBlur={handleSaveName}
              onKeyDown={handleKeyPress}
              className="list-title-input"
              autoFocus
            />
          ) : (
            <h3
              className="list-title"
              onClick={() => setIsEditing(true)}
            >
              {list.name}
            </h3>
          )}
        </div>

        <div className="list-menu" ref={menuRef}>
          <button
            className="list-menu-button"
            onClick={() => setShowMenu(!showMenu)}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
              <path d="M12 13a1 1 0 100-2 1 1 0 000 2zM12 6a1 1 0 100-2 1 1 0 000 2zM12 20a1 1 0 100-2 1 1 0 000 2z" fill="currentColor" />
            </svg>
          </button>

          {showMenu && (
            <div className="list-menu-dropdown">
              <button
                className="list-menu-item"
                onClick={() => {
                  setIsEditing(true)
                  setShowMenu(false)
                }}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                  <path d="M21.174 6.812a1 1 0 00-3.986-3.987L3.842 16.174a2 2 0 00-.5.83l-1.321 4.352a.5.5 0 00.623.622l4.353-1.32a2 2 0 00.83-.497z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  <path d="M15 5l4 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                Renommer
              </button>
              <button
                className="list-menu-item list-menu-item--danger"
                onClick={() => {
                  onDeleteList()
                  setShowMenu(false)
                }}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                  <path d="M3 6h18M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  <line x1="10" y1="11" x2="10" y2="17" stroke="currentColor" strokeWidth="2" />
                  <line x1="14" y1="11" x2="14" y2="17" stroke="currentColor" strokeWidth="2" />
                </svg>
                Supprimer
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="list-content">
        <div className="todos-container">
          {localTodos && Array.isArray(localTodos) && localTodos.map((todo, idx) => {
            if (!todo || !todo.id) {
              console.warn('Invalid todo in list:', todo)
              return null
            }
            return (
              <SimpleTodoCard
                key={todo.id}
                todo={todo}
                index={idx}
                moveTodo={moveTodoWithinList}
                onClick={() => onEditTodo(todo)}
                onChecklistClick={onChecklistClick ? () => onChecklistClick(todo) : undefined}
                globalExpandedLabels={globalExpandedLabels}
                setGlobalExpandedLabels={setGlobalExpandedLabels}
              />
            )
          })}

          {showAddCard && (
            <AddCardInline
              onSave={handleCreateCard}
              onCancel={handleCancelAddCard}
            />
          )}

          {/* Zone de drop pour placer les cartes à la fin */}
          <div
            ref={dropZone as any}
            className={`drop-zone ${isOverDropZone ? 'drop-zone--active' : ''}`}
          />
        </div>

        {!showAddCard && (
          <Button
            variant="secondary"
            size="small"
            onClick={() => setShowAddCard(true)}
            className="add-todo-button"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
              <path d="M12 5v14m-7-7h14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
            Add a card
          </Button>
        )}
      </div>
    </div>
  )
}

export default ListColumn