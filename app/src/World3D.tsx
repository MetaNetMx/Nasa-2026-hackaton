import { Html, useGLTF, useTexture } from '@react-three/drei'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { Suspense, useEffect, useMemo, useRef } from 'react'
import * as THREE from 'three'
import { Astronaut, STATUS_HEX, type AstronautProps } from './Body3D'
import type { Scene } from './content'
import type { PhotoAvatar } from './avatar'
import type { RadiationData, Status } from './data'

const R_ISS = 1 + 408 / 6371 // ISS altitude ~408 km in Earth radii
const BODY_SCALE = 0.16 // astronaut height ~0.28 Earth radii: stylised, so the body reads against the planet
const BODY_Y = 1.1
const UP = new THREE.Vector3(0, 1, 0)

function toXYZ(lat: number, lon: number, r: number) {
  const phi = (90 - lat) * (Math.PI / 180)
  const th = (lon + 180) * (Math.PI / 180)
  return new THREE.Vector3(-r * Math.sin(phi) * Math.cos(th), r * Math.cos(phi), r * Math.sin(phi) * Math.sin(th))
}

function doseColor(r: number, c: THREE.Color) {
  const v = Math.min(1, Math.log10(1 + r / 0.15) / Math.log10(1 + 20 / 0.15))
  return c.setHSL((200 - 200 * v) / 360, 0.95, 0.45 + 0.2 * v)
}

function Earth() {
  const [day, night] = useTexture(['tex/earth-blue-marble.jpg', 'tex/earth-night.jpg'])
  day.colorSpace = THREE.SRGBColorSpace
  night.colorSpace = THREE.SRGBColorSpace
  day.anisotropy = night.anisotropy = 8
  return (
    <group>
      <mesh>
        <sphereGeometry args={[1, 128, 96]} />
        <meshBasicMaterial map={day} color="#c9d8ee" />
      </mesh>
      <mesh scale={1.0008}>
        <sphereGeometry args={[1, 128, 96]} />
        <meshBasicMaterial map={night} transparent blending={THREE.AdditiveBlending} depthWrite={false} color="#ffcf8a" />
      </mesh>
    </group>
  )
}

function Atmosphere({ status }: { status: Status }) {
  const uniforms = useMemo(() => ({ uColor: { value: new THREE.Color('#4cc3ff') } }), [])
  useFrame(() => { uniforms.uColor.value.lerp(new THREE.Color(status === 'red' ? '#ff6b6b' : '#4cc3ff'), 0.03) })
  return (
    <mesh scale={1.035}>
      <sphereGeometry args={[1, 96, 64]} />
      <shaderMaterial
        uniforms={uniforms} transparent depthWrite={false} side={THREE.BackSide} blending={THREE.AdditiveBlending}
        vertexShader={`varying vec3 vN; varying vec3 vP; void main(){ vN = normalize(normalMatrix*normal); vec4 mv = modelViewMatrix*vec4(position,1.0); vP = normalize(-mv.xyz); gl_Position = projectionMatrix*mv; }`}
        fragmentShader={`uniform vec3 uColor; varying vec3 vN; varying vec3 vP; void main(){ float i = pow(clamp(1.0 - abs(dot(vN, vP)), 0.0, 1.0), 6.0); gl_FragColor = vec4(uColor, i * 0.9); }`}
      />
    </mesh>
  )
}

function Track({ data, i }: { data: RadiationData; i: number }) {
  const n = data.rate.length
  const geo = useMemo(() => {
    const pos = new Float32Array(n * 3), col = new Float32Array(n * 3), c = new THREE.Color()
    for (let k = 0; k < n; k++) {
      const v = toXYZ(data.lat[k], data.lon[k], R_ISS)
      pos.set([v.x, v.y, v.z], k * 3)
      doseColor(data.rate[k], c)
      col.set([c.r, c.g, c.b], k * 3)
    }
    const g = new THREE.BufferGeometry()
    g.setAttribute('position', new THREE.BufferAttribute(pos, 3))
    g.setAttribute('color', new THREE.BufferAttribute(col, 3))
    return g
  }, [data, n])
  useEffect(() => {
    const from = Math.max(0, i - 4320) // last 3 days of real minutes
    geo.setDrawRange(from, i - from + 1)
  }, [geo, i])
  return (
    <points geometry={geo} frustumCulled={false}>
      <shaderMaterial
        vertexColors transparent depthWrite={false} blending={THREE.AdditiveBlending}
        vertexShader={`varying vec3 vC; void main(){ vC = color; vec4 mv = modelViewMatrix*vec4(position,1.0); gl_PointSize = clamp(16.0 / -mv.z, 1.5, 9.0); gl_Position = projectionMatrix*mv; }`}
        fragmentShader={`varying vec3 vC; void main(){ float d = length(gl_PointCoord-0.5); if(d>0.5) discard; gl_FragColor = vec4(vC, pow(1.0-d*2.0, 1.4)); }`}
      />
    </points>
  )
}

