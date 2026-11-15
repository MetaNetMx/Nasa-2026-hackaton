import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion'

const LINES = [
  'NASA OSDR · INSPIRATION4 CREW BLOOD PANELS',
  'NASA CDAWEB · ISS TEPC RADIATION, SEPT 2017',
  'DATA.NASA.GOV · FLIGHT CREW PHYSIOLOGICAL STATES',
  'NASA 3D RESOURCES · SPACECRAFT MODELS',
]
const clamp = { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' } as const

/** 4.5 s retro mission-poster opening: accent bars sweep in, the title stamps, data sources type out. */
export function Intro({ accent = '#FF7A1A' }: { accent?: string }) {
  const f = useCurrentFrame()
  const { fps, durationInFrames, width, height } = useVideoConfig()
  const out = interpolate(f, [durationInFrames - 20, durationInFrames], [1, 0], clamp)
  const stamp = spring({ frame: f - 10, fps, config: { damping: 12, mass: 0.6 } })
  const bars = [
    { y: 0.36, w: 0.46, x: 0.3, d: 0 },
    { y: 0.47, w: 0.3, x: 0.12, d: 4 },
    { y: 0.58, w: 0.52, x: 0.4, d: 8 },
  ]
  return (
    <AbsoluteFill style={{ background: `rgba(20,20,20,${out})`, opacity: out, fontFamily: 'Archivo, sans-serif', color: '#EDEDED', overflow: 'hidden' }}>
      {bars.map((b, k) => {
        const p = spring({ frame: f - b.d, fps, config: { damping: 18 } })
        return <div key={k} style={{ position: 'absolute', top: height * b.y, left: width * b.x, width: width * b.w * p, height: height * 0.075, background: accent, opacity: 0.88, mixBlendMode: 'screen' }} />
      })}
      <div style={{ position: 'absolute', top: height * 0.2, left: width * 0.1, fontFamily: 'Space Mono, monospace', fontSize: 15, letterSpacing: 6, opacity: interpolate(f, [6, 20], [0, 1], clamp) }}>
        OPERATOR · CREW MEDICAL<br /><span style={{ color: accent }}>MISSION TYPE — AUTONOMOUS HEALTH</span>
      </div>
      <div style={{ position: 'absolute', top: height * 0.3, left: width * 0.1, fontSize: 168, fontWeight: 900, fontStretch: '125%', letterSpacing: -2, lineHeight: 0.9,
        transform: `scale(${1.25 - 0.25 * stamp})`, transformOrigin: 'left center', opacity: stamp }}>
        DELTA<span style={{ color: accent }}>-</span>ME
      </div>
      <div style={{ position: 'absolute', top: height * 0.56, left: width * 0.1, fontSize: 30, fontWeight: 800, fontStretch: '125%', letterSpacing: 2, opacity: interpolate(f, [30, 44], [0, 1], clamp) }}>
        YOUR OWN BASELINE, 20 MINUTES FROM HELP
      </div>
      <div style={{ position: 'absolute', top: height * 0.68, left: width * 0.1, display: 'flex', flexDirection: 'column', gap: 6, fontFamily: 'Space Mono, monospace', fontSize: 14, letterSpacing: 2 }}>
        {LINES.map((l, k) => {
          const start = 48 + k * 12
          const n = Math.max(0, Math.min(l.length, Math.floor((f - start) * 3)))
          return <div key={k} style={{ opacity: f >= start ? 1 : 0, color: n === l.length ? '#EDEDED' : accent }}>[{n === l.length ? '✓' : '…'}] {l.slice(0, n)}</div>
        })}
      </div>
      <div style={{ position: 'absolute', right: width * 0.08, bottom: height * 0.1, fontFamily: 'Space Mono, monospace', fontSize: 13, letterSpacing: 4, textAlign: 'right', color: '#8A8A8A' }}>
        NASA SPACE APPS 2026<br />HEALTH MONITORING FOR ASTRONAUTS
      </div>
    </AbsoluteFill>
  )
}
