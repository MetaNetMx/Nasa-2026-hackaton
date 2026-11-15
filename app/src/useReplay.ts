import { useEffect, useMemo, useState } from 'react'
import type { RadiationData, Status } from './data'

const W = 180 // minutes in the storm-detector window
export const RED = 2.0
export const YELLOW = 1.7
// Shelter decisions use dose at |lat| >= 40 deg outside the South Atlantic Anomaly, where solar
// particles enter. On Sept 4-10 2017 this peaked at 1.5x normal; the Sept 2017 storm reached 13x on Sept 11.
export const inSAA = (lat: number, lon: number) => lon > -90 && lon < 10 && lat > -50 && lat < 5

export function useReplay(data: RadiationData) {
  const n = data.rate.length
  const start = useMemo(() => new Date(data.source.start).getTime(), [data])
  const startIdx = useMemo(() => data.min.findIndex((m) => m >= 6 * 1440 + 18 * 60), [data]) // Sep 10 18:00 UTC
  const [i, setI] = useState(startIdx)
  const [playing, setPlaying] = useState(true)
  const [speed, setSpeed] = useState(20) // simulated minutes per second

  const hlBase = useMemo(() => {
    let s = 0, c = 0
    for (let k = 0; k < n && data.min[k] < 6 * 1440; k++) {
      if (Math.abs(data.lat[k]) >= 40 && !inSAA(data.lat[k], data.lon[k])) { s += data.rate[k]; c++ }
    }
    return s / c
  }, [data, n])

  useEffect(() => {
    if (!playing) return
    let raf = 0, last = performance.now(), acc = 0
    const tick = (now: number) => {
      acc += ((now - last) / 1000) * speed
      last = now
      const step = Math.floor(acc)
      if (step > 0) {
        acc -= step
        setI((x) => {
          const target = data.min[x] + step
          let y = x
          while (y < n - 1 && data.min[y + 1] <= target) y++
          if (y >= n - 1) { setPlaying(false); return n - 1 }
          return y
        })
      }
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [playing, speed, data, n])

  const now = data.min[i]
  const stats = useMemo(() => {
    let s = 0, c = 0, day = 0
    for (let k = i; k >= 0 && data.min[k] > now - 1440; k--) {
      day += data.rate[k]
      if (data.min[k] > now - W && Math.abs(data.lat[k]) >= 40 && !inSAA(data.lat[k], data.lon[k])) { s += data.rate[k]; c++ }
    }
    return { ratio: c > 3 ? s / c / hlBase : 1, last24Msv: day / 1000 }
  }, [i, now, data, hlBase])

  const status: Status = stats.ratio >= RED ? 'red' : stats.ratio >= YELLOW ? 'yellow' : 'green'
  const time = new Date(start + now * 60000).toISOString().slice(0, 16).replace('T', ' ') + ' UTC'
  const jump = (dayIdx: number, hour: number) => {
    const k = data.min.findIndex((m) => m >= dayIdx * 1440 + hour * 60)
    setI(k < 0 ? n - 1 : k)
  }
  return { i, setI, n, playing, setPlaying, speed, setSpeed, stats, status, time, jump, rateNow: data.rate[i] }
}
export type Replay = ReturnType<typeof useReplay>
