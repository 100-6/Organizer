// front-end/src/pages/Login/components/AuthHeader.tsx
import './AuthHeader.css'

interface AuthHeaderProps {
  title: string
  subtitle: string
}

const AuthHeader = ({ title, subtitle }: AuthHeaderProps) => {
  return (
    <div className="auth-form-header">
      <h1>{title}</h1>
      <p>{subtitle}</p>
    </div>
  )
}

export default AuthHeader