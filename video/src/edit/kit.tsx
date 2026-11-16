import type { ComponentType, ReactNode } from 'react'
import { AbsoluteFill, Audio, Freeze, Img, interpolate, OffthreadVideo, Sequence, spring, staticFile, useCurrentFrame, useVideoConfig } from 'remotion'
import { C, MONO, SANS, clamp, ease } from '../style'

export const FPS = 30

/** One A-roll cut: a slice of a graded camera take (source seconds) placed on the edit timeline (frames). */
export type Cut = { take: number; from: number; to: number; rate: number; start: number; len: number; zoom?: number; lead?: number; beat?: number; soft?: boolean }
export type Word = { w: string; a: number; b: number; key?: boolean }
export type Edl = { name: string; fps: number; total: number; cuts: Cut[]; words: Word[] }

/** Frame where the n-th occurrence of a script word starts (case/punctuation-insensitive). */
export const at = (e: Edl, w: string, n = 1) => {
  const k = w.toLowerCase().replace(/[^a-z0-9-]/g, '')
  const hits = e.words.filter((x) => x.w.toLowerCase().replace(/[^a-z0-9-]/g, '') === k)
  const h = hits[n - 1]
  if (!h) throw new Error(`word "${w}" #${n} not in ${e.name}`)
  return h.a
}
export const endOf = (e: Edl, w: string, n = 1) => {
  const k = w.toLowerCase().replace(/[^a-z0-9-]/g, '')
  return e.words.filter((x) => x.w.toLowerCase().replace(/[^a-z0-9-]/g, '') === k)[n - 1].b
}

/**
 * Camera track. Each cut is a slice of a graded take. Cuts that jump within the source punch in or out
 * (jump-cut style) with a slow push. `sideAt` (0..1) slides the speaker into the left third so a chart
 * card can fly in on the right.
 */
export function ARoll({ cuts, sideAt, zooms }: { cuts: Cut[]; sideAt: (f: number) => number; zooms?: number[] }) {
  const f = useCurrentFrame()
  const { durationInFrames } = useVideoConfig()
  const s = sideAt(f)
  const last = cuts[cuts.length - 1]
  const hold = durationInFrames - (last.start + last.len)
  // speaker-left offset: Ernesto's (take 5) close-up needs less travel than Diego's medium shot; it only changes on a cut
  const cur = [...cuts].reverse().find((c) => f >= c.start) ?? cuts[0]
  const ern = cur.take === 5
  const shift = ern ? 380 : 540
  const shrink = ern ? 1 - 0.14 * s : 1
  return (
    <AbsoluteFill style={{ background: '#050505', overflow: 'hidden' }}>
      <AbsoluteFill style={{ transform: `translateX(${-shift * s}px) scale(${shrink})`, transformOrigin: '52% 34%' }}>
        {cuts.map((c, i) => {
          // J-cut: picture of cut i starts `lead` frames late; the previous cut's picture runs on to cover it
          const lead = c.lead ?? 0
          // the last shot's picture runs on (silent) under the end lockup instead of cutting to black
          // soft cut (pause trimmed inside a line): the previous shot runs 3 frames longer and this one dissolves in over it
          const tail = i === cuts.length - 1 ? hold : cuts[i + 1]?.soft ? SOFT : cuts[i + 1]?.lead ?? 0
          return (
            <Sequence key={i} from={c.start + lead} durationInFrames={c.len - lead + tail} premountFor={45}>
              <Shot c={c} skip={lead} soft={!!c.soft} zoom={1 + ((c.zoom ?? zooms?.[i] ?? 1) - 1) * (1 - s)} />
            </Sequence>
          )
        })}
      </AbsoluteFill>
      {cuts.map((c, i) => (
        <Sequence key={`a${i}`} from={c.start} durationInFrames={c.len} premountFor={45}>
          <Audio src={staticFile(`takes/take${c.take}.mp4`)} startFrom={Math.round(c.from * FPS)} playbackRate={c.rate}
            volume={(t) => interpolate(t, [0, i === 0 ? 3 : 1.5, c.len - 1.5, c.len], [0, 1, 1, 0], clamp)} />
        </Sequence>
      ))}
    </AbsoluteFill>
  )
}

