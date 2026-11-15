import { lazy, Suspense, useEffect, useMemo, useState } from 'react'
import { CheckIn, assess, loadEntries, type Entry } from './CheckIn'
import { Walkthrough, type Step } from './Guide'
import { loadAvatar, saveAvatar, type PhotoAvatar } from './avatar'
import { CAREER_LIMIT_MSV, PRESETS, REGIONS, STATUS_ICON, STATUS_TEXT, type Preset } from './content'
import { loadAll, pointStatus, worst, type Analyte, type Mode, type RegionId, type Status } from './data'
import { ReadinessReplay, YourPulse, type PulseState } from './Readiness'
import { Anim } from './remotion/Anim'
import { DotNumber } from './remotion/DotNumber'
import { Intro } from './remotion/Intro'
import { useReplay, type Replay } from './useReplay'
import type { View } from './World3D'

const World3D = lazy(() => import('./World3D').then((m) => ({ default: m.World3D })))
const Onboarding = lazy(() => import('./Onboarding').then((m) => ({ default: m.Onboarding })))

type Loaded = Awaited<ReturnType<typeof loadAll>>
const TPS = ['L-3', 'R+1', 'R+45', 'R+82', 'R+194']
const TP_TEXT: Record<string, string> = { 'L-3': '3 d before launch', 'R+1': '1 d after landing', 'R+45': '45 d after', 'R+82': '82 d after', 'R+194': '194 d after' }
const REGION_IDS = Object.keys(REGIONS) as RegionId[]
const HEX: Record<Status, string> = { green: '#3ddc84', yellow: '#f5d90a', red: '#ff3355', none: '#5f5f5f' }
const BASELINE_TPS = 'L-92, L-44, L-3'
const SEEN_KEY = 'delta-me-seen-v3'
const SCENE_ARIA = {
  orbit: '3D scene: the crew member’s digital avatar above Earth with the real ISS radiation track',
  mars: '3D scene: the crew member’s digital avatar standing at a Mars surface base',
  moon: '3D scene: the crew member’s digital avatar on the lunar surface, Earth in the sky',
  transit: '3D scene: the crew member’s digital avatar on EVA outside the transit vehicle, Mars ahead',
} as const

/** Earth-range flags and hidden (>=3 sigma, inside lab range) shifts for one person at one draw. */
function compare(d: Loaded, person: string, tp: string) {
  let earth = 0, checks = 0
  const rows: { label: string; z: number; inRange: boolean }[] = [], hidden: { label: string; z: number }[] = []
  for (const a of d.crew.analytes) {
    const p = a.crew[person]?.points.find((x) => x.tp === tp)
    if (!p || p.lo == null || p.z == null) continue
    checks++
    const inRange = pointStatus(p, 'earth') === 'green'
    if (!inRange) earth++
    else if (Math.abs(p.z) >= 3) hidden.push({ label: short(a.label), z: p.z })
    rows.push({ label: short(a.label), z: p.z, inRange })
  }
  rows.sort((x, y) => Math.abs(y.z) - Math.abs(x.z))
  return { earth, hidden, checks, rows: rows.slice(0, 7) }
}
const sig = (z: number) => `${z > 0 ? '+' : '−'}${Math.abs(z).toFixed(1)}σ`

function PlayIcon({ playing }: { playing: boolean }) {
  return <svg width="12" height="12" viewBox="0 0 12 12" aria-hidden>{playing ? <path d="M2 1h3v10H2zM7 1h3v10H7z" fill="currentColor" /> : <path d="M2.5 1l8 5-8 5z" fill="currentColor" />}</svg>
}

export default function App() {
  const [d, setD] = useState<Loaded | null>(null)
  const [err, setErr] = useState('')
  useEffect(() => { loadAll().then(setD).catch((e) => setErr(String(e))) }, [])
  if (err) return <p className="boot">DATA LINK FAILED: {err}</p>
  if (!d) return <p className="boot">ESTABLISHING DATA LINK…</p>
  return <Mission d={d} />
}

