export type Point = { tp: string; day: number; v: number; lo: number | null; hi: number | null; z: number | null }
export type Analyte = {
  key: string
  label: string
  unit: string
  region: RegionId
  panel: string
  sd: number
  crew: Record<string, { points: Point[]; baseline: number | null }>
}
export type CrewData = {
  source: { mission: string; datasets: { id: string; name: string; url: string }[]; timepoints: string; method: string }
  crewIds: string[]
  analytes: Analyte[]
  summary: { checksR1: number; outsidePopulationR1: number; hiddenR1: { crew: string; key: string; label: string; v: number; z: number }[] }
}
export type RadiationData = {
  source: { instrument: string; dataset: string; url: string; unit: string; start: string }
  min: number[]
  rate: number[]
  lat: number[]
  lon: number[]
  dailyMsv: Record<string, number>
}
export type ReadinessData = {
  source: { dataset: string; url: string; subjects: string[]; note: string }
  features: string[]
  weights: number[]
  bias: number
  looAuc: Record<string, number>
  effects: Record<string, number>
  replaySubject: string
  replayBaseline: Record<string, [number, number]>
  replay: { t: number; exp: string; y: number; hr: number; resp: number; gsr: number; p: number }[]
}

export type RegionId = 'brain' | 'blood' | 'immune' | 'kidney' | 'liver' | 'bone' | 'metabolic' | 'radiation'
export type Status = 'green' | 'yellow' | 'red' | 'none'
export type Mode = 'earth' | 'baseline'

export async function loadAll() {
  const get = async <T,>(p: string): Promise<T> => {
    const r = await fetch(p)
    if (!r.ok) throw new Error(`${p}: ${r.status}`)
    return r.json()
  }
  const [crew, radiation, readiness] = await Promise.all([
    get<CrewData>('data/crew.json'),
    get<RadiationData>('data/radiation.json'),
    get<ReadinessData>('data/readiness.json'),
  ])
  return { crew, radiation, readiness }
}

/** Status of one lab value. Earth mode uses only the lab range; baseline mode adds the personal baseline. */
export function pointStatus(p: Point, mode: Mode): Status {
  const outside = p.lo != null && p.hi != null && (p.v < p.lo || p.v > p.hi)
  if (mode === 'earth') return p.lo == null ? 'none' : outside ? 'red' : 'green'
  if (outside) return 'red'
  if (p.z == null) return 'none'
  const a = Math.abs(p.z)
  return a >= 3 ? 'red' : a >= 2 ? 'yellow' : 'green'
}

export const worst = (s: Status[]): Status =>
  s.includes('red') ? 'red' : s.includes('yellow') ? 'yellow' : s.includes('green') ? 'green' : 'none'

export const sigmoid = (x: number) => 1 / (1 + Math.exp(-x))
