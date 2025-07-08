import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import { 
  LoadingSpinner, 
  AlertMessage, 
  Button, 
  Avatar, 
  FormInput 
} from '../../components'
import './Profile.css'

const Profile = () => {
  const { user, logout, checkAuth } = useAuth()
  const [isLoading, setIsLoading] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [isChangingPassword, setIsChangingPassword] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [formData, setFormData] = useState({
    username: '',
    email: ''
  })
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  })
  const navigate = useNavigate()

  useEffect(() => {
    if (user) {
      setFormData({
        username: user.username,
        email: user.email
      })
    }
  }, [user])

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')
    setSuccess('')

    try {
      const token = localStorage.getItem('accessToken')
      const response = await fetch('/api/users/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      })

      const data = await response.json()

      if (response.ok) {
        localStorage.setItem('user', JSON.stringify(data.user))
        await checkAuth()
        setSuccess('Profil mis à jour avec succès')
        setIsEditing(false)
      } else {
        setError(data.error || 'Erreur lors de la mise à jour')
      }
    } catch (err) {
      setError('Erreur de connexion')
    } finally {
      setIsLoading(false)
    }
  }

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setError('Les nouveaux mots de passe ne correspondent pas')
      return
    }

    setIsLoading(true)
    setError('')
    setSuccess('')

    try {
      const token = localStorage.getItem('accessToken')
      const response = await fetch('/api/users/password', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          currentPassword: passwordData.currentPassword,
          newPassword: passwordData.newPassword
        })
      })

      const data = await response.json()

      if (response.ok) {
        setSuccess('Mot de passe modifié avec succès')
        setIsChangingPassword(false)
        setPasswordData({
          currentPassword: '',
          newPassword: '',
          confirmPassword: ''
        })
      } else {
        setError(data.error || 'Erreur lors du changement de mot de passe')
      }
    } catch (err) {
      setError('Erreur de connexion')
    } finally {
      setIsLoading(false)
    }
  }

  const handleLogout = () => {
    logout()
    navigate('/')
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    })
  }

  if (!user) {
    return <LoadingSpinner message="Chargement du profil..." fullScreen />
  }

  return (
    <div className="profile-page">
      <header className="profile-header">
        <div className="profile-header-content">
          <div className="header-left">
            <Link to="/dashboard" className="back-link">
              ← Retour au dashboard
            </Link>
          </div>
          <div className="header-right">
            <Link to="/" className="profile-logo">Organizer</Link>
          </div>
        </div>
      </header>

      <main className="profile-main">
        <div className="profile-container">
          <div className="profile-hero">
            <Avatar name={user.username} size="xlarge" />
            <h1>{user.username}</h1>
            <p>Membre depuis le {formatDate(user.created_at)}</p>
          </div>

          {error && (
            <AlertMessage 
              type="error" 
              message={error} 
              onClose={() => setError('')}
            />
          )}

          {success && (
            <AlertMessage 
              type="success" 
              message={success} 
              onClose={() => setSuccess('')}
            />
          )}

          <div className="profile-sections">
            <div className="profile-section">
              <div className="section-header">
                <h2>Informations personnelles</h2>
                {!isEditing ? (
                  <Button 
                    variant="secondary" 
                    size="small"
                    onClick={() => setIsEditing(true)}
                  >
                    Modifier
                  </Button>
                ) : (
                  <Button 
                    variant="secondary" 
                    size="small"
                    onClick={() => {
                      setIsEditing(false)
                      setFormData({
                        username: user.username,
                        email: user.email
                      })
                      setError('')
                    }}
                  >
                    Annuler
                  </Button>
                )}
              </div>

              {!isEditing ? (
                <div className="profile-info">
                  <div className="info-row">
                    <label>Nom d'utilisateur</label>
                    <span>{user.username}</span>
                  </div>
                  <div className="info-row">
                    <label>Email</label>
                    <span>{user.email}</span>
                  </div>
                </div>
              ) : (
                <form onSubmit={handleUpdateProfile} className="profile-form">
                  <FormInput
                    label="Nom d'utilisateur"
                    type="text"
                    id="username"
                    name="username"
                    value={formData.username}
                    onChange={(e) => setFormData(prev => ({ ...prev, username: e.target.value }))}
                    required
                  />
                  
                  <FormInput
                    label="Email"
                    type="email"
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                    required
                  />
                  
                  <div className="form-actions">
                    <Button 
                      type="submit" 
                      variant="primary"
                      disabled={isLoading}
                    >
                      {isLoading ? 'Mise à jour...' : 'Sauvegarder'}
                    </Button>
                  </div>
                </form>
              )}
            </div>

            <div className="profile-section">
              <div className="section-header">
                <h2>Sécurité</h2>
                {!isChangingPassword ? (
                  <Button 
                    variant="secondary" 
                    size="small"
                    onClick={() => setIsChangingPassword(true)}
                  >
                    Changer le mot de passe
                  </Button>
                ) : (
                  <Button 
                    variant="secondary" 
                    size="small"
                    onClick={() => {
                      setIsChangingPassword(false)
                      setPasswordData({
                        currentPassword: '',
                        newPassword: '',
                        confirmPassword: ''
                      })
                      setError('')
                    }}
                  >
                    Annuler
                  </Button>
                )}
              </div>

              {!isChangingPassword ? (
                <div className="profile-info">
                  <div className="info-row">
                    <label>Mot de passe</label>
                    <span>••••••••</span>
                  </div>
                </div>
              ) : (
                <form onSubmit={handleChangePassword} className="profile-form">
                  <FormInput
                    label="Mot de passe actuel"
                    type="password"
                    id="currentPassword"
                    name="currentPassword"
                    value={passwordData.currentPassword}
                    onChange={(e) => setPasswordData(prev => ({ ...prev, currentPassword: e.target.value }))}
                    required
                  />
                  
                  <FormInput
                    label="Nouveau mot de passe"
                    type="password"
                    id="newPassword"
                    name="newPassword"
                    value={passwordData.newPassword}
                    onChange={(e) => setPasswordData(prev => ({ ...prev, newPassword: e.target.value }))}
                    required
                  />
                  
                  <FormInput
                    label="Confirmer le nouveau mot de passe"
                    type="password"
                    id="confirmPassword"
                    name="confirmPassword"
                    value={passwordData.confirmPassword}
                    onChange={(e) => setPasswordData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                    required
                  />
                  
                  <div className="form-actions">
                    <Button 
                      type="submit" 
                      variant="primary"
                      disabled={isLoading}
                    >
                      {isLoading ? 'Modification...' : 'Changer le mot de passe'}
                    </Button>
                  </div>
                </form>
              )}
            </div>

            <div className="profile-section danger-section">
              <div className="section-header">
                <h2>Zone de danger</h2>
              </div>
              <div className="danger-content">
                <p>Une fois déconnecté, vous devrez vous reconnecter pour accéder à vos workspaces.</p>
                <Button 
                  variant="danger" 
                  onClick={handleLogout}
                >
                  Se déconnecter
                </Button>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}

export default Profile