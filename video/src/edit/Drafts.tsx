import { AbsoluteFill, Audio, interpolate, OffthreadVideo, Sequence, spring, staticFile, useCurrentFrame, useVideoConfig } from 'remotion'
import { CrewWide, McvDrop, Storm } from '../clips'
import data from '../data.json'
import { clamp, ease } from '../style'
import A from './edl/draftA.json'
import B from './edl/draftB.json'
import { AppCard, ARoll, at, C, Captions, Finish, FlyCard, HookTag, LowerThird, MONO, Pop, SANS, Takeover, win, type Edl } from './kit'

const NAME = 'DIEGO ROMERO'
const NAME2 = 'ERNESTO RAMIREZ'
const ROLE = 'DELTA-ME · NASA SPACE APPS 2026'
/** Ernesto's take: silent, looking at the lens after his last line (source seconds), used for the team ending. */
const E_TAIL = 55.9

/** Frame inside the Storm clip where the curve first crosses the shelter line (mirrors Storm's easing). */
const STORM_RED = (() => {
  const ser = data.storm.series.filter((s) => s.ratio != null)
  const m0 = ser[0].min, m1 = ser[ser.length - 1].min
  const p = (data.storm.firstRed.min - m0) / (m1 - m0)
  return Math.round(10 + 110 * (1 - Math.cbrt(1 - p)))
})()
const MCV_HIT = 112, CREW_HIT = 108 // frame where CrewWide's red dot settles
/** Day-after-landing MCV values (fL) for the 4 crew and the lab reference range. */
const R1 = Object.values(data.mcv.lines as Record<string, ({ v: number; z: number; lo: number; hi: number } | null)[]>).map((l) => l[3]!)
const R1_LO = Math.floor(Math.min(...R1.map((p) => p.v))), R1_HI = Math.ceil(Math.max(...R1.map((p) => p.v)))

/**
 * Team ending: Diego (left half, still speaking the close, then smiling) and Ernesto (right half, silent),
 * with the Delta-Me lockup across the bottom.
 */
function TeamEnd() {
  const f = useCurrentFrame()
  const { fps } = useVideoConfig()
  const k = spring({ frame: f, fps, config: { damping: 18 } })
  const tag = (name: string, x: number) => (
    <div style={{ position: 'absolute', left: x, top: 70, transform: 'translateX(-50%)', fontFamily: MONO, fontSize: 26, letterSpacing: 3, color: C.text, opacity: ease(f, 6, 16), whiteSpace: 'nowrap' }}>
      <span style={{ background: 'rgba(8,8,8,0.8)', padding: '8px 14px', borderLeft: `6px solid ${C.accent}` }}>{name}</span>
    </div>
  )
  return (
    <AbsoluteFill>
      <div style={{ position: 'absolute', left: 960, top: 0, width: 960, height: 1080, overflow: 'hidden', background: '#050505', clipPath: `inset(0 0 0 ${(1 - k) * 100}%)` }}>
        <OffthreadVideo src={staticFile('takes/take5.mp4')} startFrom={Math.round(E_TAIL * 30)} playbackRate={0.65} muted
          style={{ position: 'absolute', left: 480 - 1920 * 0.78 / 2, top: 40, width: 1920 * 0.78, height: 1080 * 0.78 }} />
      </div>
      <div style={{ position: 'absolute', left: 958, top: 0, width: 4, height: `${k * 100}%`, background: C.accent }} />
      {tag(NAME, 480)}
      {tag(NAME2, 1440)}
      <div style={{ position: 'absolute', left: 0, right: 0, bottom: 0, height: 330, background: 'linear-gradient(rgba(5,5,5,0), rgba(5,5,5,0.94) 22%, rgba(5,5,5,0.97))', opacity: ease(f, 0, 10) }} />
      <div style={{ position: 'absolute', left: 0, right: 0, bottom: 70, display: 'flex', flexDirection: 'column', alignItems: 'center', whiteSpace: 'nowrap', opacity: ease(f, 4, 16), transform: `translateY(${(1 - ease(f, 4, 16)) * 20}px)` }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 22 }}>
          <div style={{ width: 84, height: 84, background: C.accent, color: '#111', display: 'grid', placeItems: 'center', fontSize: 58, fontWeight: 900, fontFamily: SANS }}>Δ</div>
          <div style={{ fontFamily: SANS, fontSize: 96, fontWeight: 900, fontStretch: '125%', lineHeight: 1, color: C.text }}>DELTA<span style={{ color: C.accent }}>-</span>ME</div>
        </div>
        <div style={{ fontFamily: SANS, fontSize: 38, fontWeight: 700, fontStretch: '112%', color: C.text, marginTop: 16 }}>YOUR OWN BASELINE.</div>
        <div style={{ fontFamily: MONO, fontSize: 34, letterSpacing: 1, color: C.text, marginTop: 14 }}>delta-me-astronaut-health.netlify.app</div>
        <div style={{ fontFamily: MONO, fontSize: 22, letterSpacing: 2, color: '#c8c8c8', marginTop: 10 }}>DATA: NASA OSDR · NASA CDAWEB · NOAA SWPC</div>
      </div>
      <Sequence durationInFrames={40}><Audio src={staticFile('sfx/ping.wav')} volume={0.3} /></Sequence>
    </AbsoluteFill>
  )
}

