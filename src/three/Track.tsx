import { useLayoutEffect, useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { scrollState, chaos } from '../lib/scroll'

/** Segment length (world repeats with this period) and number of segments. */
const L = 60
const N = 5
const ROAD_W = 6
const TRAVEL = 1800 // world units travelled over full scroll
const IDLE_SPEED = 3 // slow drift so it never feels static

// deterministic PRNG so every segment has the same prop layout (seamless wrap)
function rng(seed: number) {
  let s = seed >>> 0
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0
    return s / 4294967296
  }
}

const TAU = Math.PI * 2

function makeTerrain(side: 1 | -1) {
  const w = 110
  const g = new THREE.PlaneGeometry(w, L, 22, 12)
  g.rotateX(-Math.PI / 2)
  const pos = g.attributes.position as THREE.BufferAttribute
  for (let i = 0; i < pos.count; i++) {
    const lx = pos.getX(i) // -w/2..w/2
    const z = pos.getZ(i) // -L/2..L/2
    const x = side * (lx + w / 2 + ROAD_W / 2 + 1.2) // distance from road centre
    const d = Math.abs(x) - ROAD_W / 2 - 1.2
    const k = Math.min(1, d / 30)
    const phase = side > 0 ? 0 : 1.7
    // periodic in z (period L) so segments tile
    const h =
      Math.sin((z / L) * TAU * 2 + x * 0.12 + phase) * 1.4 +
      Math.sin((z / L) * TAU * 3 - x * 0.07 + phase * 2) * 1.0 +
      Math.cos(x * 0.21 + (z / L) * TAU) * 0.8
    pos.setXYZ(i, x, d < 0.5 ? -0.02 : Math.max(-0.02, h * k * 2.2 + k * k * 9), z)
  }
  const ng = g.toNonIndexed()
  g.dispose()
  ng.computeVertexNormals()
  return ng
}

// palette
const C = {
  sandA: new THREE.Color('#e3a15c'),
  sandB: new THREE.Color('#1a0710'),
  roadA: new THREE.Color('#5a4a52'),
  roadB: new THREE.Color('#0d0508'),
  wireA: new THREE.Color('#ff5a3c'),
  wireB: new THREE.Color('#ff1030'),
  trunkA: new THREE.Color('#8a5a34'),
  trunkB: new THREE.Color('#1c0a0c'),
  leafA: new THREE.Color('#2f8f4e'),
  leafB: new THREE.Color('#2a0508'),
  rockA: new THREE.Color('#b0673a'),
  rockB: new THREE.Color('#150609'),
  archA: new THREE.Color('#1e6bff'),
  archB: new THREE.Color('#220308'),
  emisB: new THREE.Color('#ff0a2a'),
  black: new THREE.Color('#000000'),
}

type PropSpec = { x: number; z: number; s: number; r: number; tilt: number }

function genProps() {
  const r = rng(1337)
  const palms: PropSpec[] = []
  const rocks: PropSpec[] = []
  for (let i = 0; i < 7; i++) {
    const side = i % 2 ? 1 : -1
    palms.push({
      x: side * (ROAD_W / 2 + 3 + r() * 9),
      z: -L / 2 + (i + r() * 0.8) * (L / 7),
      s: 0.8 + r() * 0.6,
      r: r() * TAU,
      tilt: (r() - 0.5) * 0.35,
    })
  }
  for (let i = 0; i < 10; i++) {
    const side = r() > 0.5 ? 1 : -1
    rocks.push({
      x: side * (ROAD_W / 2 + 2.5 + r() * 16),
      z: -L / 2 + r() * L,
      s: 0.4 + r() * 1.3,
      r: r() * TAU,
      tilt: r() * TAU,
    })
  }
  return { palms, rocks }
}