function Mission({ d }: { d: Loaded }) {
  const [person, setPerson] = useState(d.crew.crewIds[1] ?? d.crew.crewIds[0])
  const [tp, setTp] = useState('R+1')
  const [mode, setMode] = useState<Mode>('earth')
  const [presetId, setPresetId] = useState('mars-surface')
  const [region, setRegion] = useState<RegionId>('blood')
  const [view, setView] = useState<View>('body')
  const [intro, setIntro] = useState(true)
  const [drawer, setDrawer] = useState<null | 'readiness' | 'pulse' | 'checkin' | 'data'>(null)
  const [shelterAck, setShelterAck] = useState(false)
  const [entries, setEntries] = useState<Entry[]>(loadEntries)
  const [pulse, setPulse] = useState<PulseState>(null)
  const [packet, setPacket] = useState(false)
  const [burst, setBurst] = useState(0)
  const [walk, setWalk] = useState<null | 'guide' | 'story'>(null)
  const [welcome, setWelcome] = useState(() => { try { return !localStorage.getItem(SEEN_KEY) } catch { return true } })
  const [onboard, setOnboard] = useState(false)
  const [avatar, setAvatar] = useState<PhotoAvatar | null>(loadAvatar)
  const rp = useReplay(d.radiation)
  const preset = PRESETS.find((p) => p.id === presetId)!
  const you = person === 'you'
  const orbit = preset.scene === 'orbit'

  useEffect(() => { const t = setTimeout(() => setIntro(false), 4700); return () => clearTimeout(t) }, [])
  useEffect(() => { if (rp.status !== 'red') setShelterAck(false) }, [rp.status])
  useEffect(() => { setBurst((b) => b + 1) }, [mode, person, tp])

  const checkin = useMemo(() => assess(entries), [entries])
  const pulseStatus: Status = pulse?.z == null ? 'none' : Math.abs(pulse.z) >= 3 ? 'red' : Math.abs(pulse.z) >= 2 ? 'yellow' : 'green'

  const { status, tags } = useMemo(() => {
    const s = {} as Record<RegionId, Status>
    const tg: Partial<Record<RegionId, string>> = {}
    for (const r of REGION_IDS) {
      if (r === 'radiation') { s[r] = rp.status; continue }
      if (you) {
        const own = checkin.filter((c) => c.ind.region === r)
        const list = own.map((c) => c.s)
        if (r === 'brain') list.push(pulseStatus)
        s[r] = worst(list)
        const top = own.find((c) => c.s === s[r])
        if (top) tg[r] = `${top.ind.label.split(' ')[0]} ${top.v}`
        else if (r === 'brain' && pulse) tg[r] = `Pulse ${pulse.bpm}`
      } else {
        const pts = d.crew.analytes
          .filter((a) => a.region === r && a.crew[person])
          .map((a) => ({ a, p: a.crew[person].points.find((p) => p.tp === tp) }))
          .filter((x) => x.p)
          .map((x) => ({ ...x, st: pointStatus(x.p!, mode) }))
        s[r] = worst(pts.map((x) => x.st))
        const top = pts.filter((x) => x.st === s[r] && s[r] !== 'green').sort((a, b) => Math.abs(b.p!.z ?? 0) - Math.abs(a.p!.z ?? 0))[0]
        if (top) tg[r] = mode === 'baseline' && top.p!.z != null ? `${short(top.a.label)} ${top.p!.z > 0 ? '+' : '−'}${Math.abs(top.p!.z).toFixed(1)}σ` : `${short(top.a.label)} ${top.p!.v}`
      }
    }
    return { status: s, tags: tg }
  }, [d, person, tp, mode, rp.status, you, checkin, pulseStatus, pulse])

  const reveal = useMemo(() => (you ? { earth: 0, hidden: [], checks: 0, rows: [] } : compare(d, person, tp)), [d, person, tp, you])

  /** worst blood-panel status per crew avatar, for the roster */
  const crewStatus = useMemo(() => {
    const out: Record<string, Status> = {}
    for (const c of d.crew.crewIds) {
      out[c] = worst(d.crew.analytes.flatMap((a) => { const p = a.crew[c]?.points.find((x) => x.tp === tp); return p ? [pointStatus(p, mode)] : [] }))
    }
    return out
  }, [d, tp, mode])

  const eta = preset.oneWaySec * 2
  const etaText = eta === 0 ? 'now' : eta < 60 ? `${eta.toFixed(1)} s` : `${Math.round(eta / 60)} min`
  const doseLabel = orbit ? 'polar dose' : 'dose rate'
  const closeWelcome = () => { setWelcome(false); try { localStorage.setItem(SEEN_KEY, '1') } catch { /* private mode */ } }
  const startWalk = (w: 'guide' | 'story') => { closeWelcome(); setIntro(false); setWalk(w) }

  const guideSteps = useMemo(() => guide(preset), [preset])
  const storySteps = useMemo(() => story(d, preset, etaText, {
    setPerson, setTp, setMode, setRegion, setView, setDrawer, setShelterAck, setPacket, rp,
  }), [d, preset, etaText, rp])
  const bigValue = you ? String(REGION_IDS.filter((r) => status[r] === 'red').length) : mode === 'earth' ? String(reveal.earth) : String(reveal.hidden.length)
  const bigColor = you ? HEX.red : mode === 'earth' ? (reveal.earth ? HEX.yellow : HEX.green) : reveal.hidden.length ? HEX.red : HEX.green

  const hiddenLine = reveal.hidden.length ? reveal.hidden.map((h) => `${h.label} ${sig(h.z)}`).join(' · ') : 'none beyond 3σ'
  const anyRed = REGION_IDS.some((r) => r !== 'radiation' && status[r] === 'red')
  const radPct = Math.min(100, (rp.stats.ratio / 3) * 100)

  return (
    <div className={`app ${intro ? 'is-intro' : ''}`} style={{ '--accent': preset.accent } as React.CSSProperties}>
      <div className="world" aria-label={SCENE_ARIA[preset.scene]}>
        <Suspense fallback={null}>
          <World3D data={d.radiation} i={rp.i} radStatus={rp.status} view={view} scene={preset.scene} accent={preset.accent}
            status={status} selected={region} onSelect={(r) => { setRegion(r); if (r !== 'radiation') setView('body') }} tags={tags} burstKey={burst}
            photo={you ? avatar : null} />
        </Suspense>
      </div>
      <Orbits />
      <div className="grain" aria-hidden />

      {intro && (
        <div className="intro" onClick={() => setIntro(false)}>
          <Anim component={Intro} inputProps={{ accent: preset.accent }} durationInFrames={135} width={1280} height={Math.round((1280 * window.innerHeight) / window.innerWidth)} style={{ width: '100%', height: '100%' }} />
        </div>
      )}

      {rp.status === 'red' && !shelterAck && (
        <div className="storm" role="alert" data-tour="storm">
          <span className="storm-ico" aria-hidden><svg width="26" height="26" viewBox="0 0 24 24"><path d="M12 2L1 21h22z" fill="none" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" /><path d="M12 9v5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" /><circle cx="12" cy="17.3" r="1.2" fill="currentColor" /></svg></span>
          <div>
            <b>WARNING · SOLAR PARTICLE EVENT · GO TO THE STORM SHELTER</b>
            <span>{doseLabel[0].toUpperCase() + doseLabel.slice(1)} {rp.stats.ratio.toFixed(1)}× quiet baseline · Sept 2017 replay {rp.time.slice(5)} · ground reply {eta === 0 ? 'now' : `in ${etaText}: act now`}</span>
          </div>
          <button className="btn danger" onClick={() => setShelterAck(true)}>I’m in the shelter</button>
        </div>
      )}

      <header className="top">
        <div className="brand" data-tour="brand"><span className="logo">Δ</span><div><h1>DELTA-ME</h1><p>CREW HEALTH CONSOLE</p></div></div>
        <nav className="scenes" role="tablist" aria-label="Scenario" data-tour="scenario">
          {PRESETS.map((p) => (
            <button key={p.id} role="tab" aria-selected={p.id === presetId} className={p.id === presetId ? 'on' : ''} onClick={() => setPresetId(p.id)}
              style={{ '--a': p.accent } as React.CSSProperties}><i />{p.tab}</button>
          ))}
        </nav>
        <div className="help" data-tour="help">
          <button className="btn ghost sm" onClick={() => setOnboard(true)} data-tour="myavatar">+ My avatar</button>
          <button className="btn ghost sm" onClick={() => startWalk('guide')}>? Guide</button>
          <button className="btn sm" onClick={() => startWalk('story')}>▶ Use case</button>
        </div>
      </header>

      {/* TOP LEFT: mission tags + crew avatars */}
      <section className="mission">
        <div className="tags" data-tour="mission">
          <p><span className="dim">[...]</span> <span>[LOCATION: <em>{preset.place}</em>]</span></p>
          <p><span className="dim">[...]</span> <span>[MISSION DAY: <em>{preset.day}</em>]</span></p>
          <p title={preset.delaySource}><span className="dim">[...]</span> <span>[EARTH LINK: <em>{preset.delayText}</em>]</span></p>
        </div>
        <div className="crew" data-tour="crew">
          <p className="eyebrow">CREW · DIGITAL AVATARS</p>
          <div className="roster" role="radiogroup" aria-label="Crew avatar">
            {d.crew.crewIds.map((c) => (
              <button key={c} role="radio" aria-checked={person === c} className={person === c ? 'on' : ''} onClick={() => setPerson(c)} title={`${c}: ${STATUS_TEXT[crewStatus[c]]}`}>
                <span>{c}</span><i style={{ background: HEX[crewStatus[c]] }} />
              </button>
            ))}
            <button role="radio" aria-checked={you} className={you ? 'on' : ''} onClick={() => (avatar ? setPerson('you') : setOnboard(true))} title="Your own avatar, check-ins and camera pulse">
              {avatar ? <img src={avatar.img} alt="" /> : null}<span>YOU</span>
            </button>
          </div>
          <div className="avatar-meta">
            {you
              ? <span>{avatar ? 'Photo avatar · stays on this device' : 'No photo avatar yet'}</span>
              : <><span>Baseline {BASELINE_TPS}</span>
                <select aria-label="Blood draw" value={tp} onChange={(e) => setTp(e.target.value)}>
                  {TPS.map((t) => <option key={t} value={t}>Draw {t} · {TP_TEXT[t]}</option>)}
                </select></>}
          </div>
        </div>
      </section>

      {/* BOTTOM LEFT: the finding */}
      <section className="hero" data-tour="compare">
        <span className="chip-o">{you ? 'YOUR SYSTEMS' : 'SAME BLOOD · TWO QUESTIONS'}</span>
        <div className="hero-head">
          <div className="dots">
            <Anim key={bigValue + bigColor} component={DotNumber} inputProps={{ value: bigValue, color: bigColor }} durationInFrames={24} width={110} height={68} />
          </div>
          <h2>{you ? <>SYSTEMS AT<br />WARNING</> : mode === 'earth' ? <>FLAGGED BY<br />EARTH RANGES</> : <>HIDDEN SHIFTS<br />FOUND</>}</h2>
        </div>
        <p className="hero-sub">{you ? 'From your check-ins and camera pulse' : mode === 'earth' ? `of ${reveal.checks} results · ${person} · draw ${tp}` : `${hiddenLine} · inside the lab range`}</p>
        {!you && (
          <div className="switch" role="radiogroup" aria-label="Compare against">
            <button role="radio" aria-checked={mode === 'earth'} className={mode === 'earth' ? 'on' : ''} onClick={() => setMode('earth')}>Earth lab ranges</button>
            <button role="radio" aria-checked={mode === 'baseline'} className={mode === 'baseline' ? 'on' : ''} onClick={() => setMode('baseline')}>Own baseline</button>
          </div>
        )}
        {anyRed && !you
          ? <button className="cta" onClick={() => setPacket(true)}>Send summary to Earth · reply {eta === 0 ? 'now' : `in ${etaText}`} <span>↗</span></button>
          : you
            ? <button className="cta" onClick={() => setDrawer('checkin')}>Open daily check-in <span>↗</span></button>
            : <button className="cta" onClick={() => startWalk('story')}>Run the use case <span>↗</span></button>}
      </section>

      {/* TOP RIGHT: technical information for the selected system */}
      <aside className="tech" key={region + person + tp + mode} data-tour="system">
        <i className="cn tl" /><i className="cn tr" /><i className="cn bl" /><i className="cn br" />
        <SystemCard region={region} status={status[region]} analytes={you ? [] : d.crew.analytes} person={person} tp={tp} mode={mode}
          rp={rp} preset={preset} etaText={etaText} you={you} onEscalate={() => setPacket(true)} onOpen={setDrawer} />
      </aside>

      <p className="caption" aria-hidden>
        {you ? (avatar ? 'YOUR PHOTO AVATAR · 2.5D GAUSSIAN SPLATS' : 'YOU · NO PHOTO AVATAR YET') : `DIGITAL AVATAR · ${person} · BASELINE FROM 3 PRE-FLIGHT DRAWS`}
      </p>

      {/* BOTTOM STRIP */}
      <footer className="strip">
        <div className="chips" role="tablist" aria-label="Body systems" data-tour="chips">
          {REGION_IDS.map((r) => (
            <button key={r} role="tab" aria-selected={region === r} className={`chip ${region === r ? 'on' : ''}`}
              onClick={() => { setRegion(r); setView(r === 'radiation' ? 'world' : 'body') }} title={`${REGIONS[r].name}: ${STATUS_TEXT[status[r]]}`}>
              <i className={`st s-${status[r]}`}>{STATUS_ICON[status[r]]}</i>
              {REGIONS[r].name.split(' ')[0].replace('&', '')}
            </button>
          ))}
        </div>
        <div className="views" data-tour="views">
          <button className={view === 'body' ? 'on' : ''} onClick={() => setView('body')}>Body</button>
          <button className={view === 'world' ? 'on' : ''} onClick={() => setView('world')}>World</button>
        </div>
        <div className="rp" data-tour="replay">
          <button className="icon" aria-label={rp.playing ? 'Pause replay' : 'Play replay'} onClick={() => rp.setPlaying(!rp.playing)}><PlayIcon playing={rp.playing} /></button>
          <div className="replay-meta">
            <span>{orbit ? 'ISS DOSIMETER' : 'DOSIMETER · SEPT 2017 REPLAY'} · {rp.time.slice(5, 16)}</span>
            <input aria-label="Replay position" type="range" min={0} max={rp.n - 1} value={rp.i} onChange={(e) => rp.setI(Number(e.target.value))} />
          </div>
          <div className="dose" title={`${doseLabel} vs quiet baseline`}>
            <b className={`s-${rp.status}`}>{rp.stats.ratio.toFixed(1)}×</b>
            <span className="hatch"><i style={{ width: `${radPct}%` }} className={`s-${rp.status}`} /></span>
            <small>QUIET → STORM</small>
          </div>
        </div>
        <button className="more" data-tour="tools" onClick={() => setDrawer('readiness')}>Tools ▴</button>
      </footer>

      {drawer && (
        <div className="drawer-bg" onClick={() => setDrawer(null)}>
          <section className="drawer panel" onClick={(e) => e.stopPropagation()} aria-label="Tools" data-tour="drawer">
            <nav>
              {(['readiness', 'pulse', 'checkin', 'data'] as const).map((k) => (
                <button key={k} className={drawer === k ? 'on' : ''} onClick={() => setDrawer(k)}>
                  {{ readiness: 'Readiness model', pulse: 'Camera pulse', checkin: 'Daily check-in', data: 'Data & methods' }[k]}
                </button>
              ))}
              <button className="close" onClick={() => setDrawer(null)} aria-label="Close">✕</button>
            </nav>
            <div className="drawer-body">
              {drawer === 'readiness' && <ReadinessReplay data={d.readiness} />}
              {drawer === 'pulse' && <YourPulse onChange={setPulse} />}
              {drawer === 'checkin' && <CheckIn entries={entries} onChange={setEntries} />}
              {drawer === 'data' && <Methods d={d} />}
            </div>
          </section>
        </div>
      )}

      {packet && (
        <div className="drawer-bg center" onClick={() => setPacket(false)}>
          <div className="modal panel" onClick={(e) => e.stopPropagation()} role="dialog" aria-label="Summary for the ground">
            <p className="eyebrow">SUMMARY FOR THE FLIGHT SURGEON · REPLY IN {etaText.toUpperCase()}</p>
            <pre>{packetText(d, person, tp, mode, preset, etaText, status, rp)}</pre>
            <div className="row">
              <button className="btn" onClick={() => navigator.clipboard?.writeText(packetText(d, person, tp, mode, preset, etaText, status, rp))}>Copy</button>
              <button className="btn ghost" onClick={() => setPacket(false)}>Close</button>
            </div>
          </div>
        </div>
      )}

      {welcome && !intro && !walk && !onboard && (
        <div className="drawer-bg center">
          <div className="modal panel welcome" role="dialog" aria-label="Welcome">
            <div className="poster">
              <span className="bar b1" /><span className="bar b2" /><span className="bar b3" />
              <p className="eyebrow">OPERATOR · CREW MEDICAL · {preset.place.toUpperCase()}</p>
              <h2>DELTA<span>-</span>ME</h2>
              <p className="poster-type">— DIGITAL CREW AVATARS —</p>
            </div>
            <p>Every crew member gets a <b>digital avatar</b> built from their own pre-flight data, the software side of NASA’s AVATAR idea of flying a stand-in for each astronaut. New results are compared with that avatar, so changes that Earth lab ranges call normal still get caught, even when the doctor is {eta >= 60 ? `${etaText} away` : 'only a call away'}.</p>
            <div className="row">
              <button className="cta" onClick={() => { closeWelcome(); setOnboard(true) }}>Create my avatar from a photo <span>↗</span></button>
              <button className="btn ghost" onClick={() => startWalk('story')}>▶ Use case · {storySteps.length} steps</button>
              <button className="btn ghost" onClick={() => startWalk('guide')}>Explain the interface</button>
              <button className="btn ghost" onClick={closeWelcome}>Skip</button>
            </div>
          </div>
        </div>
      )}
      {onboard && (
        <Suspense fallback={null}>
          <Onboarding accent={preset.accent} existing={avatar}
            onDone={(a) => { setAvatar(a); saveAvatar(a); setOnboard(false); if (a) { setPerson('you'); setView('body') } }}
            onDelete={() => { setAvatar(null); saveAvatar(null); setPerson(d.crew.crewIds[1] ?? d.crew.crewIds[0]); setOnboard(false) }}
            onClose={() => setOnboard(false)} />
        </Suspense>
      )}
      {walk === 'guide' && <Walkthrough steps={guideSteps} label="INTERFACE GUIDE" onClose={() => setWalk(null)} />}
      {walk === 'story' && <Walkthrough steps={storySteps} label={`USE CASE · ${preset.name.toUpperCase()}`} onClose={() => { setWalk(null); setDrawer(null); rp.setPlaying(true) }} />}
    </div>
  )
}

