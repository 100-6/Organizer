import './Avatar.css'

interface AvatarProps {
  name: string
  size?: 'small' | 'medium' | 'large' | 'xlarge'
  onClick?: () => void
}

const Avatar = ({ name, size = 'medium', onClick }: AvatarProps) => {
  const initial = name.charAt(0).toUpperCase()
  const className = `avatar avatar--${size} ${onClick ? 'avatar--clickable' : ''}`

  return (
    <div className={className} onClick={onClick}>
      {initial}
    </div>
  )
}

export default Avatar