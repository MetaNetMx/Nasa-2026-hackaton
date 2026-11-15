import { useEffect, useLayoutEffect, useState, type ReactNode } from 'react'

export type Step = {
  /** `data-tour` value of the element to spotlight; null shows a centred card */
  target: string | null
  kicker: string
  title: string
  body: ReactNode
  /** runs when the step opens: drives the app into the state the step talks about */
  apply?: () => void
}

type Rect = { left: number; top: number; width: number; height: number }

function findRect(target: string | null): Rect | null {
  if (!target) return null
  const el = document.querySelector(`[data-tour="${target}"]`)
  if (!el) return null
  const r = el.getBoundingClientRect()
  if (r.width < 2 || r.height < 2) return null
  return { left: r.left, top: r.top, width: r.width, height: r.height }
}

/** One spotlight walkthrough, used by both the interface guide and the use case. */
export function Walkthrough({ steps, label, onClose }: { steps: Step[]; label: string; onClose: () => void }) {
  const [k, setK] = useState(0)
  const step = steps[k]
  const [rect, setRect] = useState<Rect | null>(null)

  useEffect(() => { step.apply?.() }, [k]) // eslint-disable-line react-hooks/exhaustive-deps
  // Panels animate in and resize; keep re-measuring while the step is open.
  useLayoutEffect(() => {
    const tick = () => setRect((old) => { const r = findRect(step.target); return same(old, r) ? old : r })
    tick()
    const id = setInterval(tick, 120)
    return () => clearInterval(id)
  }, [step.target])
  useEffect(() => {
    const key = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
      if (e.key === 'ArrowRight') setK((x) => Math.min(steps.length - 1, x + 1))
      if (e.key === 'ArrowLeft') setK((x) => Math.max(0, x - 1))
    }
    window.addEventListener('keydown', key)
    return () => window.removeEventListener('keydown', key)
  }, [steps.length, onClose])

  const pad = 8
  const hole = rect && { left: rect.left - pad, top: rect.top - pad, width: rect.width + pad * 2, height: rect.height + pad * 2 }
  const last = k === steps.length - 1
  return (
    <div className="walk" role="dialog" aria-label={label} aria-modal="true">
      {hole ? <div className="walk-hole" style={hole} /> : <div className="walk-dim" />}
      <div className="walk-card glass" style={place(hole)}>
        <div className="walk-top">
          <span className="eyebrow">{label} · {k + 1}/{steps.length}</span>
          <button className="walk-x" onClick={onClose} aria-label="Close">✕</button>
        </div>
        <p className="walk-kicker">{step.kicker}</p>
        <h3>{step.title}</h3>
        <div className="walk-body">{step.body}</div>
        <div className="walk-nav">
          <div className="walk-dots">{steps.map((_, j) => <i key={j} className={j === k ? 'on' : j < k ? 'done' : ''} />)}</div>
          {k > 0 && <button className="btn ghost sm" onClick={() => setK(k - 1)}>Back</button>}
          <button className="btn sm" onClick={() => (last ? onClose() : setK(k + 1))}>{last ? 'Finish' : 'Next'}</button>
        </div>
      </div>
    </div>
  )
}

const same = (a: Rect | null, b: Rect | null) =>
  a === b || (!!a && !!b && Math.abs(a.left - b.left) < 0.5 && Math.abs(a.top - b.top) < 0.5 && Math.abs(a.width - b.width) < 0.5 && Math.abs(a.height - b.height) < 0.5)

/** Put the card beside the highlighted area, on whichever side has room. */
function place(h: Rect | null): React.CSSProperties {
  const W = Math.min(360, window.innerWidth - 32), vw = window.innerWidth, vh = window.innerHeight, gap = 16
  if (!h) return { width: W, left: (vw - W) / 2, top: Math.max(16, vh / 2 - 170) }
  const clampTop = (t: number) => Math.max(16, Math.min(vh - 340, t))
  if (h.left + h.width + gap + W < vw - 8) return { width: W, left: h.left + h.width + gap, top: clampTop(h.top) }
  if (h.left - gap - W > 8) return { width: W, left: h.left - gap - W, top: clampTop(h.top) }
  const left = Math.max(16, Math.min(vw - W - 16, h.left + h.width / 2 - W / 2))
  if (h.top + h.height + gap + 300 < vh) return { width: W, left, top: h.top + h.height + gap }
  return { width: W, left, top: Math.max(16, h.top - gap - 320) }
}
