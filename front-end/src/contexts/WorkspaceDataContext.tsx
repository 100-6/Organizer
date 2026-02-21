import React, { createContext, useContext, useReducer, useEffect, useCallback } from 'react'

// Types
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
  checklist_items?: ChecklistItem[]
  workspace_id: number
}

interface ChecklistItem {
  id: number
  title: string
  is_completed: boolean
  todo_id: number
  position: number
  created_at: string
}

interface Label {
  id: number
  name: string | null
  color: string
  workspace_id: number
  created_at: string
}

interface List {
  id: number
  name: string
  workspace_id: number
  position: number
  created_at: string
  todos: Todo[]
}

interface Member {
  id: number
  username: string
  email: string
  role: string
  joined_at: string
}

interface WorkspaceData {
  id: number
  name: string
  description: string | null
  lists: List[]
  labels: Label[]
  members: Member[]
  isLoading: boolean
  error: string | null
}

// Actions
type WorkspaceAction =
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'SET_WORKSPACE_DATA'; payload: Omit<WorkspaceData, 'isLoading' | 'error'> }
  | { type: 'ADD_LIST'; payload: { list: List } }
  | { type: 'UPDATE_TODO'; payload: { todoId: number; updates: Partial<Todo> } }
  | { type: 'ADD_LABEL_TO_TODO'; payload: { todoId: number; label: Label } }
  | { type: 'REMOVE_LABEL_FROM_TODO'; payload: { todoId: number; labelId: number } }
  | { type: 'UPDATE_CHECKLIST_ITEM'; payload: { todoId: number; itemId: number; updates: Partial<ChecklistItem> } }
  | { type: 'ADD_CHECKLIST_ITEM'; payload: { todoId: number; item: ChecklistItem } }
  | { type: 'REMOVE_CHECKLIST_ITEM'; payload: { todoId: number; itemId: number } }
  | { type: 'ASSIGN_MEMBER_TO_TODO'; payload: { todoId: number; member: Member } }
  | { type: 'REMOVE_MEMBER_FROM_TODO'; payload: { todoId: number; memberId: number } }
  | { type: 'MOVE_TODO'; payload: { todoId: number; targetListId: number; newPosition: number } }
  | { type: 'WEBSOCKET_UPDATE'; payload: any }

