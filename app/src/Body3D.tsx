import { Html } from '@react-three/drei'
import { useFrame, type ThreeEvent } from '@react-three/fiber'
import { useMemo, useRef, useState } from 'react'
import * as THREE from 'three'
import type { RegionId, Status } from './data'
import { REGIONS } from './content'

export const STATUS_HEX: Record<Status, string> = { green: '#34d399', yellow: '#fbbf24', red: '#f87171', none: '#5b6b88' }

/* ---------- procedural hologram body (point cloud, body units: feet at y=0, head ~1.75) ---------- */

type V = [number, number, number]
function capsule(out: number[], nrm: number[], a: V, b: V, r0: number, r1: number, count: number) {
  const A = new THREE.Vector3(...a), B = new THREE.Vector3(...b)
  const axis = B.clone().sub(A)
  const len = axis.length()
  axis.normalize()
  const u = Math.abs(axis.x) > 0.9 ? new THREE.Vector3(0, 0, 1) : new THREE.Vector3(1, 0, 0)
  const v1 = u.clone().cross(axis).normalize()
  const v2 = axis.clone().cross(v1).normalize()
  for (let k = 0; k < count; k++) {
    const t = Math.random(), th = Math.random() * Math.PI * 2
    const r = r0 + (r1 - r0) * t
    const n = v1.clone().multiplyScalar(Math.cos(th)).add(v2.clone().multiplyScalar(Math.sin(th)))
    const p = A.clone().addScaledVector(axis, t * len).addScaledVector(n, r)
    out.push(p.x, p.y, p.z)
    nrm.push(n.x, n.y, n.z)
  }
}
function ellipsoid(out: number[], nrm: number[], c: V, r: V, count: number, yCut?: [number, number]) {
  for (let k = 0; k < count; k++) {
    const u = Math.random() * 2 - 1, th = Math.random() * Math.PI * 2
    if (yCut && (u < yCut[0] || u > yCut[1])) { k--; continue }
    const s = Math.sqrt(1 - u * u)
    const n = [s * Math.cos(th), u, s * Math.sin(th)]
    out.push(c[0] + r[0] * n[0], c[1] + r[1] * n[1], c[2] + r[2] * n[2])
    nrm.push(n[0] / r[0], n[1] / r[1], n[2] / r[2])
  }
}
function torso(out: number[], nrm: number[], count: number) {
  for (let k = 0; k < count; k++) {
    const y = 0.92 + Math.random() * 0.54
    const t = (y - 0.92) / 0.54
    const w = 0.165 - 0.035 * Math.sin(Math.PI * Math.min(1, t * 1.4)) + (0.07 * Math.max(0, t - 0.6)) / 0.4
    const d = 0.1 + 0.015 * Math.sin(Math.PI * t)
    const th = Math.random() * Math.PI * 2
    out.push(w * Math.cos(th), y, d * Math.sin(th))
    nrm.push(Math.cos(th) / w, 0, Math.sin(th) / d)
  }
}

function buildBody() {
  const p: number[] = [], n: number[] = []
  ellipsoid(p, n, [0, 1.63, 0], [0.092, 0.118, 0.104], 3200)
  capsule(p, n, [0, 1.44, 0], [0, 1.53, 0], 0.052, 0.046, 500)
  torso(p, n, 7000)
  ellipsoid(p, n, [0, 1.42, 0], [0.235, 0.06, 0.11], 1200, [-0.2, 1])
  for (const s of [-1, 1]) {
    ellipsoid(p, n, [s * 0.2, 1.42, 0], [0.06, 0.06, 0.06], 400)
    // arms slightly raised and bent: a floating, microgravity pose
    capsule(p, n, [s * 0.215, 1.41, 0], [s * 0.33, 1.2, 0.05], 0.048, 0.04, 1300)
    capsule(p, n, [s * 0.33, 1.2, 0.05], [s * 0.4, 0.98, 0.16], 0.04, 0.032, 1100)
    ellipsoid(p, n, [s * 0.415, 0.93, 0.19], [0.03, 0.055, 0.025], 400)
    capsule(p, n, [s * 0.09, 0.95, 0], [s * 0.12, 0.53, 0.08], 0.085, 0.055, 2400)
    capsule(p, n, [s * 0.12, 0.53, 0.08], [s * 0.12, 0.12, -0.02], 0.055, 0.04, 1900)
    ellipsoid(p, n, [s * 0.125, 0.07, 0.03], [0.045, 0.035, 0.1], 500)
  }
  const count = p.length / 3
  const g = new THREE.BufferGeometry()
  g.setAttribute('position', new THREE.Float32BufferAttribute(p, 3))
  g.setAttribute('normal', new THREE.Float32BufferAttribute(n, 3))
  g.normalizeNormals()
  const seed = new Float32Array(count), scatter = new Float32Array(count * 3)
  for (let k = 0; k < count; k++) {
    seed[k] = Math.random()
    const u = Math.random() * 2 - 1, th = Math.random() * Math.PI * 2, r = 1.2 + Math.random() * 2.5
    const s = Math.sqrt(1 - u * u)
    scatter.set([r * s * Math.cos(th), 0.9 + r * u, r * s * Math.sin(th)], k * 3)
  }
  g.setAttribute('seed', new THREE.BufferAttribute(seed, 1))
  g.setAttribute('scatter', new THREE.BufferAttribute(scatter, 3))
  return g
}

