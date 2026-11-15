import { useEffect, useState } from 'react'
import type { Status } from './data'

/**
 * Live near-Earth radiation from NOAA's Space Weather Prediction Center:
 * GOES primary satellite integral proton flux (>=10 MeV drives the NOAA solar radiation storm S-scale;
 * >=100 MeV is the part that gets through spacecraft walls) plus NOAA's current S-scale and today's
 * probability of an S1+ storm. Public JSON with open CORS.
 */
const PROTONS = 'https://services.swpc.noaa.gov/json/goes/primary/integral-protons-1-day.json'
const SCALES = 'https://services.swpc.noaa.gov/products/noaa-scales.json'
export const LIVE_SOURCE = 'https://www.swpc.noaa.gov/products/goes-proton-flux'
const POLL_MS = 5 * 60 * 1000

export type Live = {
  loading: boolean
  error: string | null
  time: string
  satellite: number | null
  flux10: number
  flux100: number
  scale: number
  status: Status
  probS1: number | null
  series: { t: number; f: number }[]
}

/** NOAA S-scale from >=10 MeV proton flux (pfu): S1 >= 10, S2 >= 100, S3 >= 1e3, S4 >= 1e4, S5 >= 1e5. */
export const sScale = (pfu: number) => (pfu >= 1e5 ? 5 : pfu >= 1e4 ? 4 : pfu >= 1e3 ? 3 : pfu >= 100 ? 2 : pfu >= 10 ? 1 : 0)
/** NOAA SWPC's >=100 MeV proton event alert threshold, in pfu. */
export const P100_ALERT = 1
/**
 * Crew rule used here, from public NOAA and NASA wording:
 * - Warning (storm shelter per vehicle procedure) at S3+: the first level where NOAA's scale names astronauts
 *   ("radiation hazard avoidance recommended for astronauts on EVA").
 * - Caution (limit EVA, be ready to shelter) at S1-S2, or when >=100 MeV protons reach NOAA's 1 pfu alert level:
 *   NASA's Space Radiation Analysis Group assesses moving the crew to a more shielded area when those protons rise.
 */
export const liveStatus = (scale: number, flux100: number): Status =>
  scale >= 3 ? 'red' : scale >= 1 || flux100 >= P100_ALERT ? 'yellow' : 'green'

const EMPTY: Live = { loading: true, error: null, time: '', satellite: null, flux10: 0, flux100: 0, scale: 0, status: 'none', probS1: null, series: [] }

export function useLive(on: boolean): Live {
  const [live, setLive] = useState<Live>(EMPTY)
  useEffect(() => {
    if (!on) return
    let alive = true
    const pull = async () => {
      try {
        const [pr, sc] = await Promise.all([fetch(PROTONS, { cache: 'no-store' }), fetch(SCALES, { cache: 'no-store' }).catch(() => null)])
        if (!pr.ok) throw new Error(`NOAA feed ${pr.status}`)
        const rows = (await pr.json()) as { time_tag: string; satellite: number; flux: number; energy: string }[]
        const p10 = rows.filter((r) => r.energy === '>=10 MeV' && r.flux > 0)
        const p100 = rows.filter((r) => r.energy === '>=100 MeV' && r.flux > 0)
        if (!p10.length) throw new Error('NOAA feed has no >=10 MeV data right now')
        const last = p10[p10.length - 1]
        let probS1: number | null = null
        if (sc?.ok) {
          const j = await sc.json()
          const v = Number(j?.['1']?.S?.Prob)
          probS1 = Number.isFinite(v) ? v : null
        }
        const flux10 = last.flux, scale = sScale(flux10)
        const flux100 = p100.length ? p100[p100.length - 1].flux : 0
        if (alive) setLive({
          loading: false, error: null, time: last.time_tag, satellite: last.satellite, flux10, flux100,
          scale, status: liveStatus(scale, flux100), probS1,
          series: p10.map((r) => ({ t: Date.parse(r.time_tag), f: r.flux })),
        })
      } catch (e) {
        if (alive) setLive((x) => ({ ...x, loading: false, error: e instanceof Error ? e.message : String(e) }))
      }
    }
    void pull()
    const id = setInterval(pull, POLL_MS)
    return () => { alive = false; clearInterval(id) }
  }, [on])
  return live
}