// Reducer
const workspaceReducer = (state: WorkspaceData, action: WorkspaceAction): WorkspaceData => {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload }

    case 'SET_ERROR':
      return { ...state, error: action.payload }

    case 'SET_WORKSPACE_DATA':
      return {
        ...action.payload,
        isLoading: false,
        error: null
      }

    case 'ADD_LIST': {
      const { list } = action.payload
      return {
        ...state,
        lists: [...state.lists, list]
      }
    }

    case 'UPDATE_TODO': {
      const { todoId, updates } = action.payload
      return {
        ...state,
        lists: state.lists.map(list => ({
          ...list,
          todos: list.todos.map(todo =>
            todo.id === todoId ? { ...todo, ...updates } : todo
          )
        }))
      }
    }

    case 'ADD_LABEL_TO_TODO': {
      const { todoId, label } = action.payload
      return {
        ...state,
        lists: state.lists.map(list => ({
          ...list,
          todos: list.todos.map(todo =>
            todo.id === todoId
              ? { ...todo, labels: [...todo.labels.filter(l => l.id !== label.id), label] }
              : todo
          )
        }))
      }
    }

    case 'REMOVE_LABEL_FROM_TODO': {
      const { todoId, labelId } = action.payload
      return {
        ...state,
        lists: state.lists.map(list => ({
          ...list,
          todos: list.todos.map(todo =>
            todo.id === todoId
              ? { ...todo, labels: todo.labels.filter(l => l.id !== labelId) }
              : todo
          )
        }))
      }
    }

    case 'ASSIGN_MEMBER_TO_TODO': {
      const { todoId, member } = action.payload
      return {
        ...state,
        lists: state.lists.map(list => ({
          ...list,
          todos: list.todos.map(todo =>
            todo.id === todoId
              ? { ...todo, assigned_to: member.id, assigned_username: member.username }
              : todo
          )
        }))
      }
    }

    case 'REMOVE_MEMBER_FROM_TODO': {
      const { todoId } = action.payload
      return {
        ...state,
        lists: state.lists.map(list => ({
          ...list,
          todos: list.todos.map(todo =>
            todo.id === todoId
              ? { ...todo, assigned_to: null, assigned_username: null }
              : todo
          )
        }))
      }
    }

    case 'UPDATE_CHECKLIST_ITEM': {
      const { todoId, itemId, updates } = action.payload
      return {
        ...state,
        lists: state.lists.map(list => ({
          ...list,
          todos: list.todos.map(todo => {
            if (todo.id === todoId && todo.checklist_items) {
              const updatedItems = todo.checklist_items.map(item =>
                item.id === itemId ? { ...item, ...updates } : item
              )
              const completedCount = updatedItems.filter(item => item.is_completed).length

              return {
                ...todo,
                checklist_items: updatedItems,
                checklist_count: updatedItems.length,
                completed_checklist_count: completedCount
              }
            }
            return todo
          })
        }))
      }
    }

    case 'ADD_CHECKLIST_ITEM': {
      const { todoId, item } = action.payload
      return {
        ...state,
        lists: state.lists.map(list => ({
          ...list,
          todos: list.todos.map(todo => {
            if (todo.id === todoId) {
              const newItems = [...(todo.checklist_items || []), item]
              return {
                ...todo,
                checklist_items: newItems,
                checklist_count: newItems.length,
                completed_checklist_count: newItems.filter(item => item.is_completed).length
              }
            }
            return todo
          })
        }))
      }
    }

    case 'REMOVE_CHECKLIST_ITEM': {
      const { todoId, itemId } = action.payload
      return {
        ...state,
        lists: state.lists.map(list => ({
          ...list,
          todos: list.todos.map(todo => {
            if (todo.id === todoId && todo.checklist_items) {
              const newItems = todo.checklist_items.filter(item => item.id !== itemId)
              return {
                ...todo,
                checklist_items: newItems,
                checklist_count: newItems.length,
                completed_checklist_count: newItems.filter(item => item.is_completed).length
              }
            }
            return todo
          })
        }))
      }
    }

    case 'MOVE_TODO': {
      const { todoId, targetListId, newPosition } = action.payload

      // Find and remove the todo from its current list
      let todoToMove: Todo | null = null
      const listsWithoutTodo = state.lists.map(list => ({
        ...list,
        todos: list.todos.filter(todo => {
          if (todo.id === todoId) {
            todoToMove = { ...todo, list_id: targetListId, position: newPosition }
            return false
          }
          return true
        })
      }))

      if (!todoToMove) return state

      // Add the todo to the target list
      return {
        ...state,
        lists: listsWithoutTodo.map(list => {
          if (list.id === targetListId) {
            const updatedTodos = [...list.todos, todoToMove!]
            // Sort by position
            updatedTodos.sort((a, b) => a.position - b.position)
            return { ...list, todos: updatedTodos }
          }
          return list
        })
      }
    }

    case 'WEBSOCKET_UPDATE': {
      const { type: updateType, data } = action.payload

      switch (updateType) {
        case 'TODO_UPDATED':
          return {
            ...state,
            lists: state.lists.map(list => ({
              ...list,
              todos: list.todos.map(todo =>
                todo.id === data.todoId ? { ...todo, ...data.updates } : todo
              )
            }))
          }

        case 'LABEL_ADDED_TO_TODO':
          return {
            ...state,
            lists: state.lists.map(list => ({
              ...list,
              todos: list.todos.map(todo =>
                todo.id === data.todoId
                  ? { ...todo, labels: [...todo.labels.filter(l => l.id !== data.label.id), data.label] }
                  : todo
              )
            }))
          }

        case 'LABEL_REMOVED_FROM_TODO':
          return {
            ...state,
            lists: state.lists.map(list => ({
              ...list,
              todos: list.todos.map(todo =>
                todo.id === data.todoId
                  ? { ...todo, labels: todo.labels.filter(l => l.id !== data.labelId) }
                  : todo
              )
            }))
          }

        case 'MEMBER_ASSIGNED_TO_TODO':
          return {
            ...state,
            lists: state.lists.map(list => ({
              ...list,
              todos: list.todos.map(todo =>
                todo.id === data.todoId
                  ? { ...todo, assigned_to: data.member.id, assigned_username: data.member.username }
                  : todo
              )
            }))
          }

        case 'MEMBER_REMOVED_FROM_TODO':
          return {
            ...state,
            lists: state.lists.map(list => ({
              ...list,
              todos: list.todos.map(todo =>
                todo.id === data.todoId
                  ? { ...todo, assigned_to: null, assigned_username: null }
                  : todo
              )
            }))
          }

        default:
          return state
      }
    }

    default:
      return state
  }
}

