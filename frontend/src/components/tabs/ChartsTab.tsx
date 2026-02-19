import { useSnapshots } from '../../hooks/useSnapshots'
import TrainingLoadChart from '../charts/TrainingLoadChart'
import HrvChart from '../charts/HrvChart'
import WeeklyKmChart from '../charts/WeeklyKmChart'

export default function ChartsTab() {
  const { data, loading, error } = useSnapshots(90)

  if (loading) return <p className="p-6 text-gray-500">Loading…</p>
  if (error)   return <p className="p-6 text-red-400">Error: {error}</p>
  if (!data || data.items.length === 0) return <p className="p-6 text-gray-500">No data yet.</p>

  // Reverse to chronological order for charts (API returns newest-first)
  const snapshots = [...data.items].reverse()

  return (
    <div className="py-6 px-4 space-y-10">
      <TrainingLoadChart snapshots={snapshots} />
      <HrvChart          snapshots={snapshots} />
      <WeeklyKmChart     snapshot={snapshots[snapshots.length - 1]} />
    </div>
  )
}
