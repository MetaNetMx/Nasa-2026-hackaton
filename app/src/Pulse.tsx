import { useEffect, useRef, useState } from 'react'

/**
 * Camera pulse check (remote photoplethysmography). Skin colour changes very slightly with each
 * heartbeat; averaging the green channel over the forehead and finding its dominant frequency
 * between 42 and 180 bpm gives the pulse. Everything runs on this device: no frames leave it.
 */
type Result = { bpm: number; quality: number }
type Props = { onResult: (r: Result) => void }

const SECONDS = 20
const FS = 30

function estimate(ts: number[], g: number[]): Result | null {
  if (ts.length < FS * 8) return null
  // Resample to an even 30 Hz grid.
  const t0 = ts[0], t1 = ts[ts.length - 1]
  const n = Math.floor(((t1 - t0) / 1000) * FS)
  const x = new Float64Array(n)
  let j = 0
  for (let k = 0; k < n; k++) {
    const t = t0 + (k * 1000) / FS
    while (j < ts.length - 2 && ts[j + 1] < t) j++
    const a = (t - ts[j]) / (ts[j + 1] - ts[j] || 1)
    x[k] = g[j] + a * (g[j + 1] - g[j])
  }
  // Remove slow drift with a 1 s moving average, then apply a Hann window.
  const y = new Float64Array(n)
  for (let k = 0; k < n; k++) {
    let s = 0, c = 0
    for (let m = Math.max(0, k - 15); m <= Math.min(n - 1, k + 15); m++) { s += x[m]; c++ }
    y[k] = (x[k] - s / c) * (0.5 - 0.5 * Math.cos((2 * Math.PI * k) / (n - 1)))
  }
  // Power spectrum on 0.7–3.0 Hz (42–180 bpm).
  let best = 0, bestF = 0, total = 0, cnt = 0
  for (let f = 0.7; f <= 3.0; f += 0.01) {
    let re = 0, im = 0
    for (let k = 0; k < n; k++) {
      const ph = (2 * Math.PI * f * k) / FS
      re += y[k] * Math.cos(ph)
      im -= y[k] * Math.sin(ph)
    }
    const p = re * re + im * im
    total += p; cnt++
    if (p > best) { best = p; bestF = f }
  }
  return { bpm: Math.round(bestF * 60), quality: best / (total / cnt) }
}

export function Pulse({ onResult }: Props) {
  const video = useRef<HTMLVideoElement>(null)
  const canvas = useRef<HTMLCanvasElement>(null)
  const wave = useRef<HTMLCanvasElement>(null)
  const [state, setState] = useState<'idle' | 'running' | 'done' | 'error'>('idle')
  const [left, setLeft] = useState(SECONDS)
  const [res, setRes] = useState<Result | null>(null)
  const [err, setErr] = useState('')
  const stream = useRef<MediaStream | null>(null)

  const stop = () => {
    stream.current?.getTracks().forEach((t) => t.stop())
    stream.current = null
  }
  useEffect(() => stop, [])

  const start = async () => {
    setErr('')
    setRes(null)
    try {
      stream.current = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user', width: 640, height: 480 } })
    } catch {
      setState('error')
      setErr('Camera not available or permission denied.')
      return
    }
    const v = video.current!
    v.srcObject = stream.current
    await v.play()
    setState('running')
    const ctx = canvas.current!.getContext('2d', { willReadFrequently: true })!
    const ts: number[] = [], g: number[] = []
    const began = performance.now()
    const loop = () => {
      if (!stream.current) return
      const now = performance.now()
      ctx.drawImage(v, 0, 0, 160, 120)
      // Forehead box: centre 30% wide, 12–28% from the top.
      const d = ctx.getImageData(56, 14, 48, 20).data
      let s = 0
      for (let k = 1; k < d.length; k += 4) s += d[k]
      ts.push(now)
      g.push(s / (d.length / 4))
      drawWave(g)
      const el = (now - began) / 1000
      setLeft(Math.max(0, Math.ceil(SECONDS - el)))
      if (el >= SECONDS) {
        stop()
        const r = estimate(ts, g)
        setState('done')
        if (r) { setRes(r); onResult(r) } else setErr('Not enough frames. Try again in better light.')
        return
      }
      requestAnimationFrame(loop)
    }
    requestAnimationFrame(loop)
  }

  const drawWave = (g: number[]) => {
    const c = wave.current
    if (!c) return
    const ctx = c.getContext('2d')!
    const last = g.slice(-150)
    const mn = Math.min(...last), mx = Math.max(...last)
    ctx.clearRect(0, 0, c.width, c.height)
    ctx.strokeStyle = '#5eead4'
    ctx.lineWidth = 2
    ctx.beginPath()
    last.forEach((v, k) => {
      const x = (k / 149) * c.width
      const y = c.height - ((v - mn) / (mx - mn || 1)) * c.height
      if (k === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y)
    })
    ctx.stroke()
  }

  const good = res && res.quality >= 4
  return (
    <div className="pulse">
      <div className="cam">
        <video ref={video} muted playsInline className={state === 'running' ? '' : 'hidden'} />
        {state === 'running' && <div className="roi" aria-hidden="true" />}
        {state !== 'running' && <div className="cam-off">Camera off</div>}
      </div>
      <canvas ref={canvas} width={160} height={120} className="hidden" />
      <canvas ref={wave} width={300} height={50} className="wave" aria-hidden="true" />
      {state === 'running' ? (
        <p>Hold still, forehead in the box, good light. {left} s…</p>
      ) : (
        <button className="btn" onClick={start}>{state === 'done' ? 'Measure again' : 'Start 20-second pulse check'}</button>
      )}
      {res && (
        <p className={good ? '' : 's-yellow-text'}>
          Pulse <b>{res.bpm} bpm</b> · signal quality {res.quality.toFixed(1)} {good ? '' : '(low: re-measure with more light and less movement)'}
        </p>
      )}
      {err && <p className="s-red-text">{err}</p>}
      <p className="muted small">Processed on this device only. Not a medical device.</p>
    </div>
  )
}
