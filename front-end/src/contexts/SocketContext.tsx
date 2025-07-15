import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuth } from './AuthContext';

interface User {
  id: number;
  username: string;
  email: string;
}

interface SocketContextType {
  socket: Socket | null;
  isConnected: boolean;
  onlineUsers: User[];
  joinWorkspace: (workspaceId: number) => void;
  leaveWorkspace: (workspaceId: number) => void;
  emitUserActivity: (workspaceId: number, activity: string) => void;
}

const SocketContext = createContext<SocketContextType | undefined>(undefined);

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error('useSocket must be used within a SocketProvider');
  }
  return context;
};

interface SocketProviderProps {
  children: React.ReactNode;
}

export const SocketProvider: React.FC<SocketProviderProps> = ({ children }) => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [onlineUsers, setOnlineUsers] = useState<User[]>([]);
  const { user, token } = useAuth();

  useEffect(() => {
    console.log('SocketContext useEffect - user:', user, 'token:', !!token);
    
    // Always disconnect existing socket first
    if (socket) {
      socket.disconnect();
      setSocket(null);
      setIsConnected(false);
      setOnlineUsers([]);
    }
    
    if (!user || !token) {
      console.log('No user or token, not connecting socket');
      return;
    }

    // Create socket connection
    // Use localhost for browser access, not Docker internal names
    const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';
    console.log('Connecting to:', backendUrl, 'with token:', token);
    
    const newSocket = io(backendUrl, {
      auth: {
        token: token
      },
      autoConnect: true
    });

    // Connection event handlers
    newSocket.on('connect', () => {
      console.log('Connected to server');
      setIsConnected(true);
    });

    newSocket.on('disconnect', () => {
      console.log('Disconnected from server');
      setIsConnected(false);
      setOnlineUsers([]);
    });

    newSocket.on('connect_error', (error) => {
      console.error('Socket connection error:', error);
      setIsConnected(false);
    });

    // Presence event handlers
    newSocket.on('user-joined', (userData: User) => {
      setOnlineUsers(prev => {
        const exists = prev.find(u => u.id === userData.id);
        if (!exists) {
          return [...prev, userData];
        }
        return prev;
      });
    });

    newSocket.on('user-left', (userData: { userId: number; username: string }) => {
      setOnlineUsers(prev => prev.filter(u => u.id !== userData.userId));
    });

    newSocket.on('presence-update', (users: User[]) => {
      setOnlineUsers(users);
    });

    // Activity event handlers
    newSocket.on('user-activity', (data: { userId: number; username: string; activity: string }) => {
      // You can handle user activity here (e.g., show typing indicators)
      console.log(`User ${data.username} is ${data.activity}`);
    });

    // Error handling
    newSocket.on('error', (error: string) => {
      console.error('Socket error:', error);
    });

    setSocket(newSocket);

    // Cleanup on unmount
    return () => {
      newSocket.disconnect();
    };
  }, [user, token]);

  const joinWorkspace = useCallback((workspaceId: number) => {
    if (socket && isConnected) {
      socket.emit('join-workspace', workspaceId);
    }
  }, [socket, isConnected]);

  const leaveWorkspace = useCallback((workspaceId: number) => {
    if (socket && isConnected) {
      socket.emit('leave-workspace', workspaceId);
    }
  }, [socket, isConnected]);

  const emitUserActivity = useCallback((workspaceId: number, activity: string) => {
    if (socket && isConnected) {
      socket.emit('user-activity', { workspaceId, activity });
    }
  }, [socket, isConnected]);

  return (
    <SocketContext.Provider
      value={{
        socket,
        isConnected,
        onlineUsers,
        joinWorkspace,
        leaveWorkspace,
        emitUserActivity
      }}
    >
      {children}
    </SocketContext.Provider>
  );
};