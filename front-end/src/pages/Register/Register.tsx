// front-end/src/pages/Register/Register.tsx
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import { 
  FormInput, 
  Button, 
  PageLayout, 
  ContentCard,
  AlertMessage 
} from '../../components'
import AuthHeader from '../Login/components/AuthHeader'
import AuthFooter from '../Login/components/AuthFooter'
import './Register.css'

const Register = () => {
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: ''
  })
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const navigate = useNavigate()
  const { login } = useAuth()

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
    setError('')
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')

    if (formData.password !== formData.confirmPassword) {
      setError('Les mots de passe ne correspondent pas')
      setIsLoading(false)
      return
    }

    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: formData.username,
          email: formData.email,
          password: formData.password
        }),
      })

      const data = await response.json()

      if (response.ok) {
        login(data.accessToken, data.refreshToken, data.user)
        navigate('/dashboard')
      } else {
        setError(data.error || 'Erreur lors de la création du compte')
      }
    } catch (err) {
      setError('Erreur de connexion au serveur')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <PageLayout variant="centered" showHeader={false}>
      <ContentCard variant="auth" maxWidth="small" centered>
        <AuthHeader
          title="Créer un compte"
          subtitle="Commencez à organiser vos tâches dès maintenant"
        />

        {error && <AlertMessage type="error" message={error} />}

        <form onSubmit={handleSubmit} className="auth-form">
          <FormInput
            label="Nom d'utilisateur"
            type="text"
            id="username"
            name="username"
            value={formData.username}
            onChange={handleInputChange}
            placeholder="Nom d'utilisateur"
            required
          />

          <FormInput
            label="Email"
            type="email"
            id="email"
            name="email"
            value={formData.email}
            onChange={handleInputChange}
            placeholder="m@email.com"
            required
          />

          <FormInput
            label="Mot de passe"
            type="password"
            id="password"
            name="password"
            value={formData.password}
            onChange={handleInputChange}
            placeholder="••••••••"
            required
          />

          <FormInput
            label="Confirmer le mot de passe"
            type="password"
            id="confirmPassword"
            name="confirmPassword"
            value={formData.confirmPassword}
            onChange={handleInputChange}
            placeholder="••••••••"
            required
          />

          <Button 
            type="submit" 
            variant="primary" 
            size="large"
            disabled={isLoading}
          >
            <span>{isLoading ? 'Création...' : 'Créer le compte'}</span>
          </Button>
        </form>

        <AuthFooter
          text="Déjà un compte ?"
          linkText="Se connecter"
          linkTo="/login"
        />
      </ContentCard>
    </PageLayout>
  )
}

export default Register