function Stars() {
  const geo = useMemo(() => {
    const n = 2500, p = new Float32Array(n * 3)
    for (let k = 0; k < n; k++) {
      const u = Math.random() * 2 - 1, th = Math.random() * Math.PI * 2, s = Math.sqrt(1 - u * u), r = 40 + Math.random() * 20
      p.set([r * s * Math.cos(th), r * u, r * s * Math.sin(th)], k * 3)
    }
    const g = new THREE.BufferGeometry()
    g.setAttribute('position', new THREE.BufferAttribute(p, 3))
    return g
  }, [])
  return <points geometry={geo}><pointsMaterial size={0.08} color="#9fb8dc" transparent opacity={0.7} sizeAttenuation /></points>
}

/** Solar particles streaming past the astronaut while the storm alert is active. */
function SolarWind({ status }: { status: Status }) {
  const N = 900
  const ref = useRef<THREE.Points>(null)
  const geo = useMemo(() => {
    const p = new Float32Array(N * 3), v = new Float32Array(N)
    for (let k = 0; k < N; k++) {
      p.set([-1.5 + Math.random() * 3, BODY_Y - 0.2 + Math.random() * 0.7, -0.4 + Math.random() * 0.8], k * 3)
      v[k] = 0.4 + Math.random() * 1.2
    }
    const g = new THREE.BufferGeometry()
    g.setAttribute('position', new THREE.BufferAttribute(p, 3))
    g.userData.v = v
    return g
  }, [])
  const mat = useRef<THREE.PointsMaterial>(null)
  useFrame((_, dt) => {
    const on = status === 'red' ? 1 : status === 'yellow' ? 0.35 : 0
    if (mat.current) mat.current.opacity += (on * 0.9 - mat.current.opacity) * 0.05
    if (!ref.current || (mat.current && mat.current.opacity < 0.01)) return
    const a = geo.attributes.position as THREE.BufferAttribute, v = geo.userData.v as Float32Array
    for (let k = 0; k < N; k++) {
      let x = a.getX(k) + v[k] * dt * (0.5 + on)
      if (x > 1.5) x = -1.5
      a.setX(k, x)
    }
    a.needsUpdate = true
  })
  return (
    <points ref={ref} geometry={geo} frustumCulled={false}>
      <pointsMaterial ref={mat} size={0.006} color="#ff8a7a" transparent opacity={0} blending={THREE.AdditiveBlending} depthWrite={false} sizeAttenuation />
    </points>
  )
}

/** Earth turns so the ISS ground point (from the real record) is always beneath the astronaut. */
function Planet({ data, i, status }: { data: RadiationData; i: number; status: Status }) {
  const ref = useRef<THREE.Group>(null)
  const target = useMemo(() => new THREE.Quaternion(), [])
  const ring = useRef<THREE.Mesh>(null)
  useFrame(({ clock }) => {
    const sub = toXYZ(data.lat[i], data.lon[i], 1).normalize()
    target.setFromUnitVectors(sub, UP)
    if (ref.current) ref.current.quaternion.slerp(target, 0.08)
    if (ring.current) ring.current.scale.setScalar(1 + 0.6 * ((clock.getElapsedTime() * 0.8) % 1))
  })
  const iss = toXYZ(data.lat[i], data.lon[i], R_ISS)
  return (
    <group ref={ref}>
      <Suspense fallback={null}><Earth /></Suspense>
      <Atmosphere status={status} />
      <Track data={data} i={i} />
      <group position={iss} quaternion={new THREE.Quaternion().setFromUnitVectors(UP, iss.clone().normalize())}>
        <mesh rotation={[-Math.PI / 2, 0, 0]} ref={ring}>
          <ringGeometry args={[0.03, 0.036, 48]} />
          <meshBasicMaterial color={STATUS_HEX[status === 'none' ? 'green' : status]} transparent opacity={0.8} side={THREE.DoubleSide} />
        </mesh>
      </group>
    </group>
  )
}