/** Dashed orbit rings and diamond markers framing the avatar (retro mission-graphic). */
function Orbits() {
  return (
    <svg className="orbits" viewBox="-500 -500 1000 1000" preserveAspectRatio="xMidYMid meet" aria-hidden>
      <circle r="300" fill="none" stroke="currentColor" strokeOpacity="0.22" strokeDasharray="4 8" />
      <circle r="420" fill="none" stroke="currentColor" strokeOpacity="0.14" strokeDasharray="4 8" />
      {[[0, -420], [-420, 0], [420, 0], [0, -300]].map(([x, y], k) => (
        <rect key={k} x={x - 5} y={y - 5} width="10" height="10" transform={`rotate(45 ${x} ${y})`} className="dia" />
      ))}
    </svg>
  )
}

const short = (label: string) => label.split(' (')[0]

function SystemCard({ region, status, analytes, person, tp, mode, rp, preset, etaText, you, onEscalate, onOpen }: {
  region: RegionId; status: Status; analytes: Analyte[]; person: string; tp: string; mode: Mode; rp: Replay; preset: (typeof PRESETS)[number]
  etaText: string; you: boolean; onEscalate: () => void; onOpen: (k: 'readiness' | 'pulse' | 'checkin' | 'data') => void
}) {
  const R = REGIONS[region]
  const rows = analytes
    .filter((a) => a.region === region && a.crew[person])
    .map((a) => ({ a, p: a.crew[person].points.find((x) => x.tp === tp) }))
    .filter((x) => x.p && x.p.lo != null)
    .sort((x, y) => Math.abs(y.p!.z ?? 0) - Math.abs(x.p!.z ?? 0))
  const [open, setOpen] = useState<string | null>(null)
  return (
    <>
      <div className="card-head">
        <div><p className="eyebrow">TECHNICAL INFORMATION</p><h2>{R.name}</h2></div>
        <span className={`status s-${status}`}>{STATUS_ICON[status]} {STATUS_TEXT[status]}</span>
      </div>
      <p className="lede">{R.space}</p>

      {(status === 'yellow' || status === 'red') && (
        <div className={`act s-${status}`}>
          <b>{status === 'red' ? 'Do now' : 'Next step'}</b>
          <p>{status === 'red' ? R.act.red : R.act.yellow}</p>
          {status === 'red' && region !== 'radiation' && (
            <>
              <p className="who">{preset.red}</p>
              <button className="btn" onClick={onEscalate}>Send summary · reply in {etaText}</button>
            </>
          )}
        </div>
      )}

      {region === 'radiation' && (
        <div className="kpis">
          <div><b className={`s-${rp.status}`}>{rp.stats.ratio.toFixed(1)}×</b><span>{preset.scene === 'orbit' ? 'polar dose' : 'dose rate'} vs quiet baseline</span></div>
          <div><b>{rp.stats.last24Msv.toFixed(2)}</b><span>mSv last 24 h (replay)</span></div>
          <div><b>{rp.rateNow.toFixed(2)}</b><span>µSv/min now (replay)</span></div>
          <div><b>{((rp.stats.last24Msv / CAREER_LIMIT_MSV) * 100).toFixed(2)}%</b><span>of 600 mSv career limit</span></div>
          <div className="wide">
            <button className="btn ghost sm" onClick={() => rp.jump(6, 0)}>Sep 10 · quiet</button>
            <button className="btn ghost sm" onClick={() => rp.jump(7, 8)}>Sep 11 · storm</button>
          </div>
          <p className="fine wide">{preset.radNote} Typical dose here: {preset.doseRefText}.</p>
        </div>
      )}
      {region === 'brain' && !you && <p className="fine">No in-flight readiness data for this crew member. <button className="link" onClick={() => onOpen('readiness')}>See the NASA crew-state model</button> or <button className="link" onClick={() => onOpen('pulse')}>check your own pulse</button>.</p>}
      {you && region !== 'radiation' && status === 'none' && <p className="fine">No value yet. <button className="link" onClick={() => onOpen('checkin')}>Add a check-in</button>.</p>}

      {rows.length > 0 && (
        <ul className="ranges">
          {rows.map(({ a, p }) => {
            const s = pointStatus(p!, mode)
            return (
              <li key={a.key} className={open === a.key ? 'open' : ''}>
                <button onClick={() => setOpen(open === a.key ? null : a.key)}>
                  <span className="r-name">{short(a.label)}</span>
                  <span className="r-val">{fmt(p!.v)} <small>{a.unit}</small></span>
                  <span className={`r-z s-${s}`}>{mode === 'baseline' && p!.z != null ? `${p!.z > 0 ? '+' : '−'}${Math.abs(p!.z).toFixed(1)}σ` : STATUS_ICON[s]}</span>
                  <RangeBar p={p!} base={a.crew[person].baseline} sd={a.sd} mode={mode} s={s} />
                </button>
                {open === a.key && <Spark a={a} person={person} tp={tp} />}
              </li>
            )
          })}
        </ul>
      )}
      <p className="links">{R.links.map((l) => <a key={l.url} href={l.url} target="_blank" rel="noreferrer">{l.label} ↗</a>)}</p>
    </>
  )
}

