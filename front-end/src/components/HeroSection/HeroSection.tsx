// front-end/src/components/HeroSection/HeroSection.tsx
import { type ReactNode } from 'react'
import './HeroSection.css'

interface HeroSectionProps {
  title?: string
  subtitle?: string
  actions?: ReactNode
  gradient?: boolean
  centered?: boolean
}

const HeroSection = ({ 
  title, 
  subtitle, 
  actions, 
  gradient = false,
  centered = true 
}: HeroSectionProps) => {
  const sectionClass = `hero-section ${gradient ? 'hero-section--gradient' : ''}`
  const containerClass = `hero-container ${centered ? 'hero-container--centered' : ''}`

  return (
    <section className={sectionClass}>
      <div className={containerClass}>
        {title && <h1 className="hero-title fade-in">{title}</h1>}
        {subtitle && (
          <p className="hero-subtitle fade-in">{subtitle}</p>
        )}
        {actions && (
          <div className="hero-actions fade-in">
            {actions}
          </div>
        )}
      </div>
    </section>
  )
}

export default HeroSection