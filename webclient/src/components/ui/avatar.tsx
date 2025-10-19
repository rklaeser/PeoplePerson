import avatar from 'animal-avatar-generator'

interface AvatarProps {
  name: string
  size?: number
  className?: string
}

export function Avatar({ name, size = 40, className = '' }: AvatarProps) {
  const svgString = avatar(name, {
    size,
    round: true,
    blackout: true
  })

  return (
    <div
      className={`inline-block ${className}`}
      style={{ width: size, height: size }}
      dangerouslySetInnerHTML={{ __html: svgString }}
    />
  )
}