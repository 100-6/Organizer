import Button from '../../components/Button/Button'
import './Home.css'

const Home = () => {
  const handleGetStarted = () => {
    console.log('Commencer !')
  }

  return (
    <div className="page">
      <div className="container">
        <div className="content">
          <div className="brand">{'}'} TaskFlow</div>
          <h1 className="title">
            Is a Premier Task<br />
            Management<br />
            <span className="highlight">Provider</span>
          </h1>
          <p className="description">
            Renowned for powering the backbone of<br />
            project ecosystems with our state-of-<br />
            the-art collaboration services, team<br />
            coordination & workflow optimization
          </p>
          <div className="button-container">
            <Button variant="primary" onClick={handleGetStarted}>
              GET STARTED
            </Button>
          </div>
        </div>
        
        <div className="stats">
          <div className="stat-card large">
            <div className="number">2.4k</div>
            <div className="label">Active projects</div>
          </div>
          
          <div className="stat-card small">
            <div className="number">127</div>
            <div className="label">Team members</div>
            <div className="avatars">
              <div className="avatar">👤</div>
              <div className="avatar">👥</div>
              <div className="avatar">🎯</div>
              <div className="avatar">🚀</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Home
