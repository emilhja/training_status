import { describe, it, expect } from 'vitest'
import {
  ctlStatus, atlStatus, tsbStatus, tsbZone, acStatus,
  sleepStatus, subjectiveStatus, stressStatus, readinessStatus,
  fmtSleep, fmt, fmtCadence,
} from '../utils/metrics'

// --- ctlStatus ---
describe('ctlStatus', () => {
  it('returns neutral for null', () => expect(ctlStatus(null)).toBe('neutral'))
  it('returns good when ramp > 2', () => expect(ctlStatus(3)).toBe('good'))
  it('returns good at 2.1', () => expect(ctlStatus(2.1)).toBe('good'))
  it('returns ok at boundary 2', () => expect(ctlStatus(2)).toBe('ok'))
  it('returns ok at 0', () => expect(ctlStatus(0)).toBe('ok'))
  it('returns bad when ramp < 0', () => expect(ctlStatus(-1)).toBe('bad'))
  it('returns bad at -0.1', () => expect(ctlStatus(-0.1)).toBe('bad'))
})

// --- atlStatus ---
describe('atlStatus', () => {
  it('returns neutral when atl is null', () => expect(atlStatus(null, 50)).toBe('neutral'))
  it('returns neutral when ctl is null', () => expect(atlStatus(50, null)).toBe('neutral'))
  it('returns neutral when both null', () => expect(atlStatus(null, null)).toBe('neutral'))
  it('returns good when ratio < 1.0', () => expect(atlStatus(40, 50)).toBe('good'))
  it('returns ok when ratio === 1.0', () => expect(atlStatus(50, 50)).toBe('ok'))
  it('returns ok when ratio === 1.3', () => expect(atlStatus(65, 50)).toBe('ok'))
  it('returns bad when ratio > 1.3', () => expect(atlStatus(70, 50)).toBe('bad'))
  it('returns bad at ratio 2.0', () => expect(atlStatus(100, 50)).toBe('bad'))
})

// --- tsbStatus ---
describe('tsbStatus', () => {
  it('returns neutral for null', () => expect(tsbStatus(null)).toBe('neutral'))
  it('returns good when tsb > 5', () => expect(tsbStatus(6)).toBe('good'))
  it('returns good at 25', () => expect(tsbStatus(25)).toBe('good'))
  it('returns ok at boundary 5', () => expect(tsbStatus(5)).toBe('ok'))
  it('returns ok at 0', () => expect(tsbStatus(0)).toBe('ok'))
  it('returns bad at -10 (boundary is exclusive: > -10)', () => expect(tsbStatus(-10)).toBe('bad'))
  it('returns bad when tsb < -10', () => expect(tsbStatus(-11)).toBe('bad'))
  it('returns bad at -30', () => expect(tsbStatus(-30)).toBe('bad'))
})

// --- tsbZone ---
describe('tsbZone', () => {
  it('returns empty string for null', () => expect(tsbZone(null)).toBe(''))
  it('returns Transition above 25', () => expect(tsbZone(26)).toBe('Transition'))
  it('returns Transition at 100', () => expect(tsbZone(100)).toBe('Transition'))
  it('returns Fresh at 6 to 25', () => expect(tsbZone(6)).toBe('Fresh'))
  it('returns Fresh at 25', () => expect(tsbZone(25)).toBe('Fresh'))
  it('returns Grey Zone at 0', () => expect(tsbZone(0)).toBe('Grey Zone'))
  it('returns Grey Zone at 5', () => expect(tsbZone(5)).toBe('Grey Zone'))
  it('returns Grey Zone at -9', () => expect(tsbZone(-9)).toBe('Grey Zone'))
  it('returns Overreaching at -10 (boundary is exclusive: > -10)', () => expect(tsbZone(-10)).toBe('Overreaching'))
  it('returns Overreaching at -11', () => expect(tsbZone(-11)).toBe('Overreaching'))
  it('returns Overreaching at -29', () => expect(tsbZone(-29)).toBe('Overreaching'))
  it('returns Very Overreached at -30', () => expect(tsbZone(-30)).toBe('Very Overreached'))
  it('returns Very Overreached at -50', () => expect(tsbZone(-50)).toBe('Very Overreached'))
})

