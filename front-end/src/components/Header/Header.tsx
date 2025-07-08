import { Link } from 'react-router-dom'
import './Header.css'

const Header = () => {
  return (
    <header className="header">
      <nav className="nav">
        <div className="nav-brand">
          <Link to="/" className="brand-link">Todo App</Link>
        </div>
        <ul className="nav-links">
          <li><Link to="/" className="nav-link">Accueil</Link></li>
          <li><Link to="/about" className="nav-link">À propos</Link></li>
        </ul>
      </nav>
    </header>
  )
}

export default Header