const HEART = new THREE.Vector3(0.035, 1.3, 0.04)

const vert = /* glsl */ `
  uniform float uTime, uScan, uAssemble, uBurst;
  uniform vec3 uHeart;
  attribute float seed; attribute vec3 scatter;
  varying float vGlow, vScan, vBeat;
  void main() {
    vec3 p = position;
    float chest = smoothstep(0.95, 1.15, p.y) * (1.0 - smoothstep(1.4, 1.5, p.y));
    p.xz *= 1.0 + chest * 0.022 * sin(uTime * 1.7);
    float a = clamp(uAssemble * 1.25 - seed * 0.25, 0.0, 1.0);
    a = 1.0 - pow(1.0 - a, 3.0);
    p = mix(scatter, p, a);
    vec4 mv = modelViewMatrix * vec4(p, 1.0);
    vec3 n = normalize(normalMatrix * normal);
    float rim = 1.0 - abs(dot(n, normalize(-mv.xyz)));
    float scan = smoothstep(0.035, 0.0, abs(position.y - uScan));
    float burst = smoothstep(0.06, 0.0, abs(position.y - uBurst)) * step(-0.1, uBurst);
    vScan = max(scan, burst * 1.5);
    float ph = fract(uTime * 1.15);
    float d = distance(position, uHeart);
    vBeat = smoothstep(0.06, 0.0, abs(d - ph * 0.9)) * (1.0 - ph);
    vGlow = 0.25 + 0.75 * pow(rim, 1.6) + 0.12 * sin(uTime * 2.0 + seed * 40.0);
    gl_PointSize = (1.4 + 2.2 * vScan + 1.5 * vBeat + seed * 0.8) * (uPx / -mv.z) * (0.6 + 0.4 * a);
    gl_Position = projectionMatrix * mv;
  }`.replace('uniform vec3 uHeart;', 'uniform vec3 uHeart; uniform float uPx;')
const frag = /* glsl */ `
  uniform vec3 uColor, uBeatColor;
  varying float vGlow, vScan, vBeat;
  void main() {
    float d = length(gl_PointCoord - 0.5);
    if (d > 0.5) discard;
    vec3 c = mix(uColor, uBeatColor, clamp(vBeat * 1.4, 0.0, 1.0));
    c = mix(c, vec3(1.0), vScan * 0.8);
    gl_FragColor = vec4(c, (vGlow * 0.55 + vScan + vBeat * 0.8) * (1.0 - d * 1.6));
  }`

