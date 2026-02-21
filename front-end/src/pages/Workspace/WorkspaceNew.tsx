import { useState } from 'react'
import { useParams } from 'react-router-dom'
import { WorkspaceDataProvider, useWorkspaceData } from '../../contexts/WorkspaceDataContext'
import {
  LoadingSpinner,
  AlertMessage,
  Button,
  Modal,
  FormInput,
  ErrorBoundary
} from '../../components'
import WorkspaceHeader from './components/WorkspaceHeader'
import ListColumnNew from './components/ListColumnNew'
import CardDetailsModalNew from './components/CardDetailsModalNew'
import { DndProvider } from 'react-dnd'
import { HTML5Backend } from 'react-dnd-html5-backend'
import './Workspace.css'

const WorkspaceContent = () => {
  const { id } = useParams<{ id: string }>()
  const { state, actions } = useWorkspaceData()

  const [selectedTodoId, setSelectedTodoId] = useState<number | null>(null)
  const [showCreateListModal, setShowCreateListModal] = useState(false)
  const [newListName, setNewListName] = useState('')
  const [isCreatingList, setIsCreatingList] = useState(false)
  const [labelsExpanded, setLabelsExpanded] = useState(false)



  const handleCardClick = (todoId: number) => {
    setSelectedTodoId(todoId)
  }

  const handleModalClose = () => {
    setSelectedTodoId(null)
  }

  const handleCreateList = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newListName.trim()) return

    setIsCreatingList(true)
    try {
      const token = localStorage.getItem('accessToken')
      const response = await fetch('/api/lists', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          name: newListName.trim(),
          workspaceId: id,
          position: state.lists.length
        })
      })

      if (response.ok) {
        setNewListName('')
        setShowCreateListModal(false)
        // Reload workspace to get the new list
        await actions.loadWorkspace(id!)
      } else {
        const data = await response.json()
        console.error('Error creating list:', data.error)
      }
    } catch (error) {
      console.error('Error creating list:', error)
    } finally {
      setIsCreatingList(false)
    }
  }

  const handleChecklistClick = (todoId: number) => {
    setSelectedTodoId(todoId)
    // Auto-expand checklist when opening modal
    setTimeout(() => {
      window.dispatchEvent(new CustomEvent('expandChecklist'))
    }, 100)
  }

  const moveCard = async (dragIndex: number, hoverIndex: number, sourceListId: number, targetListId: number) => {
    const sourceList = state.lists.find(list => list.id === sourceListId)
    const targetList = state.lists.find(list => list.id === targetListId)

    if (!sourceList || !targetList) return

    const todoToMove = sourceList.todos[dragIndex]
    if (!todoToMove) return

    // Calculate new position
    const newPosition = hoverIndex

    // Use the unified action for moving todos
    await actions.moveTodo(todoToMove.id, targetListId, newPosition)
  }

  const moveList = async (dragIndex: number, hoverIndex: number) => {
    // For now, just update local state - implement proper API call later
    console.log('Move list from', dragIndex, 'to', hoverIndex)
  }

  // Get the selected todo for modal
  const selectedTodo = selectedTodoId
    ? state.lists.flatMap(list => list.todos).find(todo => todo.id === selectedTodoId)
    : null

  const selectedTodoListName = selectedTodo
    ? state.lists.find(list => list.id === selectedTodo.list_id)?.name || 'Unknown List'
    : ''

  if (state.isLoading) {
    return <LoadingSpinner message="Loading workspace..." fullScreen />
  }

  if (state.error) {
    return (
      <div className="workspace-error">
        <AlertMessage
          type="error"
          message={state.error}
        />
        <div style={{ marginTop: '16px' }}>
          <Button variant="primary" onClick={() => actions.loadWorkspace(id!)}>
            Retry
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="workspace-page">
      <header className="workspace-header-container">
        <WorkspaceHeader
          workspace={state as any}
          onAddMember={() => { }}
          onSettings={() => { }}
          onManageLabels={() => { }}
        />
      </header>

      <main className="workspace-main">
        <DndProvider backend={HTML5Backend}>
          <div className="workspace-content">
            <div className="lists-container">
              {state.lists.map((list, index) => (
                <ListColumnNew
                  key={list.id}
                  list={list}
                  index={index}
                  onCardClick={handleCardClick}
                  onChecklistClick={handleChecklistClick}
                  moveCard={moveCard}
                  moveList={moveList}
                  labelsExpanded={labelsExpanded}
                  setLabelsExpanded={setLabelsExpanded}
                />
              ))}

              <div className="add-list-column">
                <button
                  className="add-list-button"
                  onClick={() => setShowCreateListModal(true)}
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                    <path d="M12 5v14m-7-7h14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                  </svg>
                  Add a list
                </button>
              </div>
            </div>
          </div>
        </DndProvider>
      </main>

      {/* Card Details Modal */}
      <CardDetailsModalNew
        isOpen={!!selectedTodoId}
        onClose={handleModalClose}
        todoId={selectedTodoId}
        listName={selectedTodoListName}
      />

      {/* Create List Modal */}
      <Modal
        isOpen={showCreateListModal}
        onClose={() => {
          setShowCreateListModal(false)
          setNewListName('')
        }}
        title="Create New List"
      >
        <form onSubmit={handleCreateList} className="create-list-form">
          <FormInput
            label="List Name"
            type="text"
            id="list-name"
            name="name"
            value={newListName}
            onChange={(e) => setNewListName(e.target.value)}
            placeholder="Enter list name..."
            required
          />

          <div className="modal-actions">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setShowCreateListModal(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              disabled={isCreatingList || !newListName.trim()}
            >
              {isCreatingList ? 'Creating...' : 'Create List'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}

const Workspace = () => {
  const { id } = useParams<{ id: string }>()

  if (!id) {
    return (
      <div className="workspace-error">
        <AlertMessage type="error" message="Workspace ID not found" />
      </div>
    )
  }

  return (
    <ErrorBoundary>
      <WorkspaceDataProvider workspaceId={id}>
        <WorkspaceContent />
      </WorkspaceDataProvider>
    </ErrorBoundary>
  )
}

export default Workspace