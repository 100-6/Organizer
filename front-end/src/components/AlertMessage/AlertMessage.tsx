import './AlertMessage.css'

interface AlertMessageProps {
  type: 'error' | 'success' | 'warning' | 'info'
  message: string
  onClose?: () => void
}

const AlertMessage = ({ type, message, onClose }: AlertMessageProps) => {
  return (
    <div className={`alert alert--${type}`}>
      <div className="alert-content">
        <span className="alert-message">{message}</span>
        {onClose && (
          <button 
            className="alert-close"
            onClick={onClose}
            aria-label="Fermer"
          >
            ×
          </button>
        )}
      </div>
    </div>
  )
}

export default AlertMessage