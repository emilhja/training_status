import type { Snapshot } from '../types'
import MetricCard from '../components/current/MetricCard'
import TrainingLoadChart from '../components/charts/TrainingLoadChart'
import TsbZonesChart from '../components/charts/TsbZonesChart'
import InjuryRiskPanel from '../components/features/InjuryRiskPanel'
import OverloadTracker from '../components/features/OverloadTracker'
import ProjectionsChart from '../components/features/ProjectionsChart'
import RacePredictor from '../components/features/RacePredictor'
import TaperCalculator from '../components/features/TaperCalculator'
import TrainingZones from '../components/features/TrainingZones'
import HrDriftAnalysis from '../components/features/HrDriftAnalysis'
import PaceZonesChart from '../components/features/PaceZonesChart'
import { ctlStatus, atlStatus, tsbStatus, tsbZone, acStatus, fmt, fmtCadence } from '../utils/metrics'

interface Props {
  s: Snapshot
  snapshots: Snapshot[]
}

export default function TrainingView({ s, snapshots }: Props) {
  return (
    <div className="space-y-6">
      <InjuryRiskPanel />

      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        <MetricCard label="Fitness (CTL)" value={fmt(s.ctl)} status={ctlStatus(s.ramp_rate)} glossaryKey="ctl" />
        <MetricCard label="Fatigue (ATL)" value={fmt(s.atl)} status={atlStatus(s.atl, s.ctl)} glossaryKey="atl" />
        <MetricCard label="Form (TSB)" value={fmt(s.tsb)} status={tsbStatus(s.tsb)} sub={tsbZone(s.tsb)} glossaryKey="tsb" />
        <MetricCard label="Workload (A:C)" value={fmt(s.ac_ratio, 2)} status={acStatus(s.ac_ratio)} glossaryKey="ac_ratio" />
        <MetricCard label="Monotony" value={fmt(s.monotony, 2)} glossaryKey="monotony" />
        <MetricCard label="Training Strain" value={s.training_strain ?? '—'} glossaryKey="training_strain" />
      </div>

      <OverloadTracker />
      <ProjectionsChart />

      {snapshots.length > 0 && (
        <div className="bg-gray-900 rounded-xl p-4">
          <TsbZonesChart snapshots={snapshots} />
        </div>
      )}

      <RacePredictor />
      <TaperCalculator />
      <TrainingZones />
      <HrDriftAnalysis />
      <PaceZonesChart snapshot={s} />

      {(s.elevation_gain_m !== null || s.avg_cadence !== null || s.icu_rpe !== null) && (
        <div className="bg-gray-900 rounded-xl p-4">
          <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">Latest Activity</h3>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {s.elevation_gain_m !== null && <MetricCard label="Elevation" value={fmt(s.elevation_gain_m)} unit="m" />}
            {s.avg_cadence !== null && <MetricCard label="Cadence" value={fmtCadence(s.avg_cadence)} unit="spm" />}
            {s.max_hr !== null && <MetricCard label="Max HR" value={s.max_hr} unit="bpm" />}
            {s.icu_rpe !== null && <MetricCard label="RPE" value={s.icu_rpe} unit="/10" glossaryKey="rpe" />}
          </div>
        </div>
      )}

      {s.critical_speed !== null && (
        <div className="bg-gray-900 rounded-xl p-4">
          <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">Critical Speed Model</h3>
          <div className="grid grid-cols-2 gap-3">
            <MetricCard label="Critical Speed" value={fmt(s.critical_speed)} unit="m/s" />
            {s.d_prime !== null && <MetricCard label="D'" value={fmt(s.d_prime)} unit="m" />}
          </div>
        </div>
      )}

      <div className="bg-gray-900 rounded-xl p-4">
        <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-4">Training Load History</h3>
        {snapshots.length > 0 && <TrainingLoadChart snapshots={snapshots} />}
      </div>
    </div>
  )
}
