import { Html, useGLTF } from '@react-three/drei'
import { useFrame, type ThreeEvent } from '@react-three/fiber'
import { Suspense, useEffect, useMemo, useRef, useState } from 'react'
import * as THREE from 'three'
import { MeshSurfaceSampler } from 'three/examples/jsm/math/MeshSurfaceSampler.js'
import { buildSplat, type OrganDef, type PhotoAvatar, type Splat } from './avatar'
import type { RegionId, Status } from './data'
import { REGIONS } from './content'

const SUIT_URL = `${import.meta.env.BASE_URL}models/astronaut.glb`

export const STATUS_HEX: Record<Status, string> = { green: '#3ddc84', yellow: '#f5d90a', red: '#ff3355', none: '#5f5f5f' }

/* ---------- hologram body (point cloud, body units: feet at y=0, head ~1.75) ---------- */

type V = [number, number, number]

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
  }`.replace('uniform vec3 uHeart;', 'uniform vec3 uHeart; uniform float uPx; uniform float uMaxY;')
  .replace('vec3 p = position;', 'if (position.y > uMaxY) { gl_PointSize = 0.0; gl_Position = vec4(2.0, 2.0, 2.0, 1.0); return; }\n    vec3 p = position;')
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

/** Point cloud sampled from the surface of NASA's Astronaut model (NASA 3D Resources), in body units. */
function sampleSuit(root: THREE.Object3D, count = 26000) {
  root.updateMatrixWorld(true)
  const geos: THREE.BufferGeometry[] = []
  root.traverse((o) => {
    const m = o as THREE.Mesh
    if (!m.isMesh) return
    const g = m.geometry.clone().applyMatrix4(m.matrixWorld)
    if (!g.attributes.normal) g.computeVertexNormals()
    geos.push(g)
  })
  const box = new THREE.Box3().setFromObject(root)
  const c = box.getCenter(new THREE.Vector3()), k = 1.75 / (box.max.y - box.min.y)
  const area = geos.map((g) => { let a = 0; const P = g.attributes.position, I = g.index; const A = new THREE.Vector3(), B = new THREE.Vector3(), C = new THREE.Vector3(); const n = I ? I.count : P.count; for (let t = 0; t < n; t += 3) { const i0 = I ? I.getX(t) : t, i1 = I ? I.getX(t + 1) : t + 1, i2 = I ? I.getX(t + 2) : t + 2; A.fromBufferAttribute(P, i0); B.fromBufferAttribute(P, i1); C.fromBufferAttribute(P, i2); a += B.sub(A).cross(C.sub(A)).length() / 2 } return a })
  const total = area.reduce((x, y) => x + y, 0) || 1
  const p: number[] = [], n: number[] = []
  const pos = new THREE.Vector3(), nrm = new THREE.Vector3()
  geos.forEach((g, gi) => {
    const sampler = new MeshSurfaceSampler(new THREE.Mesh(g)).build()
    const m = Math.round((count * area[gi]) / total)
    for (let k2 = 0; k2 < m; k2++) {
      sampler.sample(pos, nrm)
      // the NASA model faces -z; turn it to face the viewer (+z)
      p.push(-(pos.x - c.x) * k, (pos.y - box.min.y) * k, -(pos.z - c.z) * k)
      n.push(-nrm.x, nrm.y, -nrm.z)
    }
  })
  return withSeeds(p, n)
}

function withSeeds(p: number[], n: number[]) {
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

function Hologram({ burstAt, beatColor, px, accent, maxY = 99 }: { burstAt: number; beatColor: string; px: number; accent: string; maxY?: number }) {
  const { scene } = useGLTF(SUIT_URL)
  const geo = useMemo(() => sampleSuit(scene), [scene])
  const mat = useRef<THREE.ShaderMaterial>(null)
  const born = useRef<number | null>(null)
  const burst = useRef({ at: burstAt, start: -10 })
  const init = useMemo(
    () => ({
      uTime: { value: 0 }, uScan: { value: 0 }, uAssemble: { value: 0 }, uBurst: { value: -1 }, uPx: { value: 1 }, uMaxY: { value: 99 },
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
    u.uMaxY.value = maxY
    ;(u.uBeatColor.value as THREE.Color).set(beatColor)
    ;(u.uColor.value as THREE.Color).lerp(new THREE.Color(accent), 0.08)
    const b = (t - burst.current.start) / 1.1
    u.uBurst.value = b >= 0 && b <= 1 ? b * 1.9 : -1
  })
  return (
    <points geometry={geo} frustumCulled={false}>
      <shaderMaterial ref={mat} vertexShader={vert} fragmentShader={frag} uniforms={init} transparent depthWrite={false} blending={THREE.AdditiveBlending} />
    </points>
  )
}

/* ---------- photo avatar: single-photo 2.5D Gaussian splats ---------- */

const SPLAT_V = /* glsl */ `
  uniform float uTime, uAssemble, uSize, uProj, uScan, uTint;
  uniform vec3 uAccent;
  attribute float seed; attribute vec3 scatter;
  varying vec3 vC; varying float vScan;
  void main() {
    float a = clamp(uAssemble * 1.25 - seed * 0.25, 0.0, 1.0);
    a = 1.0 - pow(1.0 - a, 3.0);
    vec3 p = mix(scatter, position, a);
    vec4 mv = modelViewMatrix * vec4(p, 1.0);
    float sc = length(modelMatrix[0].xyz);
    vScan = smoothstep(0.035, 0.0, abs(position.y - uScan));
    vC = mix(color, uAccent, uTint + vScan * 0.55);
    gl_PointSize = max(1.0, uSize * sc * uProj / -mv.z) * (0.4 + 0.6 * a);
    gl_Position = projectionMatrix * mv;
  }`
const SPLAT_F = /* glsl */ `
  varying vec3 vC; varying float vScan;
  void main() {
    vec2 q = gl_PointCoord - 0.5;
    float r2 = dot(q, q);
    if (r2 > 0.25) discard; // opaque round splat core: no blending or sorting artefacts
    float g = exp(-r2 * 6.0); // Gaussian falloff kept as shading
    gl_FragColor = vec4((vC + vScan * 0.25) * (0.82 + 0.18 * g), 1.0);
  }`

function PhotoSplat({ splat, accent }: { splat: Splat; accent: string }) {
  const geo = useMemo(() => {
    const g = new THREE.BufferGeometry()
    g.setAttribute('position', new THREE.BufferAttribute(splat.pos, 3))
    g.setAttribute('color', new THREE.BufferAttribute(splat.col, 3))
    const seed = new Float32Array(splat.count), scatter = new Float32Array(splat.count * 3)
    for (let k = 0; k < splat.count; k++) {
      seed[k] = Math.random()
      const u = Math.random() * 2 - 1, th = Math.random() * Math.PI * 2, r = 1 + Math.random() * 2, s = Math.sqrt(1 - u * u)
      scatter.set([r * s * Math.cos(th), 0.9 + r * u, r * s * Math.sin(th)], k * 3)
    }
    g.setAttribute('seed', new THREE.BufferAttribute(seed, 1))
    g.setAttribute('scatter', new THREE.BufferAttribute(scatter, 3))
    return g
  }, [splat])
  const mat = useRef<THREE.ShaderMaterial>(null)
  const born = useRef<number | null>(null)
  const init = useMemo(() => ({
    uTime: { value: 0 }, uAssemble: { value: 0 }, uSize: { value: splat.size }, uProj: { value: 800 }, uScan: { value: 0 }, uTint: { value: 0.12 },
    uAccent: { value: new THREE.Color(accent) },
  }), [splat]) // eslint-disable-line react-hooks/exhaustive-deps
  const buf = useMemo(() => new THREE.Vector2(), [])
  useFrame(({ clock, gl, camera }) => {
    const u = mat.current?.uniforms
    if (!u) return
    const t = clock.getElapsedTime()
    if (born.current == null) born.current = t
    u.uTime.value = t
    u.uAssemble.value = Math.min(1, (t - born.current) / 2.4)
    u.uScan.value = 0.9 + 0.95 * Math.sin(t * 0.6)
    gl.getDrawingBufferSize(buf)
    u.uProj.value = buf.y / (2 * Math.tan(((camera as THREE.PerspectiveCamera).fov * Math.PI) / 360))
    ;(u.uAccent.value as THREE.Color).lerp(new THREE.Color(accent), 0.08)
  })
  return (
    <points geometry={geo} frustumCulled={false}>
      <shaderMaterial ref={mat} vertexShader={SPLAT_V} fragmentShader={SPLAT_F} uniforms={init} vertexColors depthWrite />
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

/*
 * Anatomical organ meshes: HuBMAP CCF 3D Reference Object Library v1.2 (CC BY 4.0), simplified for the web.
 * All organs share one reference frame in metres, so their real positions and sizes line up with each other;
 * VH_Y lifts that frame onto our body units (feet at 0, head top ~1.75).
 */
const ORGAN_URL = (f: string) => `${import.meta.env.BASE_URL}models/organs/${f}.glb`
const ORGAN_FILES: Partial<Record<RegionId, string[]>> = {
  brain: ['brain'], blood: ['heart'], liver: ['liver'], immune: ['spleen'], metabolic: ['pancreas'], kidney: ['kidney_l', 'kidney_r'], bone: ['pelvis'],
}
const ALL_ORGAN_URLS = Object.values(ORGAN_FILES).flat().map((f) => ORGAN_URL(f!))
const VH_Y = 0.79
const SUIT_Z = 0.02
const LABEL_X: Partial<Record<RegionId, number>> = { brain: 0.18, blood: 0.26, liver: -0.3, immune: 0.3, metabolic: 0.28, kidney: -0.3, bone: -0.3 }

type OrganMesh = { geo: THREE.BufferGeometry; center: THREE.Vector3 }

/** Each organ file as one geometry centred on its own middle, plus where that middle sits in the reference body. */
function useOrganMeshes(): Record<string, OrganMesh> {
  const gltfs = useGLTF(ALL_ORGAN_URLS)
  return useMemo(() => {
    const out: Record<string, OrganMesh> = {}
    const files = Object.values(ORGAN_FILES).flat() as string[]
    gltfs.forEach((g, i) => {
      g.scene.updateMatrixWorld(true)
      let geo: THREE.BufferGeometry | null = null
      g.scene.traverse((o) => { const m = o as THREE.Mesh; if (m.isMesh && !geo) geo = m.geometry.clone().applyMatrix4(m.matrixWorld) })
      if (!geo) return
      const gg = geo as THREE.BufferGeometry
      if (!gg.attributes.normal) gg.computeVertexNormals()
      gg.computeBoundingBox()
      const center = gg.boundingBox!.getCenter(new THREE.Vector3())
      gg.translate(-center.x, -center.y, -center.z)
      out[files[i]] = { geo: gg, center }
    })
    return out
  }, [gltfs])
}

/** Default organ placement for the crew hologram: the reference anatomy itself, lifted onto the body. */
function defaultOrgans(meshes: Record<string, OrganMesh>): OrganDef[] {
  return (Object.keys(ORGAN_FILES) as RegionId[]).map((id) => {
    const parts = ORGAN_FILES[id]!.map((f) => { const c = meshes[f]?.center ?? new THREE.Vector3(); return { p: [c.x, c.y + VH_Y, c.z + SUIT_Z] as V, k: 1 } })
    const y = parts.reduce((a, q) => a + q.p[1], 0) / parts.length
    return { id, parts, label: [LABEL_X[id] ?? 0.3, y, 0] as V }
  })
}

function Organ({ id, parts, label, status, selected, tag, showLabels, onSelect, meshes, xray }: {
  id: RegionId; parts: { p: V; k: number }[]; label: V; status: Status; selected: boolean; tag?: string; showLabels: boolean; onSelect: (r: RegionId) => void
  meshes: Record<string, OrganMesh>; xray: boolean
}) {
  const refs = useRef<(THREE.Group | null)[]>([])
  const [hover, setHover] = useState(false)
  const color = STATUS_HEX[status]
  const files = ORGAN_FILES[id] ?? []
  useFrame(({ clock }) => {
    const t = clock.getElapsedTime()
    const k0 = status === 'red' ? 1 + 0.12 * Math.max(0, Math.sin(t * 7.2)) : 1 + 0.025 * Math.sin(t * 2)
    const k = selected || hover ? k0 * 1.12 : k0
    refs.current.forEach((g, i) => { if (g) g.scale.setScalar(parts[i].k * k) })
  })
  const click = (e: ThreeEvent<MouseEvent>) => { e.stopPropagation(); onSelect(id) }
  const showTag = showLabels && (selected || hover || status === 'red' || status === 'yellow')
  return (
    <group>
      {parts.map((pt, k) => {
        const m = meshes[files[Math.min(k, files.length - 1)]]
        if (!m) return null
        return (
          <group key={k} position={pt.p} ref={(g) => { refs.current[k] = g }}>
            <mesh geometry={m.geo} onClick={click} renderOrder={xray ? 10 : 0}
              onPointerOver={(e) => { e.stopPropagation(); setHover(true); document.body.style.cursor = 'pointer' }}
              onPointerOut={() => { setHover(false); document.body.style.cursor = '' }}>
              <shaderMaterial key={color + (selected ? 's' : '')} vertexShader={ORGAN_V} fragmentShader={ORGAN_F}
                uniforms={{ uColor: { value: new THREE.Color(color) }, uCore: { value: selected || hover ? 0.5 : 0.24 } }}
                transparent depthWrite={false} depthTest={!xray} blending={THREE.AdditiveBlending} />
            </mesh>
            <mesh geometry={m.geo} scale={1.35} renderOrder={xray ? 10 : 0}>
              <shaderMaterial key={color + 'h'} vertexShader={ORGAN_V} fragmentShader={HALO_F}
                uniforms={{ uColor: { value: new THREE.Color(color) }, uCore: { value: status === 'red' ? 0.4 : 0.14 } }}
                transparent depthWrite={false} depthTest={!xray} blending={THREE.AdditiveBlending} />
            </mesh>
          </group>
        )
      })}
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

function Organs({ custom, ...rest }: { custom: OrganDef[] | null; status: Record<RegionId, Status>; selected: RegionId; tags: Partial<Record<RegionId, string>>; showLabels: boolean; onSelect: (r: RegionId) => void }) {
  const meshes = useOrganMeshes()
  const defs = useMemo(() => custom ?? defaultOrgans(meshes), [custom, meshes])
  return <>{defs.map((o) => <Organ key={o.id} {...o} meshes={meshes} xray={!!custom} status={rest.status[o.id]} selected={rest.selected === o.id} tag={rest.tags[o.id]} showLabels={rest.showLabels} onSelect={rest.onSelect} />)}</>
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
  accent: string
  /** the user's photo avatar; crew members use the NASA-suit hologram */
  photo: PhotoAvatar | null
}

/** The avatar in body units (feet at 0, head ~1.75). The parent scene places and scales it. */
export function Astronaut({ status, selected, onSelect, tags, burstKey, showLabels, px, accent, photo }: AstronautProps) {
  const [splat, setSplat] = useState<Splat | null>(null)
  useEffect(() => {
    let live = true
    setSplat(null)
    if (photo) buildSplat(photo).then((s) => { if (live) setSplat(s) }).catch(() => { if (live) setSplat(null) })
    return () => { live = false }
  }, [photo])
  return (
    <group>
      {splat && <PhotoSplat splat={splat} accent={accent} />}
      {/* the hologram fills whatever the photo did not show (e.g. the legs on a desk webcam) */}
      {(!splat || splat.clipY > 0) && (
        <Suspense fallback={null}><Hologram burstAt={burstKey} px={px} accent={accent} maxY={splat ? splat.clipY : 99} beatColor={STATUS_HEX[status.blood === 'none' ? 'green' : status.blood]} /></Suspense>
      )}
      <Suspense fallback={null}>
        <Organs custom={splat?.organs ?? null} status={status} selected={selected} tags={tags} showLabels={showLabels} onSelect={onSelect} />
      </Suspense>
      <Shield status={status.radiation} onSelect={() => onSelect('radiation')} />
    </group>
  )
}

useGLTF.preload(SUIT_URL)
useGLTF.preload(ALL_ORGAN_URLS)
