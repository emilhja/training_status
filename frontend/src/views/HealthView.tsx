import type { Snapshot } from '../types'
import MetricCard from '../components/current/MetricCard'
import HrvChart from '../components/charts/HrvChart'
import Vo2maxChart from '../components/charts/Vo2maxChart'
import SleepInsights from '../components/features/SleepInsights'
import HealthEventLog from '../components/features/HealthEventLog'
import { sleepStatus, subjectiveStatus, fmt, fmtSleep } from '../utils/metrics'

interface Props {
  s: Snapshot
  snapshots: Snapshot[]
}

export default function HealthView({ s, snapshots }: Props) {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        <MetricCard label="Resting HR" value={s.resting_hr ?? '—'} unit="bpm" glossaryKey="resting_hr" />
        <MetricCard label="HRV (RMSSD)" value={fmt(s.hrv, 0)} unit="ms" glossaryKey="hrv" />
        {s.hrv_sdnn !== null && <MetricCard label="HRV (SDNN)" value={fmt(s.hrv_sdnn, 0)} unit="ms" glossaryKey="hrv" />}
        <MetricCard label="Sleep" value={fmtSleep(s.sleep_secs)} status={sleepStatus(s.sleep_quality)}
                    sub={s.sleep_score ? `${Math.round(s.sleep_score)}/100` : undefined} glossaryKey="sleep" />
        <MetricCard label="VO2max" value={s.vo2max ?? '—'} glossaryKey="vo2max" />
        <MetricCard label="Steps" value={s.steps?.toLocaleString() ?? '—'} />
        {s.spo2 !== null && <MetricCard label="SpO2" value={s.spo2} unit="%" glossaryKey="spo2" />}
      </div>

      {(s.stress !== null || s.readiness !== null || s.weight !== null || s.body_fat !== null) && (
        <div className="bg-gray-900 rounded-xl p-4">
          <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">Wellness (Garmin/Intervals)</h3>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {s.stress !== null && <MetricCard label="Stress" value={s.stress} unit="/100" glossaryKey="stress" />}
            {s.readiness !== null && <MetricCard label="Readiness" value={s.readiness} unit="/100" glossaryKey="readiness" />}
            {s.weight !== null && <MetricCard label="Weight" value={fmt(s.weight)} unit="kg" glossaryKey="weight" />}
            {s.body_fat !== null && <MetricCard label="Body Fat" value={fmt(s.body_fat)} unit="%" glossaryKey="body_fat" />}
          </div>
        </div>
      )}

      {(s.mood !== null || s.motivation !== null || s.fatigue !== null || s.soreness !== null) && (
        <div className="bg-gray-900 rounded-xl p-4">
          <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">Subjective Wellness</h3>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {s.mood !== null && <MetricCard label="Mood" value={s.mood} unit="/5" status={subjectiveStatus(s.mood)} glossaryKey="mood" />}
            {s.motivation !== null && <MetricCard label="Motivation" value={s.motivation} unit="/5" status={subjectiveStatus(s.motivation)} glossaryKey="motivation" />}
            {s.fatigue !== null && <MetricCard label="Fatigue" value={s.fatigue} unit="/5" status={subjectiveStatus(s.fatigue) === 'good' ? 'bad' : subjectiveStatus(s.fatigue) === 'bad' ? 'good' : 'ok'} glossaryKey="fatigue" />}
            {s.soreness !== null && <MetricCard label="Soreness" value={s.soreness} unit="/5" status={subjectiveStatus(s.soreness) === 'good' ? 'bad' : subjectiveStatus(s.soreness) === 'bad' ? 'good' : 'ok'} glossaryKey="soreness" />}
          </div>
        </div>
      )}

      {s.comments && (
        <div className="bg-gray-900 rounded-xl p-4">
          <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-2">Notes</h3>
          <p className="text-sm text-gray-300">{s.comments}</p>
        </div>
      )}

      <div className="bg-gray-900 rounded-xl p-4">
        <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-4">HRV Trend</h3>
        {snapshots.length > 0 && <HrvChart snapshots={snapshots} />}
      </div>

      <div className="bg-gray-900 rounded-xl p-4">
        {snapshots.length > 0 && <Vo2maxChart snapshots={snapshots} />}
      </div>

      <SleepInsights />
      <HealthEventLog />
    </div>
  )
}