function Hologram({ burstAt, beatColor, px }: { burstAt: number; beatColor: string; px: number }) {
  const geo = useMemo(buildBody, [])
  const mat = useRef<THREE.ShaderMaterial>(null)
  const born = useRef<number | null>(null)
  const burst = useRef({ at: burstAt, start: -10 })
  const init = useMemo(
    () => ({
      uTime: { value: 0 }, uScan: { value: 0 }, uAssemble: { value: 0 }, uBurst: { value: -1 }, uPx: { value: 1 },
      uHeart: { value: HEART.clone() }, uColor: { value: new THREE.Color('#5eead4') }, uBeatColor: { value: new THREE.Color('#34d399') },
    }),
    [],
  )
  useFrame(({ clock }) => {
    const u = mat.current?.uniforms
    if (!u) return
    const t = clock.getElapsedTime()
    if (born.current == null) born.current = t
    if (burst.current.at !== burstAt) burst.current = { at: burstAt, start: t }
    u.uTime.value = t
    u.uAssemble.value = Math.min(1, (t - born.current) / 2.6)
    u.uScan.value = 0.9 + 0.95 * Math.sin(t * 0.6)
    u.uPx.value = px
    ;(u.uBeatColor.value as THREE.Color).set(beatColor)
    const b = (t - burst.current.start) / 1.1
    u.uBurst.value = b >= 0 && b <= 1 ? b * 1.9 : -1
  })
  return (
    <points geometry={geo} frustumCulled={false}>
      <shaderMaterial ref={mat} vertexShader={vert} fragmentShader={frag} uniforms={init} transparent depthWrite={false} blending={THREE.AdditiveBlending} />
    </points>
  )
}

/* ---------- organs ---------- */

const ORGAN_V = /* glsl */ `
  varying vec3 vN; varying vec3 vV;
  void main() {
    vec4 mv = modelViewMatrix * vec4(position, 1.0);
    vN = normalize(normalMatrix * normal); vV = normalize(-mv.xyz);
    gl_Position = projectionMatrix * mv;
  }`
const ORGAN_F = /* glsl */ `
  uniform vec3 uColor; uniform float uCore;
  varying vec3 vN; varying vec3 vV;
  void main() {
    float rim = pow(1.0 - abs(dot(vN, vV)), 2.2);
    gl_FragColor = vec4(uColor * (uCore + 1.4 * rim), uCore + rim);
  }`
const HALO_F = /* glsl */ `
  uniform vec3 uColor; uniform float uCore;
  varying vec3 vN; varying vec3 vV;
  void main() {
    float f = pow(abs(dot(vN, vV)), 3.0);
    gl_FragColor = vec4(uColor, f * uCore);
  }`

const ORGANS: { id: RegionId; parts: { p: V; r: number; s?: V }[]; label: V }[] = [
  { id: 'brain', parts: [{ p: [0, 1.655, 0.005], r: 0.068, s: [1, 0.8, 1.1] }], label: [0.14, 1.74, 0] },
  { id: 'blood', parts: [{ p: [0.035, 1.3, 0.04], r: 0.048 }], label: [0.24, 1.36, 0] },
  { id: 'liver', parts: [{ p: [-0.065, 1.18, 0.035], r: 0.06, s: [1.4, 0.7, 0.9] }], label: [-0.28, 1.22, 0] },
  { id: 'immune', parts: [{ p: [0.1, 1.17, -0.01], r: 0.036, s: [0.8, 1.2, 0.8] }], label: [0.3, 1.16, 0] },
  { id: 'metabolic', parts: [{ p: [0.03, 1.1, 0.06], r: 0.042, s: [1.3, 0.8, 0.8] }], label: [0.26, 1.04, 0] },
  { id: 'kidney', parts: [{ p: [-0.065, 1.04, -0.05], r: 0.032, s: [0.8, 1.3, 0.8] }, { p: [0.065, 1.04, -0.05], r: 0.032, s: [0.8, 1.3, 0.8] }], label: [-0.28, 1.0, 0] },
  { id: 'bone', parts: [{ p: [-0.105, 0.74, 0.04], r: 0.03, s: [1, 6.5, 1] }, { p: [0.105, 0.74, 0.04], r: 0.03, s: [1, 6.5, 1] }, { p: [-0.12, 0.32, 0.03], r: 0.025, s: [1, 7, 1] }, { p: [0.12, 0.32, 0.03], r: 0.025, s: [1, 7, 1] }], label: [-0.28, 0.6, 0] },
]

