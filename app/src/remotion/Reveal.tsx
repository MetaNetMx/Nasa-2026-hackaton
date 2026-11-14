import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion'

export type RevealRow = { label: string; z: number; inRange: boolean }
export type RevealProps = { rows: RevealRow[]; mode: 'earth' | 'baseline' }

const MAXZ = 5

/**
 * Same blood, two questions. Earth mode: every bar is checked against the lab range (all "normal").
 * Baseline mode: bars grow to their distance from the person's own pre-flight values; past ±3σ they turn red.
 */
export function Reveal({ rows, mode }: RevealProps) {
  const f = useCurrentFrame()
  const { fps, width } = useVideoConfig()
  const left = 96, right = width - 58, mid = (left + right) / 2
  const x = (z: number) => mid + (Math.max(-MAXZ, Math.min(MAXZ, z)) / MAXZ) * ((right - left) / 2)
  const band = spring({ frame: f, fps, config: { damping: 20 } })
  return (
    <AbsoluteFill style={{ fontFamily: 'JetBrains Mono, monospace', color: '#cfe0f5', fontSize: 11 }}>
      {/* ±3σ band */}
      <div style={{ position: 'absolute', top: 6, bottom: 22, left: x(-3 * band), width: x(3 * band) - x(-3 * band),
        background: mode === 'baseline' ? 'rgba(94,234,212,0.10)' : 'rgba(52,211,153,0.07)', borderLeft: '1px dashed rgba(94,234,212,.5)', borderRight: '1px dashed rgba(94,234,212,.5)' }} />
      <div style={{ position: 'absolute', top: 6, bottom: 22, left: mid, width: 1, background: 'rgba(207,224,245,.25)' }} />
      {rows.map((r, k) => {
        const s = spring({ frame: f - 6 - k * 4, fps, config: { damping: 15, stiffness: 120 } })
        const y = 10 + k * 22
        const out = Math.abs(r.z) >= 3
        const color = mode === 'earth' ? (r.inRange ? '#34d399' : '#fbbf24') : out ? '#f87171' : Math.abs(r.z) >= 2 ? '#fbbf24' : '#5eead4'
        const z = mode === 'earth' ? 0 : r.z * s
        const x0 = Math.min(x(0), x(z)), w = Math.abs(x(z) - x(0))
        return (
          <div key={r.label} style={{ position: 'absolute', top: y, left: 0, right: 0, height: 18 }}>
            <div style={{ position: 'absolute', left: 0, width: left - 8, textAlign: 'right', top: 2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', opacity: 0.85 }}>{r.label}</div>
            {mode === 'earth' ? (
              <div style={{ position: 'absolute', left: mid - 6, top: 1, color, opacity: s, fontSize: 12 }}>{r.inRange ? '✓' : '!'}</div>
            ) : (
              <>
                <div style={{ position: 'absolute', left: x0, width: w, top: 5, height: 8, background: color, boxShadow: out ? `0 0 12px ${color}` : 'none', borderRadius: 2 }} />
                <div style={{ position: 'absolute', right: 0, top: 2, width: 50, textAlign: 'right', color, opacity: s, fontWeight: out ? 700 : 400 }}>
                  {r.z > 0 ? '+' : '−'}{Math.abs(r.z * s).toFixed(1)}σ
                </div>
              </>
            )}
          </div>
        )
      })}
      <div style={{ position: 'absolute', bottom: 2, left: left, right: 58, display: 'flex', justifyContent: 'space-between', opacity: 0.55, fontSize: 10 }}>
        <span>−5σ</span><span>{mode === 'earth' ? 'lab range check' : '±3σ = your normal'}</span><span>+5σ</span>
      </div>
      {mode === 'baseline' && (
        <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none',
          background: `linear-gradient(90deg, transparent ${interpolate(f, [0, 30], [0, 100], { extrapolateRight: 'clamp' })}%, rgba(94,234,212,.12) ${interpolate(f, [0, 30], [0, 100], { extrapolateRight: 'clamp' }) + 2}%, transparent ${interpolate(f, [0, 30], [0, 100], { extrapolateRight: 'clamp' }) + 6}%)` }} />
      )}
    </AbsoluteFill>
  )
}
