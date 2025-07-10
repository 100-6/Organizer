import React, { useState } from 'react'
import { Button } from '../../../components'
import './AddChecklistItem.css'

interface AddChecklistItemProps {
  onAdd: (text: string) => void
  placeholder?: string
}

const AddChecklistItem: React.FC<AddChecklistItemProps> = ({ 
  onAdd, 
  placeholder = "Ajouter un élément..." 
}) => {
  const [text, setText] = useState('')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (text.trim()) {
      onAdd(text.trim())
      setText('')
    }
  }

  return (
    <form onSubmit={handleSubmit} className="add-checklist-item">
      <input
        type="text"
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder={placeholder}
        className="add-checklist-item-input"
      />
      <Button
        type="submit"
        variant="secondary"
        size="small"
        disabled={!text.trim()}
      >
        Ajouter
      </Button>
    </form>
  )
}

export default AddChecklistItem 