/** Lab range as a gradient bar, the value as a marker, the personal ±3σ window as an outline (baseline mode). */
function RangeBar({ p, base, sd, mode, s }: { p: { v: number; lo: number | null; hi: number | null }; base: number | null; sd: number; mode: Mode; s: Status }) {
  const lo = p.lo!, hi = p.hi!, span = hi - lo
  const min = lo - span * 0.35, max = hi + span * 0.35
  const pct = (v: number) => `${Math.max(0, Math.min(100, ((v - min) / (max - min)) * 100))}%`
  return (
    <span className="rbar">
      <i className="lab" style={{ left: pct(lo), width: `calc(${pct(hi)} - ${pct(lo)})` }} />
      {mode === 'baseline' && base != null && <i className="win" style={{ left: pct(base - 3 * sd), width: `calc(${pct(base + 3 * sd)} - ${pct(base - 3 * sd)})` }} />}
      <i className={`mark s-${s}`} style={{ left: pct(p.v) }} />
    </span>
  )
}

function Spark({ a, person, tp }: { a: Analyte; person: string; tp: string }) {
  const s = a.crew[person]
  const pts = s.points
  const b = s.baseline ?? 0
  const vals = pts.map((p) => p.v).concat([b - 3 * a.sd, b + 3 * a.sd])
  const mn = Math.min(...vals), mx = Math.max(...vals)
  const W = 300, H = 70
  const X = (k: number) => 10 + (k / Math.max(1, pts.length - 1)) * (W - 20)
  const Y = (v: number) => H - 10 - ((v - mn) / (mx - mn || 1)) * (H - 20)
  return (
    <svg className="spark" viewBox={`0 0 ${W} ${H + 12}`} role="img" aria-label={`${a.label} over time`}>
      <rect x={0} width={W} y={Y(b + 3 * a.sd)} height={Y(b - 3 * a.sd) - Y(b + 3 * a.sd)} style={{ fill: "var(--accent)", fillOpacity: 0.12 }} />
      <line x1={0} x2={W} y1={Y(b)} y2={Y(b)} style={{ stroke: "var(--accent)", strokeOpacity: 0.6 }} strokeDasharray="3 3" />
      <polyline fill="none" stroke="#ededed" strokeWidth={1.4} points={pts.map((p, k) => `${X(k)},${Y(p.v)}`).join(' ')} />
      {pts.map((p, k) => (
        <g key={p.tp}>
          <circle cx={X(k)} cy={Y(p.v)} r={p.tp === tp ? 4.5 : 2.5} style={{ fill: p.tp === tp ? 'var(--accent)' : '#ededed' }} />
          <text x={X(k)} y={H + 10} textAnchor="middle" fontSize="8" fontFamily="Space Mono, monospace" fill="#8c8c8c">{p.tp}</text>
        </g>
      ))}
    </svg>
  )
}

