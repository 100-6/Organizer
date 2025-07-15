import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { AuthProvider } from './contexts/AuthContext'
import { SocketProvider } from './contexts/SocketContext'
import ProtectedRoute from './components/ProtectedRoute'
import Home from './pages/Home/Home'
import Login from './pages/Login/Login'
import Register from './pages/Register/Register'
import Dashboard from './pages/Dashboard/Dashboard'
import Profile from './pages/Profile/Profile'
import Workspace from './pages/Workspace/Workspace'
import './App.css'

function App() {
  return (
    <Router>
      <AuthProvider>
        <SocketProvider>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route 
            path="/dashboard" 
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/profile" 
            element={
              <ProtectedRoute>
                <Profile />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/workspace/:id" 
            element={
              <ProtectedRoute>
                <Workspace />
              </ProtectedRoute>
            } 
          />
        </Routes>
        </SocketProvider>
      </AuthProvider>
    </Router>
  )
}

export default App