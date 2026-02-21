// Layout E: Three-Panel Layout
// Header with menu, left sidebar for navigation, main content, and right sidebar for quick stats

import { useParams, useNavigate, Link } from 'react-router-dom'
import { useEffect } from 'react'
import { triggerFetch } from '../api'
import { useLatestSnapshot } from '../hooks/useLatestSnapshot'
import { useSnapshots } from '../hooks/useSnapshots'
import MetricCard from '../components/current/MetricCard'
import TrainingLoadChart from '../components/charts/TrainingLoadChart'
import HrvChart from '../components/charts/HrvChart'
import WeeklyKmChart from '../components/charts/WeeklyKmChart'
import Vo2maxChart from '../components/charts/Vo2maxChart'
import LayoutB_CompactDashboard from './LayoutB_CompactDashboard'
import LayoutC_Accordion from './LayoutC_Accordion'
import GoalProgress from '../components/features/GoalProgress'
import ConsistencyScore from '../components/features/ConsistencyScore'
import RecoveryRecommendation from '../components/features/RecoveryRecommendation'
import PaceZonesChart from '../components/features/PaceZonesChart'
import CalendarHeatmap from '../components/features/CalendarHeatmap'
import StreakWidget from '../components/features/StreakWidget'
import SmartAlerts from '../components/features/SmartAlerts'
import CompareMode from '../components/features/CompareMode'
import ProjectionsChart from '../components/features/ProjectionsChart'
import WeatherImpact from '../components/features/WeatherImpact'
import FatiguePattern from '../components/features/FatiguePattern'
import DataExport from '../components/features/DataExport'
import ThemeToggle from '../components/features/ThemeToggle'
import LastUpdated from '../components/features/LastUpdated'
import SparklineChart from '../components/features/SparklineChart'
import InjuryRiskPanel from '../components/features/InjuryRiskPanel'
import CorrelationInsights from '../components/features/CorrelationInsights'
import RacePredictor from '../components/features/RacePredictor'
import WeeklySummary from '../components/features/WeeklySummary'
import PersonalRecords from '../components/features/PersonalRecords'
import TrainingLog from '../components/features/TrainingLog'
import GoalAdherence from '../components/features/GoalAdherence'
import TsbZonesChart from '../components/charts/TsbZonesChart'
import DetrainingChart from '../components/charts/DetrainingChart'
import SettingsTab from '../components/tabs/SettingsTab'
import { useState } from 'react'
import {
  ctlStatus, atlStatus, tsbStatus, tsbZone, acStatus, sleepStatus, subjectiveStatus,
  fmtSleep, fmt, fmtCadence,
} from '../utils/metrics'

type MainView = 'overview' | 'training' | 'health' | 'running' | 'trends' | 'log' | 'compact' | 'accordion' | 'settings'

const validViews: MainView[] = ['overview', 'training', 'health', 'running', 'trends', 'log', 'compact', 'accordion', 'settings']
const menuItems: { id: MainView; label: string; icon: string }[] = [
  { id: 'overview', label: 'Overview', icon: '⊞' },
  { id: 'training', label: 'Training', icon: '▲' },
  { id: 'health', label: 'Health', icon: '♥' },
  { id: 'running', label: 'Running', icon: '👟' },
  { id: 'trends', label: 'Trends', icon: '📈' },
  { id: 'log', label: 'Log', icon: '📝' },
  { id: 'compact', label: 'Compact View', icon: '⬚' },
  { id: 'accordion', label: 'Accordion View', icon: '☰' },
  { id: 'settings', label: 'Settings', icon: '⚙' },
]

