import React, { useRef } from 'react'
import { useDrag, useDrop } from 'react-dnd'
import { type Todo } from '../../../contexts/WorkspaceDataContext'
import './SimpleTodoCard.css'

interface SimpleTodoCardProps {
  todo: Todo
  onClick: () => void
  onChecklistClick?: () => void
  index: number
  listId: number
  moveCard: (dragIndex: number, hoverIndex: number, sourceListId: number, targetListId: number) => void
  labelsExpanded: boolean
  setLabelsExpanded: (expanded: boolean) => void
}

const SimpleTodoCard: React.FC<SimpleTodoCardProps> = ({ 
  todo, 
  onClick, 
  onChecklistClick,
  index,
  listId,
  moveCard,
  labelsExpanded,
  setLabelsExpanded
}) => {
  const ref = useRef<HTMLDivElement>(null)
  const [dropPosition, setDropPosition] = React.useState<'top' | 'bottom'>('top')

  const [{ isDragging }, drag] = useDrag({
    type: 'card',
    item: { 
      id: todo.id, 
      index, 
      listId: todo.list_id,
      type: 'card'
    },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  })

  const [{ isOver, canDrop, draggedItem }, drop] = useDrop({
    accept: 'card',
    hover: (draggedItem: { id: number; index: number; listId: number }, monitor) => {
      if (!ref.current) return
      
      const dragIndex = draggedItem.index
      const hoverIndex = index
      const dragListId = draggedItem.listId
      const hoverListId = listId

      // Ne rien faire si on survole la même carte
      if (draggedItem.id === todo.id) return

      // Si c'est dans la même liste, vérifier la position pour éviter le flicker
      if (dragListId === hoverListId && dragIndex === hoverIndex) return

      const hoverBoundingRect = ref.current.getBoundingClientRect()
      const hoverMiddleY = (hoverBoundingRect.bottom - hoverBoundingRect.top) / 2
      const clientOffset = monitor.getClientOffset()
      if (!clientOffset) return
      
      const hoverClientY = clientOffset.y - hoverBoundingRect.top
      
      // Mettre à jour la position de drop pour la prévisualisation
      setDropPosition(hoverClientY < hoverMiddleY ? 'top' : 'bottom')

      // Pour les mouvements dans la même liste, appliquer la logique de throttling
      if (dragListId === hoverListId) {
        // Si on va vers le bas, attendre d'être au milieu bas
        if (dragIndex < hoverIndex && hoverClientY < hoverMiddleY) return
        // Si on va vers le haut, attendre d'être au milieu haut  
        if (dragIndex > hoverIndex && hoverClientY > hoverMiddleY) return
        
        // Effectuer le mouvement dans la même liste
        moveCard(dragIndex, hoverIndex, dragListId, hoverListId)
        
        // Mettre à jour l'index de l'item dragué
        draggedItem.index = hoverIndex
      }
      // Pour les mouvements entre listes différentes, pas de throttling
      else {
        // Calculer la position cible basée sur la position de la souris
        const targetIndex = hoverClientY < hoverMiddleY ? hoverIndex : hoverIndex + 1
        
        // Effectuer le mouvement entre listes
        moveCard(dragIndex, targetIndex, dragListId, hoverListId)
        
        // Mettre à jour l'index de l'item dragué
        draggedItem.index = targetIndex
        draggedItem.listId = hoverListId
      }
    },
    collect: (monitor) => ({
      isOver: monitor.isOver(),
      canDrop: monitor.canDrop(),
      draggedItem: monitor.getItem(),
    }),
  })

  drag(drop(ref))

  // Afficher la prévisualisation pour tous les drags valides
  const shouldShowHover = isOver && canDrop && draggedItem && draggedItem.id !== todo.id

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
    } catch {
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
    } catch {
      return false
    }
  }

  return (
    <div 
      ref={ref}
      className={`simple-todo-card ${isDragging ? 'simple-todo-card--dragging' : ''} ${shouldShowHover ? `simple-todo-card--hover-${dropPosition}` : ''}`}
      onClick={!isDragging ? onClick : undefined}
    >
      <TodoCardContent 
        todo={todo} 
        formatDueDate={formatDueDate} 
        isOverdue={isOverdue}
        onChecklistClick={onChecklistClick}
        labelsExpanded={labelsExpanded}
        setLabelsExpanded={setLabelsExpanded}
      />
    </div>
  )
}

// Composant pour le contenu de la carte (évite la duplication)
const TodoCardContent: React.FC<{
  todo: Todo
  formatDueDate: (date: string, time?: string | null) => string
  isOverdue: (date: string, time?: string | null) => boolean
  onChecklistClick?: () => void
  labelsExpanded: boolean
  setLabelsExpanded: (expanded: boolean) => void
}> = ({ todo, formatDueDate, isOverdue, onChecklistClick, labelsExpanded, setLabelsExpanded }) => {
  const hasLabels = todo.labels && todo.labels.length > 0
  const hasDueDate = todo.due_date
  const hasChecklist = todo.checklist_count > 0
  const hasAssignedUser = todo.assigned_username
  const hasDescription = todo.description && todo.description.trim().length > 0

  return (
    <>
      {hasLabels && (
        <div className={`card-labels ${labelsExpanded ? 'expanded' : ''}`}>
          {todo.labels.map(label => (
            <div
              key={label.id}
              className={`card-label ${labelsExpanded ? 'expanded' : ''}`}
              style={{ backgroundColor: label.color }}
              title={label.name || 'Unnamed label'}
              onClick={(e) => {
                e.stopPropagation()
                setLabelsExpanded(!labelsExpanded)
              }}
            >
              <span className="label-text">{label.name || ''}</span>
            </div>
          ))}
        </div>
      )}

      <h4 className="card-title">{todo.title}</h4>

      {(hasDueDate || hasChecklist || hasDescription || hasAssignedUser) && (
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
              <svg className="card-badge-icon" width="16" height="16" viewBox="0 0 24 24" fill="none">
                <path d="M4 6h16M4 12h16M4 18h7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
          )}

          {hasChecklist && (
            <div 
              className="card-badge checklist-progress-badge"
              style={{
                backgroundColor: (() => {
                  const percentage = todo.checklist_count > 0 ? (todo.completed_checklist_count / todo.checklist_count) * 100 : 0
                  if (percentage === 0) return '#d1d5db'
                  if (percentage < 30) return '#ef4444'
                  if (percentage < 70) return '#f59e0b'
                  if (percentage < 100) return '#3b82f6'
                  return '#10b981'
                })()
              }}
              onClick={(e) => {
                e.stopPropagation()
                onChecklistClick?.()
              }}
            >
              <svg className="checklist-progress-icon" viewBox="0 0 24 24" fill="none">
                <path d="M9 11l3 3L22 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                <path d="M21 12c0 4.97-4.03 9-9 9s-9-4.03-9-9 4.03-9 9-9c1.67 0 3.22.46 4.56 1.25" stroke="currentColor" strokeWidth="2"/>
              </svg>
              <span>{todo.completed_checklist_count}/{todo.checklist_count}</span>
            </div>
          )}

          {hasAssignedUser && (
            <div className="card-members">
              <div className="card-member-avatar" title={todo.assigned_username!}>
                {todo.assigned_username!.charAt(0).toUpperCase()}
              </div>
            </div>
          )}
        </div>
      )}
    </>
  )
}

export default SimpleTodoCard