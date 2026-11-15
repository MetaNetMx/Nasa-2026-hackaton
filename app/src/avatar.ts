import type { RegionId } from './data'

/**
 * A personal avatar made from one photo (full body or upper body).
 * `img` is the person cut out of the photo (alpha = body mask), at most 320 px tall.
 * `lm` are the 33 MediaPipe pose landmarks [x, y, visibility], normalised to that cut-out image.
 * Everything stays in this browser.
 */
export type PhotoAvatar = { img: string; w: number; h: number; lm: number[][]; created: string }

const KEY = 'delta-me-photo-avatar'

export function loadAvatar(): PhotoAvatar | null {
  try {
    const raw = localStorage.getItem(KEY)
    return raw ? (JSON.parse(raw) as PhotoAvatar) : null
  } catch {
    return null
  }
}

export function saveAvatar(a: PhotoAvatar | null) {
  try {
    if (a) localStorage.setItem(KEY, JSON.stringify(a))
    else localStorage.removeItem(KEY)
  } catch {
    /* storage full or blocked: the avatar still works for this session */
  }
}

type V = [number, number, number]
/** An organ marker: where each anatomical mesh goes (body units) and its scale (1 = real size). */
export type OrganDef = { id: RegionId; parts: { p: V; k: number }[]; label: V }
export type PartId = 'head' | 'torso' | 'arms' | 'legs'
export type Splat = {
  pos: Float32Array; col: Float32Array; size: number; count: number; organs: OrganDef[]
  /** body parts rebuilt from the photo; everything below `clipY` (body units) stays hologram */
  parts: PartId[]; clipY: number
}

type P2 = [number, number]
type Seg = { part: PartId; a: P2; b: P2; kz: number; reach: number }

const SHOULDER_W = 0.36 // body units between the two shoulder joints (adult average)
const SHOULDER_Y = 1.44 // shoulder height on a 1.75 body

/**
 * Per-part Gaussian splatting from one photo.
 * The pose splits the body into parts (head, torso, upper arms, forearms, thighs, shins). Each body pixel joins
 * the nearest part and becomes a Gaussian on that part's rounded cross-section: depth = sqrt(w² − d²) around the
 * part's bone axis, so limbs are cylinders and the torso an ellipse, not a flat cut-out. A darker back layer closes
 * each part. Parts the photo does not show (often the legs on a desk webcam) stay as hologram.
 */
