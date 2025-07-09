import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import { 
  LoadingSpinner, 
  Button, 
  PageLayout, 
  HeroSection, 
  Section,
  StylishButton 
} from '../../components'
import TodoMockup from './components/TodoMockup'
import './Home.css'

interface TodoItem {
  id: number
  text: string
  completed: boolean
  priority: 'high' | 'medium' | 'low'
}

const Home = () => {
  const navigate = useNavigate()
  const { isAuthenticated, isLoading } = useAuth()
  const [animationKey, setAnimationKey] = useState(0)
  const [todos, setTodos] = useState<TodoItem[]>([
    { id: 1, text: "Réviser la présentation client", completed: true, priority: 'high' },
    { id: 2, text: "Appeler le service technique", completed: false, priority: 'medium' },
    { id: 3, text: "Préparer le rapport mensuel", completed: false, priority: 'high' },
    { id: 4, text: "Organiser la réunion d'équipe", completed: true, priority: 'low' },
    { id: 5, text: "Répondre aux emails importants", completed: false, priority: 'medium' }
  ])

  const handleGetStarted = () => {
    navigate(isAuthenticated ? '/dashboard' : '/register')
  }

  const handleLogin = () => {
    navigate(isAuthenticated ? '/dashboard' : '/login')
  }

  const handleSignUp = () => {
    navigate(isAuthenticated ? '/dashboard' : '/register')
  }

  const handleLogoClick = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' })
    
    setTimeout(() => {
      setAnimationKey(prev => prev + 1)
    }, 100)
  }

  const handleTodoToggle = (id: number) => {
    setTodos(prevTodos =>
      prevTodos.map(todo =>
        todo.id === id ? { ...todo, completed: !todo.completed } : todo
      )
    )
  }

  if (isLoading) {
    return <LoadingSpinner message="Chargement..." fullScreen />
  }

  const headerContent = (
    <>
      <div className="home-logo" onClick={handleLogoClick}>Organizer</div>
      <div className="home-header-buttons">
        <button className="home-login-button" onClick={handleLogin}>
          Login
        </button>
        <Button variant="primary" size="small" onClick={handleSignUp}>
          Sign Up
        </Button>
      </div>
    </>
  )

  return (
    <PageLayout variant="fullscreen" headerContent={headerContent}>
      <HeroSection
        key={`hero-${animationKey}`}
        title="Organisez votre journée avec élégance"
        subtitle="Une approche simple et raffinée pour gérer vos tâches quotidiennes. Concentrez-vous sur l'essentiel."
        gradient
        actions={
          <StylishButton variant="gradient" size="large" onClick={handleGetStarted}>
            <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M14.187 8.096L15 5.25L15.813 8.096C16.0231 8.83114 16.4171 9.50062 16.9577 10.0413C17.4984 10.5819 18.1679 10.9759 18.903 11.186L21.75 12L18.904 12.813C18.1689 13.0231 17.4994 13.4171 16.9587 13.9577C16.4181 14.4984 16.0241 15.1679 15.814 15.903L15 18.75L14.187 15.904C13.9769 15.1689 13.5829 14.4994 13.0423 13.9587C12.5016 13.4181 11.8321 13.0241 11.097 12.814L8.25 12L11.096 11.187C11.8311 10.9769 12.5006 10.5829 13.0413 10.0423C13.5819 9.50162 13.9759 8.83214 14.186 8.097L14.187 8.096Z" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5"></path>
              <path d="M6 14.25L5.741 15.285C5.59267 15.8785 5.28579 16.4206 4.85319 16.8532C4.42059 17.2858 3.87853 17.5927 3.285 17.741L2.25 18L3.285 18.259C3.87853 18.4073 4.42059 18.7142 4.85319 19.1468C5.28579 19.5794 5.59267 20.1215 5.741 20.715L6 21.75L6.259 20.715C6.40725 20.1216 6.71398 19.5796 7.14639 19.147C7.5788 18.7144 8.12065 18.4075 8.714 18.259L9.75 18L8.714 17.741C8.12065 17.5925 7.5788 17.2856 7.14639 16.853C6.71398 16.4204 6.40725 15.8784 6.259 15.285L6 14.25Z" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5"></path>
              <path d="M6.5 4L6.303 4.5915C6.24777 4.75718 6.15472 4.90774 6.03123 5.03123C5.90774 5.15472 5.75718 5.24777 5.5915 5.303L5 5.5L5.5915 5.697C5.75718 5.75223 5.90774 5.84528 6.03123 5.96877C6.15472 6.09226 6.24777 6.24282 6.303 6.4085L6.5 7L6.697 6.4085C6.75223 6.24282 6.84528 6.09226 6.96877 5.96877C7.09226 5.84528 7.24282 5.75223 7.4085 5.697L8 5.5L7.4085 5.303C7.24282 5.24777 7.09226 5.15472 6.96877 5.03123C6.84528 4.90774 6.75223 4.75718 6.697 4.5915L6.5 4Z" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5"></path>
            </svg>
            <p>Commencez</p>
          </StylishButton>
        }
      />

      <Section
        variant="centered"
        background="white"
      >
        <div className="demo-section-header">
          <h2 className="demo-title">Simple. Efficace. Élégant.</h2>
          <p className="demo-subtitle">Découvrez une interface pensée pour votre productivité</p>
        </div>
        <TodoMockup todos={todos} onTodoToggle={handleTodoToggle} />
      </Section>

      <footer className="home-footer">
        <div className="home-footer-content">
          <div className="home-footer-links">
            <a href="#">Terms</a>
            <a href="#">Privacy</a>
            <a href="#">Contact</a>
            <a href="#">Support</a>
          </div>
          <p className="home-footer-copy">© 2025 Organizer. Conçu avec attention.</p>
        </div>
      </footer>
    </PageLayout>
  )
}

export default Home