const SOFT = 3

function Shot({ c, zoom, skip, soft }: { c: Cut; zoom: number; skip: number; soft: boolean }) {
  const f = useCurrentFrame()
  const push = interpolate(f, [0, c.len], [0, 0.02], clamp)
  return (
    <AbsoluteFill style={{ transform: `scale(${zoom + push})`, transformOrigin: '52% 34%', opacity: soft ? interpolate(f, [0, SOFT], [0, 1], clamp) : 1 }}>
      <OffthreadVideo src={staticFile(`takes/take${c.take}.mp4`)} startFrom={Math.round((c.from + (skip / FPS) * c.rate) * FPS)} playbackRate={c.rate} muted
        style={{ width: '100%', height: '100%' }} />
    </AbsoluteFill>
  )
}

/* ---------------- overlays ---------------- */

/** How far into a window [a, b] (frames) we are, eased in/out over `k` frames. */
export const win = (f: number, a: number, b: number, k = 12) =>
  Math.min(ease(f, a, a + k), 1 - ease(f, b - k, b))

/**
 * A data clip (1920×1080 composition) flying in on a floating card from the right in 3D,
 * settling at a slight angle, then flying out. `skip` starts the clip later so its build lines up with the words.
 */
export function FlyCard({ Comp, len, skip = 0, label }: { Comp: ComponentType; len: number; skip?: number; label?: string }) {
  const hold = Math.max(0, -skip)
  const f = useCurrentFrame()
  const { fps } = useVideoConfig()
  const inn = spring({ frame: f, fps, config: { damping: 16, mass: 0.9 } })
  const out = spring({ frame: f - (len - 10), fps, config: { damping: 26, stiffness: 220 } })
  const k = inn - out
  const K = 0.54, W = 1920 * K, H = 1080 * K
  return (
    <AbsoluteFill style={{ perspective: 1800 }}>
      <div style={{
        position: 'absolute', right: 60, top: (1080 - H) / 2 - 50, width: W, height: H,
        transform: `translateX(${(1 - k) * 1600}px) translateY(${(1 - inn) * 60}px) rotateY(${-34 * (1 - k) - 7}deg) rotateZ(${(1 - k) * 4}deg)`,
        transformOrigin: 'right center',
        boxShadow: '0 40px 120px rgba(0,0,0,0.75), 0 0 0 1px rgba(255,122,26,0.35)',
        overflow: 'hidden', borderRadius: 6, background: C.bg,
      }}>
        <div style={{ width: 1920, height: 1080, transform: `scale(${K})`, transformOrigin: 'top left' }}>
          {hold > 0 && <Sequence durationInFrames={hold} layout="none"><Freeze frame={0}><Comp /></Freeze></Sequence>}
          <Sequence from={hold > 0 ? hold : -skip} layout="none"><Comp /></Sequence>
        </div>
        {/* sheen sweep on arrival */}
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(105deg, transparent 35%, rgba(255,255,255,0.10) 50%, transparent 65%)',
          transform: `translateX(${interpolate(f, [4, 26], [-120, 120], clamp)}%)` }} />
      </div>
      {label && (
        <div style={{ position: 'absolute', right: 60, top: (1080 - H) / 2 - 92, fontFamily: MONO, fontSize: 24, letterSpacing: 3, color: C.accent, opacity: ease(f, 10, 20) * (1 - out) }}>
          {label}
        </div>
      )}
      <Sequence durationInFrames={30}><Audio src={staticFile('sfx/whoosh.wav')} volume={0.35} /></Sequence>
    </AbsoluteFill>
  )
}