const fmt = (v: number) => (Math.abs(v) >= 100 ? v.toFixed(0) : Math.abs(v) >= 10 ? v.toFixed(1) : v.toFixed(2))

function packetText(d: Loaded, person: string, tp: string, mode: Mode, preset: Preset, eta: string, status: Record<RegionId, Status>, rp: Replay) {
  const lines = [`DELTA-ME SUMMARY · ${preset.place} · ${preset.day} · earliest reply ${eta}`, `Person: ${person}${person === 'you' ? '' : ` · draw ${tp}`} · comparison: ${mode === 'baseline' ? 'personal baseline' : 'lab range'}`, '']
  for (const r of REGION_IDS) if (status[r] === 'red' || status[r] === 'yellow') lines.push(`${STATUS_TEXT[status[r]].toUpperCase().padEnd(8)} ${REGIONS[r].name}`)
  if (person !== 'you') {
    lines.push('')
    for (const a of d.crew.analytes) {
      const p = a.crew[person]?.points.find((x) => x.tp === tp)
      const s = p ? pointStatus(p, mode) : 'none'
      if (p && (s === 'red' || s === 'yellow')) lines.push(`  ${a.label}: ${p.v} ${a.unit} (lab ${p.lo}–${p.hi}${p.z != null ? `; ${p.z > 0 ? '+' : ''}${p.z} SD vs baseline` : ''})`)
    }
  }
  lines.push('', `Radiation: ${STATUS_TEXT[rp.status]} · ${preset.scene === 'orbit' ? 'polar dose' : 'dose rate'} ${rp.stats.ratio.toFixed(1)}× quiet baseline · Sept 2017 replay ${rp.time}`)
  return lines.join('\n')
}

