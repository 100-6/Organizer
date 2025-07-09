// front-end/src/pages/Profile/components/ProfileSection.tsx
import { type ReactNode } from 'react'
import { Button } from '../../../components'
import './ProfileSection.css'

interface ProfileSectionProps {
  title: string
  children: ReactNode
  isEditing: boolean
  onEdit: () => void
  onCancel: () => void
}

const ProfileSection = ({ 
  title, 
  children, 
  isEditing, 
  onEdit, 
  onCancel 
}: ProfileSectionProps) => {
  return (
    <>
      <div className="section-header">
        <h2>{title}</h2>
        {!isEditing ? (
          <Button 
            variant="secondary" 
            size="small"
            onClick={onEdit}
          >
            Modifier
          </Button>
        ) : (
          <Button 
            variant="secondary" 
            size="small"
            onClick={onCancel}
          >
            Annuler
          </Button>
        )}
      </div>
      {children}
    </>
  )
}

export default ProfileSection