import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion'

const LINES = [
  'NASA OSDR · Inspiration4 crew blood panels',
  'NASA CDAWeb · ISS TEPC radiation, Sept 2017',
  'data.nasa.gov · Flight crew physiological states',
]

/** 4.5 s opening: logo draws, title assembles, data sources type in, then the scene is revealed. */
export function Intro() {
  const f = useCurrentFrame()
  const { fps, durationInFrames } = useVideoConfig()
  const logo = spring({ frame: f, fps, config: { damping: 14 } })
  const out = interpolate(f, [durationInFrames - 22, durationInFrames], [1, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' })
  const title = 'DELTA-ME'
  return (
    <AbsoluteFill style={{ background: `rgba(2,4,10,${out})`, alignItems: 'center', justifyContent: 'center', fontFamily: 'Space Grotesk, sans-serif', color: '#e8f1ff', opacity: out }}>
      <svg width={120} height={120} viewBox="0 0 100 100" style={{ transform: `scale(${0.6 + 0.4 * logo})`, filter: 'drop-shadow(0 0 18px rgba(94,234,212,.55))' }}>
        <path d="M50 12 L88 82 L12 82 Z" fill="none" stroke="#5eead4" strokeWidth={6} strokeLinejoin="round"
          strokeDasharray={260} strokeDashoffset={260 * (1 - Math.min(1, f / 28))} />
      </svg>
      <div style={{ display: 'flex', gap: 14, marginTop: 26, fontFamily: 'JetBrains Mono, monospace', fontSize: 44, letterSpacing: 6 }}>
        {title.split('').map((ch, k) => {
          const s = spring({ frame: f - 14 - k * 3, fps, config: { damping: 16 } })
          return <span key={k} style={{ opacity: s, transform: `translateY(${(1 - s) * 24}px)`, display: 'inline-block' }}>{ch}</span>
        })}
      </div>
      <div style={{ marginTop: 12, fontSize: 20, color: '#9fb4d0', opacity: interpolate(f, [40, 55], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }) }}>
        Your own baseline, 20 minutes from help.
      </div>
      <div style={{ marginTop: 36, display: 'flex', flexDirection: 'column', gap: 8, fontFamily: 'JetBrains Mono, monospace', fontSize: 15, color: '#5eead4' }}>
        {LINES.map((l, k) => {
          const start = 60 + k * 14
          const n = Math.max(0, Math.min(l.length, Math.floor((f - start) * 2.6)))
          return <div key={k} style={{ opacity: f >= start ? 1 : 0 }}>&gt; {l.slice(0, n)}{n < l.length && f >= start ? '▌' : n === l.length ? '  ✓' : ''}</div>
        })}
      </div>
    </AbsoluteFill>
  )
}
