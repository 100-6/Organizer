import React from 'react'

interface DebugTodoCardProps {
  todo: any
}

const DebugTodoCard: React.FC<DebugTodoCardProps> = ({ todo }) => {
  console.log('DebugTodoCard rendering with todo:', todo)
  
  return (
    <div style={{
      background: 'white',
      border: '1px solid #e2e8f0',
      borderRadius: '8px',
      padding: '16px',
      marginBottom: '12px',
      boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
    }}>
      <h4 style={{ margin: '0 0 8px 0', fontSize: '14px', fontWeight: '600' }}>
        {todo?.title || 'Titre manquant'}
      </h4>
      {todo?.description && (
        <p style={{ margin: '0', fontSize: '13px', color: '#64748b' }}>
          {todo.description}
        </p>
      )}
      <div style={{ marginTop: '8px', fontSize: '11px', color: '#64748b' }}>
        ID: {todo?.id || 'N/A'}
      </div>
    </div>
  )
}

export default DebugTodoCard 