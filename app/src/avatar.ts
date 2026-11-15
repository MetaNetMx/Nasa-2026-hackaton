import type { RegionId } from './data'

/**
 * A personal avatar made from one full-body photo.
 * `img` is the person cut out of the photo (alpha = body mask), at most 320 px tall.
 * `lm` are the 33 MediaPipe pose landmarks, normalised to that cut-out image.
 * Everything stays in this browser.
 */
export type PhotoAvatar = { img: string; w: number; h: number; lm: [number, number][]; created: string }

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
export type OrganDef = { id: RegionId; parts: { p: V; r: number; s?: V }[]; label: V }
export type Splat = { pos: Float32Array; col: Float32Array; size: number; count: number; organs: OrganDef[] }

const BODY_H = 1.75 // body units: feet at y = 0, top of head at 1.75

/**
 * Single-photo 2.5D Gaussian splatting: every body pixel becomes a soft Gaussian.
 * Depth is inflated from the distance to the body outline, so the torso is thicker than the arms;
 * a darker back layer gives the figure volume when it turns.
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
  const dist = chamfer(inside, W, H)
  let dmax = 1
  for (let k = 0; k < dist.length; k++) if (dist[k] > dmax) dmax = dist[k]

  const L = (i: number) => a.lm[i] ?? [0.5, 0.5]
  const hipX = ((L(23)[0] + L(24)[0]) / 2) * W
  const s = BODY_H / Math.max(1, bottom - top)
  const toBody = (x: number, y: number): [number, number] => [(x - hipX) * s, (bottom - y) * s]

  const pos: number[] = [], col: number[] = []
  for (let y = top; y <= bottom; y++) for (let x = 0; x < W; x++) {
    const k = y * W + x
    if (!inside[k]) continue
    const [bx, by] = toBody(x, y)
    const depth = 0.12 * Math.sqrt(dist[k] / dmax)
    const r = px[k * 4] / 255, gg = px[k * 4 + 1] / 255, b = px[k * 4 + 2] / 255
    pos.push(bx, by, depth); col.push(r, gg, b)
    pos.push(bx, by, -depth * 0.85); col.push(r * 0.45, gg * 0.45, b * 0.45)
  }

  return { pos: new Float32Array(pos), col: new Float32Array(col), size: s * 2.4, count: pos.length / 3, organs: organsFromPose(a, toBody, W, H) }
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
function organsFromPose(a: PhotoAvatar, toBody: (x: number, y: number) => [number, number], W: number, H: number): OrganDef[] {
  const P = (i: number) => toBody((a.lm[i]?.[0] ?? 0.5) * W, (a.lm[i]?.[1] ?? 0.5) * H)
  const [nx, ny] = P(0)
  const lSh = P(11), rSh = P(12), lHip = P(23), rHip = P(24)
  const sh: [number, number] = [(lSh[0] + rSh[0]) / 2, (lSh[1] + rSh[1]) / 2]
  const hip: [number, number] = [(lHip[0] + rHip[0]) / 2, (lHip[1] + rHip[1]) / 2]
  const sw = Math.abs(lSh[0] - rSh[0]) || 0.4
  // the person's left side: the side of the left shoulder landmark
  const left = Math.sign(lSh[0] - rSh[0]) || 1
  const torso = (t: number, side: number, z = 0.05): V => [sh[0] + (hip[0] - sh[0]) * t + side * left * sw, sh[1] + (hip[1] - sh[1]) * t, z]
  const lab = (p: V, out: number): V => [p[0] + out * (sw * 0.9 + 0.1), p[1], 0]
  const mid = (i: number, j: number): V => { const A = P(i), B = P(j); return [(A[0] + B[0]) / 2, (A[1] + B[1]) / 2, 0.04] }
  const head: V = [nx, ny + 0.03, 0.02]
  const heart = torso(0.28, 0.1), liver = torso(0.55, -0.22), spleen = torso(0.55, 0.26), panc = torso(0.62, 0.05, 0.06)
  const kL = torso(0.7, 0.18, -0.03), kR = torso(0.7, -0.18, -0.03)
  const r = sw / 0.47 // organ size follows body width
  return [
    { id: 'brain', parts: [{ p: head, r: 0.068 * r, s: [1, 0.8, 1.1] }], label: lab(head, 0.6) },
    { id: 'blood', parts: [{ p: heart, r: 0.048 * r }], label: lab(heart, 1) },
    { id: 'liver', parts: [{ p: liver, r: 0.06 * r, s: [1.4, 0.7, 0.9] }], label: lab(liver, -1) },
    { id: 'immune', parts: [{ p: spleen, r: 0.036 * r, s: [0.8, 1.2, 0.8] }], label: lab(spleen, 1) },
    { id: 'metabolic', parts: [{ p: panc, r: 0.042 * r, s: [1.3, 0.8, 0.8] }], label: lab([panc[0], panc[1] - 0.06, 0], 1) },
    { id: 'kidney', parts: [{ p: kL, r: 0.032 * r, s: [0.8, 1.3, 0.8] }, { p: kR, r: 0.032 * r, s: [0.8, 1.3, 0.8] }], label: lab(kR, -1) },
    { id: 'bone', parts: [mid(23, 25), mid(24, 26), mid(25, 27), mid(26, 28)].map((p) => ({ p, r: 0.028 * r, s: [1, 6.5, 1] as V })), label: lab(mid(24, 26), -1) },
  ]
}
