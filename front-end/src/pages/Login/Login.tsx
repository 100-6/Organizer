import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import { AuthForm, FormInput, Button } from '../../components'

const Login = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
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

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      })

      const data = await response.json()

      if (response.ok) {
        login(data.accessToken, data.refreshToken, data.user)
        navigate('/dashboard')
      } else {
        setError(data.error || 'Erreur de connexion')
      }
    } catch (err) {
      setError('Erreur de connexion au serveur')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <AuthForm
      title="Connexion"
      subtitle="Connectez-vous à votre compte pour continuer"
      error={error}
      onSubmit={handleSubmit}
      footer={{
        text: "Pas encore de compte ?",
        linkText: "Créer un compte",
        linkTo: "/register"
      }}
    >
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

      <Button 
        type="submit" 
        variant="primary" 
        size="large"
        disabled={isLoading}
      >
        <span>{isLoading ? 'Connexion...' : 'Se connecter'}</span>
      </Button>
    </AuthForm>
  )
}

export default Login