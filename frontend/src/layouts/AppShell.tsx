// AppShell: root layout — header, left sidebar, main content area, right sidebar (quick stats)

import { useParams, useNavigate, Link } from 'react-router-dom'
import { useEffect, useState, lazy, Suspense } from 'react'
import { triggerFetch, fetchGoals } from '../api'
import { useKeyboardShortcuts } from '../hooks/useKeyboardShortcuts'
import { useLatestSnapshot } from '../hooks/useLatestSnapshot'
import { useSnapshots } from '../hooks/useSnapshots'
import WeeklyKmChart from '../components/charts/WeeklyKmChart'
import CompactView from './CompactView'
import AccordionView from './AccordionView'
import SparklineChart from '../components/features/SparklineChart'
import DataExport from '../components/features/DataExport'
import ThemeToggle from '../components/features/ThemeToggle'
import LastUpdated from '../components/features/LastUpdated'
import SettingsTab from '../components/tabs/SettingsTab'
import ActivitiesTab from '../components/tabs/ActivitiesTab'
import ErrorBoundary from '../components/ErrorBoundary'
import { useToast } from '../components/ui/Toast'
import {
  ctlStatus, atlStatus, tsbStatus, tsbZone, acStatus,
  fmtSleep, fmt,
} from '../utils/metrics'

const OverviewView        = lazy(() => import('../views/OverviewView'))
const TrainingView        = lazy(() => import('../views/TrainingView'))
const HealthView          = lazy(() => import('../views/HealthView'))
const HealthAnalysisView  = lazy(() => import('../views/HealthAnalysisView'))
const RunningView         = lazy(() => import('../views/RunningView'))
const TrendsView          = lazy(() => import('../views/TrendsView'))
const LogView             = lazy(() => import('../views/LogView'))
const GearView            = lazy(() => import('../views/GearView'))
const DiffView            = lazy(() => import('../views/DiffView'))

type MainView = 'overview' | 'training' | 'health' | 'analysis' | 'running' | 'activities' | 'trends' | 'log' | 'gear' | 'diff' | 'compact' | 'accordion' | 'settings'

const validViews: MainView[] = ['overview', 'training', 'health', 'analysis', 'running', 'activities', 'trends', 'log', 'gear', 'diff', 'compact', 'accordion', 'settings']
const menuItems: { id: MainView; label: string; icon: string }[] = [
  { id: 'overview',   label: 'Overview',        icon: '⊞' },
  { id: 'training',   label: 'Training',         icon: '▲' },
  { id: 'health',     label: 'Health',           icon: '♥' },
  { id: 'analysis',   label: 'Analysis',         icon: '🔬' },
  { id: 'running',    label: 'Running',          icon: '👟' },
  { id: 'activities', label: 'Activities',       icon: '🏋️' },
  { id: 'trends',     label: 'Trends',           icon: '📈' },
  { id: 'log',        label: 'Log',              icon: '📝' },
  { id: 'gear',       label: 'Gear',             icon: '🏷' },
  { id: 'diff',       label: 'Snapshot Diff',    icon: '⇄' },
  { id: 'compact',    label: 'Compact View',     icon: '⬚' },
  { id: 'accordion',  label: 'Accordion View',   icon: '☰' },
  { id: 'settings',   label: 'Settings',         icon: '⚙' },
]

const ViewSpinner = () => (
  <div className="flex items-center justify-center py-20">
    <svg className="w-6 h-6 text-gray-500 animate-spin" fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/>
    </svg>
  </div>
)

