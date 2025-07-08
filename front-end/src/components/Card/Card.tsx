import './Card.css'

interface CardProps {
  title: string
  description: string
  icon?: string
  onClick?: () => void
}

const Card = ({ title, description, icon, onClick }: CardProps) => {
  return (
    <div className={`card ${onClick ? 'card--clickable' : ''}`} onClick={onClick}>
      {icon && <div className="card-icon">{icon}</div>}
      <h3 className="card-title">{title}</h3>
      <p className="card-description">{description}</p>
    </div>
  )
}

export default Card