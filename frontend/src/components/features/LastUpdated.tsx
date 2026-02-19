import { useEffect, useState } from 'react'

interface Props {
  timestamp: string
}

export default function LastUpdated({ timestamp }: Props) {
  const [timeAgo, setTimeAgo] = useState('')

  useEffect(() => {
    const update = () => {
      const now = new Date()
      const updated = new Date(timestamp)
      const diffMs = now.getTime() - updated.getTime()
      const diffMins = Math.floor(diffMs / 60000)
      const diffHours = Math.floor(diffMs / 3600000)

      if (diffMins < 1) setTimeAgo('Just now')
      else if (diffMins < 60) setTimeAgo(`${diffMins} min ago`)
      else if (diffHours < 24) setTimeAgo(`${diffHours} hour${diffHours > 1 ? 's' : ''} ago`)
      else {
        const diffDays = Math.floor(diffHours / 24)
        setTimeAgo(`${diffDays} day${diffDays > 1 ? 's' : ''} ago`)
      }
    }

    update()
    const interval = setInterval(update, 60000) // Update every minute
    return () => clearInterval(interval)
  }, [timestamp])

  const isStale = timeAgo.includes('day') || (timeAgo.includes('hour') && parseInt(timeAgo) > 12)

  return (
    <span className={`text-xs ${isStale ? 'text-yellow-500' : 'text-gray-500'}`}>
      Updated {timeAgo}
    </span>
  )
}