export default function AppShell() {
  const { view } = useParams<{ view: string }>()
  const navigate = useNavigate()
  const [leftCollapsed, setLeftCollapsed] = useState(false)
  const [mobileNavOpen, setMobileNavOpen] = useState(false)
  const [refreshing, setRefreshing] = useState(false)
  const [showShortcuts, setShowShortcuts] = useState(false)

  const { data: s, loading, error, refetch } = useLatestSnapshot()
  const { data: historyData, refetch: refetchHistory } = useSnapshots(90)
  const { showToast } = useToast()

  async function handleRefresh() {
    setRefreshing(true)
    try {
      await triggerFetch()
      const [, , goalsData] = await Promise.all([refetch(), refetchHistory(), fetchGoals()])
      // Feature G: notify if a weekly_km goal is reached after refresh
      const latestSnap = await import('../api').then(m => m.fetchLatest())
      if (latestSnap.week_0_km !== null && latestSnap.week_0_km !== undefined) {
        for (const goal of goalsData.items) {
          if (goal.goal_type === 'weekly_km' && goal.is_active && latestSnap.week_0_km >= goal.target_value) {
            showToast(`Goal reached! ${latestSnap.week_0_km.toFixed(1)} / ${goal.target_value} km this week`, 'success')
            break
          }
        }
      }
      showToast('Data refreshed', 'success')
    } catch (e) {
      showToast(e instanceof Error ? e.message : 'Refresh failed', 'error')
    } finally {
      setRefreshing(false)
    }
  }

  // Feature A: keyboard shortcuts — r=refresh, 1-9=navigate views, ?=help panel
  useKeyboardShortcuts(handleRefresh, navigate, () => setShowShortcuts(v => !v))

  const snapshots = historyData ? [...historyData.items].reverse() : []

  // Validate view and redirect if invalid
  useEffect(() => {
    if (!view || !validViews.includes(view as MainView)) {
      navigate('/overview', { replace: true })
    }
  }, [view, navigate])

  const activeView = (view as MainView) || 'overview'

  // Close mobile nav drawer on navigation
  useEffect(() => { setMobileNavOpen(false) }, [activeView])

  if (loading) return (
    <div className="flex items-center justify-center min-h-screen">
      <svg className="w-8 h-8 text-gray-500 animate-spin" fill="none" viewBox="0 0 24 24">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/>
      </svg>
    </div>
  )
  if (error)   return <p className="p-6 text-red-400">Error: {error}</p>
  if (!s)      return <p className="p-6 text-gray-500">No data yet. Run a fetch first.</p>

  const recorded = s.recorded_at.replace('T', ' ').slice(0, 16)

  const renderMainContent = () => {
    switch (activeView) {
      case 'overview':   return <OverviewView s={s} snapshots={snapshots} />
      case 'training':   return <TrainingView s={s} snapshots={snapshots} />
      case 'health':     return <HealthView s={s} snapshots={snapshots} />
      case 'analysis':   return <HealthAnalysisView s={s} />
      case 'running':    return <RunningView s={s} snapshots={snapshots} />
      case 'trends':     return <TrendsView snapshots={snapshots} />
      case 'log':        return <LogView />
      case 'gear':       return <GearView />
      case 'diff':       return <DiffView snapshots={snapshots} />
      case 'activities': return <ActivitiesTab />
      case 'compact':    return <CompactView />
      case 'accordion':  return <AccordionView />
      case 'settings':   return <SettingsTab />
    }
  }

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100 flex flex-col">
      {/* Header */}
      <header className="h-14 bg-gray-900 border-b border-gray-800 flex items-center justify-between px-4 shrink-0">
        <div className="flex items-center gap-4">
          <button
            onClick={() => setMobileNavOpen(true)}
            className="md:hidden p-2 -ml-1 rounded-lg text-gray-400 hover:text-gray-200 hover:bg-gray-800 transition-colors"
            aria-label="Open navigation"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16"/>
            </svg>
          </button>
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
            className="px-3 py-2.5 bg-green-600 hover:bg-green-500 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded text-sm font-medium transition-colors"
          >
            {refreshing ? 'Refreshing…' : 'Refresh'}
          </button>
        </div>
      </header>

      {/* Main Layout */}
      <div className="flex-1 flex overflow-hidden">
        {/* Mobile backdrop */}
        {mobileNavOpen && (
          <div
            className="fixed inset-0 z-40 bg-black/60 md:hidden"
            onClick={() => setMobileNavOpen(false)}
          />
        )}

        {/* Left Sidebar */}
        <aside className={`
          fixed inset-y-0 left-0 z-50 flex flex-col bg-gray-900 border-r border-gray-800
          transition-transform duration-200
          md:relative md:inset-auto md:z-auto md:translate-x-0
          ${mobileNavOpen ? 'translate-x-0' : '-translate-x-full'}
          ${leftCollapsed ? 'w-14' : 'w-56'}
        `}>
          {/* Mobile close button */}
          <button
            onClick={() => setMobileNavOpen(false)}
            className="md:hidden absolute top-3 right-3 p-1 rounded text-gray-500 hover:text-gray-300"
            aria-label="Close navigation"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/>
            </svg>
          </button>

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
                className={`w-full flex items-center gap-2 px-2 py-3 rounded text-sm font-medium transition-colors
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

          {/* Quick Stats in Left Sidebar (when expanded) */}
          {!leftCollapsed && (
            <div className="p-3 border-t border-gray-800 space-y-4 overflow-y-auto">
              {/* Trend Indicators */}
              <div>
                <p className="text-xs uppercase text-gray-500 tracking-wider mb-2">Trends (vs last)</p>
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
                <p className="text-xs uppercase text-gray-500 tracking-wider mb-2">Weekly Volume</p>
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
                <p className="text-xs uppercase text-gray-500 tracking-wider mb-1">4-Week Avg</p>
                <p className="text-lg font-semibold text-gray-200">
                  {fmt(((s.week_1_km || 0) + (s.week_2_km || 0) + (s.week_3_km || 0) + (s.week_4_km || 0)) / 4)}
                  <span className="text-sm text-gray-500 ml-1">km/wk</span>
                </p>
              </div>

              {/* Recent History Mini-List */}
              {snapshots.length > 1 && (
                <div>
                  <p className="text-xs uppercase text-gray-500 tracking-wider mb-2">Recent Snapshots</p>
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

          {/* Shortcut hint at bottom of left sidebar */}
          <div className="mt-auto border-t border-gray-800">
            <button
              onClick={() => setShowShortcuts(v => !v)}
              className="w-full flex items-center justify-center gap-1.5 p-2.5 text-gray-600 hover:text-gray-400 transition-colors text-xs"
              title="Keyboard shortcuts (?)"
            >
              <span className="font-mono bg-gray-800 px-1.5 py-0.5 rounded text-gray-500">?</span>
              {!leftCollapsed && <span>Shortcuts</span>}
            </button>
          </div>
        </aside>

        {/* Main Content Area */}
        <main className="flex-1 overflow-y-auto">
          <ErrorBoundary>
            <Suspense fallback={<ViewSpinner />}>
              {activeView === 'compact' || activeView === 'accordion' ? (
                renderMainContent()
              ) : (
                <div className="max-w-5xl mx-auto p-6 pb-safe">
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
            </Suspense>
          </ErrorBoundary>
        </main>

        {/* Right Sidebar - Hidden for Compact/Accordion views */}
        <aside className={`w-64 bg-gray-900 border-l border-gray-800 shrink-0 overflow-y-auto hidden xl:block ${activeView === 'compact' || activeView === 'accordion' ? 'xl:hidden' : ''}`}>
          <div className="p-4 space-y-6">
            {/* Quick Summary */}
            <div>
              <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Quick Stats</h3>
              <div className="space-y-3">
                <div className="bg-gray-800/50 rounded-lg p-3">
                  <p className="text-xs text-gray-500 uppercase">Form (TSB)</p>
                  <p className={`text-xl font-semibold ${tsbStatus(s.tsb) === 'good' ? 'text-green-400' : tsbStatus(s.tsb) === 'bad' ? 'text-red-400' : 'text-gray-200'}`}>
                    {fmt(s.tsb)}
                  </p>
                  <p className="text-xs text-gray-500">{tsbZone(s.tsb)}</p>
                </div>
                <div className="bg-gray-800/50 rounded-lg p-3">
                  <p className="text-xs text-gray-500 uppercase">Rest Days</p>
                  <p className="text-xl font-semibold text-gray-200">{s.rest_days ?? '—'}</p>
                </div>
                <div className="bg-gray-800/50 rounded-lg p-3">
                  <p className="text-xs text-gray-500 uppercase">This Week</p>
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
                    <p className="text-xs text-gray-500 mb-1">CTL</p>
                    <SparklineChart snapshots={snapshots} dataKey="ctl" color="#22c55e" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 mb-1">HRV</p>
                    <SparklineChart snapshots={snapshots} dataKey="hrv" color="#3b82f6" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Sleep Score</p>
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

            {/* Shortcut hint at bottom of right sidebar */}
            <button
              onClick={() => setShowShortcuts(v => !v)}
              className="w-full flex items-center justify-center gap-1.5 py-2 text-gray-600 hover:text-gray-400 transition-colors text-xs border-t border-gray-800 mt-2 pt-3"
              title="Keyboard shortcuts (?)"
            >
              <span className="font-mono bg-gray-800 px-1.5 py-0.5 rounded text-gray-500">?</span>
              <span>Shortcuts</span>
            </button>
          </div>
        </aside>
      </div>

      {/* Keyboard Shortcut Reference Panel */}
      {showShortcuts && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60"
          onClick={() => setShowShortcuts(false)}
        >
          <div
            className="bg-gray-900 border border-gray-700 rounded-xl shadow-2xl p-6 w-80 max-h-[90vh] overflow-y-auto"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-semibold text-gray-200 uppercase tracking-widest">Keyboard Shortcuts</h2>
              <button
                onClick={() => setShowShortcuts(false)}
                className="text-gray-500 hover:text-gray-300 transition-colors"
                aria-label="Close"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wider mb-2">Actions</p>
                <div className="space-y-2">
                  {[
                    { key: 'r', label: 'Refresh data' },
                    { key: '?', label: 'Show / hide this panel' },
                  ].map(({ key, label }) => (
                    <div key={key} className="flex items-center justify-between">
                      <span className="text-sm text-gray-300">{label}</span>
                      <kbd className="font-mono text-xs bg-gray-800 border border-gray-700 text-gray-400 px-2 py-0.5 rounded">{key}</kbd>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wider mb-2">Navigate to view</p>
                <div className="space-y-2">
                  {menuItems.filter(m => !['compact', 'accordion'].includes(m.id)).map((item, i) => (
                    <div key={item.id} className="flex items-center justify-between">
                      <span className="text-sm text-gray-300">{item.icon} {item.label}</span>
                      {i < 9 && (
                        <kbd className="font-mono text-xs bg-gray-800 border border-gray-700 text-gray-400 px-2 py-0.5 rounded">{i + 1}</kbd>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <p className="text-xs text-gray-600 mt-5">Shortcuts are inactive when a text field is focused.</p>
          </div>
        </div>
      )}
    </div>
  )
}
