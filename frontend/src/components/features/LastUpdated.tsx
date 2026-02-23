import { useEffect, useState } from 'react'

interface Props {
  timestamp: string
}

export default function LastUpdated({ timestamp }: Props) {
  const [timeAgo, setTimeAgo] = useState('')
  const [diffHours, setDiffHours] = useState(0)

  useEffect(() => {
    const update = () => {
      const now = new Date()
      const updated = new Date(timestamp)
      const diffMs = now.getTime() - updated.getTime()
      const diffMins = Math.floor(diffMs / 60000)
      const hours = Math.floor(diffMs / 3600000)

      setDiffHours(hours)
      if (diffMins < 1) setTimeAgo('Just now')
      else if (diffMins < 60) setTimeAgo(`${diffMins} min ago`)
      else if (hours < 24) setTimeAgo(`${hours} hour${hours > 1 ? 's' : ''} ago`)
      else {
        const diffDays = Math.floor(hours / 24)
        setTimeAgo(`${diffDays} day${diffDays > 1 ? 's' : ''} ago`)
      }
    }

    update()
    const interval = setInterval(update, 60000)
    return () => clearInterval(interval)
  }, [timestamp])

  const isStale = diffHours >= 12

  return (
    <span className={`text-xs font-medium flex items-center gap-1 ${isStale ? 'text-amber-400' : 'text-gray-500'}`}>
      {isStale && <span>⚠</span>}
      Updated {timeAgo}
    </span>
  )
}
