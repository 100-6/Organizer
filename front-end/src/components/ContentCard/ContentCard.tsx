// front-end/src/components/ContentCard/ContentCard.tsx
import { type ReactNode } from 'react'
import './ContentCard.css'

interface ContentCardProps {
  children: ReactNode
  variant?: 'default' | 'auth' | 'danger'
  maxWidth?: 'small' | 'medium' | 'large' | 'xlarge'
  centered?: boolean
}

const ContentCard = ({ 
  children, 
  variant = 'default',
  maxWidth = 'medium',
  centered = false 
}: ContentCardProps) => {
  const cardClass = `content-card content-card--${variant} content-card--${maxWidth} ${centered ? 'content-card--centered' : ''}`

  return (
    <div className={cardClass}>
      {children}
    </div>
  )
}

export default ContentCard