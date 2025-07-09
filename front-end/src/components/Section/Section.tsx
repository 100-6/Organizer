// front-end/src/components/Section/Section.tsx
import { type ReactNode } from 'react'
import './Section.css'

interface SectionProps {
  children: ReactNode
  title?: string
  subtitle?: string
  variant?: 'default' | 'centered'
  background?: 'default' | 'white' | 'gray'
  padding?: 'small' | 'medium' | 'large'
}

const Section = ({ 
  children, 
  title, 
  subtitle,
  variant = 'default',
  background = 'default',
  padding = 'medium'
}: SectionProps) => {
  const sectionClass = `section section--${variant} section--${background} section--${padding}`

  return (
    <section className={sectionClass}>
      <div className="section-container">
        {(title || subtitle) && (
          <div className="section-header">
            {title && <h2 className="section-title">{title}</h2>}
            {subtitle && <p className="section-subtitle">{subtitle}</p>}
          </div>
        )}
        <div className="section-content">
          {children}
        </div>
      </div>
    </section>
  )
}

export default Section