// src/App.tsx
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { useEffect } from 'react'
import Home from './pages/Home/Home'
import Login from './pages/Login/Login'
import Register from './pages/Register/Register'
import './App.css'

function App() {
  useEffect(() => {
    console.log('🚀 FRONT-END STARTUP INFO:')
    console.log('📍 Current URL:', window.location.href)
    console.log('🏠 Origin:', window.location.origin)
    console.log('🌐 Host:', window.location.host)
    console.log('🔌 Port:', window.location.port)
    console.log('📡 Protocol:', window.location.protocol)
    console.log('🗂️ Pathname:', window.location.pathname)
    console.log('🔧 User Agent:', navigator.userAgent)
    console.log('🌍 Environment variables available:')
    console.log('   - NODE_ENV:', import.meta.env.NODE_ENV)
    console.log('   - MODE:', import.meta.env.MODE)
    console.log('   - DEV:', import.meta.env.DEV)
    console.log('   - PROD:', import.meta.env.PROD)
    console.log('📦 Vite env vars:', import.meta.env)
    console.log('🎯 Expected API base:', `${window.location.origin}/api`)
    console.log('==========================================')
  }, [])

  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
      </Routes>
    </Router>
  )
}

export default App