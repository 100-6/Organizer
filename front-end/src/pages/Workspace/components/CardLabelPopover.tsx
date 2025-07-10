import React, { useState, useRef, useEffect } from 'react'
import './CardLabelPopover.css'

interface Label {
  id: number
  name: string | null
  color: string
}

interface CardLabelPopoverProps {
  labels: Label[]
  onRemoveLabel: (labelId: number) => void
  onCreateLabel: (name: string, color: string) => void
  anchorEl: HTMLElement | null
  onClose: () => void
}

const PREDEFINED_COLORS = [
  '#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#6366f1', '#a855f7', '#f43f5e', '#22d3ee', '#84cc16', '#eab308', '#f97316', '#64748b'
]

const CardLabelPopover: React.FC<CardLabelPopoverProps> = ({
  labels,
  onRemoveLabel,
  onCreateLabel,
  anchorEl,
  onClose
}) => {
  const [name, setName] = useState('')
  const [color, setColor] = useState(PREDEFINED_COLORS[0])
  const popoverRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(event.target as Node) && anchorEl && !anchorEl.contains(event.target as Node)) {
        onClose()
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [onClose, anchorEl])

  if (!anchorEl) return null

  // Positionnement du popover sous anchorEl
  const rect = anchorEl.getBoundingClientRect()
  const style: React.CSSProperties = {
    position: 'absolute',
    top: rect.bottom + window.scrollY + 6,
    left: rect.left + window.scrollX,
    zIndex: 3000
  }

  return (
    <div className="card-label-popover" ref={popoverRef} style={style}>
      <div className="card-label-popover-list">
        {labels.length === 0 && <div className="card-label-popover-empty">Aucun label</div>}
        {labels.map(label => (
          <div className="card-label-popover-item" key={label.id}>
            <span className="card-label-popover-color" style={{ backgroundColor: label.color }} />
            <span className="card-label-popover-name">{label.name || 'Sans nom'}</span>
            <button className="card-label-popover-remove" onClick={() => onRemoveLabel(label.id)} title="Retirer ce label">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none"><path d="M18 6L6 18M6 6l12 12" stroke="#ef4444" strokeWidth="2" strokeLinecap="round"/></svg>
            </button>
          </div>
        ))}
      </div>
      <form className="card-label-popover-create" onSubmit={e => { e.preventDefault(); if (name.trim()) { onCreateLabel(name.trim(), color); setName('') } }}>
        <input
          type="text"
          className="card-label-popover-input"
          placeholder="Nom du label..."
          value={name}
          onChange={e => setName(e.target.value)}
          maxLength={32}
        />
        <div className="card-label-popover-colors">
          {PREDEFINED_COLORS.map(c => (
            <button
              key={c}
              type="button"
              className={`card-label-popover-color-choice${color === c ? ' selected' : ''}`}
              style={{ backgroundColor: c }}
              onClick={() => setColor(c)}
            />
          ))}
        </div>
        <button className="card-label-popover-create-btn" type="submit" disabled={!name.trim()}>Créer</button>
      </form>
    </div>
  )
}

export default CardLabelPopover 