/** Full-screen B-roll takeover of a data clip: a 4-frame push in, 4-frame out (no ghosted dissolve). Camera audio keeps playing. */
export function Takeover({ Comp, len, skip = 0, hardOut = false }: { Comp: ComponentType; len: number; skip?: number; hardOut?: boolean }) {
  const f = useCurrentFrame()
  const a = ease(f, 0, 4), b = hardOut ? 1 : 1 - ease(f, len - 4, len)
  return (
    <AbsoluteFill style={{ opacity: Math.min(a, b), transform: `scale(${1.04 - 0.04 * a})` }}>
      <Sequence from={-skip} layout="none"><Comp /></Sequence>
      <Sequence durationInFrames={30}><Audio src={staticFile('sfx/whoosh.wav')} volume={0.3} /></Sequence>
    </AbsoluteFill>
  )
}

/** Big kinetic stat that slams in beside the speaker. */
export function Pop({ big, small, color = C.accent, x = 1060, y = 330, len }: { big: ReactNode; small?: ReactNode; color?: string; x?: number; y?: number; len: number }) {
  const f = useCurrentFrame()
  const { fps } = useVideoConfig()
  const k = spring({ frame: f, fps, config: { damping: 11, stiffness: 180 } })
  const o = 1 - ease(f, len - 8, len)
  const n = typeof big === 'string' ? big.length : 6
  const size = n <= 6 ? 170 : n <= 8 ? 136 : 112
  return (
    <AbsoluteFill>
      <div style={{ position: 'absolute', left: x, top: y, opacity: Math.min(1, k * 1.4) * o, transform: `scale(${1.18 - 0.18 * k})`, transformOrigin: 'left center' }}>
        <div style={{ fontFamily: SANS, fontWeight: 900, fontStretch: '125%', fontSize: size, lineHeight: 0.9, color, whiteSpace: 'nowrap', textShadow: '0 10px 50px rgba(0,0,0,0.6)' }}>{big}</div>
        {small && <div style={{ fontFamily: MONO, fontSize: 28, letterSpacing: 2, color: C.text, marginTop: 16, maxWidth: 800, lineHeight: 1.35, textTransform: 'uppercase', opacity: ease(f, 6, 16) }}>{small}</div>}
        <div style={{ height: 8, background: color, marginTop: 18, width: `${100 * ease(f, 4, 18)}%` }} />
      </div>
      <Sequence durationInFrames={36}><Audio src={staticFile('sfx/hit.wav')} volume={(t) => 0.28 * Math.min(1, t / 0.5)} /></Sequence>
    </AbsoluteFill>
  )
}

/** Retro-NASA lower third: accent block + name + role, slides in from the left. */
export function LowerThird({ name, role, len }: { name: string; role: string; len: number }) {
  const f = useCurrentFrame()
  const { fps } = useVideoConfig()
  const k = spring({ frame: f, fps, config: { damping: 18 } }) - ease(f, len - 10, len)
  return (
    <AbsoluteFill>
      <div style={{ position: 'absolute', left: 96, bottom: 210, display: 'flex', alignItems: 'stretch', transform: `translateX(${(k - 1) * 120}px)`, opacity: k }}>
        <div style={{ width: 12, background: C.accent }} />
        <div style={{ background: 'rgba(10,10,10,0.82)', padding: '14px 24px' }}>
          <div style={{ fontFamily: SANS, fontWeight: 900, fontStretch: '125%', fontSize: 40, color: C.text, letterSpacing: 0.5 }}>{name}</div>
          <div style={{ fontFamily: MONO, fontSize: 24, letterSpacing: 2, color: C.accent, marginTop: 6 }}>{role}</div>
        </div>
      </div>
    </AbsoluteFill>
  )
}

/** Hook title over the camera for the first seconds. */
export function HookTag({ len }: { len: number }) {
  const f = useCurrentFrame()
  const o = Math.min(ease(f, 0, 10), 1 - ease(f, len - 10, len))
  return (
    <AbsoluteFill>
      <div style={{ position: 'absolute', top: 64, left: 96, fontFamily: MONO, fontSize: 28, letterSpacing: 3, color: C.accent, opacity: o }}>
        <span style={{ background: 'rgba(10,10,10,0.8)', padding: '8px 14px' }}>MARS · SOL 214 · EARTH LINK UP TO 20 MIN EACH WAY</span>
      </div>
    </AbsoluteFill>
  )
}

