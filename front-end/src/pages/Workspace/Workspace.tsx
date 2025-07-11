import { useState, useEffect } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import { 
  LoadingSpinner, 
  AlertMessage, 
  Button, 
  Avatar, 
  Modal, 
  FormInput,
  FormTextarea,
  ErrorBoundary
} from '../../components'
import WorkspaceHeader from './components/WorkspaceHeader'
import ListColumn from './components/ListColumn'
import SimpleTodoCard from './components/SimpleTodoCard'
import CardDetailsModal from './components/CardDetailsModal'
import { DndProvider } from 'react-dnd'
import { HTML5Backend } from 'react-dnd-html5-backend'
import './Workspace.css'
import update from 'immutability-helper'

interface Workspace {
  id: number
  name: string
  description: string
  created_at: string
  owner_id: number
  members: Member[]
  user_role: string
}

interface Member {
  id: number
  username: string
  email: string
  role: string
  joined_at: string
}

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
  workspace_id?: number
}

interface Label {
  id: number
  name: string | null
  color: string
  workspace_id: number
  created_at: string
}

const Workspace = () => {
  const { id } = useParams<{ id: string }>()
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  
  const [workspace, setWorkspace] = useState<Workspace | null>(null)
  const [lists, setLists] = useState<List[]>([])
  const [todos, setTodos] = useState<{ [listId: number]: Todo[] }>({})
  const [labels, setLabels] = useState<Label[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  
  const [showCreateListModal, setShowCreateListModal] = useState(false)
  const [showCardDetailsModal, setShowCardDetailsModal] = useState(false)
  const [selectedTodo, setSelectedTodo] = useState<Todo | null>(null)
  
  const [newList, setNewList] = useState({ name: '', description: '' })
  const [isCreatingList, setIsCreatingList] = useState(false)

  useEffect(() => {
    if (id) {
      fetchWorkspaceData()
    }
  }, [id])

  const fetchWorkspaceData = async () => {
    try {
      const token = localStorage.getItem('accessToken')
      
      console.log('Fetching workspace data for ID:', id)
      
      const [workspaceRes, listsRes, labelsRes] = await Promise.all([
        fetch(`/api/workspaces/${id}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        }),
        fetch(`/api/lists/workspace/${id}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        }),
        fetch(`/api/labels/workspace/${id}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        })
      ])

      if (workspaceRes.ok && listsRes.ok) {
        const workspaceData = await workspaceRes.json()
        const listsData = await listsRes.json()
        const labelsData = labelsRes.ok ? await labelsRes.json() : { labels: [] }

        setWorkspace(workspaceData.workspace)
        setLists(listsData.lists.sort((a, b) => a.position - b.position))
        setLabels(labelsData.labels)

        const todosData: { [listId: number]: Todo[] } = {}
        
        if (listsData.lists && listsData.lists.length > 0) {
          await Promise.all(
            listsData.lists.map(async (list: List) => {
              try {
                const todosRes = await fetch(`/api/todos/list/${list.id}`, {
                  headers: { 'Authorization': `Bearer ${token}` }
                })
                if (todosRes.ok) {
                  const todosResult = await todosRes.json()
                  todosData[list.id] = (todosResult.todos || []).map((todo: any) => ({ ...todo, workspace_id: list.workspace_id }))
                } else {
                  todosData[list.id] = []
                }
              } catch (err) {
                todosData[list.id] = []
              }
            })
          )
        }
        
        setTodos({ ...todosData })
      } else if (workspaceRes.status === 403) {
        setError('Accès refusé à ce workspace')
      } else if (workspaceRes.status === 401) {
        logout()
        navigate('/login')
      } else {
        setError('Erreur lors du chargement du workspace')
      }
    } catch (err) {
      setError('Erreur de connexion')
    } finally {
      setIsLoading(false)
    }
  }

  const handleCreateList = async (e: React.FormEvent) => {
    e.preventDefault()
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
          name: newList.name,
          workspaceId: id,
          position: lists.length
        })
      })

      if (response.ok) {
        setShowCreateListModal(false)
        setNewList({ name: '', description: '' })
        await fetchWorkspaceData()
      } else {
        const data = await response.json()
        setError(data.error || 'Erreur lors de la création de la liste')
      }
    } catch (err) {
      setError('Erreur de connexion')
    } finally {
      setIsCreatingList(false)
    }
  }

  const handleDeleteList = async (listId: number) => {
    if (!window.confirm('Êtes-vous sûr de vouloir supprimer cette liste et toutes ses tâches ?')) {
      return
    }

    try {
      const token = localStorage.getItem('accessToken')
      const response = await fetch(`/api/lists/${listId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      })

      if (response.ok) {
        await fetchWorkspaceData()
      } else {
        const data = await response.json()
        setError(data.error || 'Erreur lors de la suppression')
      }
    } catch (err) {
      setError('Erreur de connexion')
    }
  }

  const handleCreateTodo = async (listId: number, title: string) => {
    try {
      const token = localStorage.getItem('accessToken')
      const response = await fetch('/api/todos', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          title,
          listId,
          position: todos[listId] ? todos[listId].length : 0
        })
      })
      
      if (response.ok) {
        await fetchWorkspaceData()
      } else {
        const data = await response.json()
        setError(data.error || 'Erreur lors de la création de la tâche')
      }
    } catch (err) {
      setError('Erreur de connexion')
    }
  }

  const handleUpdateTodo = async (todoId: number, updates: any) => {
    try {
      const token = localStorage.getItem('accessToken')
      const response = await fetch(`/api/todos/${todoId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(updates)
      })

      if (response.ok) {
        await fetchWorkspaceData()
      } else {
        const data = await response.json()
        setError(data.error || 'Erreur lors de la mise à jour')
      }
    } catch (err) {
      setError('Erreur de connexion')
    }
  }

  const handleDeleteTodo = async (todoId: number) => {
    if (!window.confirm('Êtes-vous sûr de vouloir supprimer cette tâche ?')) {
      return
    }

    try {
      const token = localStorage.getItem('accessToken')
      const response = await fetch(`/api/todos/${todoId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      })

      if (response.ok) {
        await fetchWorkspaceData()
      } else {
        const data = await response.json()
        setError(data.error || 'Erreur lors de la suppression')
      }
    } catch (err) {
      setError('Erreur de connexion')
    }
  }

  const handleMoveTodo = async (todoId: number, targetListId: number) => {
    try {
      const token = localStorage.getItem('accessToken')
      const response = await fetch(`/api/todos/${todoId}/move`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          listId: targetListId,
          position: todos[targetListId]?.length || 0
        })
      })

      if (response.ok) {
        await fetchWorkspaceData()
      } else {
        const data = await response.json()
        setError(data.error || 'Erreur lors du déplacement')
      }
    } catch (err) {
      setError('Erreur de connexion')
    }
  }

  const handleUpdateTodosOrder = async (listId: number, reorderedTodos: Todo[]) => {
    try {
      const token = localStorage.getItem('accessToken')
      
      // Créer le payload avec les nouvelles positions
      const todosWithNewPositions = reorderedTodos.map((todo, index) => ({
        id: todo.id,
        position: index,
        listId: listId
      }))

      const response = await fetch('/api/todos/positions', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          todos: todosWithNewPositions
        })
      })

      if (!response.ok) {
        // En cas d'erreur, recharger les données pour remettre l'ordre correct
        await fetchWorkspaceData()
      }
    } catch (err) {
      console.error('Error updating todos order:', err)
      // En cas d'erreur, recharger les données
      await fetchWorkspaceData()
    }
  }

  const handleOpenCardDetails = (todo: Todo) => {
    setSelectedTodo({ ...todo, workspace_id: todo.workspace_id ?? lists.find(l => l.id === todo.list_id)?.workspace_id })
    setShowCardDetailsModal(true)
  }

  const handleCloseCardDetails = () => {
    setSelectedTodo(null)
    setShowCardDetailsModal(false)
  }

  const handleAddMember = () => {
    console.log('Ajouter un membre - fonction à implémenter')
  }

  const handleSettings = () => {
    console.log('Paramètres du workspace - fonction à implémenter')
  }

  const getListName = (listId: number) => {
    return lists.find(list => list.id === listId)?.name || 'Unknown List'
  }

  const moveList = async (from: number, to: number) => {
    setLists(prevLists => update(prevLists, {
      $splice: [
        [from, 1],
        [to, 0, prevLists[from]]
      ]
    }))

    // Met à jour la position de chaque liste dans l'ordre actuel
    const newOrder = lists.map((list, idx) => ({
      id: list.id,
      position: idx
    }))

    try {
      const token = localStorage.getItem('accessToken')
      await fetch('/api/lists/update-positions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ lists: newOrder })
      })
      // Optionnel : await fetchWorkspaceData()
    } catch (err) {
    }
  }

  if (isLoading) {
    return <LoadingSpinner message="Chargement du workspace..." fullScreen />
  }

  if (!workspace) {
    return (
      <div className="workspace-error">
        <h1>Workspace introuvable</h1>
        <p>Ce workspace n'existe pas ou vous n'avez pas les permissions pour y accéder.</p>
        <Link to="/dashboard">Retour au dashboard</Link>
      </div>
    )
  }

  return (
    <ErrorBoundary>
      <DndProvider backend={HTML5Backend}>
        <div className="workspace-page">
          <WorkspaceHeader
            workspace={workspace}
            onAddMember={handleAddMember}
            onSettings={handleSettings}
            onManageLabels={() => {}}
          />

          <main className="workspace-main">
            {error && (
              <AlertMessage 
                type="error" 
                message={error} 
                onClose={() => setError('')}
              />
            )}

            <div className="workspace-content">
              <div className="lists-container">
                {lists.map((list, idx) => (
                  <ListColumn
                    key={list.id}
                    list={list}
                    todos={todos[list.id] || []}
                    labels={labels}
                    onCreateTodo={(title) => handleCreateTodo(list.id, title)}
                    onEditTodo={handleOpenCardDetails}
                    onDeleteTodo={handleDeleteTodo}
                    onDeleteList={() => handleDeleteList(list.id)}
                    onMoveTodo={handleMoveTodo}
                    onListNameUpdated={fetchWorkspaceData}
                    onUpdateTodosOrder={(reorderedTodos) => handleUpdateTodosOrder(list.id, reorderedTodos)}
                    index={idx}
                    moveList={moveList}
                  />
                ))}
                
                <div className="create-list-column">
                  <Button 
                    variant="secondary" 
                    onClick={() => setShowCreateListModal(true)}
                    className="create-list-button"
                  >
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                      <path d="M12 5v14m-7-7h14" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                    </svg>
                    Add another list
                  </Button>
                </div>
              </div>
            </div>
          </main>

          <Modal
            isOpen={showCreateListModal}
            onClose={() => setShowCreateListModal(false)}
            title="Add list"
          >
            <form onSubmit={handleCreateList} className="list-form">
              <FormInput
                label="List name"
                type="text"
                id="listName"
                name="name"
                value={newList.name}
                onChange={(e) => setNewList(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Enter list title..."
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
                  disabled={isCreatingList}
                >
                  {isCreatingList ? 'Adding...' : 'Add list'}
                </Button>
              </div>
            </form>
          </Modal>

          <CardDetailsModal
            isOpen={showCardDetailsModal}
            onClose={handleCloseCardDetails}
            todo={selectedTodo}
            onUpdate={handleUpdateTodo}
            labels={labels}
            members={workspace.members}
            listName={selectedTodo ? getListName(selectedTodo.list_id) : ''}
            onLabelsUpdated={fetchWorkspaceData}
          />
        </div>
      </DndProvider>
    </ErrorBoundary>
  )
}

export default Workspace