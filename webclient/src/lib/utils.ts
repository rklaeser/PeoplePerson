import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatTime(dateString: string): string {
  const date = new Date(dateString)
  const now = new Date()

  // Check if message is from today
  const isToday = date.toDateString() === now.toDateString()

  if (isToday) {
    // Show time for today's messages (e.g., "3:02 PM")
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    })
  }

  // Check if message is from this week
  const diffInMs = now.getTime() - date.getTime()
  const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24))

  if (diffInDays < 7) {
    // Show day name for recent messages (e.g., "Thursday")
    return date.toLocaleDateString('en-US', { weekday: 'long' })
  }

  // Show date for older messages (e.g., "1/15/2025")
  return date.toLocaleDateString('en-US', {
    month: 'numeric',
    day: 'numeric',
    year: 'numeric'
  })
}

export function getInitials(name: string): string {
  return name
    .split(' ')
    .map(word => word[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
}

export function getIntentColor(intent: string): string {
  const colors = {
    romantic: 'bg-red-100 text-red-800 border-red-200',
    core: 'bg-blue-100 text-blue-800 border-blue-200',
    archive: 'bg-gray-100 text-gray-800 border-gray-200',
    new: 'bg-green-100 text-green-800 border-green-200',
    invest: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    associate: 'bg-purple-100 text-purple-800 border-purple-200',
  }
  return colors[intent as keyof typeof colors] || colors.new
}