import * as React from "react"
import { cn, getInitials } from "@/lib/utils"

interface AvatarProps {
  name: string
  size?: number
  className?: string
}

export function Avatar({ name, size = 40, className }: AvatarProps) {
  const initials = getInitials(name)
  
  return (
    <div
      className={cn(
        "inline-flex items-center justify-center rounded-full bg-muted font-medium text-muted-foreground",
        className
      )}
      style={{ width: size, height: size, fontSize: size * 0.4 }}
    >
      {initials}
    </div>
  )
}