function Methods({ d }: { d: Loaded }) {
  return (
    <div className="methods">
      <ul>
        <li><b>Crew blood work:</b> {d.crew.source.mission}. {d.crew.source.datasets.map((s) => <a key={s.id} href={s.url} target="_blank" rel="noreferrer">{s.id} {s.name} ↗ </a>)} Timepoints: {d.crew.source.timepoints}. {d.crew.source.method}</li>
        <li><b>Radiation:</b> {d.radiation.source.instrument}, <a href={d.radiation.source.url} target="_blank" rel="noreferrer">NASA dataset ↗</a>, Sept 4–15 2017 ({d.radiation.source.unit}). Daily dose: {Object.entries(d.radiation.dailyMsv).map(([k, v]) => `${k.slice(5)} ${v.toFixed(2)}`).join(' · ')} mSv. Storm alert = mean dose at |latitude| ≥ 40° outside the South Atlantic Anomaly over the last 3 h vs. Sept 4–9: red ≥ 2×, watch ≥ 1.7×.</li>
        <li><b>Readiness:</b> logistic regression on <a href={d.readiness.source.url} target="_blank" rel="noreferrer">{d.readiness.source.dataset} ↗</a>, subjects {d.readiness.source.subjects.join(', ')}; leave-one-subject-out AUC {Object.entries(d.readiness.looAuc).map(([k, v]) => `${k}: ${v}`).join(', ')}. Labels follow the experiment timeline, so part of the signal may be drift over the session.</li>
        <li><b>Camera pulse:</b> green-channel photoplethysmography on the forehead, 20 s, dominant frequency 42–180 bpm. Runs on this device only.</li>
        <li><b>Check-in limits:</b> AHA 2017 blood pressure, ADA glucose, AASM/SRS sleep; after 3 entries the personal baseline also applies.</li>
        <li><b>Digital avatars:</b> each crew member’s avatar holds their own pre-flight baseline ({BASELINE_TPS}). The idea follows NASA’s AVATAR (A Virtual Astronaut Tissue Analog Response) on Artemis II, which flew organ chips made from each astronaut’s own cells as stand-ins for that astronaut. Delta-Me does the same in software with routine measurements; it uses no AVATAR data.</li>
        <li><b>Scenarios:</b> the base, transit and Moon scenes are illustrations. Their delays and typical doses come from the sources shown in each scenario. The blood results are Inspiration4 data in every scenario, and every scenario replays the same ISS TEPC record of the Sept 2017 storm, labelled as a replay. On Mars, Curiosity’s RAD saw that same event roughly double the surface dose rate (Hassler et al. 2018, Space Weather, doi:10.1029/2018SW001959).</li>
        <li><b>Photo avatar:</b> one full-body photo is segmented and its 33 body landmarks found with MediaPipe Pose Landmarker, running in this browser. Each body pixel becomes a Gaussian splat; depth is inflated from the distance to the body outline (single-photo 2.5D, not a multi-view 3D Gaussian Splatting reconstruction). Organ markers are placed from your shoulders, hips and legs. The photo is stored only on this device.</li>
        <li><b>3D models:</b> NASA 3D Resources (free and without copyright): Astronaut (sampled into the crew hologram), Habitat Demonstration Unit and Mars 2020 Perseverance Rover, Apollo Lunar Module, Skylab, International Space Station. The habitat texture carries NASA markings as built. Organ meshes: HuBMAP CCF 3D Reference Object Library v1.2 (Browne K., Schlehlein H., Herr B.W. II, Quardokus E., Bueckle A., Börner K., 2022; models by Kristen Browne, NIAID 3D Printing and Biovisualization), <a href="https://creativecommons.org/licenses/by/4.0/" target="_blank" rel="noreferrer">CC BY 4.0</a>, simplified for the web; the brain is the Allen Human Reference Atlas 3D model from the same library. Earth from NASA Visible Earth (Blue Marble, night lights); terrain is procedural. The avatar is drawn far larger than real scale; the ISS track sits at its real 408 km altitude.</li>
      </ul>
      <p className="disclaimer">Decision support for training and demonstration. Not a medical device and not a diagnosis. Inspiration4 was a 3-day flight with 4 crew and no in-flight blood draws, so day-after-landing results stand in for “in flight”.</p>
    </div>
  )
}

