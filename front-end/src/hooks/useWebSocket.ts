import { useEffect, useRef, useCallback } from 'react'

interface WebSocketMessage {
  type: string
  data: any
  workspaceId?: string
  userId?: string
  timestamp?: string
}

interface WebSocketHookOptions {
  url: string
  workspaceId: string
  onMessage?: (message: WebSocketMessage) => void
  onConnect?: () => void
  onDisconnect?: () => void
  onError?: (error: Event) => void
  reconnectInterval?: number
  maxReconnectAttempts?: number
}

export const useWebSocket = ({
  url,
  workspaceId,
  onMessage,
  onConnect,
  onDisconnect,
  onError,
  reconnectInterval = 3000,
  maxReconnectAttempts = 5
}: WebSocketHookOptions) => {
  const ws = useRef<WebSocket | null>(null)
  const reconnectAttempts = useRef(0)
  const reconnectTimeoutId = useRef<NodeJS.Timeout | null>(null)
  const isManuallyClosedRef = useRef(false)

  const connect = useCallback(() => {
    try {
      // Close existing connection if any
      if (ws.current) {
        ws.current.close()
      }

      const token = localStorage.getItem('accessToken')
      const wsUrl = `${url}?token=${token}&workspaceId=${workspaceId}`
      
      ws.current = new WebSocket(wsUrl)
      
      ws.current.onopen = () => {
        console.log('WebSocket connected for workspace:', workspaceId)
        reconnectAttempts.current = 0
        onConnect?.()
      }

      ws.current.onmessage = (event) => {
        try {
          const message: WebSocketMessage = JSON.parse(event.data)
          onMessage?.(message)
        } catch (error) {
          console.error('Error parsing WebSocket message:', error)
        }
      }

      ws.current.onclose = (event) => {
        console.log('WebSocket disconnected:', event.code, event.reason)
        onDisconnect?.()
        
        // Only attempt to reconnect if not manually closed and under attempt limit
        if (!isManuallyClosedRef.current && reconnectAttempts.current < maxReconnectAttempts) {
          reconnectAttempts.current++
          console.log(`Attempting to reconnect (${reconnectAttempts.current}/${maxReconnectAttempts})...`)
          
          reconnectTimeoutId.current = setTimeout(() => {
            connect()
          }, reconnectInterval)
        }
      }

      ws.current.onerror = (error) => {
        console.error('WebSocket error:', error)
        onError?.(error)
      }

    } catch (error) {
      console.error('Error connecting to WebSocket:', error)
    }
  }, [url, workspaceId, onMessage, onConnect, onDisconnect, onError, reconnectInterval, maxReconnectAttempts])

  const disconnect = useCallback(() => {
    isManuallyClosedRef.current = true
    
    if (reconnectTimeoutId.current) {
      clearTimeout(reconnectTimeoutId.current)
      reconnectTimeoutId.current = null
    }
    
    if (ws.current) {
      ws.current.close()
      ws.current = null
    }
  }, [])

  const sendMessage = useCallback((message: WebSocketMessage) => {
    if (ws.current && ws.current.readyState === WebSocket.OPEN) {
      ws.current.send(JSON.stringify(message))
    } else {
      console.warn('WebSocket is not connected. Message not sent:', message)
    }
  }, [])

  const getConnectionState = useCallback(() => {
    if (!ws.current) return 'DISCONNECTED'
    
    switch (ws.current.readyState) {
      case WebSocket.CONNECTING:
        return 'CONNECTING'
      case WebSocket.OPEN:
        return 'CONNECTED'
      case WebSocket.CLOSING:
        return 'CLOSING'
      case WebSocket.CLOSED:
        return 'DISCONNECTED'
      default:
        return 'UNKNOWN'
    }
  }, [])

  // Connect on mount
  useEffect(() => {
    isManuallyClosedRef.current = false
    connect()

    // Cleanup on unmount
    return () => {
      disconnect()
    }
  }, [connect, disconnect])

  // Reconnect when workspaceId changes
  useEffect(() => {
    if (ws.current && ws.current.readyState === WebSocket.OPEN) {
      disconnect()
      setTimeout(() => {
        isManuallyClosedRef.current = false
        connect()
      }, 100)
    }
  }, [workspaceId, connect, disconnect])

  return {
    sendMessage,
    disconnect,
    reconnect: connect,
    connectionState: getConnectionState(),
    isConnected: ws.current?.readyState === WebSocket.OPEN
  }
}