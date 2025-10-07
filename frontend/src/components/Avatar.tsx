import avatar from 'animal-avatar-generator'

interface AvatarProps {
  seed: string
  size?: number
  className?: string
  profilePicIndex?: number
}

export default function Avatar({ seed, size = 48, className = '', profilePicIndex = 0 }: AvatarProps) {
  // Use profilePicIndex to create variation in the seed for same person
  const enhancedSeed = `${seed}-${profilePicIndex}`
  
  const svgString = avatar(enhancedSeed, {
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