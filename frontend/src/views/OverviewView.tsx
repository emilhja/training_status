import { lazy, Suspense, type ReactNode } from 'react'
import type { Snapshot } from '../types'
import ErrorBoundary from '../components/ErrorBoundary'
import MetricCard from '../components/current/MetricCard'
import SmartAlerts from '../components/features/SmartAlerts'
import { loadDashboardConfig } from '../components/features/DashboardConfig'
import { ctlStatus, tsbStatus, tsbZone, fmt } from '../utils/metrics'

// Heavy components loaded lazily to improve initial bundle / PWA startup time
const TrainingLoadChart = lazy(() => import('../components/charts/TrainingLoadChart'))
const GoalProgress = lazy(() => import('../components/features/GoalProgress'))
const ConsistencyScore = lazy(() => import('../components/features/ConsistencyScore'))
const RecoveryRecommendation = lazy(() => import('../components/features/RecoveryRecommendation'))
const CalendarHeatmap = lazy(() => import('../components/features/CalendarHeatmap'))
const CompareMode = lazy(() => import('../components/features/CompareMode'))
const InjuryRiskPanel = lazy(() => import('../components/features/InjuryRiskPanel'))
const CorrelationInsights = lazy(() => import('../components/features/CorrelationInsights'))
const WeeklySummary = lazy(() => import('../components/features/WeeklySummary'))
const GoalAdherence = lazy(() => import('../components/features/GoalAdherence'))
const WeeklyActivitiesWidget = lazy(() => import('../components/features/WeeklyActivitiesWidget'))
const HrvOverviewWidget = lazy(() => import('../components/features/HrvOverviewWidget'))
const ReadinessScore = lazy(() => import('../components/features/ReadinessScore'))
const WorkoutSuggestion = lazy(() => import('../components/features/WorkoutSuggestion'))

function WidgetSkeleton() {
  return <div className="bg-gray-900 rounded-xl p-4 h-24 animate-pulse" />
}

interface Props {
  s: Snapshot
  snapshots: Snapshot[]
}

export default function OverviewView({ s, snapshots }: Props) {
  const dashConfig = loadDashboardConfig()
  const widgetMap: Record<string, ReactNode> = {
    readiness: <ReadinessScore />,
    workout_suggestion: <WorkoutSuggestion />,
    weekly_summary: <WeeklySummary />,
    smart_alerts: <SmartAlerts snapshot={s} />,
    injury_risk: <InjuryRiskPanel />,
    recovery_recommendation: <RecoveryRecommendation />,
    goal_progress: <GoalProgress snapshot={s} />,
    goal_adherence: <GoalAdherence />,
    metric_cards: (
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        <MetricCard label="Fitness (CTL)" value={fmt(s.ctl)} status={ctlStatus(s.ramp_rate)} glossaryKey="ctl" />
        <MetricCard label="Form (TSB)" value={fmt(s.tsb)} status={tsbStatus(s.tsb)} sub={tsbZone(s.tsb)} glossaryKey="tsb" />
        <MetricCard label="Resting HR" value={s.resting_hr ?? '—'} unit="bpm" glossaryKey="resting_hr" />
        <MetricCard label="HRV" value={fmt(s.hrv, 0)} unit="ms" glossaryKey="hrv" />
      </div>
    ),
    compare_consistency: (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <CompareMode snapshot={s} />
        <ConsistencyScore />
      </div>
    ),
    correlation_insights: <CorrelationInsights />,
    training_load_chart: (
      <div className="bg-gray-900 rounded-xl p-4">
        <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-4">Training Load Trend</h3>
        {snapshots.length > 0 && <TrainingLoadChart snapshots={snapshots} />}
      </div>
    ),
    calendar_heatmap: snapshots.length > 0 ? <CalendarHeatmap snapshots={snapshots} /> : null,
    weekly_activities: <WeeklyActivitiesWidget />,
    hrv_overview: snapshots.length > 0 ? <HrvOverviewWidget snapshots={snapshots} /> : null,
  }

  return (
    <div className="space-y-6">
      {dashConfig.filter(w => w.visible).map(w => {
        const widget = widgetMap[w.id]
        return widget ? (
          <ErrorBoundary key={w.id}>
            <Suspense fallback={<WidgetSkeleton />}>
              {widget}
            </Suspense>
          </ErrorBoundary>
        ) : null
      })}
    </div>
  )
}
