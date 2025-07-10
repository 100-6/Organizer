import React, { useState } from 'react'
import './LabelSelectorMenu.css'
import { Button } from '../../../components'

interface Label {
  id: number
  name: string | null
  color: string
}

interface LabelSelectorMenuProps {
  labels: Label[]
  selectedLabelIds: number[]
  onToggleLabel: (labelId: number) => void
  onCreateLabel: () => void
  onEditLabel: (labelId: number) => void
  isOpen: boolean
  onClose: () => void
}

const LabelSelectorMenu: React.FC<LabelSelectorMenuProps> = ({
  labels,
  selectedLabelIds,
  onToggleLabel,
  onCreateLabel,
  onEditLabel,
  isOpen,
  onClose
}) => {
  const [search, setSearch] = useState('')

  if (!isOpen) return null

  const filteredLabels = labels.filter(label =>
    (label.name || '').toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="label-selector-menu-overlay" onClick={onClose}>
      <div className="label-selector-menu" onClick={e => e.stopPropagation()}>
        <div className="label-selector-header">
          <span>Labels</span>
          <button className="label-selector-close" onClick={onClose}>×</button>
        </div>
        <input
          className="label-selector-search"
          type="text"
          placeholder="Search labels..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
        <div className="label-selector-list">
          {filteredLabels.map(label => (
            <div className="label-selector-item" key={label.id}>
              <input
                type="checkbox"
                checked={selectedLabelIds.includes(label.id)}
                onChange={() => onToggleLabel(label.id)}
                className="label-selector-checkbox"
                id={`label-checkbox-${label.id}`}
              />
              <span
                className="label-selector-color"
                style={{ backgroundColor: label.color }}
              />
              <label htmlFor={`label-checkbox-${label.id}`} className="label-selector-name">
                {label.name || 'Sans nom'}
              </label>
              <button
                className="label-selector-edit"
                onClick={() => onEditLabel(label.id)}
                title="Éditer le label"
                type="button"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                  <path d="M15.232 5.232l3.536 3.536M4 20h4.586a1 1 0 0 0 .707-.293l9.414-9.414a2 2 0 0 0 0-2.828l-3.172-3.172a2 2 0 0 0-2.828 0l-9.414 9.414A1 1 0 0 0 4 20z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </button>
            </div>
          ))}
        </div>
        <Button
          type="button"
          variant="secondary"
          size="small"
          className="label-selector-create"
          onClick={onCreateLabel}
        >
          Create a new label
        </Button>
      </div>
    </div>
  )
}

export default LabelSelectorMenu 