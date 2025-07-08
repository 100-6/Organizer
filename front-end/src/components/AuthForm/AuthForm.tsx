import { type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import AlertMessage from '../AlertMessage/AlertMessage'
import './AuthForm.css'

interface AuthFormProps {
  title: string
  subtitle: string
  error?: string
  onSubmit: (e: React.FormEvent) => void
  children: ReactNode
  footer: {
    text: string
    linkText: string
    linkTo: string
  }
}

const AuthForm = ({ 
  title, 
  subtitle, 
  error, 
  onSubmit, 
  children, 
  footer 
}: AuthFormProps) => {
  return (
    <div className="auth-layout">
      <div className="auth-header-nav">
        <Link to="/" className="auth-logo">Organizer</Link>
      </div>
      
      <div className="auth-page">
        <div className="auth-container">
          <div className="auth-content">
            <div className="auth-form-container">
              <div className="auth-form-header">
                <h1>{title}</h1>
                <p>{subtitle}</p>
              </div>

              {error && (
                <AlertMessage type="error" message={error} />
              )}

              <form onSubmit={onSubmit} className="auth-form">
                {children}
              </form>

              <div className="auth-footer">
                <p>
                  {footer.text} {' '}
                  <Link to={footer.linkTo} className="auth-link">
                    {footer.linkText}
                  </Link>
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default AuthForm