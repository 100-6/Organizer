import React, { useState, useRef, useEffect } from 'react'
import './AddCardInline.css'

interface AddCardInlineProps {
  onSave: (title: string) => void
  onCancel: () => void
}

const AddCardInline: React.FC<AddCardInlineProps> = ({ onSave, onCancel }) => {
  const [title, setTitle] = useState('')
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.focus()
    }
  }, [])

  const handleSave = () => {
    if (title.trim()) {
      onSave(title.trim())
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSave()
    } else if (e.key === 'Escape') {
      onCancel()
    }
  }

  const adjustTextareaHeight = () => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`
    }
  }

  return (
    <div className="add-card-inline">
      <textarea
        ref={textareaRef}
        className="add-card-textarea"
        placeholder="Enter a title for this card..."
        value={title}
        onChange={(e) => {
          setTitle(e.target.value)
          adjustTextareaHeight()
        }}
        onKeyDown={handleKeyDown}
        rows={1}
      />
      <div className="add-card-controls">
        <button
          className="add-card-save"
          onClick={handleSave}
          disabled={!title.trim()}
        >
          Add card
        </button>
        <button
          className="add-card-cancel"
          onClick={onCancel}
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
            <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
          </svg>
        </button>
      </div>
    </div>
  )
}

export default AddCardInline