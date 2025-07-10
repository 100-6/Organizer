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
import TodoCard from './components/TodoCard'
import CreateTodoModal from './components/CreateTodoModal'
import EditTodoModal from './components/EditTodoModal'
import CreateLabelModal from './components/CreateLabelModal'
import LabelManagerModal from './components/LabelManagerModal'
import { DndProvider } from 'react-dnd'
import { HTML5Backend } from 'react-dnd-html5-backend'
import './Workspace.css'

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
  const [showCreateTodoModal, setShowCreateTodoModal] = useState(false)
  const [showEditTodoModal, setShowEditTodoModal] = useState(false)
  const [showCreateLabelModal, setShowCreateLabelModal] = useState(false)
  const [showLabelManagerModal, setShowLabelManagerModal] = useState(false)
  const [selectedListId, setSelectedListId] = useState<number | null>(null)
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

      console.log('API responses:', {
        workspace: workspaceRes.status,
        lists: listsRes.status,
        labels: labelsRes.status
      })

      if (workspaceRes.ok && listsRes.ok) {
        const workspaceData = await workspaceRes.json()
        const listsData = await listsRes.json()
        const labelsData = labelsRes.ok ? await labelsRes.json() : { labels: [] }

        console.log('Parsed data:', {
          workspace: workspaceData,
          lists: listsData,
          labels: labelsData
        })

        setWorkspace(workspaceData.workspace)
        setLists(listsData.lists)
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
                  console.log(`Todos for list ${list.id}:`, todosResult.todos)
                } else {
                  console.error(`Failed to fetch todos for list ${list.id}:`, todosRes.status)
                  todosData[list.id] = []
                }
              } catch (err) {
                console.error(`Error fetching todos for list ${list.id}:`, err)
                todosData[list.id] = []
              }
            })
          )
        }
        
        console.log('Final todos data:', todosData)
        setTodos({ ...todosData })
      } else if (workspaceRes.status === 403) {
        setError('Accès refusé à ce workspace')
      } else if (workspaceRes.status === 401) {
        logout()
        navigate('/login')
      } else {
        console.error('API error:', {
          workspace: workspaceRes.status,
          lists: listsRes.status,
          labels: labelsRes.status
        })
        setError('Erreur lors du chargement du workspace')
      }
    } catch (err) {
      console.error('Error in fetchWorkspaceData:', err)
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

  const handleCreateTodo = async (todoData: any) => {
    try {
      const token = localStorage.getItem('accessToken')
      const response = await fetch('/api/todos', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          ...todoData,
          listId: selectedListId,
          position: todos[selectedListId!] ? todos[selectedListId!].length : 0,
          labels: todoData.labels
        })
      })
      if (response.ok) {
        await fetchWorkspaceData()
        setShowCreateTodoModal(false)
      } else {
        const data = await response.json()
        setError(data.error || 'Erreur lors de la création de la tâche')
      }
    } catch (err) {
      setError('Erreur de connexion')
    }
  }

  const handleUpdateTodo = async (todoId: number, todoData: any) => {
    try {
      const token = localStorage.getItem('accessToken')
      const response = await fetch(`/api/todos/${todoId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(todoData)
      })

      if (response.ok) {
        setShowEditTodoModal(false)
        setSelectedTodo(null)
        await fetchWorkspaceData()
      } else {
        const data = await response.json()
        setError(data.error || 'Erreur lors de la mise à jour')
      }
    } catch (err) {
      setError('Erreur de connexion')
    }
  }

  const handleLabelsUpdated = () => {
    fetchWorkspaceData()
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

  const handleCreateLabel = async (labelData: { name: string; color: string }) => {
    try {
      const token = localStorage.getItem('accessToken')
      const response = await fetch('/api/labels', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          ...labelData,
          workspaceId: id
        })
      })

      if (response.ok) {
        setShowCreateLabelModal(false)
        await fetchWorkspaceData()
      } else {
        const data = await response.json()
        setError(data.error || 'Erreur lors de la création du label')
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

  const handleAddMember = () => {
    console.log('Ajouter un membre - fonction à implémenter')
  }

  const handleSettings = () => {
    console.log('Paramètres du workspace - fonction à implémenter')
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
          onManageLabels={() => setShowLabelManagerModal(true)}
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
              {lists.map(list => (
                <ListColumn
                  key={list.id}
                  list={list}
                  todos={todos[list.id] || []}
                  labels={labels}
                  onCreateTodo={() => {
                    setSelectedListId(list.id)
                    setShowCreateTodoModal(true)
                  }}
                  onEditTodo={(todo) => {
                    setSelectedTodo({ ...(todo as any), workspace_id: todo.workspace_id ?? lists.find(l => l.id === todo.list_id)?.workspace_id })
                    setShowEditTodoModal(true)
                  }}
                  onDeleteTodo={handleDeleteTodo}
                  onDeleteList={() => handleDeleteList(list.id)}
                  onMoveTodo={handleMoveTodo}
                  onListNameUpdated={fetchWorkspaceData}
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
                  Ajouter une liste
                </Button>
              </div>
            </div>
          </div>
        </main>

        <Modal
          isOpen={showCreateListModal}
          onClose={() => setShowCreateListModal(false)}
          title="Nouvelle Liste"
        >
          <form onSubmit={handleCreateList} className="list-form">
            <FormInput
              label="Nom de la liste"
              type="text"
              id="listName"
              name="name"
              value={newList.name}
              onChange={(e) => setNewList(prev => ({ ...prev, name: e.target.value }))}
              placeholder="À faire"
              required
            />
            
            <div className="modal-actions">
              <Button 
                type="button" 
                variant="secondary" 
                onClick={() => setShowCreateListModal(false)}
              >
                Annuler
              </Button>
              <Button 
                type="submit" 
                variant="primary"
                disabled={isCreatingList}
              >
                {isCreatingList ? 'Création...' : 'Créer'}
              </Button>
            </div>
          </form>
        </Modal>

        <CreateTodoModal
          isOpen={showCreateTodoModal}
          onClose={() => {
            setShowCreateTodoModal(false)
          }}
          onSubmit={handleCreateTodo}
          labels={labels}
          members={workspace.members}
          selectedListId={selectedListId}
        />

        <EditTodoModal
          isOpen={showEditTodoModal}
          onClose={() => {
            setShowEditTodoModal(false)
            setSelectedTodo(null)
          }}
          todo={selectedTodo}
          onSubmit={handleUpdateTodo}
          labels={labels}
          members={workspace.members}
          workspaceId={id!}
          onLabelsUpdated={handleLabelsUpdated}
        />

        <CreateLabelModal
          isOpen={showCreateLabelModal}
          onClose={() => setShowCreateLabelModal(false)}
          onSubmit={handleCreateLabel}
        />

        <LabelManagerModal
          isOpen={showLabelManagerModal}
          onClose={() => setShowLabelManagerModal(false)}
          labels={labels}
          onLabelUpdated={fetchWorkspaceData}
          onLabelDeleted={fetchWorkspaceData}
          workspaceId={id}
        />
      </div>
    </DndProvider>
    </ErrorBoundary>
  )
}

export default Workspace