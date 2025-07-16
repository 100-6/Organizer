const jwt = require('jsonwebtoken');
const pool = require('../config/database');

// Store connected users and their presence
const connectedUsers = new Map();
const workspacePresence = new Map();

// Socket authentication middleware
const authenticateSocket = async (socket, next) => {
  try {
    const token = socket.handshake.auth.token;
    console.log('Socket auth attempt with token:', !!token);
    if (!token) {
      console.log('No token provided in socket auth');
      return next(new Error('No token provided'));
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log('Decoded JWT:', decoded);
    
    // Le JWT contient userId, pas id
    const userId = decoded.userId || decoded.id;
    console.log('Looking for user with ID:', userId);
    
    const user = await pool.query('SELECT id, username, email FROM users WHERE id = $1', [userId]);
    
    if (user.rows.length === 0) {
      return next(new Error('User not found'));
    }

    socket.user = user.rows[0];
    next();
  } catch (error) {
    next(new Error('Authentication failed'));
  }
};

// Helper function to get workspace members
const getWorkspaceMembers = async (workspaceId) => {
  const result = await pool.query(`
    SELECT u.id, u.username, u.email, wm.role
    FROM users u
    JOIN workspace_members wm ON u.id = wm.user_id
    WHERE wm.workspace_id = $1
  `, [workspaceId]);
  return result.rows;
};

// Helper function to check if user is member of workspace
const isWorkspaceMember = async (userId, workspaceId) => {
  const result = await pool.query(
    'SELECT role FROM workspace_members WHERE user_id = $1 AND workspace_id = $2',
    [userId, workspaceId]
  );
  return result.rows.length > 0;
};

// Helper function to update presence
const updateWorkspacePresence = (workspaceId, userId, isOnline) => {
  if (!workspacePresence.has(workspaceId)) {
    workspacePresence.set(workspaceId, new Map());
  }
  
  const presence = workspacePresence.get(workspaceId);
  
  if (isOnline) {
    presence.set(userId, {
      id: userId,
      username: connectedUsers.get(userId)?.username || 'Unknown',
      lastSeen: new Date()
    });
  } else {
    presence.delete(userId);
  }
};

// Helper function to get workspace presence
const getWorkspacePresence = (workspaceId) => {
  if (!workspacePresence.has(workspaceId)) {
    return [];
  }
  return Array.from(workspacePresence.get(workspaceId).values());
};

module.exports = (io) => {
  // Use authentication middleware
  io.use(authenticateSocket);

  io.on('connection', (socket) => {
    console.log(`User ${socket.user.username} connected with socket ${socket.id}`);
    
    // Store user connection
    connectedUsers.set(socket.user.id, {
      socketId: socket.id,
      username: socket.user.username,
      email: socket.user.email,
      workspaces: new Set()
    });

    // Join workspace room
    socket.on('join-workspace', async (workspaceId) => {
      try {
        // Check if user is member of workspace
        if (!await isWorkspaceMember(socket.user.id, workspaceId)) {
          socket.emit('error', 'Not authorized to join this workspace');
          return;
        }

        // Leave previous workspace rooms
        const userConnection = connectedUsers.get(socket.user.id);
        if (userConnection) {
          userConnection.workspaces.forEach(oldWorkspaceId => {
            socket.leave(`workspace-${oldWorkspaceId}`);
            updateWorkspacePresence(oldWorkspaceId, socket.user.id, false);
            // Notify others about user leaving
            socket.to(`workspace-${oldWorkspaceId}`).emit('user-left', {
              userId: socket.user.id,
              username: socket.user.username
            });
          });
          userConnection.workspaces.clear();
        }

        // Join new workspace room
        socket.join(`workspace-${workspaceId}`);
        
        // Update user connection
        if (userConnection) {
          userConnection.workspaces.add(workspaceId);
        }

        // Update presence
        updateWorkspacePresence(workspaceId, socket.user.id, true);

        // Notify others about user joining
        socket.to(`workspace-${workspaceId}`).emit('user-joined', {
          userId: socket.user.id,
          username: socket.user.username,
          email: socket.user.email
        });

        // Send current presence to the joining user
        const currentPresence = getWorkspacePresence(workspaceId);
        socket.emit('presence-update', currentPresence);

        console.log(`User ${socket.user.username} joined workspace ${workspaceId}`);
      } catch (error) {
        console.error('Error joining workspace:', error);
        socket.emit('error', 'Failed to join workspace');
      }
    });

    // Leave workspace room
    socket.on('leave-workspace', (workspaceId) => {
      socket.leave(`workspace-${workspaceId}`);
      
      const userConnection = connectedUsers.get(socket.user.id);
      if (userConnection) {
        userConnection.workspaces.delete(workspaceId);
      }

      updateWorkspacePresence(workspaceId, socket.user.id, false);
      
      // Notify others about user leaving
      socket.to(`workspace-${workspaceId}`).emit('user-left', {
        userId: socket.user.id,
        username: socket.user.username
      });

      console.log(`User ${socket.user.username} left workspace ${workspaceId}`);
    });

    // Handle user activity (for "typing" or "active" status)
    socket.on('user-activity', (data) => {
      const { workspaceId, activity } = data;
      socket.to(`workspace-${workspaceId}`).emit('user-activity', {
        userId: socket.user.id,
        username: socket.user.username,
        activity
      });
    });

    // Handle disconnect
    socket.on('disconnect', () => {
      console.log(`User ${socket.user.username} disconnected`);
      
      const userConnection = connectedUsers.get(socket.user.id);
      if (userConnection) {
        // Notify all workspaces about user leaving
        userConnection.workspaces.forEach(workspaceId => {
          updateWorkspacePresence(workspaceId, socket.user.id, false);
          socket.to(`workspace-${workspaceId}`).emit('user-left', {
            userId: socket.user.id,
            username: socket.user.username
          });
        });
      }

      // Remove user connection
      connectedUsers.delete(socket.user.id);
    });

    // Handle errors
    socket.on('error', (error) => {
      console.error('Socket error:', error);
    });
  });

  // Export helper functions for use in routes
  io.emitToWorkspace = (workspaceId, event, data) => {
    io.to(`workspace-${workspaceId}`).emit(event, data);
  };

  io.emitToUser = (email, event, data) => {
    // Find user by email and emit event to their socket
    for (const [userId, userConnection] of connectedUsers) {
      if (userConnection.email === email) {
        io.to(userConnection.socketId).emit(event, data);
        break;
      }
    }
  };

  io.getWorkspacePresence = getWorkspacePresence;
  io.connectedUsers = connectedUsers;
};