/* ---------- surface and deep-space scenes (procedural: no outside textures) ---------- */

const hash = (i: number, j: number) => { const h = Math.sin(i * 127.1 + j * 311.7) * 43758.5453; return h - Math.floor(h) }
function vnoise(x: number, z: number) {
  const i = Math.floor(x), j = Math.floor(z), fx = x - i, fz = z - j
  const u = fx * fx * (3 - 2 * fx), v = fz * fz * (3 - 2 * fz)
  const a = hash(i, j), b = hash(i + 1, j), c = hash(i, j + 1), d = hash(i + 1, j + 1)
  return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v
}
function fbm(x: number, z: number) {
  let s = 0, amp = 0.5, f = 1
  for (let o = 0; o < 5; o++) { s += amp * vnoise(x * f, z * f); f *= 2.03; amp *= 0.5 }
  return s - 0.5
}
const smooth = (a: number, b: number, x: number) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t) }

const CRATERS: [number, number, number, number][] = [[-3, -6, 1.8, 0.25], [4.5, -9, 2.6, 0.35], [-7, -14, 4, 0.5], [2.2, -3.4, 0.6, 0.07], [-1.6, -2.6, 0.35, 0.04], [8, -4, 1.4, 0.2]]

function Terrain({ kind }: { kind: 'mars' | 'moon' }) {
  const geo = useMemo(() => {
    const g = new THREE.PlaneGeometry(90, 90, 320, 320)
    g.rotateX(-Math.PI / 2)
    const pos = g.attributes.position as THREE.BufferAttribute
    const col = new Float32Array(pos.count * 3)
    const lo = new THREE.Color(kind === 'mars' ? '#5a2612' : '#3d3d40'), hi = new THREE.Color(kind === 'mars' ? '#b5612f' : '#9a9a9c'), c = new THREE.Color()
    for (let k = 0; k < pos.count; k++) {
      const x = pos.getX(k), z = pos.getZ(k), r = Math.hypot(x, z)
      const amp = 0.02 + 1.6 * smooth(1.5, 26, r)
      let h = fbm(x * 0.35, z * 0.35) * amp + fbm(x * 3, z * 3) * 0.025
      if (kind === 'mars') h += 2.2 * smooth(14, 40, -z) * (0.6 + fbm(x * 0.08, 3)) // crater rim on the horizon
      if (kind === 'moon') for (const [cx, cz, R, dep] of CRATERS) {
        const d = Math.hypot(x - cx, z - cz) / R
        if (d < 1) h -= dep * (1 - d * d)
        h += 0.35 * dep * Math.exp(-(((d - 1) / 0.18) ** 2))
      }
      if (r < 0.7) h *= r / 0.7
      pos.setY(k, h)
      c.copy(lo).lerp(hi, Math.min(1, Math.max(0, 0.55 + h * 1.4 + fbm(x * 1.7, z * 1.7) * 0.8)))
      col.set([c.r, c.g, c.b], k * 3)
    }
    g.setAttribute('color', new THREE.BufferAttribute(col, 3))
    g.computeVertexNormals()
    return g
  }, [kind])
  const rocks = useMemo(() => {
    const m = new THREE.Object3D(), list: THREE.Matrix4[] = []
    for (let k = 0; k < 160; k++) {
      const a = hash(k, 1) * Math.PI * 2, r = 0.5 + hash(k, 2) * 7
      const x = Math.cos(a) * r, z = Math.sin(a) * r
      if (Math.hypot(x, z) < 0.45) continue
      const s = 0.012 + hash(k, 3) ** 3 * 0.09
      m.position.set(x, s * 0.3, z); m.rotation.set(hash(k, 4) * 3, hash(k, 5) * 3, 0); m.scale.set(s, s * 0.7, s * 1.2); m.updateMatrix()
      list.push(m.matrix.clone())
    }
    return list
  }, [])
  const inst = useRef<THREE.InstancedMesh>(null)
  useEffect(() => { rocks.forEach((mx, k) => inst.current?.setMatrixAt(k, mx)); if (inst.current) inst.current.instanceMatrix.needsUpdate = true }, [rocks])
  return (
    <group position={[0, BODY_Y, 0]}>
      <mesh geometry={geo} receiveShadow>
        <meshStandardMaterial vertexColors roughness={1} metalness={0} />
      </mesh>
      <instancedMesh ref={inst} args={[undefined, undefined, rocks.length]} castShadow receiveShadow>
        <dodecahedronGeometry args={[1, 0]} />
        <meshStandardMaterial color={kind === 'mars' ? '#6e3118' : '#5c5c60'} roughness={1} flatShading />
      </instancedMesh>
    </group>
  )
}