/* ---------- interface guide: every part of the screen ---------- */

function guide(p: Preset): Step[] {
  return [
    { target: 'brand', kicker: 'What this is', title: 'A crew health console for when Earth is far away',
      body: <p>Each crew member has a <b>digital avatar</b>: a 3D twin that holds their own pre-flight baseline. Every new result is compared with that person, not with a population on Earth. It is decision support for the crew, not a diagnosis.</p> },
    { target: 'myavatar', kicker: 'Top bar', title: 'Your own avatar from one photo',
      body: <p><b>+ My avatar</b> takes one full-body photo (camera or upload) and turns it into a 3D avatar made of Gaussian splats, with your organs placed from your detected body pose. The photo is processed in your browser and never leaves this device.</p> },
    { target: 'scenario', kicker: 'Top bar', title: 'Scenario: where the crew is',
      body: <p>Pick <b>Mars surface</b>, <b>Mars transit</b>, <b>Moon</b> or <b>ISS</b>. The 3D world, the accent colour, the delay to Earth, the typical radiation dose and the escalation advice all follow it.</p> },
    { target: 'mission', kicker: 'Top left', title: 'Mission tags',
      body: <p>Where the crew is ({p.place}), the mission day, and the one-way signal delay to Earth: <b>{p.delayText}</b>. The delay decides whether the crew can call the ground or must act first.</p> },
    { target: null, kicker: 'Centre', title: 'The avatar in its world',
      body: <><p>The hologram is the selected crew member’s avatar, placed where the scenario is: {p.place}. Organs glow by status. <b>Click an organ</b> to open that body system.</p><p>A pulse ripples out from the heart; a scan sweeps the body each time a new result is loaded.</p></> },
    { target: 'crew', kicker: 'Top left', title: 'Crew avatars',
      body: <p>One avatar per crew member (real Inspiration4 crew data, anonymised C001–C004), plus <b>You</b> for your photo avatar and check-ins. The dot is that avatar’s worst status. The menu picks which blood draw to show; the baseline is always the three draws before launch.</p> },
    { target: 'compare', kicker: 'Bottom left', title: 'Same blood, two questions',
      body: <><p><b>Earth lab ranges</b> asks “is this normal for people on Earth?”. <b>Own baseline</b> asks “is this normal for this person?”.</p><p>The big number is the finding: results flagged by lab ranges, or hidden shifts beyond ±3σ from this person’s baseline that the lab range still calls normal. The button below is the next action.</p></> },
    { target: 'system', kicker: 'Top right', title: 'Technical information and what to do',
      body: <><p>The selected body system: its status, what spaceflight does to it, and, at Caution or Warning, <b>what to do now and who to call</b> given the delay.</p><p>In each bar the green band is the Earth lab range, the outline is this person’s ±3σ window and the marker is today’s value. Tap a row for its trend over all draws. Links go to the NASA source.</p></> },
    { target: 'chips', kicker: 'Bottom strip', title: 'Body systems and status colours',
      body: <p>Eight systems, each with a status in NASA caution-and-warning colours: <span className="s-green">● Nominal</span>, <span className="s-yellow">▲ Caution</span>, <span className="s-red">■ Warning</span>, <span className="s-none">○ No data</span>. Click one to open it.</p> },
    { target: 'views', kicker: 'Bottom strip', title: 'Body or World view',
      body: <p><b>Body</b> zooms in on the avatar with organ labels. <b>World</b> pulls back to show where the crew is, with NASA 3D models: the Habitat Demonstration Unit on Mars, the Apollo Lunar Module on the Moon, a Skylab-type habitat in transit, or the ISS over Earth with its real radiation track.</p> },
    { target: 'replay', kicker: 'Bottom strip', title: 'Radiation monitor',
      body: <p>Plays the real minute-by-minute dosimeter record of the <b>September 2017 solar storm</b>. The number and hatched bar show the dose rate against the quiet baseline: at 1.7× it turns Caution, at 2× a shelter Warning fires. Drag to scrub; the Radiation system has jump buttons.</p> },
    { target: 'tools', kicker: 'Bottom strip', title: 'Tools: the self-assessment',
      body: <ul className="walk-list"><li><b>Readiness model</b>: attention from heart rate, breathing and skin signals (NASA crew-state data).</li><li><b>Camera pulse</b>: a 20-second pulse from your webcam; stays on this device.</li><li><b>Daily check-in</b>: sleep, blood pressure, glucose, symptoms; after three entries your own baseline applies.</li><li><b>Data &amp; methods</b>: every source and threshold.</li></ul> },
    { target: 'help', kicker: 'Any time', title: 'Use case and guide',
      body: <p><b>▶ Use case</b> plays a full mission morning, step by step, in this scenario. <b>? Guide</b> brings back this tour. Arrow keys move between steps; Esc closes.</p> },
  ]
}

