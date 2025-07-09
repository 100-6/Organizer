// front-end/src/components/StylishButton/StylishButton.tsx
import { type ReactNode } from 'react'
import './StylishButton.css'

interface StylishButtonProps {
  children: ReactNode
  onClick?: () => void
  variant?: 'primary' | 'gradient' | 'slide'
  size?: 'small' | 'medium' | 'large'
  disabled?: boolean
  type?: 'button' | 'submit' | 'reset'
}

const StylishButton = ({ 
  children, 
  onClick,
  variant = 'primary',
  size = 'medium',
  disabled = false,
  type = 'button'
}: StylishButtonProps) => {
  const buttonClass = `stylish-btn stylish-btn--${variant} stylish-btn--${size} ${disabled ? 'stylish-btn--disabled' : ''}`

  return (
    <button
      className={buttonClass}
      onClick={onClick}
      disabled={disabled}
      type={type}
    >
      <span className="stylish-btn-content">
        {children}
      </span>
    </button>
  )
}

export default StylishButton