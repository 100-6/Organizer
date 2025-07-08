import './LoadingSpinner.css'

interface LoadingSpinnerProps {
  message?: string
  size?: 'small' | 'medium' | 'large'
  fullScreen?: boolean
}

const LoadingSpinner = ({ 
  message = 'Chargement...', 
  size = 'medium',
  fullScreen = false 
}: LoadingSpinnerProps) => {
  const containerClass = fullScreen ? 'loading-container full-screen' : 'loading-container'
  const spinnerClass = `loading-spinner loading-spinner--${size}`

  return (
    <div className={containerClass}>
      <div className={spinnerClass}></div>
      <p className="loading-message">{message}</p>
    </div>
  )
}

export default LoadingSpinner