/* ---------- use case: one mission morning, driving the real app state ---------- */

type Ctl = {
  setPerson: (v: string) => void; setTp: (v: string) => void; setMode: (v: Mode) => void; setRegion: (v: RegionId) => void
  setView: (v: View) => void; setDrawer: (v: null | 'readiness' | 'pulse' | 'checkin' | 'data') => void
  setShelterAck: (v: boolean) => void; setPacket: (v: boolean) => void; rp: Replay
}

function story(d: Loaded, p: Preset, eta: string, c: Ctl): Step[] {
  const who = 'C002', tp = 'R+1'
  const r = compare(d, who, tp)
  const list = r.hidden.map((h) => `${h.label} ${sig(h.z)}`).join(' and ')
  const far = eta !== 'now'
  const reset = () => { c.setDrawer(null); c.setPacket(false) }
  return [
    { target: 'crew', kicker: `${p.day} · 07:40 · ${p.place}`, title: `Morning check before the ${p.task}`,
      apply: () => { reset(); c.setPerson(who); c.setTp(tp); c.setMode('earth'); c.setRegion('blood'); c.setView('body'); c.rp.jump(6, 0); c.rp.setPlaying(false) },
      body: <><p>Crew member <b>{who}</b> is on today’s {p.task}. Before suiting up, they run the onboard blood analyzer and the result lands on their avatar.</p><p className="fine">Data: real Inspiration4 results for {who}, the day after landing, standing in for an in-flight draw.</p></> },
    { target: 'compare', kicker: '07:41 · Earth lab ranges', title: r.earth ? `Lab ranges flag ${r.earth} of ${r.checks}` : 'Lab ranges: everything is “normal”',
      apply: () => c.setMode('earth'),
      body: <p>Against ranges built from healthy people on Earth, {r.earth ? `only ${r.earth} of ${r.checks} results stand out, none of them alarming` : `all ${r.checks} results look normal`}. With a standard lab report, the {p.task} goes ahead.</p> },
    { target: 'compare', kicker: '07:42 · Own baseline', title: `The avatar finds ${r.hidden.length} hidden shifts`,
      apply: () => { c.setMode('baseline'); c.setRegion('blood') },
      body: <p>Switch to <b>Own baseline</b>. {who}’s avatar holds their three pre-flight draws. Against that baseline, <b>{list}</b> moved more than 3σ while still inside the lab range. On the avatar, the matching organs turn red.</p> },
    { target: 'system', kicker: '07:45 · Act without waiting', title: far ? `Earth is ${eta} away: the crew decides` : 'Call the ground, act now',
      apply: () => { c.setRegion('blood'); c.setView('body') },
      body: <><p>The technical panel says what to do now and who to call. {p.red}</p><p>The crew medical officer takes {who} off the {p.task}, and the summary for the flight surgeon is one click away{far ? `; the earliest reply is ${eta} away` : ''}.</p></> },
    { target: 'storm', kicker: '10:15 · Solar particle event', title: 'Shelter warning, no one feels a thing',
      apply: () => { reset(); c.setShelterAck(false); c.setRegion('radiation'); c.setView('world'); c.rp.jump(7, 8); c.rp.setPlaying(false) },
      body: <><p>The dosimeter passes <b>2× its quiet baseline</b> and a shelter Warning fires. Radiation can’t be seen or felt, so the crew moves to the shelter within minutes instead of waiting {far ? eta : 'on a call'}.</p><p className="fine">{p.radNote}</p></> },
    { target: 'drawer', kicker: `13:30 · Go / no-go`, title: `Self-assessment before the rescheduled ${p.task}`,
      apply: () => { c.setShelterAck(true); c.setView('body'); c.setDrawer('checkin') },
      body: <p>The backup crew member takes the {p.task}. Before suiting up, they log a <b>daily check-in</b> (sleep, blood pressure, symptoms) and a 20-second <b>camera pulse</b>. After three check-ins their own baseline applies too. <b>Readiness</b> shows the NASA crew-state model behind the attention check.</p> },
    { target: null, kicker: 'End of the day', title: 'What the avatar changed',
      apply: () => { c.setDrawer(null) },
      body: <><p><b>Without Delta-Me:</b> the {p.task} goes ahead with {r.hidden.length} unflagged changes, and the storm waits on {far ? `a ${eta} reply from Earth` : 'the ground'}.</p><p><b>With Delta-Me:</b> the changes are caught against {who}’s own avatar, the crew is in the shelter in minutes, and a summary is already on its way to the flight surgeon.</p><p className="fine">Decision support for training and demonstration, not a diagnosis.</p></> },
  ]
}
