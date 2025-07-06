const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.BACKEND_PORT;

app.use(express.json());

app.get('/', (req, res) => {
  res.json({ message: 'Todo App Backend API', port: PORT });
});

app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Backend server running on port ${PORT}`);
});