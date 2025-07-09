// front-end/src/pages/Login/components/AuthFooter.tsx
import { Link } from 'react-router-dom'
import './AuthFooter.css'

interface AuthFooterProps {
  text: string
  linkText: string
  linkTo: string
}

const AuthFooter = ({ text, linkText, linkTo }: AuthFooterProps) => {
  return (
    <div className="auth-footer">
      <p>
        {text} {' '}
        <Link to={linkTo} className="auth-link">
          {linkText}
        </Link>
      </p>
    </div>
  )
}

export default AuthFooter