function Sky({ horizon, mid, zenith }: { horizon: string; mid: string; zenith: string }) {
  const uniforms = useMemo(() => ({ uH: { value: new THREE.Color(horizon) }, uM: { value: new THREE.Color(mid) }, uZ: { value: new THREE.Color(zenith) } }), [horizon, mid, zenith])
  return (
    <mesh renderOrder={-1}>
      <sphereGeometry args={[35, 48, 24]} />
      <shaderMaterial uniforms={uniforms} side={THREE.BackSide} depthWrite={false}
        vertexShader={`varying vec3 vD; void main(){ vD = normalize(position); gl_Position = projectionMatrix*modelViewMatrix*vec4(position,1.0); }`}
        fragmentShader={`uniform vec3 uH, uM, uZ; varying vec3 vD; void main(){ float y = max(vD.y, 0.0); vec3 c = mix(uH, uM, smoothstep(0.0, 0.12, y)); c = mix(c, uZ, smoothstep(0.1, 0.6, y)); gl_FragColor = vec4(c, 1.0); }`} />
    </mesh>
  )
}

/** A soft glowing disc: the Sun, or Earth seen from far away. */
function Glow({ position, color, size, label }: { position: [number, number, number]; color: string; size: number; label?: string }) {
  return (
    <group position={position}>
      <mesh><sphereGeometry args={[size, 16, 12]} /><meshBasicMaterial color={color} fog={false} /></mesh>
      <sprite scale={size * 9}>
        <spriteMaterial color={color} transparent opacity={0.35} blending={THREE.AdditiveBlending} depthWrite={false} fog={false}
          map={GLOW_TEX} />
      </sprite>
      {label && <Html center position={[0, -size * 3.2, 0]} style={{ pointerEvents: 'none' }} zIndexRange={[4, 0]}><div className="sky-label">{label}</div></Html>}
    </group>
  )
}
const GLOW_TEX = (() => {
  const c = document.createElement('canvas'); c.width = c.height = 64
  const g = c.getContext('2d')!, gr = g.createRadialGradient(32, 32, 0, 32, 32, 32)
  gr.addColorStop(0, 'rgba(255,255,255,1)'); gr.addColorStop(1, 'rgba(255,255,255,0)')
  g.fillStyle = gr; g.fillRect(0, 0, 64, 64)
  return new THREE.CanvasTexture(c)
})()

const M = (f: string) => `${import.meta.env.BASE_URL}models/${f}`
const MODELS = { habitat: M('habitat.glb'), rover: M('perseverance.glb'), lm: M('lunar-module.glb'), skylab: M('skylab.glb'), iss: M('iss.glb') }

/**
 * A NASA 3D Resources model (free and without copyright), normalised by its bounds:
 * scaled to a target height or width in scene units, centred, standing on y = 0, casting shadows.
 */
function NasaModel({ url, height, width, position, rotation }: { url: string; height?: number; width?: number; position: [number, number, number]; rotation?: [number, number, number] }) {
  const { scene } = useGLTF(url)
  const obj = useMemo(() => {
    const c = scene.clone(true)
    const box = new THREE.Box3().setFromObject(c), size = box.getSize(new THREE.Vector3())
    c.scale.setScalar(height ? height / size.y : (width ?? 1) / Math.max(size.x, size.z))
    box.setFromObject(c)
    const ctr = box.getCenter(new THREE.Vector3())
    c.position.set(-ctr.x, -box.min.y, -ctr.z)
    c.traverse((o) => { const m = o as THREE.Mesh; if (m.isMesh) { m.castShadow = true; m.receiveShadow = true } })
    const g = new THREE.Group()
    g.add(c)
    return g
  }, [scene, height, width])
  return <primitive object={obj} position={position} rotation={rotation ?? [0, 0, 0]} />
}

