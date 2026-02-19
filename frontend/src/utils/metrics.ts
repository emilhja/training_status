import type { Status } from '../types'

// --- Status helpers (mirror backend cli.py logic) ---

export function ctlStatus(ramp: number | null): Status {
  if (ramp === null) return 'neutral'
  if (ramp > 2)  return 'good'
  if (ramp >= 0) return 'ok'
  return 'bad'
}

export function atlStatus(atl: number | null, ctl: number | null): Status {
  if (!atl || !ctl) return 'neutral'
  const r = atl / ctl
  if (r < 1.0)  return 'good'
  if (r <= 1.3) return 'ok'
  return 'bad'
}

export function tsbStatus(tsb: number | null): Status {
  if (tsb === null) return 'neutral'
  if (tsb > 5)   return 'good'
  if (tsb > -10) return 'ok'
  return 'bad'
}

export function tsbZone(tsb: number | null): string {
  if (tsb === null) return ''
  if (tsb > 25)  return 'Transition'
  if (tsb > 5)   return 'Fresh'
  if (tsb > -10) return 'Grey Zone'
  if (tsb > -30) return 'Overreaching'
  return 'Very Overreached'
}

export function acStatus(ac: number | null): Status {
  if (ac === null) return 'neutral'
  if (ac < 0.8 || ac > 1.5) return 'bad'
  if (ac <= 1.3) return 'good'
  return 'ok'
}

export function sleepStatus(q: number | null): Status {
  if (q === 1) return 'good'
  if (q === 2) return 'ok'
  if (q === 3) return 'bad'
  return 'neutral'
}

export function subjectiveStatus(v: number | null): Status {
  if (v === null) return 'neutral'
  if (v >= 4) return 'good'
  if (v >= 3) return 'ok'
  return 'bad'
}

export function stressStatus(v: number | null): Status {
  if (v === null) return 'neutral'
  if (v <= 25) return 'good'
  if (v <= 50) return 'ok'
  return 'bad'
}

export function readinessStatus(v: number | null): Status {
  if (v === null) return 'neutral'
  if (v >= 80) return 'good'
  if (v >= 60) return 'ok'
  return 'bad'
}

// --- Formatters ---

export function fmtSleep(secs: number | null): string {
  if (!secs) return '—'
  const h = Math.floor(secs / 3600)
  const m = Math.floor((secs % 3600) / 60)
  return `${h}h${String(m).padStart(2, '0')}m`
}

export function fmt(v: number | null, decimals = 1): string {
  if (v === null) return '—'
  return v.toFixed(decimals)
}

/**
 * Convert Garmin's half-cadence (steps per foot per minute) to full cadence
 * (steps per minute). Garmin records avg_cadence as steps per foot, so multiply
 * by 2 to get the standard full-body steps-per-minute value.
 */
export function fmtCadence(halfCadence: number): number {
  return Math.round(halfCadence * 2)
}
