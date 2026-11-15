import { AbsoluteFill, Img, interpolate, spring, staticFile, useCurrentFrame, useVideoConfig } from 'remotion'
import { C, MONO, SANS, clamp, ease } from './style'

const grain = (f: number) => "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='200' height='200'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' seed='" + (f % 7) + "'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")"

/** 0–3 s: the problem in one line, Apollo-poster bars. */
export function Title() {
  const f = useCurrentFrame()
  const { fps } = useVideoConfig()
  const k = spring({ frame: f - 4, fps, config: { damping: 14 } })
  const bar = (d: number) => spring({ frame: f - d, fps, config: { damping: 18 } })
  return (
    <AbsoluteFill style={{ background: C.bg, color: C.text, fontFamily: SANS, justifyContent: 'center', paddingLeft: 140 }}>
      {[[0.4, 0.52, 0.38, 0], [0.53, 0.1, 0.3, 4], [0.66, 0.46, 0.4, 8]].map(([y, x, w, d], i) => (
        <div key={i} style={{ position: 'absolute', top: `${y * 100}%`, left: `${x * 100}%`, width: `${w * bar(d) * 100}%`, height: 64, background: C.accent, opacity: 0.85, mixBlendMode: 'screen' }} />
      ))}
      <div style={{ fontFamily: MONO, fontSize: 26, letterSpacing: 6, color: C.accent, opacity: ease(f, 0, 10) }}>MARS · SOL 214 · EARTH LINK 20 MIN EACH WAY</div>
      <div style={{ fontSize: 132, fontWeight: 900, fontStretch: '125%', lineHeight: 0.92, marginTop: 24, opacity: k, transform: `scale(${1.15 - 0.15 * k})`, transformOrigin: 'left center' }}>
        ON MARS, YOUR<br />DOCTOR IS <span style={{ color: C.accent }}>40 MIN</span><br />AWAY.
      </div>
      <AbsoluteFill style={{ opacity: 0.08, mixBlendMode: 'overlay', backgroundImage: grain(f) }} />
    </AbsoluteFill>
  )
}

/** The product on screen: slow push-in on the real app (C002 on Mars, own-baseline view). */
export function AppShot() {
  const f = useCurrentFrame()
  const { durationInFrames } = useVideoConfig()
  const s = interpolate(f, [0, durationInFrames], [1.0, 1.12], clamp)
  return (
    <AbsoluteFill style={{ background: C.bg, overflow: 'hidden' }}>
      <Img src={staticFile('app-mars.png')} style={{ width: '100%', height: '100%', objectFit: 'cover', transform: `scale(${s})`, transformOrigin: '62% 40%' }} />
      <div style={{ position: 'absolute', left: '50%', transform: 'translateX(-50%)', whiteSpace: 'nowrap', bottom: 150, fontFamily: SANS, fontWeight: 900, fontStretch: '125%', fontSize: 64, color: C.text, background: 'rgba(14,14,14,0.85)', padding: '14px 26px', opacity: ease(f, 6, 18) }}>
        CONFIRM, THEN <span style={{ color: C.bad }}>ACT</span>.
      </div>
      <div style={{ position: 'absolute', left: '50%', transform: 'translateX(-50%)', whiteSpace: 'nowrap', bottom: 112, fontFamily: MONO, fontSize: 20, letterSpacing: 2, color: C.muted, opacity: ease(f, 10, 22) }}>
        EACH ASTRONAUT AS A DIGITAL AVATAR OF THEIR OWN BASELINE · WHAT TO DO NOW · WHO TO CALL
      </div>
    </AbsoluteFill>
  )
}

/** 27–30 s: name, line, URL. */
export function EndCard() {
  const f = useCurrentFrame()
  return (
    <AbsoluteFill style={{ background: C.bg, color: C.text, fontFamily: SANS, justifyContent: 'center', alignItems: 'center', textAlign: 'center' }}>
      <div style={{ width: 120, height: 120, background: C.accent, color: '#111', display: 'grid', placeItems: 'center', fontSize: 80, fontWeight: 900, opacity: ease(f, 0, 8) }}>Δ</div>
      <div style={{ fontSize: 150, fontWeight: 900, fontStretch: '125%', marginTop: 26, opacity: ease(f, 3, 14) }}>DELTA<span style={{ color: C.accent }}>-</span>ME</div>
      <div style={{ fontSize: 40, fontWeight: 700, fontStretch: '112%', opacity: ease(f, 10, 22) }}>YOUR OWN BASELINE, 20 MINUTES FROM HELP.</div>
      <div style={{ fontFamily: MONO, fontSize: 28, letterSpacing: 3, color: C.accent, marginTop: 30, opacity: ease(f, 18, 30) }}>delta-me-astronaut-health.netlify.app</div>
      <div style={{ fontFamily: MONO, fontSize: 20, letterSpacing: 3, color: C.muted, marginTop: 18, opacity: ease(f, 22, 34) }}>NASA OSDR · NASA CDAWEB · NOAA SWPC · NASA SPACE APPS 2026</div>
      <AbsoluteFill style={{ opacity: 0.08, mixBlendMode: 'overlay', backgroundImage: grain(f) }} />
    </AbsoluteFill>
  )
}
