import { useState, useEffect } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import { useSocket } from '../../contexts/SocketContext'
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
import OnlineUsers from '../../components/OnlineUsers'
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
  const { user, logout, token } = useAuth()
  const { socket, joinWorkspace, leaveWorkspace, isConnected } = useSocket()
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
  const [openChecklistByDefault, setOpenChecklistByDefault] = useState(false)
  
  const [newList, setNewList] = useState({ name: '', description: '' })
  const [isCreatingList, setIsCreatingList] = useState(false)
  const [globalExpandedLabels, setGlobalExpandedLabels] = useState(false)

  useEffect(() => {
    if (id) {
      fetchWorkspaceData()
    }
  }, [id])

  // Socket.io event handlers
  useEffect(() => {
    if (!socket || !id || !isConnected) return

    const workspaceId = parseInt(id)
    
    // Join workspace room
    console.log('Joining workspace:', workspaceId);
    joinWorkspace(workspaceId)

    // Setup event listeners for real-time updates
    console.log('Setting up Socket.io event listeners');
    const handleTodoCreated = (todo: Todo) => {
      console.log('Real-time todo created:', todo);
      setTodos(prev => ({
        ...prev,
        [todo.list_id]: [...(prev[todo.list_id] || []), todo]
      }))
    }

    const handleTodoUpdated = (updatedTodo: Todo) => {
      setTodos(prev => ({
        ...prev,
        [updatedTodo.list_id]: (prev[updatedTodo.list_id] || []).map(t => 
          t.id === updatedTodo.id ? { ...t, ...updatedTodo } : t  // MERGE au lieu d'écraser
        )
      }))
      
      // Update selectedTodo if it's the same todo and modal is open
      if (selectedTodo && selectedTodo.id === updatedTodo.id) {
        setSelectedTodo(prev => ({ ...prev, ...updatedTodo }))  // MERGE aussi
      }
    }

    const handleTodoDeleted = (data: { id: number; list_id: number }) => {
      setTodos(prev => ({
        ...prev,
        [data.list_id]: (prev[data.list_id] || []).filter(t => t.id !== data.id)
      }))
    }

    const handleTodoMoved = (data: { id: number; fromListId: number; toListId: number; todo: Todo }) => {
      setTodos(prev => {
        const newTodos = { ...prev }
        
        // Remove from old list
        if (newTodos[data.fromListId]) {
          newTodos[data.fromListId] = newTodos[data.fromListId].filter(t => t.id !== data.id)
        }
        
        // Add to new list
        if (!newTodos[data.toListId]) {
          newTodos[data.toListId] = []
        }
        newTodos[data.toListId] = [...newTodos[data.toListId], data.todo]
        
        return newTodos
      })
    }

    const handleListCreated = (list: List) => {
      setLists(prev => [...prev, list])
      setTodos(prev => ({ ...prev, [list.id]: [] }))
    }

    const handleListUpdated = (list: List) => {
      setLists(prev => prev.map(l => l.id === list.id ? list : l))
    }

    const handleListDeleted = (listId: number) => {
      setLists(prev => prev.filter(l => l.id !== listId))
      setTodos(prev => {
        const newTodos = { ...prev }
        delete newTodos[listId]
        return newTodos
      })
    }

    const handleListPositionsUpdated = (data: { lists: { id: number; position: number }[] }) => {
      console.log('Real-time list positions updated:', data)
      
      // Réorganiser les listes selon les nouvelles positions
      setLists(prev => {
        const newLists = [...prev]
        const positionMap = new Map(data.lists.map(l => [l.id, l.position]))
        
        return newLists.sort((a, b) => {
          const posA = positionMap.get(a.id) ?? a.position
          const posB = positionMap.get(b.id) ?? b.position
          return posA - posB
        })
      })
    }

    const handleLabelCreated = (label: Label) => {
      console.log('Real-time label created:', label);
      console.log('Current labels before:', labels.length);
      setLabels(prev => {
        const newLabels = [...prev, label];
        console.log('New labels after:', newLabels.length);
        return newLabels;
      });
    }

    const handleLabelUpdated = (label: Label) => {
      console.log('Real-time label updated:', label);
      setLabels(prev => prev.map(l => l.id === label.id ? label : l))
      
      // Forcer le re-render des todos qui utilisent ce label
      setTodos(prev => {
        const newTodos = { ...prev }
        let updatedSelectedTodo = null;
        
        Object.keys(newTodos).forEach(listId => {
          newTodos[listId] = newTodos[listId].map(todo => {
            if (todo.labels && todo.labels.some(l => l.id === label.id)) {
              const updatedTodo = {
                ...todo,
                labels: todo.labels.map(l => l.id === label.id ? label : l)
              }
              
              // Check if this is the selected todo
              if (selectedTodo && selectedTodo.id === todo.id) {
                updatedSelectedTodo = updatedTodo
              }
              
              return updatedTodo
            }
            return todo
          })
        })
        
        // Update selectedTodo if it was affected
        if (updatedSelectedTodo) {
          setSelectedTodo(updatedSelectedTodo)
        }
        
        return newTodos
      })
    }

    const handleLabelDeleted = (labelId: number) => {
      console.log('Real-time label deleted:', labelId);
      setLabels(prev => prev.filter(l => l.id !== labelId))
      
      // Retirer le label supprimé de tous les todos
      setTodos(prev => {
        const newTodos = { ...prev }
        let updatedSelectedTodo = null;
        
        Object.keys(newTodos).forEach(listId => {
          newTodos[listId] = newTodos[listId].map(todo => {
            if (todo.labels && todo.labels.some(l => l.id === labelId)) {
              const updatedTodo = {
                ...todo,
                labels: todo.labels.filter(l => l.id !== labelId)
              }
              
              // Check if this is the selected todo
              if (selectedTodo && selectedTodo.id === todo.id) {
                updatedSelectedTodo = updatedTodo
              }
              
              return updatedTodo
            }
            return todo
          })
        })
        
        // Update selectedTodo if it was affected
        if (updatedSelectedTodo) {
          setSelectedTodo(updatedSelectedTodo)
        }
        
        return newTodos
      })
    }

    const handleTodoLabelAdded = (data: { todoId: number | string; labelId: number | string }) => {
      console.log('Real-time label added to todo:', data);
      const todoId = parseInt(data.todoId.toString());
      const labelId = parseInt(data.labelId.toString());
      
      // Utiliser une fonction qui accède aux labels actuels
      setLabels(currentLabels => {
        const label = currentLabels.find(l => l.id === labelId);
        if (!label) {
          console.log('Label not found:', labelId, 'Available labels:', currentLabels.map(l => l.id));
          return currentLabels;
        }
        
        // Mettre à jour les todos avec le label trouvé
        setTodos(prev => {
          const newTodos = { ...prev }
          let updatedTodo = null;
          
          Object.keys(newTodos).forEach(listId => {
            newTodos[listId] = newTodos[listId].map(todo => {
              if (todo.id === todoId) {
                console.log('Found todo to update:', todo.id, 'Current labels:', todo.labels?.map(l => l.id));
                const todoLabels = todo.labels || [];
                if (!todoLabels.some(l => l.id === labelId)) {
                  console.log('Adding label to todo');
                  updatedTodo = {
                    ...todo,
                    labels: [...todoLabels, label]
                  }
                  return updatedTodo
                } else {
                  console.log('Label already exists on todo');
                }
              }
              return todo
            })
          })
          
          // Update selectedTodo if it's the same todo
          if (updatedTodo && selectedTodo && selectedTodo.id === todoId) {
            setSelectedTodo(updatedTodo)
          }
          
          return newTodos
        })
        
        return currentLabels;
      })
    }

    const handleTodoLabelRemoved = (data: { todoId: number | string; labelId: number | string }) => {
      console.log('Real-time label removed from todo:', data);
      const todoId = parseInt(data.todoId.toString());
      const labelId = parseInt(data.labelId.toString());
      
      setTodos(prev => {
        const newTodos = { ...prev }
        let updatedTodo = null;
        
        Object.keys(newTodos).forEach(listId => {
          newTodos[listId] = newTodos[listId].map(todo => {
            if (todo.id === todoId && todo.labels) {
              updatedTodo = {
                ...todo,
                labels: todo.labels.filter(l => l.id !== labelId)
              }
              return updatedTodo
            }
            return todo
          })
        })
        
        // Update selectedTodo if it's the same todo
        if (updatedTodo && selectedTodo && selectedTodo.id === todoId) {
          setSelectedTodo(updatedTodo)
        }
        
        return newTodos
      })
    }

    const handleTodoMemberAssigned = (data: { todoId: number | string; member: any }) => {
      console.log('Real-time member assigned to todo:', data);
      const todoId = parseInt(data.todoId.toString());
      
      setTodos(prev => {
        const newTodos = { ...prev }
        let updatedTodo = null;
        
        Object.keys(newTodos).forEach(listId => {
          newTodos[listId] = newTodos[listId].map(todo => {
            if (todo.id === todoId) {
              const currentMembers = todo.assigned_members || [];
              if (!currentMembers.some(m => m.id === data.member.id)) {
                updatedTodo = {
                  ...todo,
                  assigned_members: [...currentMembers, data.member]
                }
                return updatedTodo
              }
            }
            return todo
          })
        })
        
        // Update selectedTodo if it's the same todo
        if (updatedTodo && selectedTodo && selectedTodo.id === todoId) {
          setSelectedTodo(updatedTodo)
        }
        
        return newTodos
      })
    }

    const handleTodoMemberUnassigned = (data: { todoId: number | string; memberId: number | string }) => {
      console.log('Real-time member unassigned from todo:', data);
      const todoId = parseInt(data.todoId.toString());
      const memberId = parseInt(data.memberId.toString());
      
      setTodos(prev => {
        const newTodos = { ...prev }
        let updatedTodo = null;
        
        Object.keys(newTodos).forEach(listId => {
          newTodos[listId] = newTodos[listId].map(todo => {
            if (todo.id === todoId && todo.assigned_members) {
              updatedTodo = {
                ...todo,
                assigned_members: todo.assigned_members.filter(m => m.id !== memberId)
              }
              return updatedTodo
            }
            return todo
          })
        })
        
        // Update selectedTodo if it's the same todo
        if (updatedTodo && selectedTodo && selectedTodo.id === todoId) {
          setSelectedTodo(updatedTodo)
        }
        
        return newTodos
      })
    }

    const handleChecklistItemCreated = (data: { todoId: number | string; checklistItem: any; checklist_count: number; completed_checklist_count: number }) => {
      console.log('Real-time checklist item created:', data);
      const todoId = parseInt(data.todoId.toString());
      
      setTodos(prev => {
        const newTodos = { ...prev }
        let updatedTodo = null;
        
        Object.keys(newTodos).forEach(listId => {
          newTodos[listId] = newTodos[listId].map(todo => {
            if (todo.id === todoId) {
              updatedTodo = {
                ...todo,
                checklist_count: data.checklist_count,
                completed_checklist_count: data.completed_checklist_count,
                checklist_items: todo.checklist_items ? [...todo.checklist_items, data.checklistItem] : [data.checklistItem]
              }
              return updatedTodo
            }
            return todo
          })
        })
        
        // Update selectedTodo if it's the same todo - preserve all existing data
        if (selectedTodo && selectedTodo.id === todoId) {
          setSelectedTodo(prev => ({
            ...prev,
            checklist_count: data.checklist_count,
            completed_checklist_count: data.completed_checklist_count,
            checklist_items: prev.checklist_items ? [...prev.checklist_items, data.checklistItem] : [data.checklistItem]
          }))
        }
        
        return newTodos
      })
    }

    const handleChecklistItemUpdated = (data: { todoId: number | string; checklistItem: any; checklist_count: number; completed_checklist_count: number }) => {
      console.log('Real-time checklist item updated:', data);
      const todoId = parseInt(data.todoId.toString());
      
      setTodos(prev => {
        const newTodos = { ...prev }
        let updatedTodo = null;
        
        Object.keys(newTodos).forEach(listId => {
          newTodos[listId] = newTodos[listId].map(todo => {
            if (todo.id === todoId) {
              updatedTodo = {
                ...todo,
                checklist_count: data.checklist_count,
                completed_checklist_count: data.completed_checklist_count,
                checklist_items: todo.checklist_items ? 
                  todo.checklist_items.map(item => 
                    item.id === data.checklistItem.id ? data.checklistItem : item
                  ) : [data.checklistItem]
              }
              return updatedTodo
            }
            return todo
          })
        })
        
        // Update selectedTodo if it's the same todo - preserve all existing data
        if (selectedTodo && selectedTodo.id === todoId) {
          setSelectedTodo(prev => ({
            ...prev,
            checklist_count: data.checklist_count,
            completed_checklist_count: data.completed_checklist_count,
            checklist_items: prev.checklist_items ? 
              prev.checklist_items.map(item => 
                item.id === data.checklistItem.id ? data.checklistItem : item
              ) : [data.checklistItem]
          }))
        }
        
        return newTodos
      })
    }

    const handleChecklistItemDeleted = (data: { todoId: number | string; itemId: number | string; checklist_count: number; completed_checklist_count: number }) => {
      console.log('Real-time checklist item deleted:', data);
      const todoId = parseInt(data.todoId.toString());
      const itemId = parseInt(data.itemId.toString());
      
      setTodos(prev => {
        const newTodos = { ...prev }
        let updatedTodo = null;
        
        Object.keys(newTodos).forEach(listId => {
          newTodos[listId] = newTodos[listId].map(todo => {
            if (todo.id === todoId) {
              updatedTodo = {
                ...todo,
                checklist_count: data.checklist_count,
                completed_checklist_count: data.completed_checklist_count,
                checklist_items: todo.checklist_items ? 
                  todo.checklist_items.filter(item => item.id !== itemId) : []
              }
              return updatedTodo
            }
            return todo
          })
        })
        
        // Update selectedTodo if it's the same todo - preserve all existing data
        if (selectedTodo && selectedTodo.id === todoId) {
          setSelectedTodo(prev => ({
            ...prev,
            checklist_count: data.checklist_count,
            completed_checklist_count: data.completed_checklist_count,
            checklist_items: prev.checklist_items ? 
              prev.checklist_items.filter(item => item.id !== itemId) : []
          }))
        }
        
        return newTodos
      })
    }

    // Register event listeners
    socket.on('todo:created', handleTodoCreated)
    socket.on('todo:updated', handleTodoUpdated)
    socket.on('todo:deleted', handleTodoDeleted)
    socket.on('todo:moved', handleTodoMoved)
    socket.on('list:created', handleListCreated)
    socket.on('list:updated', handleListUpdated)
    socket.on('list:deleted', handleListDeleted)
    socket.on('list:positions-updated', handleListPositionsUpdated)
    socket.on('label:created', handleLabelCreated)
    socket.on('label:updated', handleLabelUpdated)
    socket.on('label:deleted', handleLabelDeleted)
    socket.on('todo:label-added', handleTodoLabelAdded)
    socket.on('todo:label-removed', handleTodoLabelRemoved)
    socket.on('todo:member-assigned', handleTodoMemberAssigned)
    socket.on('todo:member-unassigned', handleTodoMemberUnassigned)
    socket.on('todo:checklist-item-created', handleChecklistItemCreated)
    socket.on('todo:checklist-item-updated', handleChecklistItemUpdated)
    socket.on('todo:checklist-item-deleted', handleChecklistItemDeleted)

    // Cleanup
    return () => {
      socket.off('todo:created', handleTodoCreated)
      socket.off('todo:updated', handleTodoUpdated)
      socket.off('todo:deleted', handleTodoDeleted)
      socket.off('todo:moved', handleTodoMoved)
      socket.off('list:created', handleListCreated)
      socket.off('list:updated', handleListUpdated)
      socket.off('list:deleted', handleListDeleted)
      socket.off('list:positions-updated', handleListPositionsUpdated)
      socket.off('label:created', handleLabelCreated)
      socket.off('label:updated', handleLabelUpdated)
      socket.off('label:deleted', handleLabelDeleted)
      socket.off('todo:label-added', handleTodoLabelAdded)
      socket.off('todo:label-removed', handleTodoLabelRemoved)
      socket.off('todo:member-assigned', handleTodoMemberAssigned)
      socket.off('todo:member-unassigned', handleTodoMemberUnassigned)
      socket.off('todo:checklist-item-created', handleChecklistItemCreated)
      socket.off('todo:checklist-item-updated', handleChecklistItemUpdated)
      socket.off('todo:checklist-item-deleted', handleChecklistItemDeleted)
      
      leaveWorkspace(workspaceId)
    }
  }, [socket, id, isConnected])

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
        // Ne pas recharger toutes les données, laisser Socket.io gérer la synchronisation
        console.log('Todo updated successfully, waiting for Socket.io event')
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

  const handleOpenCardDetails = async (todo: Todo, openChecklist: boolean = false) => {
    try {
      // Fetch complete todo details including checklist items
      const token = localStorage.getItem('accessToken')
      const response = await fetch(`/api/todos/${todo.id}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      
      if (response.ok) {
        const data = await response.json()
        const detailedTodo = {
          ...data.todo,
          workspace_id: todo.workspace_id ?? lists.find(l => l.id === todo.list_id)?.workspace_id
        }
        setSelectedTodo(detailedTodo)
      } else {
        // Fallback to basic todo data
        setSelectedTodo({ ...todo, workspace_id: todo.workspace_id ?? lists.find(l => l.id === todo.list_id)?.workspace_id })
      }
    } catch (error) {
      console.error('Error fetching todo details:', error)
      // Fallback to basic todo data
      setSelectedTodo({ ...todo, workspace_id: todo.workspace_id ?? lists.find(l => l.id === todo.list_id)?.workspace_id })
    }
    setOpenChecklistByDefault(openChecklist)
    setShowCardDetailsModal(true)
  }

  const handleOpenCardDetailsWithChecklist = async (todo: Todo) => {
    await handleOpenCardDetails(todo, true)
  }

  const handleCloseCardDetails = () => {
    setSelectedTodo(null)
    setShowCardDetailsModal(false)
    setOpenChecklistByDefault(false)
  }

  const refreshSelectedTodo = async () => {
    if (selectedTodo) {
      try {
        const token = localStorage.getItem('accessToken')
        const response = await fetch(`/api/todos/${selectedTodo.id}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        })
        
        if (response.ok) {
          const data = await response.json()
          const detailedTodo = {
            ...data.todo,
            workspace_id: selectedTodo.workspace_id
          }
          setSelectedTodo(detailedTodo)
        }
      } catch (error) {
        console.error('Error refreshing todo details:', error)
      }
    }
  }

  const handleAddMember = () => {
    console.log('Ajouter un membre - fonction à implémenter')
  }

  const handleLabelsUpdated = async () => {
    await fetchWorkspaceData()
    await refreshSelectedTodo()
  }

  const handleSettings = () => {
    console.log('Paramètres du workspace - fonction à implémenter')
  }

  const getListName = (listId: number) => {
    return lists.find(list => list.id === listId)?.name || 'Unknown List'
  }

  const moveList = async (from: number, to: number) => {
    // Calculer le nouvel ordre avec les nouvelles positions
    const updatedLists = update(lists, {
      $splice: [
        [from, 1],
        [to, 0, lists[from]]
      ]
    })

    // Mettre à jour l'état local immédiatement
    setLists(updatedLists)

    // Calculer les nouvelles positions basées sur l'ordre mis à jour
    const newOrder = updatedLists.map((list, idx) => ({
      id: list.id,
      position: idx
    }))

    console.log('Sending lists data:', JSON.stringify(newOrder, null, 2));

    try {
      console.log('Request payload:', JSON.stringify({ lists: newOrder }, null, 2))
      console.log('Token from context:', token)
      
      const response = await fetch('/api/lists/positions', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token || localStorage.getItem('accessToken')}`
        },
        body: JSON.stringify({ lists: newOrder })
      })

      console.log('Response status:', response.status)
      if (!response.ok) {
        const errorText = await response.text()
        console.log('Response error:', errorText)
        throw new Error('Erreur lors de la sauvegarde des positions')
      }

      console.log('List positions saved successfully')
    } catch (err) {
      console.error('Error saving list positions:', err)
      // Rollback en cas d'erreur
      setLists(lists) // Revenir à l'état précédent
      setError('Erreur lors de la sauvegarde des positions des listes')
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

          <OnlineUsers />

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
                    onChecklistClick={handleOpenCardDetailsWithChecklist}
                    onDeleteTodo={handleDeleteTodo}
                    onDeleteList={() => handleDeleteList(list.id)}
                    onMoveTodo={handleMoveTodo}
                    onListNameUpdated={fetchWorkspaceData}
                    globalExpandedLabels={globalExpandedLabels}
                    setGlobalExpandedLabels={setGlobalExpandedLabels}
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
            onLabelsUpdated={handleLabelsUpdated}
            openChecklistByDefault={openChecklistByDefault}
          />
        </div>
      </DndProvider>
    </ErrorBoundary>
  )
}

export default Workspace