/** Even fade to black over the last frames of the whole video. */
function FadeOut({ total }: { total: number }) {
  const f = useCurrentFrame()
  return <AbsoluteFill style={{ background: '#000', opacity: interpolate(f, [total - 10, total], [0, 0.85], clamp), pointerEvents: 'none' }} />
}

/** Space Apps rule: SI-assisted video must carry a visible watermark. Small, constant, bottom-right. */
function SIMark() {
  return (
    <AbsoluteFill style={{ pointerEvents: 'none' }}>
      <div style={{ position: 'absolute', right: 28, bottom: 22, fontFamily: MONO, fontSize: 17, letterSpacing: 1.5, color: 'rgba(237,237,237,0.72)', background: 'rgba(8,8,8,0.55)', padding: '4px 10px', borderRadius: 3 }}>
        SI-ASSISTED EDIT &amp; GRAPHICS · CLAUDE · REAL FOOTAGE &amp; NASA DATA
      </div>
    </AbsoluteFill>
  )
}

/** Source chip that slides in while the speaker says "this is real NASA data…". */
function SourceChip({ text, len }: { text: string; len: number }) {
  const f = useCurrentFrame()
  const o = win(f, 0, len, 8)
  return (
    <AbsoluteFill>
      <div style={{ position: 'absolute', right: 110, top: 150, fontFamily: MONO, fontSize: 28, letterSpacing: 2, color: C.text, opacity: o, transform: `translateY(${(1 - o) * -16}px)` }}>
        <span style={{ background: 'rgba(10,10,10,0.85)', padding: '10px 16px', borderLeft: `6px solid ${C.accent}` }}>DATA: <span style={{ color: C.accent }}>{text}</span></span>
      </div>
    </AbsoluteFill>
  )
}

/** Shared sound bed: quiet ambient drone under the voice. */
function Bed({ total }: { total: number }) {
  return <Audio src={staticFile('sfx/bed.m4a')} volume={(f) => 0.14 * interpolate(f, [0, 20, total - 30, total], [0, 1, 1, 0], clamp)} />
}

type Win = [number, number]
/** Speaker-left layout: merge windows closer than 24 frames so the speaker doesn't ping-pong between graphics. */
const sideFrom = (wins: Win[]) => {
  const m: Win[] = []
  ;[...wins].sort((x, y) => x[0] - y[0]).forEach(([a, b]) => {
    const l = m[m.length - 1]
    if (l && a - l[1] < 24) l[1] = Math.max(l[1], b)
    else m.push([a, b])
  })
  return (f: number) => Math.max(0, ...m.map(([a, b]) => win(f, a, b, 14)))
}
/** Framing changes only between lines (punch in / out); cuts inside a line keep the same framing. */
const zoomsFor = (e: Edl) => e.cuts.map((c) => { const b = c.beat ?? 0; return c.take === 5 ? 1.0 : b === 0 ? 1.1 : b % 2 ? 1.0 : 1.09 }) // Ernesto's shot is already a close-up
const len = (x: Win) => x[1] - x[0]
/** Edit frame where script line `beat` starts (its first cut). */
const cutAt = (e: Edl, beat: number) => e.cuts.find((c) => c.beat === beat)!.start

