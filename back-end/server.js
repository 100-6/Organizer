const express = require('express');
const cors = require('cors');
const http = require('http');
const { Server } = require('socket.io');
require('dotenv').config();

const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/user');
const workspaceRoutes = require('./routes/workspaces');
const listRoutes = require('./routes/list');
const todoRoutes = require('./routes/todo');
const labelRoutes = require('./routes/label');
const invitationRoutes = require('./routes/invitation');
const { errorHandler, notFound } = require('./middleware/errorHandler');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: [
      process.env.FRONTEND_URL, 
      "http://localhost:3000", 
      "http://localhost:5173",
      "null" // Pour les fichiers HTML locaux
    ],
    methods: ["GET", "POST"],
    credentials: true,
    allowEIO3: true
  }
});
const PORT = process.env.BACKEND_PORT;

app.use(cors({
  origin: [
    process.env.FRONTEND_URL, 
    "http://localhost:3000", 
    "http://localhost:5173",
    "null"
  ],
  credentials: true
}));
app.use(express.json());

app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/workspaces', workspaceRoutes);
app.use('/api/lists', listRoutes);
app.use('/api/todos', todoRoutes);
app.use('/api/labels', labelRoutes);
app.use('/api/invitations', invitationRoutes);

app.get('/', (req, res) => {
  res.json({ message: 'Todo App Backend API', port: PORT });
});

app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

app.use(notFound);
app.use(errorHandler);

// Rendre l'instance io accessible dans les routes
app.set('io', io);

// Socket.io configuration
require('./socket/socketHandler')(io);

server.listen(PORT, '0.0.0.0', () => {
  console.log(`Backend server running on port ${PORT}`);
});