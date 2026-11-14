import { useMemo, useState } from 'react'
import { Area, AreaChart, CartesianGrid, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import type { ReadinessData } from './data'
import { Pulse } from './Pulse'

const EXP = { CA: 'Channelized attention', DA: 'Diverted attention', SS: 'Startle / surprise' } as const

export function ReadinessReplay({ data }: { data: ReadinessData }) {
  const [exp, setExp] = useState<keyof typeof EXP>('SS')
  const rows = useMemo(
    () => data.replay.filter((r) => r.exp === exp).map((r) => ({ ...r, induced: r.y ? 1 : 0 })),
    [data, exp],
  )
  const auc = Object.values(data.looAuc)
  return (
    <div className="replay">
      <p className="muted small">
        Heart rate, breathing rate and skin conductance, each compared with the person’s own resting values. Trained on {data.source.subjects.length} NASA
        subjects; tested on a subject it never saw, it separates induced states from rest with AUC {Math.min(...auc).toFixed(2)}–{Math.max(...auc).toFixed(2)}.
        Shown: subject {data.replaySubject}.
      </p>
      <div className="seg" role="tablist">
        {(Object.keys(EXP) as (keyof typeof EXP)[]).map((k) => (
          <button key={k} role="tab" aria-selected={exp === k} className={exp === k ? 'on' : ''} onClick={() => setExp(k)}>
            {EXP[k]}
          </button>
        ))}
      </div>
      <ResponsiveContainer width="100%" height={170}>
        <AreaChart data={rows} margin={{ top: 6, right: 8, bottom: 0, left: 0 }}>
          <CartesianGrid stroke="var(--grid)" />
          <XAxis dataKey="t" tick={{ fill: 'var(--muted)', fontSize: 11 }} unit=" s" />
          <YAxis domain={[0, 1]} tick={{ fill: 'var(--muted)', fontSize: 11 }} width={34} />
          <Area type="stepAfter" dataKey="induced" stroke="none" fill="var(--warn)" fillOpacity={0.18} name="NASA label: induced state" />
          <Area type="monotone" dataKey="p" stroke="var(--accent)" fill="var(--accent)" fillOpacity={0.15} name="Model: load probability" />
          <ReferenceLine y={0.5} stroke="var(--muted)" strokeDasharray="3 3" />
          <Tooltip
            contentStyle={{ background: 'var(--panel)', border: '1px solid var(--grid)', color: 'var(--text)' }}
            formatter={(v, n) => [typeof v === 'number' ? v.toFixed(2) : v, n]}
            labelFormatter={(t) => `t = ${t} s`}
          />
        </AreaChart>
      </ResponsiveContainer>
      <p className="muted small">
        Shaded = the state NASA induced (ground truth). Line = model estimate. Effect in induced states:
        HR {fmtE(data.effects.hr)}, breathing {fmtE(data.effects.resp)}, skin conductance {fmtE(data.effects.gsr)} SD. Source:{' '}
        <a href={data.source.url} target="_blank" rel="noreferrer">{data.source.dataset} ↗</a>. {data.source.note}
      </p>
    </div>
  )
}
const fmtE = (v: number) => `${v > 0 ? '+' : ''}${v.toFixed(2)}`

const KEY = 'deltame.restingHr'
export function loadResting(): number[] {
  try { return JSON.parse(localStorage.getItem(KEY) || '[]') } catch { return [] }
}
function saveResting(v: number[]) {
  try { localStorage.setItem(KEY, JSON.stringify(v.slice(-20))) } catch { /* storage unavailable */ }
}

export type PulseState = { bpm: number; z: number | null; n: number } | null

export function YourPulse({ onChange }: { onChange: (p: PulseState) => void }) {
  const [hist, setHist] = useState<number[]>(loadResting)
  const [last, setLast] = useState<PulseState>(null)
  const record = (bpm: number, asBaseline: boolean) => {
    const base = hist
    const mean = base.length ? base.reduce((a, b) => a + b, 0) / base.length : 0
    const sd = base.length >= 3 ? Math.max(5, Math.sqrt(base.reduce((a, b) => a + (b - mean) ** 2, 0) / (base.length - 1))) : 0
    const z = base.length >= 3 ? (bpm - mean) / sd : null
    const s = { bpm, z, n: base.length }
    setLast(s)
    onChange(s)
    if (asBaseline) {
      const next = [...hist, bpm]
      setHist(next)
      saveResting(next)
    }
  }
  return (
    <div className="you-pulse">
      <Pulse onResult={(r) => r.quality >= 4 && record(r.bpm, hist.length < 3)} />
      <p className="small">
        {hist.length < 3
          ? `Building your resting baseline: ${hist.length}/3 calm measurements saved.`
          : `Resting baseline from ${hist.length} measurements: ${Math.round(hist.reduce((a, b) => a + b, 0) / hist.length)} bpm.`}
        {last?.z != null && ` This reading is ${last.z > 0 ? '+' : ''}${last.z.toFixed(1)} SD from it.`}
      </p>
      {hist.length > 0 && (
        <button className="btn ghost small" onClick={() => { setHist([]); saveResting([]); setLast(null); onChange(null) }}>
          Reset my baseline
        </button>
      )}
    </div>
  )
}
