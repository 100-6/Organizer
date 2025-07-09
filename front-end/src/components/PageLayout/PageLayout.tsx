// front-end/src/components/PageLayout/PageLayout.tsx
import { type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import './PageLayout.css'

interface PageLayoutProps {
  children: ReactNode
  variant?: 'default' | 'fullscreen' | 'centered'
  showHeader?: boolean
  headerContent?: ReactNode
}

const PageLayout = ({ 
  children, 
  variant = 'default',
  showHeader = true,
  headerContent
}: PageLayoutProps) => {
  const containerClass = `page-layout page-layout--${variant}`

  return (
    <div className={containerClass}>
      {showHeader && (
        <header className="page-header">
          <div className="page-header-content">
            {headerContent || (
              <Link to="/" className="page-logo">Organizer</Link>
            )}
          </div>
        </header>
      )}
      <main className="page-main">
        {children}
      </main>
    </div>
  )
}

export default PageLayout