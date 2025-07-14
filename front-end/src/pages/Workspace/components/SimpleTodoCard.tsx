import React, { useRef, useState } from 'react'
import { useDrag, useDrop } from 'react-dnd'
import './SimpleTodoCard.css'

interface Todo {
  id: number
  title: string
  description: string | null
  list_id: number
  assigned_to: number | null
  assigned_username: string | null
  assigned_members?: Member[]
  due_date: string | null
  due_time: string | null
  position: number
  created_at: string
  checklist_count: number
  completed_checklist_count: number
  labels: Label[]
}

interface Member {
  id: number
  username: string
  email: string
  role: string
  joined_at: string
}

interface Label {
  id: number
  name: string | null
  color: string
  workspace_id: number
  created_at: string
}

interface SimpleTodoCardProps {
  todo: Todo
  onClick: () => void
  index: number
  moveTodo: (dragIndex: number, hoverIndex: number) => void
  globalExpandedLabels: boolean
  setGlobalExpandedLabels: (expanded: boolean) => void
}

const SimpleTodoCard: React.FC<SimpleTodoCardProps> = ({ todo, onClick, index, moveTodo, globalExpandedLabels, setGlobalExpandedLabels }) => {
  const ref = useRef<HTMLDivElement>(null)

  const [{ handlerId, isOver }, drop] = useDrop<
    { index: number; id: number; listId: number },
    void,
    { handlerId: any; isOver: boolean }
  >({
    accept: 'todo',
    collect(monitor) {
      return {
        handlerId: monitor.getHandlerId(),
        isOver: monitor.isOver(),
      }
    },
    hover(item, monitor) {
      if (!ref.current) {
        return
      }
      const dragIndex = item.index
      const hoverIndex = index

      // Ne rien faire si on survole le même élément
      if (dragIndex === hoverIndex) {
        return
      }

      // Ne réorganiser que si c'est dans la même liste
      if (item.listId !== todo.list_id) {
        return
      }

      // Déterminer le rectangle du survol
      const hoverBoundingRect = ref.current?.getBoundingClientRect()

      // Obtenir le point milieu vertical
      const hoverMiddleY = (hoverBoundingRect.bottom - hoverBoundingRect.top) / 2

      // Déterminer la position de la souris
      const clientOffset = monitor.getClientOffset()

      // Obtenir les pixels vers le haut
      const hoverClientY = (clientOffset?.y ?? 0) - hoverBoundingRect.top

      // Faire le glissement vers le bas seulement quand la souris a croisé la moitié de la hauteur de l'élément
      // Quand on traîne vers le bas, on bouge seulement quand le curseur est en dessous de 50%
      // Quand on traîne vers le haut, on bouge seulement quand le curseur est au dessus de 50%

      // Traîner vers le bas
      if (dragIndex < hoverIndex && hoverClientY < hoverMiddleY) {
        return
      }

      // Traîner vers le haut
      if (dragIndex > hoverIndex && hoverClientY > hoverMiddleY) {
        return
      }

      // Effectuer le mouvement
      moveTodo(dragIndex, hoverIndex)

      // Note: nous mutons l'élément monitor ici !
      // Généralement c'est mieux d'éviter les mutations,
      // mais c'est correct ici pour des raisons de performance
      // et pour éviter les appels de rendu coûteux.
      item.index = hoverIndex
    },
  })

  const [{ isDragging }, drag] = useDrag({
    type: 'todo',
    item: () => {
      return { id: todo.id, index, listId: todo.list_id }
    },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  })

  drag(drop(ref))

  const formatDueDate = (date: string, time?: string | null) => {
    try {
      const dueDate = new Date(date)
      const today = new Date()
      const tomorrow = new Date(today)
      tomorrow.setDate(today.getDate() + 1)
      
      let dateStr = ''
      if (dueDate.toDateString() === today.toDateString()) {
        dateStr = 'Today'
      } else if (dueDate.toDateString() === tomorrow.toDateString()) {
        dateStr = 'Tomorrow'
      } else {
        dateStr = dueDate.toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric'
        })
      }
      
      if (time) {
        const [hours, minutes] = time.split(':')
        const hour12 = parseInt(hours) > 12 ? parseInt(hours) - 12 : parseInt(hours)
        const ampm = parseInt(hours) >= 12 ? 'PM' : 'AM'
        dateStr += ` ${hour12}:${minutes} ${ampm}`
      }
      
      return dateStr
    } catch (error) {
      return 'Invalid date'
    }
  }

  const isOverdue = (date: string, time?: string | null) => {
    try {
      const dueDate = new Date(date)
      if (time) {
        const [hours, minutes] = time.split(':')
        dueDate.setHours(parseInt(hours), parseInt(minutes))
      } else {
        dueDate.setHours(23, 59, 59)
      }
      return dueDate < new Date()
    } catch (error) {
      return false
    }
  }

  const getChecklistColor = () => {
    if (todo.checklist_count === 0) return '#6b7280' // gris
    
    const completedCount = todo.completed_checklist_count
    const totalCount = todo.checklist_count
    const percentage = (completedCount / totalCount) * 100
    
    if (percentage === 0) return '#6b7280' // gris
    if (percentage < 25) return '#ef4444' // rouge
    if (percentage < 50) return '#f59e0b' // jaune
    if (percentage < 100) return '#3b82f6' // bleu
    return '#10b981' // vert (100%)
  }

  const getMemberAvatarColor = (userId: number) => {
    const colors = [
      '#10b981', // vert
      '#3b82f6', // bleu
      '#8b5cf6', // violet
      '#f59e0b', // jaune
      '#ef4444', // rouge
      '#06b6d4', // cyan
      '#84cc16', // lime
      '#f97316', // orange
    ]
    return colors[userId % colors.length]
  }

  const hasLabels = todo.labels && todo.labels.length > 0
  const hasDueDate = todo.due_date
  const hasChecklist = todo.checklist_count > 0
  const hasAssignedUser = todo.assigned_username
  const hasAssignedMembers = todo.assigned_members && todo.assigned_members.length > 0
  const hasDescription = todo.description && todo.description.trim().length > 0

  return (
    <div 
      ref={ref}
      data-handler-id={handlerId}
      className={`simple-todo-card ${isDragging ? 'simple-todo-card--dragging' : ''} ${isOver && !isDragging ? 'simple-todo-card--drag-over' : ''}`}
      onClick={onClick}
    >
      <div className="card-content">
        <div className="card-main">
          {hasLabels && (
            <div className="card-labels">
              {todo.labels.map(label => (
                <div
                  key={label.id}
                  className={`card-label ${globalExpandedLabels ? 'expanded' : ''}`}
                  style={{ backgroundColor: label.color }}
                  title={label.name || 'Unnamed label'}
                  onClick={(e) => {
                    e.stopPropagation()
                    setGlobalExpandedLabels(!globalExpandedLabels)
                  }}
                >
                  {globalExpandedLabels && label.name && (
                    <span className="label-text">
                      {label.name}
                    </span>
                  )}
                </div>
              ))}
            </div>
          )}

          <h4 className="card-title">{todo.title}</h4>

          {(hasDueDate || hasChecklist || hasDescription) && (
            <div className="card-badges">
              {hasDueDate && (
                <div className={`card-badge ${isOverdue(todo.due_date!, todo.due_time) ? 'card-badge--overdue' : ''}`}>
                  <svg className="card-badge-icon" viewBox="0 0 24 24" fill="none">
                    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/>
                    <path d="M12 6v6l4 2" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                  </svg>
                  <span>{formatDueDate(todo.due_date!, todo.due_time)}</span>
                </div>
              )}

              {hasDescription && (
                <div className="card-badge">
                  <svg className="card-badge-icon" viewBox="0 0 24 24" fill="none">
                    <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" stroke="currentColor" strokeWidth="2"/>
                    <polyline points="14,2 14,8 20,8" stroke="currentColor" strokeWidth="2"/>
                    <line x1="16" y1="13" x2="8" y2="13" stroke="currentColor" strokeWidth="2"/>
                    <line x1="16" y1="17" x2="8" y2="17" stroke="currentColor" strokeWidth="2"/>
                  </svg>
                </div>
              )}

              {hasChecklist && (
                <div className="card-badge card-badge--checklist" style={{ backgroundColor: getChecklistColor() }}>
                  <svg className="card-badge-icon" viewBox="0 0 24 24" fill="none">
                    <path d="M9 11l3 3L22 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                    <path d="M21 12c0 4.97-4.03 9-9 9s-9-4.03-9-9 4.03-9 9-9c1.67 0 3.22.46 4.56 1.25" stroke="currentColor" strokeWidth="2"/>
                  </svg>
                  <span>{todo.completed_checklist_count}/{todo.checklist_count}</span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Section des membres assignés à droite */}
        {(hasAssignedMembers || hasAssignedUser) && (
          <div className="card-assigned-members">
            {hasAssignedMembers ? (
              // Affichage des assignations multiples
              <>
                {todo.assigned_members!.slice(0, 2).map((member, index) => (
                  <div 
                    key={member.id} 
                    className="card-member-avatar" 
                    title={member.username}
                    style={{ backgroundColor: getMemberAvatarColor(member.id) }}
                  >
                    {member.username.charAt(0).toUpperCase()}
                  </div>
                ))}
                {todo.assigned_members!.length > 2 && (
                  <div className="card-member-avatar card-member-overflow" title={`+${todo.assigned_members!.length - 2} others`}>
                    +{todo.assigned_members!.length - 2}
                  </div>
                )}
              </>
            ) : (
              // Affichage de l'assignation unique (legacy)
              <div className="card-member-avatar" title={todo.assigned_username!}>
                {todo.assigned_username!.charAt(0).toUpperCase()}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

export default SimpleTodoCard