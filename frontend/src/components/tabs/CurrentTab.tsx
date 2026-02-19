import { useLatestSnapshot } from '../../hooks/useLatestSnapshot'
import MetricCard from '../current/MetricCard'
import type { Status } from '../../types'

// --- Status helpers (mirror main.py logic) ---

function ctlStatus(ramp: number | null): Status {
  if (ramp === null) return 'neutral'
  if (ramp > 2)  return 'good'
  if (ramp >= 0) return 'ok'
  return 'bad'
}

function atlStatus(atl: number | null, ctl: number | null): Status {
  if (!atl || !ctl) return 'neutral'
  const r = atl / ctl
  if (r < 1.0)  return 'good'
  if (r <= 1.3) return 'ok'
  return 'bad'
}

function tsbStatus(tsb: number | null): Status {
  if (tsb === null) return 'neutral'
  if (tsb > 5)   return 'good'
  if (tsb > -10) return 'ok'
  return 'bad'
}

function tsbZone(tsb: number | null): string {
  if (tsb === null) return ''
  if (tsb > 25)  return 'Transition'
  if (tsb > 5)   return 'Fresh'
  if (tsb > -10) return 'Grey Zone'
  if (tsb > -30) return 'Overreaching'
  return 'Very Overreached'
}

function acStatus(ac: number | null): Status {
  if (ac === null) return 'neutral'
  if (ac < 0.8 || ac > 1.5) return 'bad'
  if (ac <= 1.3) return 'good'
  return 'ok'
}

function sleepStatus(q: number | null): Status {
  if (q === 1) return 'good'
  if (q === 2) return 'ok'
  if (q === 3) return 'bad'
  return 'neutral'
}

function subjectiveStatus(v: number | null): Status {
  if (v === null) return 'neutral'
  if (v >= 4) return 'good'
  if (v >= 3) return 'ok'
  return 'bad'
}

function stressStatus(v: number | null): Status {
  if (v === null) return 'neutral'
  if (v <= 25) return 'good'
  if (v <= 50) return 'ok'
  return 'bad'
}

function readinessStatus(v: number | null): Status {
  if (v === null) return 'neutral'
  if (v >= 80) return 'good'
  if (v >= 60) return 'ok'
  return 'bad'
}

function fmtSleep(secs: number | null): string {
  if (!secs) return '—'
  const h = Math.floor(secs / 3600)
  const m = Math.floor((secs % 3600) / 60)
  return `${h}h${String(m).padStart(2, '0')}m`
}

function fmt(v: number | null, decimals = 1): string {
  if (v === null) return '—'
  return v.toFixed(decimals)
}

// --- Component ---

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mb-8">
      <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-widest px-4 mb-3">{title}</h2>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 px-4">
        {children}
      </div>
    </div>
  )
}

