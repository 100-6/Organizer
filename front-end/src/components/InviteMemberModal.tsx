import React, { useState, useEffect, useRef } from 'react'
import './InviteMemberModal.css'

interface User {
  id: number
  email: string
  username: string
}

interface InviteMemberModalProps {
  isOpen: boolean
  onClose: () => void
  workspaceId: string
  onInviteSent: () => void
}

const InviteMemberModal: React.FC<InviteMemberModalProps> = ({
  isOpen,
  onClose,
  workspaceId,
  onInviteSent
}) => {
  const [email, setEmail] = useState('')
  const [role, setRole] = useState('member')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [suggestions, setSuggestions] = useState<User[]>([])
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [activeSuggestionIndex, setActiveSuggestionIndex] = useState(-1)
  const inputRef = useRef<HTMLInputElement>(null)
  const suggestionsRef = useRef<HTMLDivElement>(null)

  // Rechercher des utilisateurs pour les suggestions
  const searchUsers = async (query: string) => {
    if (query.length < 2) {
      setSuggestions([])
      setShowSuggestions(false)
      return
    }

    try {
      const token = localStorage.getItem('accessToken')
      const response = await fetch(`/api/users/search?query=${encodeURIComponent(query)}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (response.ok) {
        const data = await response.json()
        setSuggestions(data.users || [])
        setShowSuggestions(true)
        setActiveSuggestionIndex(-1)
      }
    } catch (error) {
      console.error('Error searching users:', error)
    }
  }

  // Debounce la recherche
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (email.trim()) {
        searchUsers(email.trim())
      } else {
        setSuggestions([])
        setShowSuggestions(false)
      }
    }, 300)

    return () => clearTimeout(timeoutId)
  }, [email])

  // Gérer les clics en dehors des suggestions
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (suggestionsRef.current && !suggestionsRef.current.contains(event.target as Node) &&
          inputRef.current && !inputRef.current.contains(event.target as Node)) {
        setShowSuggestions(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Gérer la navigation au clavier
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!showSuggestions || suggestions.length === 0) return

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault()
        setActiveSuggestionIndex(prev => 
          prev < suggestions.length - 1 ? prev + 1 : 0
        )
        break
      case 'ArrowUp':
        e.preventDefault()
        setActiveSuggestionIndex(prev => 
          prev > 0 ? prev - 1 : suggestions.length - 1
        )
        break
      case 'Enter':
        if (activeSuggestionIndex >= 0) {
          e.preventDefault()
          selectSuggestion(suggestions[activeSuggestionIndex])
        }
        break
      case 'Escape':
        setShowSuggestions(false)
        setActiveSuggestionIndex(-1)
        break
    }
  }

  // Sélectionner une suggestion
  const selectSuggestion = (user: User) => {
    setEmail(user.email)
    setShowSuggestions(false)
    setActiveSuggestionIndex(-1)
    inputRef.current?.focus()
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')
    setSuccess('')

    try {
      const token = localStorage.getItem('accessToken')
      const response = await fetch(`/api/invitations/workspace/${workspaceId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          email: email.trim(),
          role
        })
      })

      const data = await response.json()

      if (response.ok) {
        setSuccess('Invitation envoyée avec succès !')
        setEmail('')
        setRole('member')
        onInviteSent()
        setTimeout(() => {
          onClose()
          setSuccess('')
        }, 2000)
      } else {
        setError(data.error || 'Erreur lors de l\'envoi de l\'invitation')
      }
    } catch (error) {
      console.error('Error sending invitation:', error)
      setError('Erreur réseau. Veuillez réessayer.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleClose = () => {
    setEmail('')
    setRole('member')
    setError('')
    setSuccess('')
    setSuggestions([])
    setShowSuggestions(false)
    setActiveSuggestionIndex(-1)
    onClose()
  }

  if (!isOpen) return null

  return (
    <div className="modal-overlay" onClick={handleClose}>
      <div className="modal-content invite-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Inviter un membre</h2>
          <button className="modal-close" onClick={handleClose}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="invite-form">
          {error && (
            <div className="error-message">
              {error}
            </div>
          )}

          {success && (
            <div className="success-message">
              {success}
            </div>
          )}

          <div className="form-group">
            <label htmlFor="email">Adresse email</label>
            <div className="email-input-container">
              <input
                ref={inputRef}
                type="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onKeyDown={handleKeyDown}
                onFocus={() => {
                  if (suggestions.length > 0) {
                    setShowSuggestions(true)
                  }
                }}
                placeholder="Commencez à taper un email..."
                required
                disabled={isLoading}
                autoComplete="off"
              />
              
              {showSuggestions && suggestions.length > 0 && (
                <div ref={suggestionsRef} className="email-suggestions">
                  {suggestions.map((user, index) => (
                    <div
                      key={user.id}
                      className={`suggestion-item ${index === activeSuggestionIndex ? 'active' : ''}`}
                      onClick={() => selectSuggestion(user)}
                      onMouseEnter={() => setActiveSuggestionIndex(index)}
                    >
                      <div className="suggestion-avatar">
                        {user.username.charAt(0).toUpperCase()}
                      </div>
                      <div className="suggestion-info">
                        <div className="suggestion-email">{user.email}</div>
                        <div className="suggestion-username">@{user.username}</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="role">Rôle</label>
            <select
              id="role"
              value={role}
              onChange={(e) => setRole(e.target.value)}
              disabled={isLoading}
              className="role-select"
            >
              <option value="viewer">Viewer - Lecture seule</option>
              <option value="member">Member - Peut éditer le contenu</option>
              <option value="editor">Editor - Peut gérer les membres</option>
            </select>
          </div>

          <div className="role-description">
            {role === 'viewer' && (
              <p className="role-desc viewer">
                Les viewers peuvent voir le workspace mais ne peuvent pas modifier le contenu.
              </p>
            )}
            {role === 'member' && (
              <p className="role-desc member">
                Les members peuvent créer et modifier les listes, todos et labels.
              </p>
            )}
            {role === 'editor' && (
              <p className="role-desc editor">
                Les editors peuvent tout faire sauf supprimer le workspace ou changer le propriétaire.
              </p>
            )}
          </div>

          <div className="modal-actions">
            <button
              type="button"
              className="btn btn-secondary"
              onClick={handleClose}
              disabled={isLoading}
            >
              Annuler
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={isLoading || !email.trim()}
            >
              {isLoading ? 'Envoi...' : 'Envoyer l\'invitation'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default InviteMemberModal