// --- acStatus ---
describe('acStatus', () => {
  it('returns neutral for null', () => expect(acStatus(null)).toBe('neutral'))
  it('returns bad when ac < 0.8', () => expect(acStatus(0.7)).toBe('bad'))
  it('returns bad when ac > 1.5', () => expect(acStatus(1.6)).toBe('bad'))
  it('returns good at 0.8', () => expect(acStatus(0.8)).toBe('good'))
  it('returns good at 1.0', () => expect(acStatus(1.0)).toBe('good'))
  it('returns good at 1.3', () => expect(acStatus(1.3)).toBe('good'))
  it('returns ok at 1.4', () => expect(acStatus(1.4)).toBe('ok'))
  it('returns ok at 1.5', () => expect(acStatus(1.5)).toBe('ok'))
})

// --- sleepStatus ---
describe('sleepStatus', () => {
  it('returns neutral for null', () => expect(sleepStatus(null)).toBe('neutral'))
  it('returns good for quality 1', () => expect(sleepStatus(1)).toBe('good'))
  it('returns ok for quality 2', () => expect(sleepStatus(2)).toBe('ok'))
  it('returns bad for quality 3', () => expect(sleepStatus(3)).toBe('bad'))
  it('returns neutral for unknown value 4', () => expect(sleepStatus(4)).toBe('neutral'))
  it('returns neutral for 0', () => expect(sleepStatus(0)).toBe('neutral'))
})

// --- subjectiveStatus ---
describe('subjectiveStatus', () => {
  it('returns neutral for null', () => expect(subjectiveStatus(null)).toBe('neutral'))
  it('returns good at 4', () => expect(subjectiveStatus(4)).toBe('good'))
  it('returns good at 5', () => expect(subjectiveStatus(5)).toBe('good'))
  it('returns ok at 3', () => expect(subjectiveStatus(3)).toBe('ok'))
  it('returns bad at 2', () => expect(subjectiveStatus(2)).toBe('bad'))
  it('returns bad at 1', () => expect(subjectiveStatus(1)).toBe('bad'))
})

// --- stressStatus ---
describe('stressStatus', () => {
  it('returns neutral for null', () => expect(stressStatus(null)).toBe('neutral'))
  it('returns good at 0', () => expect(stressStatus(0)).toBe('good'))
  it('returns good at 25 (boundary)', () => expect(stressStatus(25)).toBe('good'))
  it('returns ok at 26', () => expect(stressStatus(26)).toBe('ok'))
  it('returns ok at 50 (boundary)', () => expect(stressStatus(50)).toBe('ok'))
  it('returns bad at 51', () => expect(stressStatus(51)).toBe('bad'))
  it('returns bad at 100', () => expect(stressStatus(100)).toBe('bad'))
})

// --- readinessStatus ---
describe('readinessStatus', () => {
  it('returns neutral for null', () => expect(readinessStatus(null)).toBe('neutral'))
  it('returns good at 80 (boundary)', () => expect(readinessStatus(80)).toBe('good'))
  it('returns good at 100', () => expect(readinessStatus(100)).toBe('good'))
  it('returns ok at 79', () => expect(readinessStatus(79)).toBe('ok'))
  it('returns ok at 60 (boundary)', () => expect(readinessStatus(60)).toBe('ok'))
  it('returns bad at 59', () => expect(readinessStatus(59)).toBe('bad'))
  it('returns bad at 0', () => expect(readinessStatus(0)).toBe('bad'))
})

// --- fmtSleep ---
describe('fmtSleep', () => {
  it('returns — for null', () => expect(fmtSleep(null)).toBe('—'))
  it('returns — for 0', () => expect(fmtSleep(0)).toBe('—'))
  it('formats 8h', () => expect(fmtSleep(28800)).toBe('8h00m'))
  it('formats 7h30m', () => expect(fmtSleep(27000)).toBe('7h30m'))
  it('pads single-digit minutes', () => expect(fmtSleep(3660)).toBe('1h01m'))
  it('formats 6h45m', () => expect(fmtSleep(24300)).toBe('6h45m'))
})

// --- fmt ---
describe('fmt', () => {
  it('returns — for null', () => expect(fmt(null)).toBe('—'))
  it('formats with 1 decimal by default', () => expect(fmt(42.567)).toBe('42.6'))
  it('formats with 0 decimals', () => expect(fmt(42.567, 0)).toBe('43'))
  it('formats with 2 decimals', () => expect(fmt(1.1, 2)).toBe('1.10'))
  it('handles negative numbers', () => expect(fmt(-5.3, 1)).toBe('-5.3'))
  it('handles zero', () => expect(fmt(0)).toBe('0.0'))
})

// --- fmtCadence ---
describe('fmtCadence', () => {
  it('doubles and rounds half-cadence', () => expect(fmtCadence(90)).toBe(180))
  it('rounds fractional result', () => expect(fmtCadence(89.6)).toBe(179))
  it('handles zero', () => expect(fmtCadence(0)).toBe(0))
})