// Context
interface WorkspaceDataContextType {
  state: WorkspaceData
  actions: {
    loadWorkspace: (workspaceId: string) => Promise<void>
    createList: (name: string) => Promise<void>
    updateTodo: (todoId: number, updates: Partial<Todo>) => Promise<void>
    addLabelToTodo: (todoId: number, labelId: number) => Promise<void>
    removeLabelFromTodo: (todoId: number, labelId: number) => Promise<void>
    assignMemberToTodo: (todoId: number, memberId: number) => Promise<void>
    removeMemberFromTodo: (todoId: number, memberId: number) => Promise<void>
    updateChecklistItem: (todoId: number, itemId: number, updates: Partial<ChecklistItem>) => Promise<void>
    addChecklistItem: (todoId: number, title: string) => Promise<void>
    removeChecklistItem: (todoId: number, itemId: number) => Promise<void>
    moveTodo: (todoId: number, targetListId: number, newPosition: number) => Promise<void>
  }
}

const WorkspaceDataContext = createContext<WorkspaceDataContextType | null>(null)

// Provider
export const WorkspaceDataProvider: React.FC<{ children: React.ReactNode; workspaceId: string }> = ({
  children,
  workspaceId
}) => {
  const initialState: WorkspaceData = {
    id: 0,
    name: '',
    description: null,
    lists: [],
    labels: [],
    members: [],
    isLoading: true,
    error: null
  }

  const [state, dispatch] = useReducer(workspaceReducer, initialState)

  // Load workspace data
  const loadWorkspace = useCallback(async (workspaceId: string) => {
    dispatch({ type: 'SET_LOADING', payload: true })
    dispatch({ type: 'SET_ERROR', payload: null })

    try {
      const token = localStorage.getItem('accessToken')
      const response = await fetch(`/api/workspaces/${workspaceId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })

      if (!response.ok) {
        throw new Error('Failed to load workspace')
      }

      const data = await response.json()

      dispatch({
        type: 'SET_WORKSPACE_DATA',
        payload: {
          id: data.workspace.id,
          name: data.workspace.name,
          description: data.workspace.description,
          lists: data.lists || [],
          labels: data.labels || [],
          members: data.members || []
        }
      })
    } catch (error) {
      console.error('Error loading workspace:', error)
      dispatch({ type: 'SET_ERROR', payload: 'Failed to load workspace' })
    }
  }, [])

  // For now, disable WebSockets and use polling for sync
  // TODO: Implement WebSocket server later
  const broadcastChange = useCallback((type: string, data: any) => {
    // For now, just log the change that would be broadcast
    console.log('Would broadcast:', type, data)
  }, [])

  // Create list action
  const createList = useCallback(async (name: string) => {
    try {
      const token = localStorage.getItem('accessToken')
      const response = await fetch('/api/lists', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          name: name.trim(),
          workspaceId: workspaceId,
          position: state.lists.length
        })
      })

      if (response.ok) {
        const data = await response.json()
        const newList: List = {
          id: data.list.id,
          name: data.list.name,
          workspace_id: data.list.workspace_id,
          position: data.list.position,
          created_at: data.list.created_at,
          todos: []
        }

        // Add the new list to state
        dispatch({ type: 'ADD_LIST', payload: { list: newList } })
      } else {
        const data = await response.json()
        console.error('Error creating list:', data.error)
        throw new Error(data.error || 'Failed to create list')
      }
    } catch (error) {
      console.error('Error creating list:', error)
      throw error
    }
  }, [workspaceId, state.lists.length])

  // API Actions with optimistic updates
  const updateTodo = useCallback(async (todoId: number, updates: Partial<Todo>) => {
    // Optimistic update
    dispatch({ type: 'UPDATE_TODO', payload: { todoId, updates } })

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

      if (!response.ok) {
        // Revert optimistic update by reloading workspace
        loadWorkspace(workspaceId)
        throw new Error('Failed to update todo')
      } else {
        // Broadcast change to other users
        broadcastChange('TODO_UPDATED', { todoId, updates })
      }
    } catch (error) {
      console.error('Error updating todo:', error)
    }
  }, [workspaceId, loadWorkspace, broadcastChange])

  const addLabelToTodo = useCallback(async (todoId: number, labelId: number) => {
    const label = state.labels.find(l => l.id === labelId)
    if (!label) return

    // Optimistic update
    dispatch({ type: 'ADD_LABEL_TO_TODO', payload: { todoId, label } })

    try {
      const token = localStorage.getItem('accessToken')
      const response = await fetch(`/api/todos/${todoId}/labels`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ labelId })
      })

      if (!response.ok) {
        // Revert optimistic update
        dispatch({ type: 'REMOVE_LABEL_FROM_TODO', payload: { todoId, labelId } })
        throw new Error('Failed to add label')
      } else {
        // Broadcast change to other users
        broadcastChange('LABEL_ADDED_TO_TODO', { todoId, label })
      }
    } catch (error) {
      console.error('Error adding label:', error)
    }
  }, [state.labels, broadcastChange])

  const removeLabelFromTodo = useCallback(async (todoId: number, labelId: number) => {
    const label = state.labels.find(l => l.id === labelId)
    if (!label) return

    // Optimistic update
    dispatch({ type: 'REMOVE_LABEL_FROM_TODO', payload: { todoId, labelId } })

    try {
      const token = localStorage.getItem('accessToken')
      const response = await fetch(`/api/todos/${todoId}/labels/${labelId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      })

      if (!response.ok) {
        // Revert optimistic update
        dispatch({ type: 'ADD_LABEL_TO_TODO', payload: { todoId, label } })
        throw new Error('Failed to remove label')
      } else {
        // Broadcast change to other users
        broadcastChange('LABEL_REMOVED_FROM_TODO', { todoId, labelId })
      }
    } catch (error) {
      console.error('Error removing label:', error)
    }
  }, [state.labels, broadcastChange])

  const assignMemberToTodo = useCallback(async (todoId: number, memberId: number) => {
    const member = state.members.find(m => m.id === memberId)
    if (!member) return

    // Optimistic update
    dispatch({ type: 'ASSIGN_MEMBER_TO_TODO', payload: { todoId, member } })

    try {
      const token = localStorage.getItem('accessToken')
      const response = await fetch(`/api/todos/${todoId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ assignedTo: memberId })
      })

      if (!response.ok) {
        // Revert optimistic update
        dispatch({ type: 'REMOVE_MEMBER_FROM_TODO', payload: { todoId, memberId } })
        throw new Error('Failed to assign member')
      } else {
        // Broadcast change to other users
        broadcastChange('MEMBER_ASSIGNED_TO_TODO', { todoId, member })
      }
    } catch (error) {
      console.error('Error assigning member:', error)
    }
  }, [state.members, broadcastChange])

  const removeMemberFromTodo = useCallback(async (todoId: number, memberId: number) => {
    const member = state.members.find(m => m.id === memberId)

    // Optimistic update
    dispatch({ type: 'REMOVE_MEMBER_FROM_TODO', payload: { todoId, memberId } })

    try {
      const token = localStorage.getItem('accessToken')
      const response = await fetch(`/api/todos/${todoId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ assignedTo: null })
      })

      if (!response.ok) {
        // Revert optimistic update
        if (member) {
          dispatch({ type: 'ASSIGN_MEMBER_TO_TODO', payload: { todoId, member } })
        }
        throw new Error('Failed to remove member')
      } else {
        // Broadcast change to other users
        broadcastChange('MEMBER_REMOVED_FROM_TODO', { todoId, memberId })
      }
    } catch (error) {
      console.error('Error removing member:', error)
    }
  }, [state.members, broadcastChange])

  const updateChecklistItem = useCallback(async (todoId: number, itemId: number, updates: Partial<ChecklistItem>) => {
    // Optimistic update
    dispatch({ type: 'UPDATE_CHECKLIST_ITEM', payload: { todoId, itemId, updates } })

    try {
      const token = localStorage.getItem('accessToken')
      const response = await fetch(`/api/todos/${todoId}/checklist/${itemId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(updates)
      })

      if (!response.ok) {
        // Revert by reloading workspace
        loadWorkspace(workspaceId)
        throw new Error('Failed to update checklist item')
      }
    } catch (error) {
      console.error('Error updating checklist item:', error)
    }
  }, [workspaceId, loadWorkspace])

  const addChecklistItem = useCallback(async (todoId: number, title: string) => {
    try {
      const token = localStorage.getItem('accessToken')
      const response = await fetch(`/api/todos/${todoId}/checklist`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ title, position: 0 })
      })

      if (response.ok) {
        const data = await response.json()
        dispatch({ type: 'ADD_CHECKLIST_ITEM', payload: { todoId, item: data.checklistItem } })
      }
    } catch (error) {
      console.error('Error adding checklist item:', error)
    }
  }, [])

  const removeChecklistItem = useCallback(async (todoId: number, itemId: number) => {
    // Optimistic update
    dispatch({ type: 'REMOVE_CHECKLIST_ITEM', payload: { todoId, itemId } })

    try {
      const token = localStorage.getItem('accessToken')
      const response = await fetch(`/api/todos/${todoId}/checklist/${itemId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      })

      if (!response.ok) {
        // Revert by reloading workspace
        loadWorkspace(workspaceId)
        throw new Error('Failed to remove checklist item')
      }
    } catch (error) {
      console.error('Error removing checklist item:', error)
    }
  }, [workspaceId, loadWorkspace])

  const moveTodo = useCallback(async (todoId: number, targetListId: number, newPosition: number) => {
    // Optimistic update
    dispatch({ type: 'MOVE_TODO', payload: { todoId, targetListId, newPosition } })

    try {
      const token = localStorage.getItem('accessToken')
      const response = await fetch(`/api/todos/${todoId}/move`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ listId: targetListId, position: newPosition })
      })

      if (!response.ok) {
        // Revert by reloading workspace
        loadWorkspace(workspaceId)
        throw new Error('Failed to move todo')
      }
    } catch (error) {
      console.error('Error moving todo:', error)
    }
  }, [workspaceId, loadWorkspace])

  // Disable polling for now to avoid constant refresh issues
  // TODO: Re-enable with proper state management later
  // useEffect(() => {
  //   const interval = setInterval(() => {
  //     if (!state.isLoading) {
  //       loadWorkspace(workspaceId)
  //     }
  //   }, 30000) // Reduced to 30 seconds when re-enabled
  //   return () => clearInterval(interval)
  // }, [workspaceId, loadWorkspace, state.isLoading])

  // Load workspace on mount
  useEffect(() => {
    loadWorkspace(workspaceId)
  }, [workspaceId, loadWorkspace])

  const actions = {
    loadWorkspace,
    createList,
    updateTodo,
    addLabelToTodo,
    removeLabelFromTodo,
    assignMemberToTodo,
    removeMemberFromTodo,
    updateChecklistItem,
    addChecklistItem,
    removeChecklistItem,
    moveTodo
  }

  return (
    <WorkspaceDataContext.Provider value={{ state, actions }}>
      {children}
    </WorkspaceDataContext.Provider>
  )
}

// Hook
export const useWorkspaceData = () => {
  const context = useContext(WorkspaceDataContext)
  if (!context) {
    throw new Error('useWorkspaceData must be used within a WorkspaceDataProvider')
  }
  return context
}

export type { Todo, Label, ChecklistItem, Member, List, WorkspaceData }