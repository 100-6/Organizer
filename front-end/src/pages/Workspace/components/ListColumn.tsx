import { useState, useRef } from 'react'
import { useDrop } from 'react-dnd'
import { Button } from '../../../components'
import SimpleTodoCard from './SimpleTodoCard'
import AddCardInline from './AddCardInline'
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
  onDeleteTodo: (todoId: number) => void
  onDeleteList: () => void
  onMoveTodo: (todoId: number, targetListId: number) => void
  onListNameUpdated?: () => void
}

const ListColumn = ({
  list,
  todos,
  labels,
  onCreateTodo,
  onEditTodo,
  onDeleteTodo,
  onDeleteList,
  onMoveTodo,
  onListNameUpdated
}: ListColumnProps) => {
  const [showMenu, setShowMenu] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [editName, setEditName] = useState(list.name)
  const [showAddCard, setShowAddCard] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  const [{ isOver }, drop] = useDrop({
    accept: 'todo',
    drop: (item: { id: number; listId: number }) => {
      if (item.listId !== list.id) {
        onMoveTodo(item.id, list.id)
      }
    },
    collect: (monitor) => ({
      isOver: monitor.isOver(),
    }),
  })

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
      ref={drop as any}
      className={`list-column ${isOver ? 'list-column--dragover' : ''}`}
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
              <path d="M12 13a1 1 0 100-2 1 1 0 000 2zM12 6a1 1 0 100-2 1 1 0 000 2zM12 20a1 1 0 100-2 1 1 0 000 2z" fill="currentColor"/>
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
                  <path d="M21.174 6.812a1 1 0 00-3.986-3.987L3.842 16.174a2 2 0 00-.5.83l-1.321 4.352a.5.5 0 00.623.622l4.353-1.32a2 2 0 00.83-.497z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M15 5l4 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
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

      <div className="list-content">
        <div className="todos-container">
          {todos && Array.isArray(todos) && todos.map(todo => {
            if (!todo || !todo.id) {
              console.warn('Invalid todo in list:', todo)
              return null
            }
            return (
              <SimpleTodoCard
                key={todo.id}
                todo={todo}
                onClick={() => onEditTodo(todo)}
              />
            )
          })}
          
          {showAddCard && (
            <AddCardInline
              onSave={handleCreateCard}
              onCancel={handleCancelAddCard}
            />
          )}
        </div>
        
        {!showAddCard && (
          <Button 
            variant="secondary" 
            size="small"
            onClick={() => setShowAddCard(true)}
            className="add-todo-button"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
              <path d="M12 5v14m-7-7h14" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            </svg>
            Add a card
          </Button>
        )}
      </div>
    </div>
  )
}

export default ListColumn