export default function Track() {
  const world = useRef<THREE.Group>(null)
  const trunkRef = useRef<THREE.InstancedMesh>(null)
  const leafRef = useRef<THREE.InstancedMesh>(null)
  const rockRef = useRef<THREE.InstancedMesh>(null)
  const dashRef = useRef<THREE.InstancedMesh>(null)
  const rumbleRef = useRef<THREE.InstancedMesh>(null)
  const archRef = useRef<THREE.InstancedMesh>(null)

  const geo = useMemo(() => {
    const trunk = new THREE.CylinderGeometry(0.12, 0.2, 4, 5, 1)
    trunk.translate(0, 2, 0)
    const leaf = new THREE.ConeGeometry(1.8, 0.9, 6, 1)
    leaf.rotateX(Math.PI)
    leaf.translate(0, 4.1, 0)
    return {
      terrainL: makeTerrain(-1),
      terrainR: makeTerrain(1),
      road: new THREE.PlaneGeometry(ROAD_W, L, 1, 1).rotateX(-Math.PI / 2),
      grid: new THREE.PlaneGeometry(ROAD_W, L, 3, 20).rotateX(-Math.PI / 2),
      trunk,
      leaf,
      rock: new THREE.DodecahedronGeometry(1, 0),
      box: new THREE.BoxGeometry(1, 1, 1),
    }
  }, [])

  const mat = useMemo(
    () => ({
      sand: new THREE.MeshStandardMaterial({ color: C.sandA, flatShading: true, roughness: 1 }),
      road: new THREE.MeshStandardMaterial({ color: C.roadA, roughness: 0.9 }),
      wire: new THREE.MeshBasicMaterial({
        color: C.wireB,
        wireframe: true,
        transparent: true,
        opacity: 0,
        depthWrite: false,
      }),
      trunk: new THREE.MeshStandardMaterial({ color: C.trunkA, flatShading: true }),
      leaf: new THREE.MeshStandardMaterial({ color: C.leafA, flatShading: true }),
      rock: new THREE.MeshStandardMaterial({ color: C.rockA, flatShading: true }),
      line: new THREE.MeshStandardMaterial({ color: '#fff4d6', emissive: '#000000' }),
      rumble: new THREE.MeshStandardMaterial({ color: '#ffffff' }),
      arch: new THREE.MeshStandardMaterial({ color: C.archA, flatShading: true, emissive: '#000000' }),
    }),
    [],
  )

  const props = useMemo(genProps, [])
  const DASHES = 10 // per segment
  const RUMBLES = 20 // per side per segment
  const ARCH_PARTS = 3

  useLayoutEffect(() => {
    const m = new THREE.Matrix4()
    const q = new THREE.Quaternion()
    const e = new THREE.Euler()
    const p = new THREE.Vector3()
    const s = new THREE.Vector3()
    const put = (mesh: THREE.InstancedMesh | null, i: number) => mesh?.setMatrixAt(i, m.compose(p, q, s))
    for (let seg = 0; seg < N; seg++) {
      const oz = -seg * L
      props.palms.forEach((pl, i) => {
        const idx = seg * props.palms.length + i
        p.set(pl.x, 0, oz + pl.z)
        q.setFromEuler(e.set(pl.tilt, pl.r, pl.tilt * 0.5))
        s.setScalar(pl.s)
        put(trunkRef.current, idx)
        put(leafRef.current, idx)
      })
      props.rocks.forEach((rk, i) => {
        p.set(rk.x, rk.s * 0.3, oz + rk.z)
        q.setFromEuler(e.set(rk.tilt, rk.r, 0))
        s.set(rk.s, rk.s * 0.7, rk.s)
        put(rockRef.current, seg * props.rocks.length + i)
      })
      q.identity()
      for (let d = 0; d < DASHES; d++) {
        p.set(0, 0.012, oz - L / 2 + (d + 0.5) * (L / DASHES))
        s.set(0.18, 0.02, 2.4)
        put(dashRef.current, seg * DASHES + d)
      }
      for (let side = 0; side < 2; side++) {
        for (let r = 0; r < RUMBLES; r++) {
          const idx = (seg * 2 + side) * RUMBLES + r
          p.set((side ? 1 : -1) * (ROAD_W / 2 + 0.3), 0.03, oz - L / 2 + (r + 0.5) * (L / RUMBLES))
          s.set(0.6, 0.06, L / RUMBLES)
          put(rumbleRef.current, idx)
          rumbleRef.current?.setColorAt(idx, new THREE.Color(r % 2 ? '#ffffff' : '#e8182c'))
        }
      }
      // checkpoint arch, one per segment
      const az = oz - L * 0.35
      const ab = seg * ARCH_PARTS
      p.set(-ROAD_W / 2 - 1.2, 2.5, az); s.set(0.5, 5, 0.5); put(archRef.current, ab)
      p.set(ROAD_W / 2 + 1.2, 2.5, az); s.set(0.5, 5, 0.5); put(archRef.current, ab + 1)
      p.set(0, 5.2, az); s.set(ROAD_W + 3.4, 0.9, 0.5); put(archRef.current, ab + 2)
    }
    for (const r of [trunkRef, leafRef, rockRef, dashRef, rumbleRef, archRef]) {
      if (!r.current) continue
      r.current.instanceMatrix.needsUpdate = true
      if (r.current.instanceColor) r.current.instanceColor.needsUpdate = true
      r.current.computeBoundingSphere()
    }
  }, [props])

  const tmp = useMemo(() => new THREE.Color(), [])

  useFrame(({ clock }) => {
    const p = scrollState.progress
    const c = chaos(p)
    const dist = p * TRAVEL + clock.elapsedTime * IDLE_SPEED
    if (world.current) world.current.position.z = dist % L

    mat.sand.color.lerpColors(C.sandA, C.sandB, c)
    mat.road.color.lerpColors(C.roadA, C.roadB, c)
    mat.trunk.color.lerpColors(C.trunkA, C.trunkB, c)
    mat.leaf.color.lerpColors(C.leafA, C.leafB, c)
    mat.rock.color.lerpColors(C.rockA, C.rockB, c)
    mat.arch.color.lerpColors(C.archA, C.archB, c)
    mat.arch.emissive.lerpColors(C.black, C.emisB, c)
    mat.line.emissive.lerpColors(C.black, C.emisB, c)
    const flicker = c > 0 ? 0.85 + 0.15 * Math.sin(clock.elapsedTime * 23) : 1
    mat.wire.opacity = c * flicker
    mat.wire.visible = c > 0.01
    mat.wire.color.copy(tmp.lerpColors(C.wireA, C.wireB, c))
  })

  const segs = Array.from({ length: N }, (_, i) => i)

  return (
    <group ref={world}>
      {segs.map((i) => (
        <group key={i} position={[0, 0, -i * L]}>
          <mesh geometry={geo.road} material={mat.road} />
          <mesh geometry={geo.grid} material={mat.wire} position={[0, 0.02, 0]} />
          <mesh geometry={geo.terrainL} material={mat.sand} />
          <mesh geometry={geo.terrainR} material={mat.sand} />
          <mesh geometry={geo.terrainL} material={mat.wire} position={[0, 0.03, 0]} />
          <mesh geometry={geo.terrainR} material={mat.wire} position={[0, 0.03, 0]} />
        </group>
      ))}
      <instancedMesh ref={trunkRef} args={[geo.trunk, mat.trunk, N * props.palms.length]} />
      <instancedMesh ref={leafRef} args={[geo.leaf, mat.leaf, N * props.palms.length]} />
      <instancedMesh ref={rockRef} args={[geo.rock, mat.rock, N * props.rocks.length]} />
      <instancedMesh ref={dashRef} args={[geo.box, mat.line, N * DASHES]} />
      <instancedMesh ref={rumbleRef} args={[geo.box, mat.rumble, N * 2 * RUMBLES]} />
      <instancedMesh ref={archRef} args={[geo.box, mat.arch, N * ARCH_PARTS]} />
    </group>
  )
}