export default function CurrentTab() {
  const { data: s, loading, error } = useLatestSnapshot()

  if (loading) return <p className="p-6 text-gray-500">Loading…</p>
  if (error)   return <p className="p-6 text-red-400">Error: {error}</p>
  if (!s)      return <p className="p-6 text-gray-500">No data yet. Run a fetch first.</p>

  const recorded = s.recorded_at.replace('T', ' ').slice(0, 16)
  
  // Format HR zone time display
  const hrZoneTotal = (s.hr_zone_z1_secs || 0) + (s.hr_zone_z2_secs || 0) + 
                      (s.hr_zone_z3_secs || 0) + (s.hr_zone_z4_secs || 0) + (s.hr_zone_z5_secs || 0)
  const fmtZoneMins = (secs: number | null) => {
    if (!secs || !hrZoneTotal) return '—'
    const mins = Math.round(secs / 60)
    const pct = Math.round((secs / hrZoneTotal) * 100)
    return `${mins}m (${pct}%)`
  }

  return (
    <div className="py-6">
      <p className="text-xs text-gray-600 px-4 mb-6">Last snapshot: {recorded}</p>

      <Section title="Training Load">
        <MetricCard label="Fitness (CTL)"   value={fmt(s.ctl)}      status={ctlStatus(s.ramp_rate)} />
        <MetricCard label="Fatigue (ATL)"   value={fmt(s.atl)}      status={atlStatus(s.atl, s.ctl)} />
        <MetricCard label="Form (TSB)"       value={fmt(s.tsb)}      status={tsbStatus(s.tsb)} sub={tsbZone(s.tsb)} />
        <MetricCard label="Workload (A:C)"  value={fmt(s.ac_ratio, 2)} status={acStatus(s.ac_ratio)} />
        <MetricCard label="Monotony"        value={fmt(s.monotony, 2)} />
        <MetricCard label="Training Strain" value={s.training_strain ?? '—'} />
        <MetricCard label="Rest Days"       value={s.rest_days ?? '—'} unit="days" />
      </Section>

      <Section title="Health">
        <MetricCard label="Resting HR"  value={s.resting_hr ?? '—'} unit="bpm" />
        <MetricCard label="HRV (RMSSD)" value={fmt(s.hrv, 0)}       unit="ms" />
        {s.hrv_sdnn !== null && <MetricCard label="HRV (SDNN)" value={fmt(s.hrv_sdnn, 0)} unit="ms" />}
        <MetricCard label="Sleep"       value={fmtSleep(s.sleep_secs)} status={sleepStatus(s.sleep_quality)}
                    sub={s.sleep_score ? `${Math.round(s.sleep_score)}/100` : undefined} />
        <MetricCard label="VO2max"      value={s.vo2max ?? '—'} />
        <MetricCard label="Steps"       value={s.steps?.toLocaleString() ?? '—'} />
        {s.spo2 !== null && <MetricCard label="SpO2" value={s.spo2} unit="%" />}
      </Section>

      {(s.stress !== null || s.readiness !== null || s.weight !== null || s.body_fat !== null) && (
        <Section title="Wellness (Garmin/Intervals)">
          {s.stress !== null && <MetricCard label="Stress" value={s.stress} unit="/100" status={stressStatus(s.stress)} />}
          {s.readiness !== null && <MetricCard label="Readiness" value={s.readiness} unit="/100" status={readinessStatus(s.readiness)} />}
          {s.weight !== null && <MetricCard label="Weight" value={fmt(s.weight)} unit="kg" />}
          {s.body_fat !== null && <MetricCard label="Body Fat" value={fmt(s.body_fat)} unit="%" />}
        </Section>
      )}

      {(s.mood !== null || s.motivation !== null || s.fatigue !== null || s.soreness !== null) && (
        <Section title="Subjective Wellness">
          {s.mood !== null && <MetricCard label="Mood" value={s.mood} unit="/5" status={subjectiveStatus(s.mood)} />}
          {s.motivation !== null && <MetricCard label="Motivation" value={s.motivation} unit="/5" status={subjectiveStatus(s.motivation)} />}
          {s.fatigue !== null && <MetricCard label="Fatigue" value={s.fatigue} unit="/5" status={subjectiveStatus(s.fatigue) === 'good' ? 'bad' : subjectiveStatus(s.fatigue) === 'bad' ? 'good' : 'ok'} />}
          {s.soreness !== null && <MetricCard label="Soreness" value={s.soreness} unit="/5" status={subjectiveStatus(s.soreness) === 'good' ? 'bad' : subjectiveStatus(s.soreness) === 'bad' ? 'good' : 'ok'} />}
        </Section>
      )}

      <Section title="Latest Activity">
        {s.elevation_gain_m !== null && <MetricCard label="Elevation Gain" value={fmt(s.elevation_gain_m)} unit="m" />}
        {s.avg_cadence !== null && <MetricCard label="Avg Cadence" value={Math.round(s.avg_cadence * 2)} unit="spm" />}
        {s.max_hr !== null && <MetricCard label="Max HR" value={s.max_hr} unit="bpm" />}
        {s.icu_rpe !== null && <MetricCard label="RPE" value={s.icu_rpe} unit="/10" />}
        {s.feel !== null && <MetricCard label="Feel" value={s.feel} unit="/5" status={subjectiveStatus(s.feel)} />}
        {hrZoneTotal > 0 && (
          <>
            <MetricCard label="HR Z1" value={fmtZoneMins(s.hr_zone_z1_secs)} />
            <MetricCard label="HR Z2" value={fmtZoneMins(s.hr_zone_z2_secs)} />
            <MetricCard label="HR Z3" value={fmtZoneMins(s.hr_zone_z3_secs)} />
            <MetricCard label="HR Z4" value={fmtZoneMins(s.hr_zone_z4_secs)} />
            <MetricCard label="HR Z5" value={fmtZoneMins(s.hr_zone_z5_secs)} />
          </>
        )}
      </Section>

      <Section title="Running Volume">
        <MetricCard label="Total Distance" value={fmt(s.total_distance_km, 0)} unit="km" />
        <MetricCard label="Run Count"      value={s.run_count ?? '—'} />
        <MetricCard label="Longest Run"    value={fmt(s.longest_run_km)} unit="km" />
        <MetricCard label="Avg Pace"       value={s.avg_pace ?? '—'} unit="min/km" />
        <MetricCard label="This Week"      value={fmt(s.week_0_km)} unit="km" />
        <MetricCard label="Week 1"         value={fmt(s.week_1_km)} unit="km" />
        <MetricCard label="Week 2"         value={fmt(s.week_2_km)} unit="km" />
        <MetricCard label="Week 3"         value={fmt(s.week_3_km)} unit="km" />
        <MetricCard label="Week 4"         value={fmt(s.week_4_km)} unit="km" />
        <MetricCard label="Last Month"     value={fmt(s.last_month_km)} unit="km" />
      </Section>

      {(s.longest_streak !== null || s.avg_days_run_per_week !== null || s.most_often_run_day !== null) && (
        <Section title="Running Patterns">
          {s.longest_streak !== null && <MetricCard label="Longest Streak" value={s.longest_streak} unit="days" />}
          {s.longest_break_days !== null && <MetricCard label="Longest Break" value={s.longest_break_days} unit="days" />}
          {s.avg_days_run_per_week !== null && <MetricCard label="Avg Days/Week" value={fmt(s.avg_days_run_per_week, 1)} />}
          {s.days_run_am !== null && <MetricCard label="AM Runs" value={s.days_run_am} />}
          {s.days_run_pm !== null && <MetricCard label="PM Runs" value={s.days_run_pm} />}
          {s.most_often_run_day !== null && <MetricCard label="Fav Day" value={s.most_often_run_day} />}
        </Section>
      )}

      {(s.weather_temp !== null || s.weather_humidity !== null) && (
        <Section title="Weather (Latest Run)">
          {s.weather_temp !== null && (
            <MetricCard label="Temperature" value={s.weather_temp} unit="°C" 
                        sub={s.weather_temp_feels_like !== null ? `Feels like ${s.weather_temp_feels_like}°C` : undefined} />
          )}
          {s.weather_humidity !== null && <MetricCard label="Humidity" value={s.weather_humidity} unit="%" />}
          {s.weather_wind_speed !== null && <MetricCard label="Wind" value={fmt(s.weather_wind_speed)} unit="km/h" />}
          {s.weather_type !== null && <MetricCard label="Conditions" value={s.weather_type} />}
        </Section>
      )}
      
      {s.comments && (
        <div className="mb-8 px-4">
          <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-widest mb-2">Notes</h2>
          <p className="text-sm text-gray-300 bg-gray-800/50 rounded-lg p-3">{s.comments}</p>
        </div>
      )}
    </div>
  )
}