/** The real app on a floating card (screenshot), slow push. */
export function AppCard() {
  const f = useCurrentFrame()
  return (
    <AbsoluteFill style={{ background: C.bg, overflow: 'hidden' }}>
      <Img src={staticFile('app-mars.png')} style={{ width: '100%', height: '100%', objectFit: 'cover', transform: `scale(${1 + f * 0.0007})`, transformOrigin: '62% 40%' }} />
    </AbsoluteFill>
  )
}

/**
 * Phrase captions (up to 4 words), words appearing as spoken; only key numbers in accent.
 * `hide` windows suppress captions where an on-screen graphic already says the same words;
 * `raise` windows lift them above a full-screen chart's footer.
 */
export function Captions({ words, hide = [], raise = [] }: { words: Word[]; hide?: [number, number][]; raise?: [number, number][] }) {
  const f = useCurrentFrame()
  if (hide.some(([a, b]) => f >= a && f < b)) return null
  const groups: Word[][] = []
  let cur: Word[] = []
  words.forEach((w, i) => {
    cur.push(w)
    const next = words[i + 1]
    const punct = /[.!?]$/.test(w.w) || (/,$/.test(w.w) && cur.length >= 2)
    const orphan = next && /[.,!?]$/.test(next.w) && cur.length === 4 // keep 'INSPIRATION4 CREW.' together
    if (!next || punct || (cur.length >= 4 && !orphan) || cur.length >= 5 || next.a - w.b > 10) { groups.push(cur); cur = [] }
  })
  // the latest group that has started wins, so the next phrase never waits for the previous one to clear
  const g = [...groups].reverse().find((g) => f >= g[0].a - 2 && f < g[g.length - 1].b + 8)
  if (!g) return null
  const up = raise.some(([a, b]) => f >= a && f < b)
  return (
    <AbsoluteFill style={{ justifyContent: 'flex-end', alignItems: 'center', paddingBottom: up ? 150 : 84, pointerEvents: 'none' }}>
      <div style={{ display: 'flex', gap: 14, fontFamily: SANS, fontWeight: 800, fontStretch: '110%', fontSize: 52, textTransform: 'uppercase', letterSpacing: 0.5,
        background: 'rgba(8,8,8,0.55)', padding: '8px 22px', borderRadius: 4 }}>
        {g.map((w, i) => {
          const k = ease(f, w.a - 2, w.a + 2)
          return (
            <span key={i} style={{ color: w.key ? C.accent : C.text, opacity: 0.25 + 0.75 * k, display: 'inline-block' }}>{w.w.replace(/[.,!?]$/, '')}</span>
          )
        })}
      </div>
    </AbsoluteFill>
  )
}

/** Thin progress bar in accent across the bottom: makes 30 s feel deliberate. */
export function Progress() {
  const f = useCurrentFrame()
  const { durationInFrames } = useVideoConfig()
  return <div style={{ position: 'absolute', left: 0, bottom: 0, height: 5, width: `${(f / durationInFrames) * 100}%`, background: C.accent, opacity: 0.9 }} />
}

/** Letterbox + vignette + grain finishing layer. */
export function Finish() {
  const f = useCurrentFrame()
  return (
    <AbsoluteFill style={{ pointerEvents: 'none' }}>
      <AbsoluteFill style={{ background: 'radial-gradient(ellipse at 50% 45%, transparent 55%, rgba(0,0,0,0.55) 100%)' }} />
      <AbsoluteFill style={{ opacity: 0.06, mixBlendMode: 'overlay', backgroundImage: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='200' height='200'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' seed='" + (f % 7) + "'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")" }} />
    </AbsoluteFill>
  )
}

export { C, MONO, SANS }