/* ================= DRAFT A · data in motion ================= */
export function DraftA() {
  const e = A as Edl
  const T = e.total
  const w = {
    hook: [0, at(e, 'this')] as Win,
    forty: [at(e, '40') - 6, at(e, 'this') - 2] as Win,
    lower: [at(e, 'this'), at(e, 'the', 2) - 4] as Win,
    lower2: [at(e, 'the', 2) + 2, at(e, 'every') - 4] as Win,
    mcv: [at(e, 'day') - 8, at(e, 'measured') + 6] as Win, // exit starts on the cut back to Diego
    // "Measured against each astronaut's own baseline" plays clean on the founder: a breath between cards
    crew: [at(e, 'that') - 6, at(e, 'delta-me') + 6] as Win,
    app: [at(e, 'delta-me') - 3, at(e, 'and') - 2] as Win,
    storm: [at(e, 'and') - 2, at(e, 'not') - 1] as Win,
    not40: [at(e, 'not') - 3, at(e, 'delta-me', 2) - 2] as Win,
    end: [at(e, 'delta-me', 2) - 2, T] as Win, // layout stays put to the last frame (see sideFrom call)
  }
  const side = sideFrom([w.forty, w.mcv, w.crew, w.app, w.storm, w.not40, [w.end[0], T + 60]])
  return (
    <AbsoluteFill style={{ background: '#050505' }}>
      <ARoll cuts={e.cuts} sideAt={side} zooms={zoomsFor(e)} />
      <Sequence from={w.hook[0]} durationInFrames={len(w.hook)}><HookTag len={len(w.hook)} /></Sequence>
      <Sequence from={w.forty[0]} durationInFrames={len(w.forty)}><Pop big="40 MIN" small="round trip · up to 20 min each way" len={len(w.forty)} /></Sequence>
      <Sequence from={w.lower[0]} durationInFrames={len(w.lower)}>
        <LowerThird name={NAME} role={ROLE} len={len(w.lower)} />
        <SourceChip text="NASA OSDR · INSPIRATION4" len={len(w.lower)} />
      </Sequence>
      <Sequence from={w.lower2[0]} durationInFrames={len(w.lower2)}><LowerThird name={NAME2} role={ROLE} len={len(w.lower2)} /></Sequence>
      <Sequence from={w.mcv[0]} durationInFrames={len(w.mcv)}>
        <FlyCard Comp={McvDrop} len={len(w.mcv)} skip={MCV_HIT - (at(e, 'four') - w.mcv[0])} label="RED-CELL SIZE · ALL 4 CREW" />
      </Sequence>
      <Sequence from={w.crew[0]} durationInFrames={len(w.crew)}>
        <FlyCard Comp={CrewWide} len={len(w.crew)} skip={CREW_HIT - (at(e, 'bigger') - w.crew[0])} label="DAY 1 VS. 88 SHIFTS AFTER RECOVERY" />
      </Sequence>
      <Sequence from={w.app[0]} durationInFrames={len(w.app)}>
        <FlyCard Comp={AppCard} len={len(w.app)} label="THE APP · EACH ASTRONAUT VS. THEMSELVES" />
      </Sequence>
      <Sequence from={w.storm[0]} durationInFrames={len(w.storm)}>
        <FlyCard Comp={Storm} len={len(w.storm)} skip={STORM_RED - (at(e, 'shelter') - w.storm[0])} label="ISS RADIATION · SOLAR STORM, SEPT 2017" />
      </Sequence>
      <Sequence from={w.not40[0]} durationInFrames={len(w.not40)}><Pop big="NOT 40." small="alert on board · no Earth round trip" color={C.bad} len={len(w.not40)} /></Sequence>
      <Sequence from={w.end[0]} durationInFrames={len(w.end)}><TeamEnd /></Sequence>
      <Sequence from={w.storm[0] - 50} durationInFrames={60}><Audio src={staticFile('sfx/riser.wav')} volume={0.14} /></Sequence>
      <Captions words={e.words} hide={[w.not40, w.end]} />
      <Finish />
      <SIMark />
      <FadeOut total={T} />
      <Bed total={T} />
    </AbsoluteFill>
  )
}

