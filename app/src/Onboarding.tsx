import { useEffect, useRef, useState } from 'react'
import { buildSplat, type PhotoAvatar } from './avatar'

type Stage = 'intro' | 'camera' | 'processing' | 'done' | 'error'
const BASE = import.meta.env.BASE_URL
const MAX_H = 320 // stored cut-out height (keeps localStorage small)

type Pose = {
  detect: (img: HTMLCanvasElement) => {
    landmarks: { x: number; y: number; visibility?: number }[][]
    segmentationMasks?: { width: number; height: number; getAsFloat32Array: () => Float32Array; close: () => void }[]
  }
  close: () => void
}

async function loadPose(): Promise<Pose> {
  const { FilesetResolver, PoseLandmarker } = await import('@mediapipe/tasks-vision')
  const files = await FilesetResolver.forVisionTasks(`${BASE}mediapipe/wasm`)
  const opts = (delegate: 'GPU' | 'CPU') => ({
    baseOptions: { modelAssetPath: `${BASE}mediapipe/pose_landmarker_full.task`, delegate },
    runningMode: 'IMAGE' as const, numPoses: 1, outputSegmentationMasks: true,
  })
  try {
    return (await PoseLandmarker.createFromOptions(files, opts('GPU'))) as unknown as Pose
  } catch {
    return (await PoseLandmarker.createFromOptions(files, opts('CPU'))) as unknown as Pose
  }
}

/** Person cut out of the photo, cropped to the body, landmarks re-normalised to the crop. */
function cutOut(src: HTMLCanvasElement, mask: Float32Array, mw: number, mh: number, lm: { x: number; y: number; visibility?: number }[]): PhotoAvatar {
  let x0 = mw, y0 = mh, x1 = 0, y1 = 0
  for (let y = 0; y < mh; y++) for (let x = 0; x < mw; x++) if (mask[y * mw + x] > 0.5) { if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y }
  const pad = Math.round((y1 - y0) * 0.03)
  x0 = Math.max(0, x0 - pad); y0 = Math.max(0, y0 - pad); x1 = Math.min(mw - 1, x1 + pad); y1 = Math.min(mh - 1, y1 + pad)
  const cw = x1 - x0 + 1, ch = y1 - y0 + 1, k = Math.min(1, MAX_H / ch)
  const ow = Math.max(1, Math.round(cw * k)), oh = Math.max(1, Math.round(ch * k))
  // full-res cut-out first, then scale down
  const full = document.createElement('canvas')
  full.width = cw; full.height = ch
  const fg = full.getContext('2d')!
  const sx = src.width / mw, sy = src.height / mh
  fg.drawImage(src, x0 * sx, y0 * sy, cw * sx, ch * sy, 0, 0, cw, ch)
  const id = fg.getImageData(0, 0, cw, ch)
  for (let y = 0; y < ch; y++) for (let x = 0; x < cw; x++) id.data[(y * cw + x) * 4 + 3] = Math.round(Math.min(1, Math.max(0, (mask[(y + y0) * mw + x + x0] - 0.3) / 0.4)) * 255)
  fg.putImageData(id, 0, 0)
  const out = document.createElement('canvas')
  out.width = ow; out.height = oh
  out.getContext('2d')!.drawImage(full, 0, 0, ow, oh)
  return {
    img: out.toDataURL('image/png'), w: ow, h: oh, created: new Date().toISOString(),
    lm: lm.map((p) => [(p.x * mw - x0) / cw, (p.y * mh - y0) / ch, p.visibility ?? 1]),
  }
}

