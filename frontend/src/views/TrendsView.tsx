import type { Snapshot } from '../types'
import TrainingLoadChart from '../components/charts/TrainingLoadChart'
import HrvChart from '../components/charts/HrvChart'
import Vo2maxChart from '../components/charts/Vo2maxChart'
import CalendarHeatmap from '../components/features/CalendarHeatmap'
import DetrainingChart from '../components/charts/DetrainingChart'

interface Props {
  snapshots: Snapshot[]
}

export default function TrendsView({ snapshots }: Props) {
  return (
    <div className="space-y-6">
      {snapshots.length > 0 && <CalendarHeatmap snapshots={snapshots} />}

      <div className="bg-gray-900 rounded-xl p-4">
        <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-4">Training Load (90 days)</h3>
        {snapshots.length > 0 && <TrainingLoadChart snapshots={snapshots} />}
      </div>

      <div className="bg-gray-900 rounded-xl p-4">
        <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-4">HRV Trend (90 days)</h3>
        {snapshots.length > 0 && <HrvChart snapshots={snapshots} />}
      </div>

      <div className="bg-gray-900 rounded-xl p-4">
        {snapshots.length > 0 && <Vo2maxChart snapshots={snapshots} />}
      </div>

      <div className="bg-gray-900 rounded-xl p-4">
        <DetrainingChart />
      </div>
    </div>
  )
}
