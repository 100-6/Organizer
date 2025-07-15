import { createContext, useContext, useState, useEffect, type ReactNode } from 'react'

interface User {
  id: number
  username: string
  email: string
  created_at: string
}

interface AuthContextType {
  user: User | null
  token: string | null
  isAuthenticated: boolean
  isLoading: boolean
  login: (accessToken: string, refreshToken: string, userData: User) => void
  logout: () => void
  checkAuth: () => Promise<boolean>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

interface AuthProviderProps {
  children: ReactNode
}

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [user, setUser] = useState<User | null>(null)
  const [token, setToken] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  const isAuthenticated = !!user

  const login = (accessToken: string, refreshToken: string, userData: User) => {
    localStorage.setItem('accessToken', accessToken)
    localStorage.setItem('refreshToken', refreshToken)
    localStorage.setItem('user', JSON.stringify(userData))
    setUser(userData)
    setToken(accessToken)
  }

  const logout = () => {
    localStorage.removeItem('accessToken')
    localStorage.removeItem('refreshToken')
    localStorage.removeItem('user')
    setUser(null)
    setToken(null)
  }

  const refreshAccessToken = async (): Promise<boolean> => {
    try {
      const refreshToken = localStorage.getItem('refreshToken')
      if (!refreshToken) return false

      const response = await fetch('/api/auth/refresh', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ refreshToken }),
      })

      if (response.ok) {
        const data = await response.json()
        localStorage.setItem('accessToken', data.accessToken)
        localStorage.setItem('refreshToken', data.refreshToken)
        setToken(data.accessToken)
        return true
      } else {
        logout()
        return false
      }
    } catch (error) {
      logout()
      return false
    }
  }

  const checkAuth = async (): Promise<boolean> => {
    try {
      const token = localStorage.getItem('accessToken')
      const userData = localStorage.getItem('user')

      if (!token || !userData) {
        logout()
        return false
      }

      const response = await fetch('/api/users/profile', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (response.ok) {
        const data = await response.json()
        setUser(data.user)
        localStorage.setItem('user', JSON.stringify(data.user))
        const storedToken = localStorage.getItem('accessToken')
        setToken(storedToken)
        return true
      } else if (response.status === 401) {
        const refreshed = await refreshAccessToken()
        if (refreshed) {
          return checkAuth()
        }
        return false
      } else {
        logout()
        return false
      }
    } catch (error) {
      logout()
      return false
    }
  }

  useEffect(() => {
    const initAuth = async () => {
      setIsLoading(true)
      await checkAuth()
      setIsLoading(false)
    }

    initAuth()
  }, [])

  const value = {
    user,
    token,
    isAuthenticated,
    isLoading,
    login,
    logout,
    checkAuth
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}