/** Mars as a planet seen from the transit vehicle: procedural colour, polar cap, lit from the Sun. */
function MarsGlobe() {
  const ref = useRef<THREE.Mesh>(null)
  useFrame((_, dt) => { if (ref.current) ref.current.rotation.y += dt * 0.01 })
  return (
    <mesh ref={ref} position={[4.2, 2.2, -11]}>
      <sphereGeometry args={[2.3, 96, 64]} />
      <shaderMaterial
        uniforms={{ uSun: { value: new THREE.Vector3(-1, 0.25, 0.6).normalize() } }}
        vertexShader={`varying vec3 vP; varying vec3 vN; void main(){ vP = position; vN = normalize(mat3(modelMatrix)*normal); gl_Position = projectionMatrix*modelViewMatrix*vec4(position,1.0); }`}
        fragmentShader={`uniform vec3 uSun; varying vec3 vP; varying vec3 vN;
          float n3(vec3 p){ return sin(p.x*2.1+sin(p.y*3.3))*sin(p.y*2.7+sin(p.z*1.9))*sin(p.z*2.3+sin(p.x*2.9)); }
          void main(){ vec3 p = normalize(vP);
            float n = n3(p*2.0)*0.5 + n3(p*5.0+1.7)*0.3 + n3(p*11.0+4.1)*0.2;
            vec3 c = mix(vec3(0.42,0.17,0.08), vec3(0.80,0.45,0.25), smoothstep(-0.4,0.5,n));
            c = mix(c, vec3(0.93,0.9,0.86), smoothstep(0.86,0.93,abs(p.y)+n*0.04));
            float l = clamp(dot(vN, uSun), 0.0, 1.0);
            gl_FragColor = vec4(c*(0.04+1.05*l), 1.0); }`} />
    </mesh>
  )
}

export type View = 'body' | 'world'
type Cam = { pos: THREE.Vector3; look: THREE.Vector3; fov: number }
const BODY_CAM: Cam = { pos: new THREE.Vector3(0.02, BODY_Y + 0.22, 0.95), look: new THREE.Vector3(0, BODY_Y + 0.1, 0), fov: 34 }
const WORLD_CAM: Record<Scene, Cam> = {
  orbit: { pos: new THREE.Vector3(0, 2.1, 3.6), look: new THREE.Vector3(0, 0.55, 0), fov: 38 },
  mars: { pos: new THREE.Vector3(0.85, BODY_Y + 0.4, 1.6), look: new THREE.Vector3(-0.45, BODY_Y + 0.22, -1.4), fov: 44 },
  moon: { pos: new THREE.Vector3(0.8, BODY_Y + 0.36, 1.55), look: new THREE.Vector3(-0.7, BODY_Y + 0.42, -2.6), fov: 46 },
  transit: { pos: new THREE.Vector3(-0.7, BODY_Y + 0.25, 1.5), look: new THREE.Vector3(1.3, BODY_Y + 0.35, -4), fov: 44 },
}

/** Smooth camera flights between views plus gentle mouse parallax. */
function Rig({ view, scene }: { view: View; scene: Scene }) {
  const { camera, pointer } = useThree()
  const look = useRef(BODY_CAM.look.clone())
  useFrame((_, dt) => {
    const c = view === 'body' ? BODY_CAM : WORLD_CAM[scene]
    const k = view === 'body' ? 0.12 : scene === 'orbit' ? 0.5 : 0.15
    const par = new THREE.Vector3(pointer.x * k, pointer.y * k * 0.45, 0)
    const e = 1 - Math.exp(-Math.min(dt, 1) * 2.8) // frame-rate independent easing
    camera.position.lerp(c.pos.clone().add(par), e)
    look.current.lerp(c.look, e)
    camera.lookAt(look.current)
    const pc = camera as THREE.PerspectiveCamera
    pc.fov += (c.fov - pc.fov) * e
    pc.updateProjectionMatrix()
  })
  return null
}

/** Floating in microgravity (orbit, transit) or standing on the ground (Moon, Mars). */
function Avatar({ children, standing }: { children: React.ReactNode; standing: boolean }) {
  const ref = useRef<THREE.Group>(null)
  useFrame(({ clock }) => {
    const t = clock.getElapsedTime()
    if (!ref.current) return
    ref.current.position.y = BODY_Y + (standing ? 0 : 0.008 * Math.sin(t * 0.8))
    ref.current.rotation.y = (standing ? 0.12 : 0.35) * Math.sin(t * 0.18)
    ref.current.rotation.z = standing ? 0 : 0.04 * Math.sin(t * 0.5)
  })
  return <group ref={ref} position={[0, BODY_Y, 0]} scale={BODY_SCALE}>{children}</group>
}

function Sun({ position, intensity, color }: { position: [number, number, number]; intensity: number; color: string }) {
  return (
    <directionalLight position={position} intensity={intensity} color={color} castShadow
      shadow-mapSize-width={2048} shadow-mapSize-height={2048} shadow-bias={-0.0004} shadow-normalBias={0.02}
      shadow-camera-left={-4} shadow-camera-right={4} shadow-camera-top={4} shadow-camera-bottom={-4} shadow-camera-near={0.5} shadow-camera-far={40} />
  )
}