export function Onboarding({ accent, existing, onDone, onDelete, onClose }: {
  accent: string; existing: PhotoAvatar | null; onDone: (a: PhotoAvatar | null) => void; onDelete: () => void; onClose: () => void
}) {
  const [stage, setStage] = useState<Stage>('intro')
  const [log, setLog] = useState<string[]>([])
  const [err, setErr] = useState('')
  const [count, setCount] = useState<number | null>(null)
  const [result, setResult] = useState<PhotoAvatar | null>(null)
  const [parts, setParts] = useState<string[]>([])
  const video = useRef<HTMLVideoElement>(null)
  const stream = useRef<MediaStream | null>(null)

  const stop = () => { stream.current?.getTracks().forEach((t) => t.stop()); stream.current = null }
  useEffect(() => stop, [])

  const openCamera = async () => {
    setErr('')
    try {
      stream.current = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user', width: { ideal: 1280 }, height: { ideal: 960 } }, audio: false })
      setStage('camera')
      requestAnimationFrame(() => { if (video.current && stream.current) { video.current.srcObject = stream.current; void video.current.play() } })
    } catch (e) {
      const name = (e as DOMException)?.name
      setErr(name === 'NotAllowedError' ? 'Camera permission was denied. Allow the camera in the browser bar, or upload a photo instead.'
        : name === 'NotFoundError' ? 'No camera found on this device. Upload a photo instead.'
        : !window.isSecureContext ? 'The camera needs a secure (https) page. Upload a photo instead.'
        : 'The camera could not start. Upload a photo instead.')
    }
  }

  const capture = () => {
    const v = video.current
    if (!v || !v.videoWidth) { setErr('The camera has no picture yet. Try again in a second.'); return }
    const c = document.createElement('canvas')
    c.width = v.videoWidth; c.height = v.videoHeight
    c.getContext('2d')!.drawImage(v, 0, 0)
    stop()
    void process(c)
  }
  const timer = () => {
    let n = 10
    setCount(n)
    const id = setInterval(() => {
      n -= 1
      setCount(n)
      if (n <= 0) { clearInterval(id); setCount(null); capture() }
    }, 1000)
  }

  const upload = async (f: File | undefined) => {
    if (!f) return
    const im = new Image()
    im.src = URL.createObjectURL(f)
    try { await im.decode() } catch { setErr('That file could not be read as an image. Try a JPG or PNG.'); setStage('error'); return }
    const k = Math.min(1, 1600 / Math.max(im.naturalWidth, im.naturalHeight))
    const c = document.createElement('canvas')
    c.width = Math.round(im.naturalWidth * k); c.height = Math.round(im.naturalHeight * k)
    c.getContext('2d')!.drawImage(im, 0, 0, c.width, c.height)
    URL.revokeObjectURL(im.src)
    void process(c)
  }

  const process = async (c: HTMLCanvasElement) => {
    setStage('processing')
    const say = (l: string) => setLog((x) => [...x, l])
    setLog([])
    try {
      say('LOADING POSE MODEL · ON THIS DEVICE')
      let pose: Pose
      try { pose = await loadPose() } catch (e) { throw new Error(`The pose model could not load (${e instanceof Error ? e.message : 'network'}). Check your connection and try again.`) }
      say('SEGMENTING BODY')
      const r = pose.detect(c)
      const lm = r.landmarks[0]
      const m = r.segmentationMasks?.[0]
      if (!lm || !m) { pose.close(); throw new Error('No person found. Face the camera with at least your head and shoulders in the frame, in good light.') }
      const vis = (i: number) => lm[i]?.visibility ?? 1
      if (vis(0) < 0.5 || vis(11) < 0.5 || vis(12) < 0.5) { m.close(); pose.close(); throw new Error('We could not see your head and both shoulders. Face the camera and move back a little.') }
      say('ESTIMATING POSE · 33 LANDMARKS')
      const a = cutOut(c, m.getAsFloat32Array(), m.width, m.height, lm)
      m.close(); pose.close()
      say('SPLITTING INTO BODY PARTS')
      const sp = await buildSplat(a)
      say(`PLACING ${(sp.count / 1000).toFixed(0)}K GAUSSIAN SPLATS ON ${sp.parts.length} PARTS`)
      say('ANCHORING ORGANS TO YOUR POSE')
      setParts(sp.parts)
      setResult(a)
      setStage('done')
    } catch (e) {
      setErr(e instanceof Error ? e.message : String(e))
      setStage('error')
    }
  }

  return (
    <div className="drawer-bg center onboard-bg">
      <div className="modal panel onboard" role="dialog" aria-label="Create your avatar" style={{ '--accent': accent } as React.CSSProperties}>
        <div className="onboard-top">
          <p className="eyebrow">[ONBOARDING] · CREW AVATAR</p>
          <button className="walk-x" onClick={() => { stop(); onClose() }} aria-label="Close">✕</button>
        </div>

        {stage === 'intro' && (
          <>
            <h2 className="ob-title">ONE PHOTO.<br /><span>YOUR AVATAR.</span></h2>
            <p>Take one photo facing the camera, arms slightly away from your body. Delta-Me finds your pose, splits you into body parts (head, torso, arms, legs) and rebuilds each part in 3D as Gaussian splats, with your organs placed on your own body.</p>
            <ul className="ob-steps">
              <li><b>01</b> Full body works best; head and shoulders is enough</li>
              <li><b>02</b> Parts the photo does not show stay as hologram</li>
              <li><b>03</b> Your avatar appears in the mission world</li>
            </ul>
            <p className="fine">The photo is processed in your browser and saved only on this device. It never leaves it. Delete it any time.</p>
            {err && <p className="ob-err">{err}</p>}
            <div className="row">
              <button className="cta" onClick={openCamera}>Use camera <span>↗</span></button>
              <label className="btn ghost">Upload a photo<input type="file" accept="image/*" hidden onChange={(e) => void upload(e.target.files?.[0])} /></label>
              {existing && <button className="btn ghost" onClick={onDelete}>Delete my avatar</button>}
            </div>
          </>
        )}

        {stage === 'camera' && (
          <>
            <div className="ob-cam">
              <video ref={video} playsInline muted />
              <svg viewBox="0 0 100 160" className="ob-guide" aria-hidden>
                <circle cx="50" cy="20" r="9" /><path d="M36 34h28l6 46-8 2-3 38 3 34h-10l-2-30-2 30h-10l3-34-3-38-8-2z" />
              </svg>
              {count != null && <div className="ob-count">{count}</div>}
            </div>
            <p className="fine">Fit as much of your body as you can inside the outline: at least head and shoulders.</p>
            {err && <p className="ob-err">{err}</p>}
            <div className="row">
              <button className="cta" onClick={capture} disabled={count != null}>Capture now <span>↗</span></button>
              <button className="btn ghost" onClick={timer} disabled={count != null}>{count != null ? 'Get in position…' : '10 s timer'}</button>
              <button className="btn ghost" onClick={() => { stop(); setStage('intro') }}>Back</button>
            </div>
          </>
        )}

        {(stage === 'processing' || stage === 'done') && (
          <div className="ob-proc">
            <div className="ob-preview">
              {result ? <img src={result.img} alt="Your cut-out" /> : <div className="ob-scan" />}
            </div>
            <div className="ob-log">
              {log.map((l, k) => <p key={k}>&gt; {l} <span>✓</span></p>)}
              {stage === 'processing' && <p className="blink">&gt; _</p>}
              {stage === 'done' && (
                <>
                  <h3>AVATAR READY</h3>
                  <p className="ob-parts">{(['head', 'torso', 'arms', 'legs']).map((q) => <span key={q} className={parts.includes(q) ? 'on' : ''}>{q.toUpperCase()} {parts.includes(q) ? '✓' : '· HOLOGRAM'}</span>)}</p>
                  <p className="fine">Per-part splats from one photo: each part’s depth is estimated from its outline and bone axis, not scanned.</p>
                  <button className="cta" onClick={() => onDone(result)}>Enter the mission <span>↗</span></button>
                </>
              )}
            </div>
          </div>
        )}

        {stage === 'error' && (
          <>
            <h2 className="ob-title">TRY<br /><span>AGAIN.</span></h2>
            <p className="ob-err">{err}</p>
            <div className="row">
              <button className="cta" onClick={() => setStage('intro')}>Back <span>↗</span></button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
