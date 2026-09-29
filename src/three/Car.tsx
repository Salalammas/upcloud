import { useFrame } from '@react-three/fiber'
import { useMemo, useRef } from 'react'
import * as THREE from 'three'
import { scrollState, stageLocal } from '../lib/scroll'

const PURPLE = '#7b00ff'
const CYAN = '#00e5ff'

function makeLiveryTexture() {
  const c = document.createElement('canvas')
  c.width = 512
  c.height = 128
  const g = c.getContext('2d')!
  g.clearRect(0, 0, c.width, c.height)
  g.fillStyle = CYAN
  g.beginPath()
  g.moveTo(0, 96)
  g.lineTo(512, 70)
  g.lineTo(512, 82)
  g.lineTo(0, 110)
  g.fill()
  g.font = 'italic 900 72px Arial Black, Impact, sans-serif'
  g.textAlign = 'center'
  g.textBaseline = 'middle'
  g.lineWidth = 8
  g.strokeStyle = '#1a0633'
  g.strokeText('UPCLOUD', 256, 52)
  g.fillStyle = '#ffffff'
  g.fillText('UPCLOUD', 256, 52)
  const t = new THREE.CanvasTexture(c)
  t.colorSpace = THREE.SRGBColorSpace
  t.anisotropy = 4
  return t
}

const easeOut = (t: number) => 1 - Math.pow(1 - t, 3)

function Wheel({ position, spinRef }: { position: [number, number, number]; spinRef: React.RefObject<THREE.Group[]> }) {
  return (
    <group position={position}>
      <group
        ref={(g) => {
          if (g && spinRef.current && !spinRef.current.includes(g)) spinRef.current.push(g)
        }}
      >
        <mesh rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.36, 0.36, 0.28, 10]} />
          <meshStandardMaterial color="#111018" flatShading roughness={0.9} />
        </mesh>
        <mesh rotation={[0, 0, Math.PI / 2]} position={[position[0] > 0 ? 0.145 : -0.145, 0, 0]}>
          <cylinderGeometry args={[0.2, 0.2, 0.02, 6]} />
          <meshStandardMaterial color={CYAN} flatShading metalness={0.6} roughness={0.3} />
        </mesh>
      </group>
    </group>
  )
}

