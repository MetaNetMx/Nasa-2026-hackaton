import { useTexture } from '@react-three/drei'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { Suspense, useEffect, useMemo, useRef } from 'react'
import * as THREE from 'three'
import { Astronaut, STATUS_HEX, type AstronautProps } from './Body3D'
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

export type View = 'body' | 'world'
const CAM: Record<View, { pos: THREE.Vector3; look: THREE.Vector3; fov: number }> = {
  body: { pos: new THREE.Vector3(0.02, BODY_Y + 0.22, 0.95), look: new THREE.Vector3(0, BODY_Y + 0.1, 0), fov: 34 },
  world: { pos: new THREE.Vector3(0, 2.1, 3.6), look: new THREE.Vector3(0, 0.55, 0), fov: 38 },
}

/** Smooth camera flights between views plus gentle mouse parallax. */
function Rig({ view }: { view: View }) {
  const { camera, pointer } = useThree()
  const look = useRef(CAM.body.look.clone())
  useFrame(() => {
    const c = CAM[view]
    const par = new THREE.Vector3(pointer.x * (view === 'body' ? 0.12 : 0.5), pointer.y * (view === 'body' ? 0.05 : 0.25), 0)
    camera.position.lerp(c.pos.clone().add(par), 0.045)
    look.current.lerp(c.look, 0.045)
    camera.lookAt(look.current)
    const pc = camera as THREE.PerspectiveCamera
    pc.fov += (c.fov - pc.fov) * 0.045
    pc.updateProjectionMatrix()
  })
  return null
}

/** The astronaut drifts and slowly turns, as anyone floating in microgravity would. */
function Floating({ children }: { children: React.ReactNode }) {
  const ref = useRef<THREE.Group>(null)
  useFrame(({ clock }) => {
    const t = clock.getElapsedTime()
    if (!ref.current) return
    ref.current.position.y = BODY_Y + 0.008 * Math.sin(t * 0.8)
    ref.current.rotation.y = 0.35 * Math.sin(t * 0.18)
    ref.current.rotation.z = 0.04 * Math.sin(t * 0.5)
  })
  return <group ref={ref} position={[0, BODY_Y, 0]} scale={BODY_SCALE}>{children}</group>
}

type Props = Omit<AstronautProps, 'px' | 'showLabels'> & { data: RadiationData; i: number; radStatus: Status; view: View }

export function World3D({ data, i, radStatus, view, ...body }: Props) {
  return (
    <Canvas camera={{ position: [0, 2.6, 4.4], fov: 38, near: 0.01, far: 200 }} dpr={[1, 2]} gl={{ antialias: true }}>
      <color attach="background" args={['#02040a']} />
      <Stars />
      <Planet data={data} i={i} status={radStatus} />
      <Floating>
        <Astronaut {...body} px={1.1} showLabels={view === 'body'} />
      </Floating>
      <SolarWind status={radStatus} />
      <Rig view={view} />
    </Canvas>
  )
}