function Organ({ id, parts, label, status, selected, tag, showLabels, onSelect }: {
  id: RegionId; parts: { p: V; r: number; s?: V }[]; label: V; status: Status; selected: boolean; tag?: string; showLabels: boolean; onSelect: (r: RegionId) => void
}) {
  const refs = useRef<(THREE.Group | null)[]>([])
  const [hover, setHover] = useState(false)
  const color = STATUS_HEX[status]
  useFrame(({ clock }) => {
    const t = clock.getElapsedTime()
    const k0 = status === 'red' ? 1 + 0.2 * Math.max(0, Math.sin(t * 7.2)) : 1 + 0.04 * Math.sin(t * 2)
    const k = selected || hover ? k0 * 1.15 : k0
    refs.current.forEach((g, i) => {
      if (!g) return
      const s = parts[i].s ?? [1, 1, 1]
      g.scale.set(s[0] * k, s[1] * k, s[2] * k)
    })
  })
  const click = (e: ThreeEvent<MouseEvent>) => { e.stopPropagation(); onSelect(id) }
  const showTag = showLabels && (selected || hover || status === 'red' || status === 'yellow')
  return (
    <group>
      {parts.map((pt, k) => (
        <group key={k} position={pt.p} ref={(g) => { refs.current[k] = g }}>
          <mesh
            onClick={click}
            onPointerOver={(e) => { e.stopPropagation(); setHover(true); document.body.style.cursor = 'pointer' }}
            onPointerOut={() => { setHover(false); document.body.style.cursor = '' }}
          >
            <sphereGeometry args={[pt.r, 32, 24]} />
            <shaderMaterial key={color + (selected ? 's' : '')} vertexShader={ORGAN_V} fragmentShader={ORGAN_F}
              uniforms={{ uColor: { value: new THREE.Color(color) }, uCore: { value: selected ? 0.55 : 0.28 } }}
              transparent depthWrite={false} blending={THREE.AdditiveBlending} />
          </mesh>
          <mesh scale={2.4}>
            <sphereGeometry args={[pt.r, 24, 16]} />
            <shaderMaterial key={color + 'h'} vertexShader={ORGAN_V} fragmentShader={HALO_F}
              uniforms={{ uColor: { value: new THREE.Color(color) }, uCore: { value: status === 'red' ? 0.5 : 0.22 } }}
              transparent depthWrite={false} blending={THREE.AdditiveBlending} />
          </mesh>
        </group>
      ))}
      {showTag && (
        <Html position={label} style={{ pointerEvents: 'none' }} zIndexRange={[10, 0]}>
          <div className={`tag3d s-${status} ${label[0] < 0 ? 'left' : ''}`}>
            <span>{REGIONS[id].name}</span>
            {tag && <b>{tag}</b>}
          </div>
        </Html>
      )}
    </group>
  )
}

/** Radiation shell around the body; flickers during a solar particle event. */
function Shield({ status, onSelect }: { status: Status; onSelect: () => void }) {
  const ref = useRef<THREE.Mesh>(null)
  const mat = useRef<THREE.MeshBasicMaterial>(null)
  useFrame(({ clock }) => {
    const t = clock.getElapsedTime()
    if (ref.current) ref.current.rotation.y = t * 0.2
    if (mat.current) mat.current.opacity = status === 'red' ? 0.14 + 0.12 * Math.abs(Math.sin(t * 9)) : status === 'yellow' ? 0.08 : 0.025
  })
  return (
    <mesh ref={ref} position={[0, 0.9, 0.03]} scale={[0.62, 1.05, 0.55]} onClick={(e) => { e.stopPropagation(); onSelect() }}>
      <icosahedronGeometry args={[1, 2]} />
      <meshBasicMaterial ref={mat} color={STATUS_HEX[status]} wireframe transparent depthWrite={false} />
    </mesh>
  )
}

export type AstronautProps = {
  status: Record<RegionId, Status>
  selected: RegionId
  onSelect: (r: RegionId) => void
  tags: Partial<Record<RegionId, string>>
  burstKey: number
  showLabels: boolean
  px: number
}

/** The astronaut in body units (feet at 0, head ~1.75). The parent scene places and scales it. */
export function Astronaut({ status, selected, onSelect, tags, burstKey, showLabels, px }: AstronautProps) {
  return (
    <group>
      <Hologram burstAt={burstKey} px={px} beatColor={STATUS_HEX[status.blood === 'none' ? 'green' : status.blood]} />
      {ORGANS.map((o) => (
        <Organ key={o.id} {...o} status={status[o.id]} selected={selected === o.id} tag={tags[o.id]} showLabels={showLabels} onSelect={onSelect} />
      ))}
      <Shield status={status.radiation} onSelect={() => onSelect('radiation')} />
    </group>
  )
}