export default function LayoutE_ThreePanel() {
  const { view } = useParams<{ view: string }>()
  const navigate = useNavigate()
  const [leftCollapsed, setLeftCollapsed] = useState(false)
  const [refreshing, setRefreshing] = useState(false)

  async function handleRefresh() {
    setRefreshing(true)
    try {
      await triggerFetch()
    } finally {
      refetch()
      setRefreshing(false)
    }
  }
  const { data: s, loading, error, refetch } = useLatestSnapshot()
  const { data: historyData } = useSnapshots(90)
  const snapshots = historyData ? [...historyData.items].reverse() : []

  // Validate view and redirect if invalid
  useEffect(() => {
    if (!view || !validViews.includes(view as MainView)) {
      navigate('/overview', { replace: true })
    }
  }, [view, navigate])

  const activeView = (view as MainView) || 'overview'

  if (loading) return <p className="p-6 text-gray-500">Loading…</p>
  if (error)   return <p className="p-6 text-red-400">Error: {error}</p>
  if (!s)      return <p className="p-6 text-gray-500">No data yet. Run a fetch first.</p>

  const recorded = s.recorded_at.replace('T', ' ').slice(0, 16)

  const renderMainContent = () => {
    switch (activeView) {
      case 'overview':
        return (
          <div className="space-y-6">
            {/* Weekly Summary */}
            <WeeklySummary />

            {/* Smart Alerts */}
            <SmartAlerts snapshot={s} />

            {/* Injury Risk Assessment */}
            <InjuryRiskPanel />

            {/* Recovery Recommendation */}
            <RecoveryRecommendation />

            {/* Goal Progress */}
            <GoalProgress snapshot={s} />

            {/* Goal Adherence */}
            <GoalAdherence />

            {/* Key Metrics Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <MetricCard label="Fitness (CTL)" value={fmt(s.ctl)} status={ctlStatus(s.ramp_rate)} />
              <MetricCard label="Form (TSB)" value={fmt(s.tsb)} status={tsbStatus(s.tsb)} sub={tsbZone(s.tsb)} />
              <MetricCard label="Resting HR" value={s.resting_hr ?? '—'} unit="bpm" />
              <MetricCard label="HRV" value={fmt(s.hrv, 0)} unit="ms" />
            </div>
            
            {/* Comparison Row */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <CompareMode snapshot={s} />
              <ConsistencyScore />
            </div>
            
            {/* Pattern Insights */}
            <CorrelationInsights />

            {/* Charts */}
            <div className="bg-gray-900 rounded-xl p-4">
              <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-4">Training Load Trend</h3>
              {snapshots.length > 0 && <TrainingLoadChart snapshots={snapshots} />}
            </div>

            {/* Activity Heatmap */}
            {snapshots.length > 0 && <CalendarHeatmap snapshots={snapshots} />}
          </div>
        )
      
      case 'training':
        return (
          <div className="space-y-6">
            {/* Injury Risk Assessment */}
            <InjuryRiskPanel />
            
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
              <MetricCard label="Fitness (CTL)" value={fmt(s.ctl)} status={ctlStatus(s.ramp_rate)} />
              <MetricCard label="Fatigue (ATL)" value={fmt(s.atl)} status={atlStatus(s.atl, s.ctl)} />
              <MetricCard label="Form (TSB)" value={fmt(s.tsb)} status={tsbStatus(s.tsb)} sub={tsbZone(s.tsb)} />
              <MetricCard label="Workload (A:C)" value={fmt(s.ac_ratio, 2)} status={acStatus(s.ac_ratio)} />
              <MetricCard label="Monotony" value={fmt(s.monotony, 2)} />
              <MetricCard label="Training Strain" value={s.training_strain ?? '—'} />
            </div>

            {/* 7-Day Projections */}
            <ProjectionsChart />

            {/* TSB Training Zones */}
            {snapshots.length > 0 && (
              <div className="bg-gray-900 rounded-xl p-4">
                <TsbZonesChart snapshots={snapshots} />
              </div>
            )}

            {/* Race Predictor */}
            <RacePredictor />
            
            {/* Pace Zones */}
            <PaceZonesChart snapshot={s} />
            
            {(s.elevation_gain_m !== null || s.avg_cadence !== null || s.icu_rpe !== null) && (
              <div className="bg-gray-900 rounded-xl p-4">
                <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">Latest Activity</h3>
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                  {s.elevation_gain_m !== null && <MetricCard label="Elevation" value={fmt(s.elevation_gain_m)} unit="m" />}
                  {s.avg_cadence !== null && <MetricCard label="Cadence" value={fmtCadence(s.avg_cadence)} unit="spm" />}
                  {s.max_hr !== null && <MetricCard label="Max HR" value={s.max_hr} unit="bpm" />}
                  {s.icu_rpe !== null && <MetricCard label="RPE" value={s.icu_rpe} unit="/10" />}
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
      
      case 'health':
        return (
          <div className="space-y-6">
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
              <MetricCard label="Resting HR" value={s.resting_hr ?? '—'} unit="bpm" />
              <MetricCard label="HRV (RMSSD)" value={fmt(s.hrv, 0)} unit="ms" />
              {s.hrv_sdnn !== null && <MetricCard label="HRV (SDNN)" value={fmt(s.hrv_sdnn, 0)} unit="ms" />}
              <MetricCard label="Sleep" value={fmtSleep(s.sleep_secs)} status={sleepStatus(s.sleep_quality)}
                          sub={s.sleep_score ? `${Math.round(s.sleep_score)}/100` : undefined} />
              <MetricCard label="VO2max" value={s.vo2max ?? '—'} />
              <MetricCard label="Steps" value={s.steps?.toLocaleString() ?? '—'} />
              {s.spo2 !== null && <MetricCard label="SpO2" value={s.spo2} unit="%" />}
            </div>
            
            {(s.stress !== null || s.readiness !== null || s.weight !== null || s.body_fat !== null) && (
              <div className="bg-gray-900 rounded-xl p-4">
                <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">Wellness (Garmin/Intervals)</h3>
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                  {s.stress !== null && <MetricCard label="Stress" value={s.stress} unit="/100" />}
                  {s.readiness !== null && <MetricCard label="Readiness" value={s.readiness} unit="/100" />}
                  {s.weight !== null && <MetricCard label="Weight" value={fmt(s.weight)} unit="kg" />}
                  {s.body_fat !== null && <MetricCard label="Body Fat" value={fmt(s.body_fat)} unit="%" />}
                </div>
              </div>
            )}

            {(s.mood !== null || s.motivation !== null || s.fatigue !== null || s.soreness !== null) && (
              <div className="bg-gray-900 rounded-xl p-4">
                <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">Subjective Wellness</h3>
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                  {s.mood !== null && <MetricCard label="Mood" value={s.mood} unit="/5" status={subjectiveStatus(s.mood)} />}
                  {s.motivation !== null && <MetricCard label="Motivation" value={s.motivation} unit="/5" status={subjectiveStatus(s.motivation)} />}
                  {s.fatigue !== null && <MetricCard label="Fatigue" value={s.fatigue} unit="/5" status={subjectiveStatus(s.fatigue) === 'good' ? 'bad' : subjectiveStatus(s.fatigue) === 'bad' ? 'good' : 'ok'} />}
                  {s.soreness !== null && <MetricCard label="Soreness" value={s.soreness} unit="/5" status={subjectiveStatus(s.soreness) === 'good' ? 'bad' : subjectiveStatus(s.soreness) === 'bad' ? 'good' : 'ok'} />}
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

            {/* VO2max Trend */}
            <div className="bg-gray-900 rounded-xl p-4">
              {snapshots.length > 0 && <Vo2maxChart snapshots={snapshots} />}
            </div>
          </div>
        )
      
      case 'running':
        return (
          <div className="space-y-6">
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
              <MetricCard label="Total Distance" value={fmt(s.total_distance_km, 0)} unit="km" />
              <MetricCard label="Run Count" value={s.run_count ?? '—'} />
              <MetricCard label="Longest Run" value={fmt(s.longest_run_km)} unit="km" />
              <MetricCard label="Avg Pace" value={s.avg_pace ?? '—'} unit="min/km" />
              <MetricCard label="This Week" value={fmt(s.week_0_km)} unit="km" />
              <MetricCard label="Last Month" value={fmt(s.last_month_km)} unit="km" />
            </div>

            {/* Streak Widget */}
            <StreakWidget snapshot={s} />

            {/* Weather Impact Analysis */}
            {snapshots.length > 0 && <WeatherImpact snapshots={snapshots} />}

            {/* Fatigue Pattern */}
            <FatiguePattern snapshot={s} />

            {(s.longest_streak !== null || s.avg_days_run_per_week !== null || s.most_often_run_day !== null) && (
              <div className="bg-gray-900 rounded-xl p-4">
                <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">Running Patterns</h3>
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                  {s.longest_streak !== null && <MetricCard label="Longest Streak" value={s.longest_streak} unit="days" />}
                  {s.longest_break_days !== null && <MetricCard label="Longest Break" value={s.longest_break_days} unit="days" />}
                  {s.avg_days_run_per_week !== null && <MetricCard label="Avg Days/Week" value={fmt(s.avg_days_run_per_week, 1)} />}
                  {s.most_often_run_day !== null && <MetricCard label="Fav Day" value={s.most_often_run_day} />}
                  {s.days_run_am !== null && <MetricCard label="AM Runs" value={s.days_run_am} />}
                  {s.days_run_pm !== null && <MetricCard label="PM Runs" value={s.days_run_pm} />}
                </div>
              </div>
            )}

            {/* Personal Records */}
            <PersonalRecords />

            <div className="bg-gray-900 rounded-xl p-4">
              <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-4">Weekly Volume</h3>
              <WeeklyKmChart snapshot={s} />
            </div>
          </div>
        )

      case 'log':
        return (
          <div className="space-y-6">
            <TrainingLog />
          </div>
        )

      case 'trends':
        return (
          <div className="space-y-6">
            {/* Activity Heatmap */}
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

            {/* Detraining Estimator */}
            <div className="bg-gray-900 rounded-xl p-4">
              <DetrainingChart />
            </div>
          </div>
        )

      case 'compact':
        return <LayoutB_CompactDashboard />

      case 'accordion':
        return <LayoutC_Accordion />

      case 'settings':
        return <SettingsTab />
    }
  }

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100 flex flex-col">
      {/* Header */}
      <header className="h-14 bg-gray-900 border-b border-gray-800 flex items-center justify-between px-4 shrink-0">
        <div className="flex items-center gap-4">
          <h1 className="text-base font-semibold tracking-tight">Training Status</h1>
          <LastUpdated timestamp={s.recorded_at} />
        </div>
        
        {/* Header Menu */}
        <nav className="hidden md:flex items-center gap-1">
          {menuItems.map(item => (
            <Link
              key={item.id}
              to={`/${item.id}`}
              className={`px-3 py-1.5 rounded text-sm font-medium transition-colors flex items-center gap-2
                ${activeView === item.id
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-400 hover:bg-gray-800 hover:text-gray-200'
                }`}
            >
              <span>{item.icon}</span>
              <span className="hidden lg:inline">{item.label}</span>
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <ThemeToggle />
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="px-3 py-1.5 bg-green-600 hover:bg-green-500 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded text-sm font-medium transition-colors"
          >
            {refreshing ? 'Refreshing…' : 'Refresh'}
          </button>
        </div>
      </header>

      {/* Main Layout */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Sidebar */}
        <aside className={`${leftCollapsed ? 'w-14' : 'w-56'} bg-gray-900 border-r border-gray-800 flex flex-col shrink-0 transition-all duration-200`}>
          {/* Collapse Toggle */}
          <button 
            onClick={() => setLeftCollapsed(!leftCollapsed)}
            className="p-3 border-b border-gray-800 text-gray-500 hover:text-gray-300 flex items-center justify-center"
            title={leftCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            <svg className={`w-5 h-5 transition-transform ${leftCollapsed ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
            </svg>
          </button>

          {/* Compact Navigation */}
          <nav className="p-1.5 space-y-0.5">
            {menuItems.map(item => (
              <Link
                key={item.id}
                to={`/${item.id}`}
                className={`w-full flex items-center gap-2 px-2 py-1.5 rounded text-xs font-medium transition-colors
                  ${activeView === item.id
                    ? 'bg-blue-600/20 text-blue-400'
                    : 'text-gray-400 hover:bg-gray-800 hover:text-gray-200'
                  }`}
                title={item.label}
              >
                <span className="text-base shrink-0">{item.icon}</span>
                {!leftCollapsed && <span>{item.label}</span>}
              </Link>
            ))}
          </nav>

          {/* Quick Stats in Left Sidebar (when expanded) - Different from right sidebar */}
          {!leftCollapsed && (
            <div className="p-3 border-t border-gray-800 space-y-4">
              {/* Trend Indicators */}
              <div>
                <p className="text-[10px] uppercase text-gray-500 tracking-wider mb-2">Trends (vs last)</p>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-400">CTL</span>
                    <div className="flex items-center gap-1">
                      <span className={`text-sm font-medium ${s.ramp_rate && s.ramp_rate > 0 ? 'text-green-400' : s.ramp_rate && s.ramp_rate < 0 ? 'text-red-400' : 'text-gray-300'}`}>
                        {s.ramp_rate && s.ramp_rate > 0 ? '+' : ''}{fmt(s.ramp_rate, 2)}
                      </span>
                      {s.ramp_rate && s.ramp_rate > 0 ? (
                        <svg className="w-3 h-3 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
                        </svg>
                      ) : s.ramp_rate && s.ramp_rate < 0 ? (
                        <svg className="w-3 h-3 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                        </svg>
                      ) : null}
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-400">A:C Ratio</span>
                    <span className={`text-sm font-medium ${acStatus(s.ac_ratio) === 'good' ? 'text-green-400' : acStatus(s.ac_ratio) === 'bad' ? 'text-red-400' : 'text-yellow-400'}`}>
                      {fmt(s.ac_ratio, 2)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-400">Monotony</span>
                    <span className="text-sm font-medium text-gray-300">{fmt(s.monotony, 2)}</span>
                  </div>
                </div>
              </div>

              {/* Weekly Volume Comparison */}
              <div>
                <p className="text-[10px] uppercase text-gray-500 tracking-wider mb-2">Weekly Volume</p>
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-gray-400">This week</span>
                    <span className="font-medium text-gray-200">{fmt(s.week_0_km)} km</span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-gray-400">Last week</span>
                    <span className="font-medium text-gray-200">{fmt(s.week_1_km)} km</span>
                  </div>
                  {s.week_0_km !== null && s.week_1_km !== null && s.week_1_km > 0 && (
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-gray-500">Change</span>
                      <span className={`font-medium ${((s.week_0_km - s.week_1_km) / s.week_1_km) > 0 ? 'text-green-400' : 'text-red-400'}`}>
                        {((s.week_0_km - s.week_1_km) / s.week_1_km * 100) > 0 ? '+' : ''}
                        {fmt((s.week_0_km - s.week_1_km) / s.week_1_km * 100, 0)}%
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* 4-Week Average */}
              <div>
                <p className="text-[10px] uppercase text-gray-500 tracking-wider mb-1">4-Week Avg</p>
                <p className="text-lg font-semibold text-gray-200">
                  {fmt(((s.week_1_km || 0) + (s.week_2_km || 0) + (s.week_3_km || 0) + (s.week_4_km || 0)) / 4)}
                  <span className="text-sm text-gray-500 ml-1">km/wk</span>
                </p>
              </div>

              {/* Recent History Mini-List */}
              {snapshots.length > 1 && (
                <div>
                  <p className="text-[10px] uppercase text-gray-500 tracking-wider mb-2">Recent Snapshots</p>
                  <div className="space-y-1">
                    {snapshots.slice(-3).reverse().map((snap, idx) => (
                      <div key={snap.id} className="flex items-center justify-between text-xs py-1 border-b border-gray-800/50 last:border-0">
                        <span className="text-gray-500">
                          {idx === 0 ? 'Today' : idx === 1 ? 'Yesterday' : snap.recorded_at.slice(5, 10)}
                        </span>
                        <div className="flex gap-2">
                          <span className="text-gray-300">{fmt(snap.ctl)}</span>
                          <span className={`${tsbStatus(snap.tsb) === 'good' ? 'text-green-400' : tsbStatus(snap.tsb) === 'bad' ? 'text-red-400' : 'text-gray-400'}`}>
                            {fmt(snap.tsb)}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </aside>

        {/* Main Content Area */}
        <main className="flex-1 overflow-y-auto">
          {activeView === 'compact' || activeView === 'accordion' ? (
            // Full-width for alternate layouts (no padding, no max-width)
            renderMainContent()
          ) : (
            // Standard layoutE view with padding and max-width
            <div className="max-w-5xl mx-auto p-6">
              <div className="mb-6">
                <h2 className="text-xl font-semibold text-gray-200">
                  {menuItems.find(m => m.id === activeView)?.label}
                </h2>
                <p className="text-sm text-gray-500 mt-1">
                  Last updated: {recorded}
                </p>
              </div>
              {renderMainContent()}
            </div>
          )}
        </main>

        {/* Right Sidebar - Hidden for Compact/Accordion views */}
        <aside className={`w-64 bg-gray-900 border-l border-gray-800 shrink-0 overflow-y-auto hidden xl:block ${activeView === 'compact' || activeView === 'accordion' ? 'xl:hidden' : ''}`}>
          <div className="p-4 space-y-6">
            {/* Quick Summary */}
            <div>
              <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Quick Stats</h3>
              <div className="space-y-3">
                <div className="bg-gray-800/50 rounded-lg p-3">
                  <p className="text-[10px] text-gray-500 uppercase">Form (TSB)</p>
                  <p className={`text-xl font-semibold ${tsbStatus(s.tsb) === 'good' ? 'text-green-400' : tsbStatus(s.tsb) === 'bad' ? 'text-red-400' : 'text-gray-200'}`}>
                    {fmt(s.tsb)}
                  </p>
                  <p className="text-xs text-gray-500">{tsbZone(s.tsb)}</p>
                </div>
                <div className="bg-gray-800/50 rounded-lg p-3">
                  <p className="text-[10px] text-gray-500 uppercase">Rest Days</p>
                  <p className="text-xl font-semibold text-gray-200">{s.rest_days ?? '—'}</p>
                </div>
                <div className="bg-gray-800/50 rounded-lg p-3">
                  <p className="text-[10px] text-gray-500 uppercase">This Week</p>
                  <p className="text-xl font-semibold text-gray-200">{fmt(s.week_0_km)} <span className="text-sm text-gray-500">km</span></p>
                </div>
              </div>
            </div>

            {/* Health Summary */}
            <div>
              <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Health</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500">Resting HR</span>
                  <span className="text-gray-200">{s.resting_hr ?? '—'} bpm</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">HRV</span>
                  <span className="text-gray-200">{fmt(s.hrv, 0)} ms</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Sleep</span>
                  <span className="text-gray-200">{fmtSleep(s.sleep_secs)}</span>
                </div>
                {s.sleep_score !== null && (
                  <div className="flex justify-between">
                    <span className="text-gray-500">Sleep Score</span>
                    <span className="text-gray-200">{Math.round(s.sleep_score)}/100</span>
                  </div>
                )}
              </div>
            </div>

            {/* Volume Summary */}
            <div>
              <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Volume</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500">Total Runs</span>
                  <span className="text-gray-200">{s.run_count?.toLocaleString() ?? '—'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Total Distance</span>
                  <span className="text-gray-200">{fmt(s.total_distance_km, 0)} km</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Longest Run</span>
                  <span className="text-gray-200">{fmt(s.longest_run_km)} km</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Avg Pace</span>
                  <span className="text-gray-200">{s.avg_pace ?? '—'}</span>
                </div>
              </div>
            </div>

            {/* Mini Weekly Chart */}
            <div>
              <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Weekly Progress</h3>
              <WeeklyKmChart snapshot={s} />
            </div>

            {/* 7-Day Trends with Sparklines */}
            {snapshots.length > 1 && (
              <div>
                <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">7-Day Trends</h3>
                <div className="space-y-3">
                  <div>
                    <p className="text-[10px] text-gray-500 mb-1">CTL</p>
                    <SparklineChart snapshots={snapshots} dataKey="ctl" color="#22c55e" />
                  </div>
                  <div>
                    <p className="text-[10px] text-gray-500 mb-1">HRV</p>
                    <SparklineChart snapshots={snapshots} dataKey="hrv" color="#3b82f6" />
                  </div>
                  <div>
                    <p className="text-[10px] text-gray-500 mb-1">Sleep Score</p>
                    <SparklineChart snapshots={snapshots} dataKey="sleep_score" color="#a855f7" />
                  </div>
                </div>
              </div>
            )}

            {/* Status Indicators */}
            <div>
              <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Status</h3>
              <div className="space-y-2">
                <div className={`text-xs px-2 py-1 rounded ${ctlStatus(s.ramp_rate) === 'good' ? 'bg-green-500/20 text-green-400' : 'bg-gray-800 text-gray-400'}`}>
                  Fitness: {ctlStatus(s.ramp_rate)}
                </div>
                <div className={`text-xs px-2 py-1 rounded ${atlStatus(s.atl, s.ctl) === 'good' ? 'bg-green-500/20 text-green-400' : atlStatus(s.atl, s.ctl) === 'bad' ? 'bg-red-500/20 text-red-400' : 'bg-gray-800 text-gray-400'}`}>
                  Fatigue: {atlStatus(s.atl, s.ctl)}
                </div>
                <div className={`text-xs px-2 py-1 rounded ${tsbStatus(s.tsb) === 'good' ? 'bg-green-500/20 text-green-400' : tsbStatus(s.tsb) === 'bad' ? 'bg-red-500/20 text-red-400' : 'bg-gray-800 text-gray-400'}`}>
                  Form: {tsbStatus(s.tsb)}
                </div>
              </div>
            </div>

            {/* Data Export */}
            <DataExport />
          </div>
        </aside>
      </div>
    </div>
  )
}
