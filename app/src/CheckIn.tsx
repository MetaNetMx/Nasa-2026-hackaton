import { useState } from 'react'
import type { RegionId, Status } from './data'
import { STATUS_ICON } from './content'

/**
 * Daily self check-in for the indicators the challenge names. Absolute limits are standard adult
 * clinical cut-offs (AHA 2017 blood pressure, ADA glucose, AASM sleep); after 3 entries each value
 * is also compared with the person's own history, and the worse of the two rules wins.
 */
export type Entry = { ts: number; hr?: number; sys?: number; dia?: number; glucose?: number; temp?: number; sleep?: number; mood?: number }
type Field = keyof Omit<Entry, 'ts'>

type Ind = {
  key: Field
  label: string
  unit: string
  region: RegionId
  step: number
  min: number
  max: number
  rule: (v: number, e: Entry) => Status
  source: string
}

export const INDICATORS: Ind[] = [
  { key: 'hr', label: 'Resting heart rate', unit: 'bpm', region: 'blood', step: 1, min: 30, max: 200,
    rule: (v) => (v < 40 || v > 120 ? 'red' : v < 50 || v > 100 ? 'yellow' : 'green'), source: 'Resting adult range 60–100 bpm (AHA)' },
  { key: 'sys', label: 'Blood pressure, systolic', unit: 'mmHg', region: 'blood', step: 1, min: 60, max: 250,
    rule: (v) => (v >= 140 || v < 90 ? 'red' : v >= 130 ? 'yellow' : 'green'), source: 'AHA 2017 categories; <90 = low' },
  { key: 'dia', label: 'Blood pressure, diastolic', unit: 'mmHg', region: 'blood', step: 1, min: 30, max: 150,
    rule: (v) => (v >= 90 ? 'red' : v >= 80 ? 'yellow' : 'green'), source: 'AHA 2017 categories' },
  { key: 'glucose', label: 'Fasting glucose', unit: 'mg/dL', region: 'metabolic', step: 1, min: 20, max: 500,
    rule: (v) => (v < 54 || v >= 126 ? 'red' : v < 70 || v >= 100 ? 'yellow' : 'green'), source: 'ADA: 70–99 normal, <54 level-2 low, ≥126 high' },
  { key: 'temp', label: 'Body temperature', unit: '°C', region: 'immune', step: 0.1, min: 34, max: 42,
    rule: (v) => (v >= 39 ? 'red' : v >= 38 ? 'yellow' : 'green'), source: 'Fever ≥38 °C. Note: resting core temperature runs ~1 °C higher in long flights (Stahn et al. 2017)' },
  { key: 'sleep', label: 'Sleep last night', unit: 'h', region: 'brain', step: 0.5, min: 0, max: 14,
    rule: (v) => (v < 5 ? 'red' : v < 7 ? 'yellow' : 'green'), source: 'AASM/SRS: adults need ≥7 h' },
  { key: 'mood', label: 'Mood (1 low – 5 great)', unit: '', region: 'brain', step: 1, min: 1, max: 5,
    rule: (v) => (v <= 1 ? 'red' : v <= 2 ? 'yellow' : 'green'), source: 'Self-rating; low mood is shared only with a private ground conference' },
]

const KEY = 'deltame.checkins'
export function loadEntries(): Entry[] {
  try { return JSON.parse(localStorage.getItem(KEY) || '[]') } catch { return [] }
}
function save(e: Entry[]) {
  try { localStorage.setItem(KEY, JSON.stringify(e.slice(-200))) } catch { /* storage unavailable */ }
}

/** Status per indicator for the latest entry, combining the absolute rule and the personal baseline. */
export function assess(entries: Entry[]) {
  const last = entries[entries.length - 1]
  const out: { ind: Ind; v: number; s: Status; z: number | null }[] = []
  if (!last) return out
  for (const ind of INDICATORS) {
    const v = last[ind.key]
    if (v == null) continue
    let s = ind.rule(v, last)
    const prev = entries.slice(0, -1).map((e) => e[ind.key]).filter((x): x is number => x != null)
    let z: number | null = null
    if (prev.length >= 3 && ind.key !== 'mood') {
      const m = prev.reduce((a, b) => a + b, 0) / prev.length
      const sd = Math.sqrt(prev.reduce((a, b) => a + (b - m) ** 2, 0) / (prev.length - 1)) || 1e-9
      z = (v - m) / sd
      const bs: Status = Math.abs(z) >= 3 ? 'red' : Math.abs(z) >= 2 ? 'yellow' : 'green'
      const rank = { none: 0, green: 1, yellow: 2, red: 3 }
      if (rank[bs] > rank[s]) s = bs
    }
    out.push({ ind, v, s, z })
  }
  return out
}

export function streak(entries: Entry[]) {
  const days = new Set(entries.map((e) => new Date(e.ts).toDateString()))
  let n = 0
  const d = new Date()
  while (days.has(d.toDateString())) { n++; d.setDate(d.getDate() - 1) }
  return n
}

export function CheckIn({ entries, onChange }: { entries: Entry[]; onChange: (e: Entry[]) => void }) {
  const [form, setForm] = useState<Partial<Record<Field, string>>>({})
  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    const entry: Entry = { ts: Date.now() }
    for (const ind of INDICATORS) {
      const raw = form[ind.key]
      if (raw != null && raw !== '' && !Number.isNaN(Number(raw))) entry[ind.key] = Number(raw)
    }
    if (Object.keys(entry).length === 1) return
    const next = [...entries, entry]
    save(next)
    onChange(next)
    setForm({})
  }
  const result = assess(entries)
  const n = streak(entries)
  return (
    <section className="hud">
      <header>
        <h2>DAILY CHECK-IN</h2>
        <span className="badge">🔥 {n}-day streak</span>
      </header>
      <p className="muted small">Under a minute. Fill what you measured today; leave the rest empty. Saved only on this device.</p>
      <form className="checkin" onSubmit={submit}>
        {INDICATORS.map((ind) => (
          <label key={ind.key}>
            <span>{ind.label}{ind.unit && ` (${ind.unit})`}</span>
            <input
              type="number" inputMode="decimal" step={ind.step} min={ind.min} max={ind.max}
              value={form[ind.key] ?? ''}
              onChange={(e) => setForm({ ...form, [ind.key]: e.target.value })}
            />
          </label>
        ))}
        <button className="btn" type="submit">Save check-in</button>
      </form>
      {result.length > 0 && (
        <table className="labs">
          <thead><tr><th>Latest</th><th>Value</th><th>Rule</th><th>vs. you</th></tr></thead>
          <tbody>
            {result.map(({ ind, v, s, z }) => (
              <tr key={ind.key}>
                <td><span className={`dot s-${s}`}>{STATUS_ICON[s]}</span> {ind.label}</td>
                <td>{v} {ind.unit}</td>
                <td className="small muted">{ind.source}</td>
                <td>{z == null ? '—' : `${z > 0 ? '+' : ''}${z.toFixed(1)} SD`}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </section>
  )
}