export async function buildSplat(a: PhotoAvatar): Promise<Splat> {
  const im = new Image()
  im.src = a.img
  await im.decode()
  const W = im.naturalWidth, H = im.naturalHeight
  const cv = document.createElement('canvas')
  cv.width = W
  cv.height = H
  const g = cv.getContext('2d', { willReadFrequently: true })!
  g.drawImage(im, 0, 0)
  const px = g.getImageData(0, 0, W, H).data
  const inside = new Uint8Array(W * H)
  let top = H, bottom = 0
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    if (px[(y * W + x) * 4 + 3] > 110) { inside[y * W + x] = 1; if (y < top) top = y; if (y > bottom) bottom = y }
  }
  const edge = smooth(chamfer(inside, W, H), inside, W, H) // ~3 per pixel, smoothed so depth has no steps

  const L = (i: number): P2 => [(a.lm[i]?.[0] ?? 0.5) * W, (a.lm[i]?.[1] ?? 0.5) * H]
  const vis = (i: number) => a.lm[i]?.[2] ?? 1
  const inFrame = (i: number) => { const q = a.lm[i]; return !!q && q[0] > -0.02 && q[0] < 1.02 && q[1] > -0.02 && q[1] < 1.02 }
  const ok = (...ids: number[]) => ids.every((i) => vis(i) > 0.5 && inFrame(i))
  const mid = (p: P2, q: P2): P2 => [(p[0] + q[0]) / 2, (p[1] + q[1]) / 2]
  const ext = (p: P2, q: P2, k: number): P2 => [q[0] + (q[0] - p[0]) * k, q[1] + (q[1] - p[1]) * k]

  const sh = mid(L(11), L(12))
  const swPx = Math.max(4, Math.hypot(L(11)[0] - L(12)[0], L(11)[1] - L(12)[1]))
  const hipsSeen = ok(23, 24)
  const hip: P2 = hipsSeen ? mid(L(23), L(24)) : [sh[0], sh[1] + swPx * 1.45]
  const feetSeen = ok(27, 28) && vis(27) > 0.6 && vis(28) > 0.6 && Math.min(L(27)[1], L(28)[1]) - hip[1] > Math.hypot(hip[0] - sh[0], hip[1] - sh[1]) * 0.9

  // scale and vertical anchor: full height when the feet are in the photo, shoulder width otherwise
  const s = feetSeen ? 1.75 / Math.max(1, bottom - top) : SHOULDER_W / swPx
  const y0 = feetSeen ? bottom : sh[1] + SHOULDER_Y / s
  const toBody = (x: number, y: number): [number, number] => [(x - hip[0]) * s, (y0 - y) * s]

  const segs: Seg[] = []
  if (ok(0)) segs.push({ part: 'head', a: sh, b: ext(sh, L(0), 0.75), kz: 0.9, reach: swPx * 0.55 })
  segs.push({ part: 'torso', a: sh, b: hip, kz: 0.55, reach: swPx * 0.8 })
  for (const [s0, e0, w0] of [[11, 13, 15], [12, 14, 16]]) {
    if (ok(s0, e0)) segs.push({ part: 'arms', a: L(s0), b: L(e0), kz: 0.95, reach: swPx * 0.32 })
    if (ok(e0, w0)) segs.push({ part: 'arms', a: L(e0), b: ext(L(e0), L(w0), 0.3), kz: 0.95, reach: swPx * 0.28 })
  }
  // legs only count when clearly seen and leg-length: the pose model invents squashed legs just inside the frame
  const torsoPx = Math.hypot(hip[0] - sh[0], hip[1] - sh[1])
  const legOk = (i: number, j: number) => vis(i) > 0.6 && vis(j) > 0.6 && inFrame(i) && inFrame(j) && Math.hypot(L(j)[0] - L(i)[0], L(j)[1] - L(i)[1]) > torsoPx * 0.4
  for (const [h0, k0, a0] of [[23, 25, 27], [24, 26, 28]]) {
    if (!legOk(h0, k0)) continue
    segs.push({ part: 'legs', a: L(h0), b: L(k0), kz: 0.95, reach: swPx * 0.42 })
    if (legOk(k0, a0)) segs.push({ part: 'legs', a: L(k0), b: ext(L(k0), L(a0), 0.18), kz: 0.95, reach: swPx * 0.36 })
  }

  const pos: number[] = [], col: number[] = []
  const used = new Set<PartId>()
  let lowest = Infinity
  for (let y = top; y <= bottom; y++) for (let x = 0; x < W; x++) {
    const k = y * W + x
    if (!inside[k]) continue
    let best: Seg | null = null, bd = Infinity
    for (const sg of segs) { const d = segDist(x, y, sg.a, sg.b); if (d < bd) { bd = d; best = sg } }
    if (!best || bd > best.reach) continue // pixel belongs to a part the pose did not find
    const w = bd + edge[k] / 3 // half-width of the part along this pixel's cross-section
    const z = best.kz * Math.sqrt(Math.max(0, w * w - bd * bd)) * s
    const [bx, by] = toBody(x, y)
    const r = px[k * 4] / 255, gg = px[k * 4 + 1] / 255, b = px[k * 4 + 2] / 255
    pos.push(bx, by, z); col.push(r, gg, b)
    pos.push(bx, by, -z); col.push(r * 0.5, gg * 0.5, b * 0.5)
    used.add(best.part)
    if (by < lowest) lowest = by
  }
  const parts = (['head', 'torso', 'arms', 'legs'] as PartId[]).filter((q) => used.has(q))
  return {
    pos: new Float32Array(pos), col: new Float32Array(col), size: s * 3.4, count: pos.length / 3,
    organs: organsFromPose(a, toBody, W, H, hip), parts, clipY: feetSeen && parts.includes('legs') ? -1 : lowest + 0.04,
  }
}

