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
  FormTextarea
} from '../../components'
import WorkspaceHeader from './components/WorkspaceHeader'
import ListColumn from './components/ListColumn'
import TodoCard from './components/TodoCard'
import CreateTodoModal from './components/CreateTodoModal'
import EditTodoModal from './components/EditTodoModal'
import CreateLabelModal from './components/CreateLabelModal'
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
  const [selectedListId, setSelectedListId] = useState<number | null>(null)
  const [selectedTodo, setSelectedTodo] = useState<Todo | null>(null)
  
  const [newList, setNewList] = useState({ name: '', description: '' })
  const [isCreatingList, setIsCreatingList] = useState(false)
  const [showLabelManagerModal, setShowLabelManagerModal] = useState(false)

  useEffect(() => {
    if (id) {
      fetchWorkspaceData()
    }
  }, [id])

  const fetchWorkspaceData = async () => {
    try {
      const token = localStorage.getItem('accessToken')
      
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
        setLists(listsData.lists)
        setLabels(labelsData.labels)

        const todosData: { [listId: number]: Todo[] } = {}
        await Promise.all(
          listsData.lists.map(async (list: List) => {
            const todosRes = await fetch(`/api/todos/list/${list.id}`, {
              headers: { 'Authorization': `Bearer ${token}` }
            })
            if (todosRes.ok) {
              const todosResult = await todosRes.json()
              todosData[list.id] = todosResult.todos
            }
          })
        )
        setTodos(todosData)
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
          position: todos[selectedListId!]?.length || 0
        })
      })

      if (response.ok) {
        setShowCreateTodoModal(false)
        setSelectedListId(null)
        await fetchWorkspaceData()
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

  const handleDeleteTodo = async (todoId: number) => {
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

  if (isLoading) {
    return <LoadingSpinner message="Chargement du workspace..." fullScreen />
  }

  if (!workspace) {
    return (
      <div className="workspace-error">
        <h1>Workspace introuvable</h1>
        <Link to="/dashboard">Retour au dashboard</Link>
      </div>
    )
  }

  return (
    <DndProvider backend={HTML5Backend}>
      <div className="workspace-page">
        <WorkspaceHeader
          workspace={workspace}
          onCreateLabel={() => setShowCreateLabelModal(true)}
          onAddMember={() => {}}
          onSettings={() => {}}
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
                    setSelectedTodo(todo)
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
            setSelectedListId(null)
          }}
          onSubmit={handleCreateTodo}
          labels={labels}
          members={workspace.members}
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
        />

        <CreateLabelModal
          isOpen={showCreateLabelModal}
          onClose={() => setShowCreateLabelModal(false)}
          onSubmit={handleCreateLabel}
        />
        {showLabelManagerModal && (
          <LabelManagerModal
            isOpen={showLabelManagerModal}
            onClose={() => setShowLabelManagerModal(false)}
            labels={labels}
            onLabelUpdated={async () => await fetchWorkspaceData()}
            onLabelDeleted={async () => await fetchWorkspaceData()}
            workspaceId={id}
          />
        )}
      </div>
    </DndProvider>
  )
}

export default Workspace