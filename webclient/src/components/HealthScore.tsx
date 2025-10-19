import React from 'react'

type HealthStatus = 'healthy' | 'warning' | 'dormant'

interface HealthScoreProps {
  score: number
  status: HealthStatus
  emoji: string
  daysSinceContact: number
  size?: 'sm' | 'md'
}

const STATUS_COLORS = {
  healthy: 'text-green-600',
  warning: 'text-yellow-600',
  dormant: 'text-red-600',
}

const STATUS_BG = {
  healthy: 'bg-green-50',
  warning: 'bg-yellow-50',
  dormant: 'bg-red-50',
}

export function HealthScore({
  score,
  status,
  emoji,
  daysSinceContact,
  size = 'md'
}: HealthScoreProps) {
  const isSmall = size === 'sm'

  return (
    <div className={`flex items-center gap-1 ${STATUS_BG[status]} rounded-lg ${isSmall ? 'px-1.5 py-0.5' : 'px-3 py-2'}`}>
      <span className={isSmall ? 'text-sm' : 'text-2xl'}>{emoji}</span>
      <div>
        <div className={`font-semibold ${STATUS_COLORS[status]} ${isSmall ? 'text-xs' : 'text-base'}`}>
          {score}
        </div>
        {!isSmall && (
          <div className="text-xs text-gray-500">
            {daysSinceContact}d ago
          </div>
        )}
      </div>
    </div>
  )
}