function segDist(x: number, y: number, a: P2, b: P2) {
  const dx = b[0] - a[0], dy = b[1] - a[1], l2 = dx * dx + dy * dy || 1
  const t = Math.max(0, Math.min(1, ((x - a[0]) * dx + (y - a[1]) * dy) / l2))
  return Math.hypot(x - (a[0] + t * dx), y - (a[1] + t * dy))
}
/** Two 3x3 box blurs inside the body: removes the chamfer's stair-steps. */
function smooth(d: Float32Array, m: Uint8Array, W: number, H: number) {
  let a: Float32Array = d, out: Float32Array = new Float32Array(d.length)
  for (let pass = 0; pass < 2; pass++) {
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
      const k = y * W + x
      if (!m[k]) { out[k] = 0; continue }
      let s = 0, n = 0
      for (let j = -1; j <= 1; j++) for (let i = -1; i <= 1; i++) {
        const xx = x + i, yy = y + j
        if (xx < 0 || yy < 0 || xx >= W || yy >= H) continue
        s += a[yy * W + xx]; n++
      }
      out[k] = s / n
    }
    ;[a, out] = [out, a]
  }
  return a
}

/** Two-pass 3-4 chamfer distance from each body pixel to the outline. */
function chamfer(m: Uint8Array, W: number, H: number) {
  const d = new Float32Array(W * H)
  const INF = 1e6
  for (let k = 0; k < d.length; k++) d[k] = m[k] ? INF : 0
  const at = (x: number, y: number) => (x < 0 || y < 0 || x >= W || y >= H ? 0 : d[y * W + x])
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    const k = y * W + x
    if (!d[k]) continue
    d[k] = Math.min(d[k], at(x - 1, y) + 3, at(x, y - 1) + 3, at(x - 1, y - 1) + 4, at(x + 1, y - 1) + 4)
  }
  for (let y = H - 1; y >= 0; y--) for (let x = W - 1; x >= 0; x--) {
    const k = y * W + x
    if (!d[k]) continue
    d[k] = Math.min(d[k], at(x + 1, y) + 3, at(x, y + 1) + 3, at(x + 1, y + 1) + 4, at(x - 1, y + 1) + 4)
  }
  return d
}

/** Place the organ markers from the detected pose (MediaPipe indices: 0 nose, 11/12 shoulders, 23/24 hips, 25/26 knees, 27/28 ankles). */
function organsFromPose(a: PhotoAvatar, toBody: (x: number, y: number) => [number, number], W: number, H: number, hipPx: P2): OrganDef[] {
  const P = (i: number) => toBody((a.lm[i]?.[0] ?? 0.5) * W, (a.lm[i]?.[1] ?? 0.5) * H)
  const [nx, ny] = P(0)
  const lSh = P(11), rSh = P(12)
  const sh: [number, number] = [(lSh[0] + rSh[0]) / 2, (lSh[1] + rSh[1]) / 2]
  const hip = toBody(hipPx[0], hipPx[1])
  const sw = Math.abs(lSh[0] - rSh[0]) || 0.4
  // the person's left side: the side of the left shoulder landmark
  const left = Math.sign(lSh[0] - rSh[0]) || 1
  const torso = (t: number, side: number, z = 0.05): V => [sh[0] + (hip[0] - sh[0]) * t + side * left * sw, sh[1] + (hip[1] - sh[1]) * t, z]
  const lab = (p: V, out: number): V => [p[0] + out * (sw * 0.9 + 0.1), p[1], 0]
  const head: V = [nx, ny + 0.03, 0.02]
  const heart = torso(0.28, 0.1), liver = torso(0.55, -0.22), spleen = torso(0.55, 0.26), panc = torso(0.62, 0.05, 0.06)
  const kL = torso(0.7, 0.18, -0.03), kR = torso(0.7, -0.18, -0.03)
  const k = sw / 0.4 // organ size follows shoulder width (reference body: ~0.40 m)
  const pelvis: V = [hip[0], hip[1] + 0.04 * k, 0]
  return [
    { id: 'brain', parts: [{ p: head, k }], label: lab(head, 0.6) },
    { id: 'blood', parts: [{ p: heart, k }], label: lab(heart, 1) },
    { id: 'liver', parts: [{ p: liver, k }], label: lab(liver, -1) },
    { id: 'immune', parts: [{ p: spleen, k }], label: lab(spleen, 1) },
    { id: 'metabolic', parts: [{ p: panc, k }], label: lab([panc[0], panc[1] - 0.06, 0], 1) },
    { id: 'kidney', parts: [{ p: kL, k }, { p: kR, k }], label: lab(kR, -1) },
    { id: 'bone', parts: [{ p: pelvis, k }], label: lab(pelvis, -1) },
  ]
}