export default function Car() {
  const root = useRef<THREE.Group>(null)
  const body = useRef<THREE.Group>(null)
  const wheels = useRef<THREE.Group[]>([])
  const spin = useRef(0)
  const livery = useMemo(makeLiveryTexture, [])

  useFrame((state, dt) => {
    const p = scrollState.progress
    const t = state.clock.elapsedTime
    const g = root.current
    if (!g) return
    const arrive = stageLocal(p, 3)
    if (p < 3 / 6) {
      g.scale.setScalar(0)
      g.visible = false
      return
    }
    g.visible = true
    g.scale.setScalar(1)
    const e = easeOut(arrive)
    // drive in from behind the camera (camera at z=8) to settle at z≈1
    const targetZ = THREE.MathUtils.lerp(14, 1, e)
    const sway = Math.sin(t * 0.9) * 0.35 * (0.4 + 0.6 * e)
    g.position.set(sway, 0, targetZ)

    const vel = scrollState.velocity
    const yaw = Math.sin(t * 0.9 + 0.8) * 0.12 + THREE.MathUtils.clamp(vel * 0.01, -0.25, 0.25)
    g.rotation.y = THREE.MathUtils.lerp(g.rotation.y, yaw, 1 - Math.exp(-dt * 4))

    if (body.current) {
      body.current.position.y = Math.sin(t * 11) * 0.015 + Math.sin(t * 3.3) * 0.01
      body.current.rotation.z = Math.sin(t * 0.9 + 0.8) * -0.03
      body.current.rotation.x = Math.sin(t * 7) * 0.006
    }

    const speed = 6 + Math.abs(vel) * 0.6 + (1 - e) * 20
    spin.current -= speed * dt
    for (const w of wheels.current) w.rotation.x = spin.current
  })

  return (
    <group ref={root} scale={0} visible={false}>
      {/* car faces -Z (driving along the road) */}
      <group ref={body} position={[0, 0.36, 0]}>
        {/* lower body */}
        <mesh position={[0, 0.28, 0]} castShadow>
          <boxGeometry args={[1.7, 0.5, 3.6]} />
          <meshStandardMaterial color={PURPLE} flatShading roughness={0.4} metalness={0.2} />
        </mesh>
        {/* hood slope */}
        <mesh position={[0, 0.56, -1.25]} rotation={[0.12, 0, 0]}>
          <boxGeometry args={[1.6, 0.12, 1.1]} />
          <meshStandardMaterial color={PURPLE} flatShading />
        </mesh>
        {/* cabin */}
        <mesh position={[0, 0.8, 0.25]}>
          <boxGeometry args={[1.45, 0.55, 1.9]} />
          <meshStandardMaterial color={PURPLE} flatShading />
        </mesh>
        {/* windows */}
        <mesh position={[0, 0.82, -0.72]} rotation={[-0.5, 0, 0]}>
          <boxGeometry args={[1.3, 0.5, 0.04]} />
          <meshStandardMaterial color="#0a1a2e" flatShading metalness={0.8} roughness={0.15} />
        </mesh>
        {[-1, 1].map((s) => (
          <mesh key={`win${s}`} position={[s * 0.73, 0.85, 0.25]}>
            <boxGeometry args={[0.02, 0.36, 1.6]} />
            <meshStandardMaterial color="#0a1a2e" flatShading metalness={0.8} roughness={0.15} />
          </mesh>
        ))}
        {/* cyan stripes over roof/hood */}
        {[-0.28, 0.28].map((x) => (
          <group key={`st${x}`}>
            <mesh position={[x, 1.08, 0.25]}>
              <boxGeometry args={[0.14, 0.02, 1.9]} />
              <meshStandardMaterial color={CYAN} emissive={CYAN} emissiveIntensity={0.3} flatShading />
            </mesh>
            <mesh position={[x, 0.63, -1.25]} rotation={[0.12, 0, 0]}>
              <boxGeometry args={[0.14, 0.02, 1.1]} />
              <meshStandardMaterial color={CYAN} emissive={CYAN} emissiveIntensity={0.3} flatShading />
            </mesh>
          </group>
        ))}
        {/* side livery stripe + UPCLOUD decal on doors */}
        {[-1, 1].map((s) => (
          <group key={`side${s}`}>
            <mesh position={[s * 0.855, 0.12, 0]}>
              <boxGeometry args={[0.02, 0.08, 3.5]} />
              <meshStandardMaterial color={CYAN} emissive={CYAN} emissiveIntensity={0.4} flatShading />
            </mesh>
            <mesh position={[s * 0.861, 0.32, 0.1]} rotation={[0, s * Math.PI / 2, 0]}>
              <planeGeometry args={[2.2, 0.55]} />
              <meshStandardMaterial map={livery} transparent alphaTest={0.05} depthWrite={false} polygonOffset polygonOffsetFactor={-2} />
            </mesh>
          </group>
        ))}
        {/* bumpers */}
        <mesh position={[0, 0.1, -1.85]}>
          <boxGeometry args={[1.75, 0.22, 0.2]} />
          <meshStandardMaterial color="#1a1a24" flatShading />
        </mesh>
        <mesh position={[0, 0.1, 1.85]}>
          <boxGeometry args={[1.75, 0.22, 0.2]} />
          <meshStandardMaterial color="#1a1a24" flatShading />
        </mesh>
        {/* headlights */}
        {[-0.55, 0.55].map((x) => (
          <mesh key={`hl${x}`} position={[x, 0.36, -1.81]}>
            <boxGeometry args={[0.38, 0.16, 0.04]} />
            <meshStandardMaterial color="#fffbe0" emissive="#fff6c0" emissiveIntensity={3} toneMapped={false} />
          </mesh>
        ))}
        {/* rally light pod */}
        {[-0.3, 0.3].map((x) => (
          <mesh key={`pod${x}`} position={[x, 0.22, -1.97]} rotation={[Math.PI / 2, 0, 0]}>
            <cylinderGeometry args={[0.1, 0.1, 0.06, 8]} />
            <meshStandardMaterial color="#fff" emissive="#ffffff" emissiveIntensity={2.5} toneMapped={false} />
          </mesh>
        ))}
        {/* taillights */}
        {[-0.6, 0.6].map((x) => (
          <mesh key={`tl${x}`} position={[x, 0.4, 1.81]}>
            <boxGeometry args={[0.36, 0.12, 0.04]} />
            <meshStandardMaterial color="#ff1040" emissive="#ff0033" emissiveIntensity={2} toneMapped={false} />
          </mesh>
        ))}
        {/* roof spoiler */}
        <mesh position={[0, 1.15, 1.3]} rotation={[0.15, 0, 0]}>
          <boxGeometry args={[1.5, 0.06, 0.45]} />
          <meshStandardMaterial color={CYAN} flatShading />
        </mesh>
        {[-0.6, 0.6].map((x) => (
          <mesh key={`sp${x}`} position={[x, 1.1, 1.2]}>
            <boxGeometry args={[0.06, 0.1, 0.2]} />
            <meshStandardMaterial color="#1a1a24" flatShading />
          </mesh>
        ))}
        {/* wheel arches */}
        {[-1.15, 1.15].map((z) =>
          [-1, 1].map((s) => (
            <mesh key={`arch${z}${s}`} position={[s * 0.86, 0.1, z]}>
              <boxGeometry args={[0.12, 0.2, 0.95]} />
              <meshStandardMaterial color={PURPLE} flatShading />
            </mesh>
          )),
        )}
      </group>
      {/* wheels (not bobbing, stay on road) */}
      <Wheel position={[-0.82, 0.36, -1.15]} spinRef={wheels} />
      <Wheel position={[0.82, 0.36, -1.15]} spinRef={wheels} />
      <Wheel position={[-0.82, 0.36, 1.15]} spinRef={wheels} />
      <Wheel position={[0.82, 0.36, 1.15]} spinRef={wheels} />
      {/* headlight glow onto the road */}
      <pointLight position={[0, 0.6, -2.6]} color="#fff4c8" intensity={4} distance={8} />
    </group>
  )
}
