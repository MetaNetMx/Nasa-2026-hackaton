import { lazy, Suspense, useEffect, useMemo, useState } from 'react'
import { CheckIn, assess, loadEntries, type Entry } from './CheckIn'
import { CAREER_LIMIT_MSV, PRESETS, REGIONS, STATUS_ICON, STATUS_TEXT } from './content'
import { loadAll, pointStatus, worst, type Analyte, type Mode, type RegionId, type Status } from './data'
import { ReadinessReplay, YourPulse, type PulseState } from './Readiness'
import { Anim } from './remotion/Anim'
import { DotNumber } from './remotion/DotNumber'
import { Intro } from './remotion/Intro'
import { Reveal, type RevealRow } from './remotion/Reveal'
import { useReplay, type Replay } from './useReplay'
import type { View } from './World3D'

const World3D = lazy(() => import('./World3D').then((m) => ({ default: m.World3D })))

type Loaded = Awaited<ReturnType<typeof loadAll>>
const TPS = ['L-3', 'R+1', 'R+45', 'R+82', 'R+194']
const TP_TEXT: Record<string, string> = { 'L-3': '3 d before launch', 'R+1': '1 d after landing', 'R+45': '45 d after', 'R+82': '82 d after', 'R+194': '194 d after' }
const REGION_IDS = Object.keys(REGIONS) as RegionId[]
const HEX: Record<Status, string> = { green: '#34d399', yellow: '#fbbf24', red: '#f87171', none: '#5b6b88' }

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
  const [presetId, setPresetId] = useState('mars-transit')
  const [region, setRegion] = useState<RegionId>('blood')
  const [view, setView] = useState<View>('body')
  const [intro, setIntro] = useState(true)
  const [drawer, setDrawer] = useState<null | 'readiness' | 'pulse' | 'checkin' | 'data'>(null)
  const [shelterAck, setShelterAck] = useState(false)
  const [entries, setEntries] = useState<Entry[]>(loadEntries)
  const [pulse, setPulse] = useState<PulseState>(null)
  const [packet, setPacket] = useState(false)
  const [burst, setBurst] = useState(0)
  const rp = useReplay(d.radiation)
  const preset = PRESETS.find((p) => p.id === presetId)!
  const you = person === 'you'

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

  const reveal = useMemo(() => {
    let earth = 0, hidden = 0, checks = 0
    const rows: RevealRow[] = []
    if (!you) {
      for (const a of d.crew.analytes) {
        const p = a.crew[person]?.points.find((x) => x.tp === tp)
        if (!p || p.lo == null || p.z == null) continue
        checks++
        const inRange = pointStatus(p, 'earth') === 'green'
        if (!inRange) earth++
        else if (Math.abs(p.z) >= 3) hidden++
        rows.push({ label: short(a.label), z: p.z, inRange })
      }
      rows.sort((x, y) => Math.abs(y.z) - Math.abs(x.z))
    }
    return { earth, hidden, checks, rows: rows.slice(0, 7) }
  }, [d, person, tp, you])

  const eta = preset.oneWaySec * 2
  const etaText = eta === 0 ? 'now' : eta < 60 ? `${eta.toFixed(1)} s` : `${Math.round(eta / 60)} min`
  const bigValue = you ? String(REGION_IDS.filter((r) => status[r] === 'red').length) : mode === 'earth' ? String(reveal.earth) : String(reveal.hidden)
  const bigColor = you ? HEX.red : mode === 'earth' ? (reveal.earth ? HEX.yellow : HEX.green) : reveal.hidden ? HEX.red : HEX.green

  return (
    <div className={`app ${intro ? 'is-intro' : ''}`}>
      <div className="world" aria-label="3D scene: astronaut above Earth with the real ISS radiation track">
        <Suspense fallback={null}>
          <World3D data={d.radiation} i={rp.i} radStatus={rp.status} view={view}
            status={status} selected={region} onSelect={(r) => { setRegion(r); if (r !== 'radiation') setView('body') }} tags={tags} burstKey={burst} />
        </Suspense>
      </div>

      {intro && (
        <div className="intro" onClick={() => setIntro(false)}>
          <Anim component={Intro} durationInFrames={135} width={1280} height={Math.round((1280 * window.innerHeight) / window.innerWidth)} style={{ width: '100%', height: '100%' }} />
        </div>
      )}

      {rp.status === 'red' && !shelterAck && (
        <div className="storm glass" role="alert">
          <span className="storm-ico">☢</span>
          <div>
            <b>Solar storm · go to the shelter now</b>
            <span>Polar dose {rp.stats.ratio.toFixed(1)}× normal · {rp.time.slice(5)} · ground reply in {etaText}{eta >= 60 ? ': act now' : ''}</span>
          </div>
          <button className="btn danger" onClick={() => setShelterAck(true)}>I’m in the shelter</button>
        </div>
      )}

      <header className="top glass">
        <div className="brand"><span className="logo">Δ</span><div><h1>Delta-Me</h1><p>Your own baseline, {preset.oneWaySec >= 60 ? '20 min' : preset.delayText} from help</p></div></div>
        <div className="pickers">
          <select aria-label="Person" value={person} onChange={(e) => setPerson(e.target.value)}>
            {d.crew.crewIds.map((c) => <option key={c} value={c}>Inspiration4 · {c}</option>)}
            <option value="you">You (check-in + camera)</option>
          </select>
          {!you && (
            <select aria-label="Blood draw" value={tp} onChange={(e) => setTp(e.target.value)}>
              {TPS.map((t) => <option key={t} value={t}>{t} · {TP_TEXT[t]}</option>)}
            </select>
          )}
          <select aria-label="Mission" value={presetId} onChange={(e) => setPresetId(e.target.value)}>
            {PRESETS.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
          <span className="pill"><i className="live" /> {preset.delayText}</span>
        </div>
      </header>

      {/* LEFT: the reveal */}
      <aside className="card left glass">
        <p className="eyebrow">{you ? 'YOUR SYSTEMS' : 'SAME BLOOD · TWO QUESTIONS'}</p>
        {!you && (
          <div className="switch" role="radiogroup" aria-label="Compare against">
            <button role="radio" aria-checked={mode === 'earth'} className={mode === 'earth' ? 'on' : ''} onClick={() => setMode('earth')}>Earth lab ranges</button>
            <button role="radio" aria-checked={mode === 'baseline'} className={mode === 'baseline' ? 'on' : ''} onClick={() => setMode('baseline')}>My own baseline</button>
          </div>
        )}
        <div className="big">
          <div className="dots">
            <Anim key={bigValue + bigColor} component={DotNumber} inputProps={{ value: bigValue, color: bigColor }} durationInFrames={24} width={130} height={80} />
          </div>
          <p>{you ? 'systems need action' : mode === 'earth' ? <>flagged by lab ranges<br /><span>of {reveal.checks} results · {person} · {tp}</span></> : <>hidden shifts beyond 3σ<br /><span>that the lab range calls “normal”</span></>}</p>
        </div>
        {!you && reveal.rows.length > 0 && (
          <Anim key={`${mode}-${person}-${tp}`} component={Reveal} inputProps={{ rows: reveal.rows, mode }} durationInFrames={60} width={320} height={reveal.rows.length * 22 + 36} style={{ width: '100%' }} />
        )}
        {you && <button className="btn ghost" onClick={() => setDrawer('checkin')}>Open daily check-in</button>}
      </aside>

      {/* RIGHT: selected system */}
      <aside className="card right glass" key={region + person + tp + mode}>
        <SystemCard region={region} status={status[region]} analytes={you ? [] : d.crew.analytes} person={person} tp={tp} mode={mode}
          rp={rp} preset={preset} etaText={etaText} you={you} onEscalate={() => setPacket(true)} onOpen={setDrawer} />
      </aside>

      {/* DOCK */}
      <footer className="dock glass">
        <div className="chips" role="tablist" aria-label="Body systems">
          {REGION_IDS.map((r) => (
            <button key={r} role="tab" aria-selected={region === r} className={`chip ${region === r ? 'on' : ''}`}
              onClick={() => { setRegion(r); setView(r === 'radiation' ? 'world' : 'body') }} title={`${REGIONS[r].name}: ${STATUS_TEXT[status[r]]}`}>
              <i style={{ background: HEX[status[r]], boxShadow: status[r] === 'red' ? `0 0 10px ${HEX.red}` : 'none' }} />
              {REGIONS[r].name.split(' ')[0].replace('&', '')}
            </button>
          ))}
        </div>
        <div className="views">
          <button className={view === 'body' ? 'on' : ''} onClick={() => setView('body')}>Body</button>
          <button className={view === 'world' ? 'on' : ''} onClick={() => setView('world')}>World</button>
        </div>
        <div className="rp">
          <button className="icon" aria-label={rp.playing ? 'Pause replay' : 'Play replay'} onClick={() => rp.setPlaying(!rp.playing)}>{rp.playing ? '❚❚' : '▶'}</button>
          <div className="replay-meta">
            <span>ISS {rp.time.slice(5)}</span>
            <input aria-label="Replay position" type="range" min={0} max={rp.n - 1} value={rp.i} onChange={(e) => rp.setI(Number(e.target.value))} />
          </div>
          <span className={`rad s-${rp.status}`}>{rp.stats.ratio.toFixed(1)}×</span>
        </div>
        <button className="more" onClick={() => setDrawer('readiness')}>More ▴</button>
      </footer>

      {drawer && (
        <div className="drawer-bg" onClick={() => setDrawer(null)}>
          <section className="drawer glass" onClick={(e) => e.stopPropagation()} aria-label="More">
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
        <div className="drawer-bg" onClick={() => setPacket(false)}>
          <div className="modal glass" onClick={(e) => e.stopPropagation()} role="dialog" aria-label="Summary for the ground">
            <p className="eyebrow">SUMMARY FOR THE FLIGHT SURGEON · REPLY IN {etaText.toUpperCase()}</p>
            <pre>{packetText(d, person, tp, mode, preset.name, etaText, status, rp)}</pre>
            <div className="row">
              <button className="btn" onClick={() => navigator.clipboard?.writeText(packetText(d, person, tp, mode, preset.name, etaText, status, rp))}>Copy</button>
              <button className="btn ghost" onClick={() => setPacket(false)}>Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
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
        <div><p className="eyebrow">BODY SYSTEM</p><h2>{R.name}</h2></div>
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
          <div><b className={`s-${rp.status}`}>{rp.stats.ratio.toFixed(1)}×</b><span>polar dose vs normal</span></div>
          <div><b>{rp.stats.last24Msv.toFixed(2)}</b><span>mSv last 24 h</span></div>
          <div><b>{rp.rateNow.toFixed(2)}</b><span>µSv/min now</span></div>
          <div><b>{((rp.stats.last24Msv / CAREER_LIMIT_MSV) * 100).toFixed(2)}%</b><span>of career limit</span></div>
          <div className="wide">
            <button className="btn ghost sm" onClick={() => rp.jump(6, 0)}>Sep 10 · quiet</button>
            <button className="btn ghost sm" onClick={() => rp.jump(7, 5)}>Sep 11 · storm</button>
          </div>
          <p className="fine wide">Real ISS TEPC minutes. {preset.name}: {preset.doseRefText}.</p>
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
      <rect x={0} width={W} y={Y(b + 3 * a.sd)} height={Y(b - 3 * a.sd) - Y(b + 3 * a.sd)} fill="rgba(94,234,212,.1)" />
      <line x1={0} x2={W} y1={Y(b)} y2={Y(b)} stroke="rgba(94,234,212,.5)" strokeDasharray="3 3" />
      <polyline fill="none" stroke="#e8f1ff" strokeWidth={1.6} points={pts.map((p, k) => `${X(k)},${Y(p.v)}`).join(' ')} />
      {pts.map((p, k) => (
        <g key={p.tp}>
          <circle cx={X(k)} cy={Y(p.v)} r={p.tp === tp ? 4.5 : 2.5} fill={p.tp === tp ? '#5eead4' : '#e8f1ff'} />
          <text x={X(k)} y={H + 10} textAnchor="middle" fontSize="8" fill="#7d8ea8">{p.tp}</text>
        </g>
      ))}
    </svg>
  )
}

const fmt = (v: number) => (Math.abs(v) >= 100 ? v.toFixed(0) : Math.abs(v) >= 10 ? v.toFixed(1) : v.toFixed(2))

function packetText(d: Loaded, person: string, tp: string, mode: Mode, mission: string, eta: string, status: Record<RegionId, Status>, rp: Replay) {
  const lines = [`DELTA-ME SUMMARY · ${mission} · earliest reply ${eta}`, `Person: ${person}${person === 'you' ? '' : ` · draw ${tp}`} · comparison: ${mode === 'baseline' ? 'personal baseline' : 'lab range'}`, '']
  for (const r of REGION_IDS) if (status[r] === 'red' || status[r] === 'yellow') lines.push(`${status[r].toUpperCase().padEnd(6)} ${REGIONS[r].name}`)
  if (person !== 'you') {
    lines.push('')
    for (const a of d.crew.analytes) {
      const p = a.crew[person]?.points.find((x) => x.tp === tp)
      const s = p ? pointStatus(p, mode) : 'none'
      if (p && (s === 'red' || s === 'yellow')) lines.push(`  ${a.label}: ${p.v} ${a.unit} (lab ${p.lo}–${p.hi}${p.z != null ? `; ${p.z > 0 ? '+' : ''}${p.z} SD vs baseline` : ''})`)
    }
  }
  lines.push('', `Radiation: ${rp.status} · polar dose ${rp.stats.ratio.toFixed(1)}× normal · ${rp.time}`)
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
        <li><b>3D scene:</b> Earth from NASA Visible Earth (Blue Marble, night lights). The astronaut is drawn far larger than real scale so it reads against the planet; the ISS track sits at its real 408 km altitude.</li>
      </ul>
      <p className="disclaimer">Decision support for training and demonstration. Not a medical device and not a diagnosis. Inspiration4 was a 3-day flight with 4 crew and no in-flight blood draws, so day-after-landing results stand in for “in flight”.</p>
    </div>
  )
}
