import { type ReactNode } from 'react'
import './Modal.css'

interface ModalProps {
  isOpen: boolean
  onClose: () => void
  title: string
  children: ReactNode
  size?: 'small' | 'medium' | 'large'
}

const Modal = ({ isOpen, onClose, title, children, size = 'medium' }: ModalProps) => {
  if (!isOpen) return null

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div 
        className={`modal-content modal-content--${size}`}
        onClick={e => e.stopPropagation()}
      >
        <div className="modal-header">
          <h2 className="modal-title">{title}</h2>
          <button 
            className="modal-close"
            onClick={onClose}
            aria-label="Fermer"
          >
            ×
          </button>
        </div>
        <div className="modal-body">
          {children}
        </div>
      </div>
    </div>
  )
}

export default Modal