/* ================= DRAFT B · founder focus ================= */
export function DraftB() {
  const e = B as Edl
  const T = e.total
  const w = {
    hook: [0, at(e, 'this')] as Win,
    forty: [at(e, '40') - 6, at(e, 'this') - 2] as Win,
    lower: [at(e, 'this'), at(e, 'the', 2) - 4] as Win,
    lower2: [at(e, 'the', 2) + 2, at(e, 'every') - 4] as Win,
    four: [at(e, 'fell') - 2, at(e, 'every') - 2] as Win,
    normal: [at(e, 'said') - 4, at(e, 'measured') + 6] as Win,
    crew: [at(e, 'bigger') - 10, cutAt(e, 6)] as Win, // ~2 s, ends exactly on the cut to Ernesto
    app: [at(e, 'delta-me') - 2, at(e, 'and') - 2] as Win,
    storm: [at(e, 'storm') - 4, at(e, 'not') - 3] as Win,
    not40: [at(e, 'not') - 3, at(e, 'delta-me', 2) - 2] as Win,
    end: [at(e, 'delta-me', 2) - 2, T] as Win, // layout stays put to the last frame (see sideFrom call)
  }
  const side = sideFrom([w.forty, w.four, w.normal, w.app, w.storm, w.not40, [w.end[0], T + 60]])
  return (
    <AbsoluteFill style={{ background: '#050505' }}>
      <ARoll cuts={e.cuts} sideAt={side} zooms={zoomsFor(e)} />
      <Sequence from={w.hook[0]} durationInFrames={len(w.hook)}><HookTag len={len(w.hook)} /></Sequence>
      <Sequence from={w.forty[0]} durationInFrames={len(w.forty)}><Pop big="40 MIN" small="round trip · up to 20 min each way" len={len(w.forty)} /></Sequence>
      <Sequence from={w.lower[0]} durationInFrames={len(w.lower)}>
        <LowerThird name={NAME} role={ROLE} len={len(w.lower)} />
        <SourceChip text="NASA OSDR · INSPIRATION4" len={len(w.lower)} />
      </Sequence>
      <Sequence from={w.lower2[0]} durationInFrames={len(w.lower2)}><LowerThird name={NAME2} role={ROLE} len={len(w.lower2)} /></Sequence>
      <Sequence from={w.four[0]} durationInFrames={len(w.four)}><Pop big="4 / 4" small="crew: red-cell size fell vs. their own pre-flight baseline" color={C.bad} len={len(w.four)} /></Sequence>
      <Sequence from={w.normal[0]} durationInFrames={len(w.normal)}><Pop big="“NORMAL”" small={`${R1_LO}–${R1_HI} fL · inside the ${R1[0].lo}–${R1[0].hi} fL lab range`} color={C.good} len={len(w.normal)} /></Sequence>
      <Sequence from={w.crew[0]} durationInFrames={len(w.crew)}>
        <Takeover Comp={CrewWide} len={len(w.crew)} skip={CREW_HIT - (at(e, 'bigger') - w.crew[0])} hardOut />
      </Sequence>
      <Sequence from={w.app[0]} durationInFrames={len(w.app)}>
        <FlyCard Comp={AppCard} len={len(w.app)} label="THE APP · EACH ASTRONAUT VS. THEMSELVES" />
      </Sequence>
      <Sequence from={w.storm[0]} durationInFrames={len(w.storm)}><Pop big="12×" small="peak ISS radiation dose rate vs. quiet days · solar storm, Sept 11 2017" color={C.bad} len={len(w.storm)} /></Sequence>
      <Sequence from={w.not40[0]} durationInFrames={len(w.not40)}><Pop big="NOT 40." small="alert on board · no Earth round trip" color={C.bad} len={len(w.not40)} /></Sequence>
      <Sequence from={w.end[0]} durationInFrames={len(w.end)}><TeamEnd /></Sequence>
      <Captions words={e.words} hide={[w.not40, w.end, w.crew]} />
      <Finish />
      <SIMark />
      <FadeOut total={T} />
      <Bed total={T} />
    </AbsoluteFill>
  )
}

export const durations = { A: (A as Edl).total, B: (B as Edl).total }