function Environment({ scene, data, i, radStatus }: { scene: Scene; data: RadiationData; i: number; radStatus: Status }) {
  if (scene === 'orbit') return (
    <>
      <color attach="background" args={['#02040a']} />
      <Stars />
      <ambientLight intensity={0.35} />
      <directionalLight position={[-4, 3, 3]} intensity={2.2} color="#fff6ea" />
      <Planet data={data} i={i} status={radStatus} />
      <Suspense fallback={null}><NasaModel url={MODELS.iss} width={1.1} position={[0.62, BODY_Y - 0.12, -0.75]} rotation={[0.25, -0.5, 0.1]} /></Suspense>
    </>
  )
  if (scene === 'mars') return (
    <>
      <color attach="background" args={['#0a0607']} />
      <fogExp2 attach="fog" args={['#3b1d14', 0.045]} />
      <Sky horizon="#7a3a22" mid="#2c1511" zenith="#06050a" />
      <Stars />
      <hemisphereLight args={['#c98a6a', '#2a120a', 0.7]} />
      <Sun position={[-6, 3.2, 3]} intensity={1.6} color="#ffd2b0" />
      <Glow position={[-9, 1.1, -24]} color="#cfe0ff" size={0.22} />
      <Glow position={[-7.5, 3.4, -22]} color="#9cc7ff" size={0.05} label="Earth · 20 light-min away" />
      <Terrain kind="mars" />
      <Suspense fallback={null}>
        <NasaModel url={MODELS.habitat} height={0.7} position={[-1.35, BODY_Y, -2.3]} rotation={[0, 0.9, 0]} />
        <NasaModel url={MODELS.rover} height={0.3} position={[0.42, BODY_Y, -1.55]} rotation={[0, -2.2, 0]} />
      </Suspense>
    </>
  )
  if (scene === 'moon') return (
    <>
      <color attach="background" args={['#010103']} />
      <fogExp2 attach="fog" args={['#020204', 0.03]} />
      <Stars />
      <ambientLight intensity={0.12} />
      <Sun position={[6, 2.2, 3]} intensity={2.6} color="#fff6ea" />
      <group position={[-4.2, 3.4, -12]} scale={1.15}><Suspense fallback={null}><Earth /></Suspense><Atmosphere status="green" /></group>
      <Html center position={[-4.2, 1.9, -12]} style={{ pointerEvents: 'none' }} zIndexRange={[4, 0]}><div className="sky-label">Earth · 1.3 light-s away</div></Html>
      <Terrain kind="moon" />
      <Suspense fallback={null}><NasaModel url={MODELS.lm} height={1.0} position={[-0.95, BODY_Y, -1.6]} rotation={[0, 0.5, 0]} /></Suspense>
    </>
  )
  return (
    <>
      <color attach="background" args={['#010206']} />
      <Stars />
      <ambientLight intensity={0.15} />
      <directionalLight position={[-6, 1.5, 4]} intensity={2.2} color="#fff4e6" />
      <MarsGlobe />
      <Glow position={[3.4, 7.4, -30]} color="#9cc7ff" size={0.06} label="Earth · 20 light-min away" />
      <Suspense fallback={null}><NasaModel url={MODELS.skylab} width={2.2} position={[3.1, BODY_Y - 0.55, -4.6]} rotation={[0.15, -0.7, 0.2]} /></Suspense>
    </>
  )
}

type Props = Omit<AstronautProps, 'px' | 'showLabels'> & { data: RadiationData; i: number; radStatus: Status; view: View; scene: Scene; accent: string; photo: PhotoAvatar | null }

export function World3D({ data, i, radStatus, view, scene, ...body }: Props) {
  return (
    <Canvas shadows camera={{ position: [0, 2.6, 4.4], fov: 38, near: 0.01, far: 200 }} dpr={[1, 2]} gl={{ antialias: true }}>
      <Environment scene={scene} data={data} i={i} radStatus={radStatus} />
      <Avatar standing={scene === 'mars' || scene === 'moon'}>
        <Astronaut {...body} px={1.1} showLabels={view === 'body'} />
      </Avatar>
      <SolarWind status={radStatus} />
      <Rig view={view} scene={scene} />
    </Canvas>
  )
}

useGLTF.preload(MODELS.habitat)
