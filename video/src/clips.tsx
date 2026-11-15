import { interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion'
import data from './data.json'
import { C, MONO, clamp, ease, Frame, Headline, Mono } from './style'

type Pt = { tp: string; v: number; z: number; lo: number; hi: number } | null
const fmtZ = (z: number) => `${z < 0 ? '−' : '+'}${Math.abs(z).toFixed(1)}σ`

/* ---------- 1 · The finding: MCV per crew across all 7 draws ---------- */
export function McvDrop() {
  const f = useCurrentFrame()
  const { fps } = useVideoConfig()
  const X0 = 200, X1 = 1400, Y0 = 380, Y1 = 900
  const zTop = 2, zBot = -5.2
  const xs = data.tps.map((_, i) => X0 + (i / (data.tps.length - 1)) * (X1 - X0))
  const Y = (z: number) => Y0 + ((zTop - z) / (zTop - zBot)) * (Y1 - Y0)
  const lines = Object.entries(data.mcv.lines) as [string, Pt[]][]
  const draw = ease(f, 18, 110)
  const hit = spring({ frame: f - 112, fps, config: { damping: 12 } })
  const r1 = lines.map(([, l]) => l[3]!.z)
  const avg = r1.reduce((a, b) => a + b, 0) / r1.length
  const days = ['−92', '−44', '−3', '+1', '+45', '+82', '+194']
  return (
    <Frame tag="01 / 03" source="NASA OSDR · INSPIRATION4 · OSD-569">
      <Headline>Red-cell size fell<br />in all 4 crew</Headline>
      <svg width={1920} height={1080} style={{ position: 'absolute', inset: 0 }}>
        {/* personal normal: ±3 SD */}
        <rect x={X0 - 30} width={X1 - X0 + 60} y={Y(3)} height={Y(-3) - Y(3)} fill={C.accent} opacity={0.07 * ease(f, 6, 20)} />
        {[3, -3].map((z) => <line key={z} x1={X0 - 30} x2={X1 + 30} y1={Y(z)} y2={Y(z)} stroke={C.accent} strokeDasharray="6 8" opacity={0.6 * ease(f, 6, 20)} />)}
        <line x1={X0 - 30} x2={X1 + 30} y1={Y(0)} y2={Y(0)} stroke={C.line} />
        <text x={X0 - 40} y={Y(3) - 12} fill={C.accent} fontFamily={MONO} fontSize={20} opacity={ease(f, 8, 22)}>YOUR OWN NORMAL (±3σ FROM 3 PRE-FLIGHT DRAWS)</text>
        {/* flight marker */}
        <line x1={(xs[2] + xs[3]) / 2} x2={(xs[2] + xs[3]) / 2} y1={Y0 - 10} y2={Y1 + 10} stroke={C.text} strokeOpacity={0.35} strokeDasharray="2 6" />
        <text x={(xs[2] + xs[3]) / 2} y={Y1 + 44} fill={C.text} fontFamily={MONO} fontSize={18} textAnchor="middle" opacity={0.7}>3-DAY FLIGHT</text>
        {xs.map((x, i) => <text key={i} x={x} y={Y1 + 80} fill={i === 3 ? C.bad : C.muted} fontFamily={MONO} fontSize={22} textAnchor="middle">{days[i]}</text>)}
        <text x={X0 - 40} y={Y1 + 80} fill={C.muted} fontFamily={MONO} fontSize={18} textAnchor="end">DAY</text>
        {lines.map(([c, l], li) => {
          const pts = l.map((p, i) => (p ? [xs[i], Y(p.z)] : null)).filter(Boolean) as number[][]
          const len = pts.reduce((a, p, i) => (i ? a + Math.hypot(p[0] - pts[i - 1][0], p[1] - pts[i - 1][1]) : 0), 0)
          return (
            <g key={c}>
              <polyline points={pts.map((p) => p.join(',')).join(' ')} fill="none" stroke={C.text} strokeOpacity={0.75} strokeWidth={3}
                strokeDasharray={len} strokeDashoffset={len * (1 - Math.min(1, draw * 1.1 - li * 0.04))} />
              {pts.map((p, i) => i <= Math.floor(draw * 7) && (
                <circle key={i} cx={p[0]} cy={p[1]} r={i === 3 ? 8 + 6 * hit : 5} fill={i === 3 && hit > 0.05 ? C.bad : C.text} />
              ))}
            </g>
          )
        })}
      </svg>
      {/* callout */}
      <div style={{ position: 'absolute', right: 80, top: 380, width: 400, opacity: hit, transform: `translateX(${(1 - hit) * 30}px)` }}>
        <Mono style={{ fontSize: 22, color: C.bad }}>Day after landing</Mono>
        <div style={{ fontSize: 112, fontWeight: 900, fontStretch: '112%', color: C.bad, lineHeight: 1 }}>{fmtZ(avg)}</div>
        <Mono style={{ fontSize: 20, color: C.muted }}>avg of 4 crew</Mono>
      </div>
      <div style={{ position: 'absolute', right: 80, top: 640, width: 400, opacity: ease(f, 150, 170) }}>
        <div style={{ fontFamily: MONO, fontSize: 22, letterSpacing: 2, color: C.good, lineHeight: 1.35 }}>✓ EARTH LAB RANGE:<br />“NORMAL” FOR ALL 4</div>
        <div style={{ fontFamily: MONO, fontSize: 18, color: C.muted, marginTop: 10 }}>{lines.map(([, l]) => l[3]!.v.toFixed(1)).join(' · ')} fL<br />lab range {lines[0][1][3]!.lo}–{lines[0][1][3]!.hi} fL</div>
      </div>
    </Frame>
  )
}

/* ---------- 2 · The proof: day-1 crew-wide shift vs every crew-wide shift at recovery ---------- */
export function CrewWide() {
  const f = useCurrentFrame()
  const { fps } = useVideoConfig()
  const X0 = 200, X1 = 1720, base = 760, max = 4
  const X = (z: number) => X0 + (z / max) * (X1 - X0)
  // stack dots into columns of 0.1 SD
  const cols: Record<number, number> = {}
  const dots = data.crewWide.null.map((z, i) => { const b = Math.round(z * 10); cols[b] = (cols[b] ?? 0) + 1; return { z, h: cols[b], i } })
  const hit = spring({ frame: f - 96, fps, config: { damping: 11 } })
  const r1 = Math.abs(data.crewWide.r1)
  return (
    <Frame tag="02 / 03" source="88 CREW-WIDE SHIFTS AT RECOVERY DRAWS">
      <Headline>Bigger than any shift<br />after recovery</Headline>
      <svg width={1920} height={1080} style={{ position: 'absolute', inset: 0 }}>
        <line x1={X0} x2={X1} y1={base + 18} y2={base + 18} stroke={C.line} strokeWidth={2} />
        {[0, 1, 2, 3, 4].map((z) => <text key={z} x={X(z)} y={base + 60} fill={C.muted} fontFamily={MONO} fontSize={22} textAnchor="middle">{z}σ</text>)}
        <text x={X0} y={base + 100} fill={C.muted} fontFamily={MONO} fontSize={18}>HOW FAR THE WHOLE CREW MOVED TOGETHER (AVERAGE SHIFT, ONE TEST, ONE DRAW)</text>
        {dots.map((d) => {
          const k = ease(f, 10 + d.i * 0.6, 26 + d.i * 0.6)
          return <circle key={d.i} cx={X(d.z)} cy={base - (d.h - 1) * 22 - (1 - k) * 300} r={9} fill={C.text} opacity={0.75 * k} />
        })}
        <line x1={X(data.crewWide.nullMax)} x2={X(data.crewWide.nullMax)} y1={400} y2={base + 18} stroke={C.text} strokeDasharray="6 8" opacity={ease(f, 70, 84)} />
        <text x={X(data.crewWide.nullMax) - 14} y={420} fill={C.text} fontFamily={MONO} fontSize={22} textAnchor="end" opacity={ease(f, 70, 84)}>RECOVERY MAX {data.crewWide.nullMax.toFixed(1)}σ</text>
        <circle cx={interpolate(hit, [0, 1], [X(0), X(r1)])} cy={base} r={16 + 4 * Math.sin(f / 5)} fill={C.bad} opacity={hit > 0.02 ? 1 : 0} />
        <text x={X(r1)} y={base - 44} fill={C.bad} fontFamily={MONO} fontSize={24} textAnchor="middle" opacity={ease(f, 112, 124)}>DAY 1 · MCV {r1.toFixed(1)}σ</text>
      </svg>
      <div style={{ position: 'absolute', left: 96, bottom: 70, fontFamily: MONO, fontSize: 22, letterSpacing: 1, color: C.muted, opacity: ease(f, 130, 150) }}>
        ONE ODD VALUE: ~3% CHANCE → <span style={{ color: C.text }}>RE-TEST</span>{'   ·   '}WHOLE CREW SHIFTS TOGETHER → <span style={{ color: C.bad }}>ACT</span>
      </div>
    </Frame>
  )
}

/* ---------- 3 · The storm: ISS polar dose vs quiet baseline, Sept 9–12 2017 ---------- */
export function Storm() {
  const f = useCurrentFrame()
  const ser = data.storm.series.filter((s) => s.ratio != null) as { min: number; ratio: number }[]
  const X0 = 200, X1 = 1500, Y0 = 360, Y1 = 900, top = 13
  const m0 = ser[0].min, m1 = ser[ser.length - 1].min
  const X = (m: number) => X0 + ((m - m0) / (m1 - m0)) * (X1 - X0)
  const Y = (r: number) => Y1 - (Math.min(r, top) / top) * (Y1 - Y0)
  const prog = ease(f, 10, 120)
  const shown = ser.filter((s) => s.min <= m0 + (m1 - m0) * prog)
  const last = shown[shown.length - 1] ?? ser[0]
  const red = last.min >= data.storm.firstRed.min
  const peak = shown.reduce((m, x) => Math.max(m, x.ratio), 0)
  const flash = red ? 0.6 + 0.4 * Math.abs(Math.sin(f / 4)) : 0
  const dayStart = (d: number) => d * 1440
  return (
    <Frame tag="03 / 03" source="NASA CDAWEB · ISS TEPC DOSIMETER">
      <Headline>A real solar storm<br />Sept 11, 2017</Headline>
      <svg width={1920} height={1080} style={{ position: 'absolute', inset: 0 }}>
        <line x1={X0} x2={X1} y1={Y(2)} y2={Y(2)} stroke={C.bad} strokeDasharray="8 8" opacity={0.8} />
        <text x={X0} y={Y(2) - 12} fill={C.bad} fontFamily={MONO} fontSize={20}>SHELTER LINE · 2× QUIET</text>
        <line x1={X0} x2={X1} y1={Y(1)} y2={Y(1)} stroke={C.line} />
        <text x={X0 - 14} y={Y(1) + 7} fill={C.muted} fontFamily={MONO} fontSize={18} textAnchor="end">1×</text>
        {[5, 6, 7, 8].map((d) => (
          <g key={d}><line x1={X(dayStart(d))} x2={X(dayStart(d))} y1={Y0} y2={Y1} stroke={C.line} />
            <text x={X(dayStart(d)) + 8} y={Y1 + 40} fill={d === 7 ? C.bad : C.muted} fontFamily={MONO} fontSize={22}>SEP {4 + d}</text></g>
        ))}
        <polyline fill="none" stroke={red ? C.bad : C.accent} strokeWidth={4} points={shown.map((s) => `${X(s.min)},${Y(s.ratio)}`).join(' ')} />
        <circle cx={X(last.min)} cy={Y(last.ratio)} r={9} fill={red ? C.bad : C.accent} />
      </svg>
      <div style={{ position: 'absolute', right: 96, top: 360, width: 560, textAlign: 'right' }}>
        <Mono style={{ fontSize: 20, color: C.muted }}>{red ? 'ISS polar dose · peak' : 'ISS polar dose'}</Mono>
        <div style={{ fontSize: 132, fontWeight: 900, fontStretch: '125%', lineHeight: 1, color: red ? C.bad : C.text }}>{(red ? peak : last.ratio).toFixed(1)}×</div>
        <Mono style={{ fontSize: 20, color: C.muted }}>vs quiet baseline</Mono>
        <div style={{ marginTop: 40, opacity: ease(f, 128, 146) }}>
          <Mono style={{ fontSize: 20, color: C.muted }}>daily dose</Mono>
          <div style={{ fontSize: 56, fontWeight: 900, fontStretch: '112%' }}>{data.storm.daily['2017-09-10'].toFixed(1)} → <span style={{ color: C.bad }}>{data.storm.daily['2017-09-11'].toFixed(2)}</span></div>
          <Mono style={{ fontSize: 18, color: C.muted }}>mSv · Sept 10 vs Sept 11</Mono>
        </div>
      </div>
      {red && (
        <div style={{ position: 'absolute', left: 96, bottom: 66, display: 'flex', gap: 18, alignItems: 'center', border: `2px solid ${C.bad}`, borderLeftWidth: 10, padding: '14px 22px', background: 'rgba(40,6,12,0.9)', opacity: interpolate(flash, [0, 1], [0.5, 1], clamp) }}>
          <Mono style={{ fontSize: 26, color: '#ff8fa3', fontWeight: 700 }}>WARNING · GO TO THE STORM SHELTER</Mono>
          <Mono style={{ fontSize: 20, color: '#f2c9d0' }}>alert in minutes · Earth reply from Mars: 40 min</Mono>
        </div>
      )}
    </Frame>
  )
}
