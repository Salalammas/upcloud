import { useMemo, useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import { scrollState, chaos, stageLocal } from '../lib/scroll'

/* ---------- palettes: [top, mid, horizon] ---------- */
const SUNSET = ['#1a0633', '#b0247a', '#ff8a3d'].map((c) => new THREE.Color(c))
const RAMPANT = ['#050000', '#3a0006', '#c4100c'].map((c) => new THREE.Color(c))
const DAWN = ['#2a8fd8', '#7fe6ff', '#ffd66b'].map((c) => new THREE.Color(c))

const SUN_A = { sunset: [new THREE.Color('#ffe45c'), new THREE.Color('#ff3d8b')], rampant: [new THREE.Color('#ff2a10'), new THREE.Color('#400000')], dawn: [new THREE.Color('#fffbe0'), new THREE.Color('#ffb52e')] }

const skyVert = /* glsl */ `
varying vec3 vPos;
void main() {
  vPos = normalize(position);
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}`

const skyFrag = /* glsl */ `
uniform vec3 uTop; uniform vec3 uMid; uniform vec3 uHorizon;
uniform float uFlicker; uniform float uTime; uniform float uChaos;
varying vec3 vPos;
float hash(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
void main() {
  float h = vPos.y;
  float t = clamp(h, 0.0, 1.0);
  vec3 col = mix(uHorizon, uMid, smoothstep(0.0, 0.18, t));
  col = mix(col, uTop, smoothstep(0.15, 0.65, t));
  if (h < 0.0) col = mix(uHorizon, uTop * 0.6, smoothstep(0.0, -0.3, h));
  // chunky 90s dithering bands
  col = floor(col * 24.0 + hash(gl_FragCoord.xy * 0.5) * 0.5) / 24.0;
  // chaos: scanline tear + flicker
  float scan = step(0.97, hash(vec2(floor(gl_FragCoord.y * 0.25), floor(uTime * 12.0))));
  col += vec3(0.5, 0.0, 0.0) * scan * uChaos;
  col *= 1.0 - uFlicker;
  gl_FragColor = vec4(col, 1.0);
}`

const sunVert = /* glsl */ `
varying vec2 vUv;
void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`

const sunFrag = /* glsl */ `
uniform vec3 uTopCol; uniform vec3 uBotCol; uniform float uTime; uniform float uChaos; uniform float uFlicker;
varying vec2 vUv;
void main() {
  vec2 p = vUv - 0.5;
  float r = length(p);
  if (r > 0.5) discard;
  float y = vUv.y;
  // retro horizontal cut bands, thicker toward the bottom, scrolling down
  float band = fract(y * 14.0 + uTime * 0.25 * (1.0 + uChaos * 4.0));
  float thick = mix(0.55, 0.0, smoothstep(0.05, 0.55, y));
  if (y < 0.55 && band < thick) discard;
  vec3 col = mix(uBotCol, uTopCol, smoothstep(0.0, 1.0, y));
  col *= 1.0 - uFlicker * 0.8;
  gl_FragColor = vec4(col, 1.0);
}`

/* ---------- low-poly mountain strip ---------- */
function mountainGeometry(width: number, height: number, peaks: number, seed: number) {
  let s = seed
  const rnd = () => ((s = (s * 16807) % 2147483647) / 2147483647)
  const pts: [number, number][] = []
  for (let i = 0; i <= peaks; i++) {
    const x = -width / 2 + (i / peaks) * width
    const y = i % 2 === 0 ? height * (0.15 + rnd() * 0.3) : height * (0.55 + rnd() * 0.45)
    pts.push([x, y])
  }
  const pos: number[] = []
  const col: number[] = []
  const base = -height * 0.4
  for (let i = 0; i < pts.length - 1; i++) {
    const [x0, y0] = pts[i]
    const [x1, y1] = pts[i + 1]
    const mx = (x0 + x1) / 2
    const my = Math.min(y0, y1) * 0.5
    // facets: two triangles + ridge fill for flat-shaded look
    const tris = [
      [x0, base, x0, y0, mx, my],
      [mx, my, x0, y0, x1, y1],
      [x0, base, mx, my, x1, base],
      [mx, my, x1, y1, x1, base],
    ]
    tris.forEach((t, k) => {
      pos.push(t[0], t[1], 0, t[2], t[3], 0, t[4], t[5], 0)
      const shade = 0.75 + ((i + k) % 3) * 0.12 + (k === 1 ? 0.15 : 0)
      for (let v = 0; v < 3; v++) col.push(shade, shade, shade)
    })
  }
  const g = new THREE.BufferGeometry()
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3))
  g.setAttribute('color', new THREE.Float32BufferAttribute(col, 3))
  return g
}

const LAYERS = [
  { z: -110, w: 520, h: 34, peaks: 26, seed: 7, parallax: 0.9, base: '#3b0f5c', y: -2 },
  { z: -85, w: 420, h: 24, peaks: 22, seed: 31, parallax: 0.75, base: '#26083f', y: -2 },
  { z: -60, w: 320, h: 16, peaks: 20, seed: 97, parallax: 0.55, base: '#14032a', y: -2 },
]
const MTN_CHAOS = new THREE.Color('#0a0000')
const MTN_DAWN = [new THREE.Color('#3a6fa8'), new THREE.Color('#28527f'), new THREE.Color('#1a3558')]

const tmpA = new THREE.Color()
const tmpB = new THREE.Color()

function blend3(out: THREE.Color, a: THREE.Color, b: THREE.Color, c: THREE.Color, k: number, d: number) {
  tmpA.copy(a).lerp(b, k)
  return out.copy(tmpA).lerp(c, d)
}

export default function Sky() {
  const { scene, camera } = useThree()
  const group = useRef<THREE.Group>(null)
  const mtnRefs = useRef<(THREE.Mesh | null)[]>([])

  const skyUniforms = useMemo(
    () => ({
      uTop: { value: SUNSET[0].clone() },
      uMid: { value: SUNSET[1].clone() },
      uHorizon: { value: SUNSET[2].clone() },
      uFlicker: { value: 0 },
      uTime: { value: 0 },
      uChaos: { value: 0 },
    }),
    [],
  )
  const sunUniforms = useMemo(
    () => ({
      uTopCol: { value: SUN_A.sunset[0].clone() },
      uBotCol: { value: SUN_A.sunset[1].clone() },
      uTime: { value: 0 },
      uChaos: { value: 0 },
      uFlicker: { value: 0 },
    }),
    [],
  )
  const geos = useMemo(() => LAYERS.map((l) => mountainGeometry(l.w, l.h, l.peaks, l.seed)), [])
  const mtnBase = useMemo(() => LAYERS.map((l) => new THREE.Color(l.base)), [])

  useFrame((state) => {
    const p = scrollState.progress
    const t = state.clock.elapsedTime
    const c = chaos(p)
    const dawn = THREE.MathUtils.smoothstep(stageLocal(p, 4), 0.2, 1)
    const flicker = c > 0.3 ? (Math.random() < 0.08 * c ? 0.6 * c : 0) + Math.sin(t * 37) * 0.05 * c : 0

    const keys = ['uTop', 'uMid', 'uHorizon'] as const
    keys.forEach((k, i) => blend3(skyUniforms[k].value, SUNSET[i], RAMPANT[i], DAWN[i], c, dawn))
    skyUniforms.uFlicker.value = flicker
    skyUniforms.uTime.value = t
    skyUniforms.uChaos.value = c

    blend3(sunUniforms.uTopCol.value, SUN_A.sunset[0], SUN_A.rampant[0], SUN_A.dawn[0], c, dawn)
    blend3(sunUniforms.uBotCol.value, SUN_A.sunset[1], SUN_A.rampant[1], SUN_A.dawn[1], c, dawn)
    sunUniforms.uTime.value = t
    sunUniforms.uChaos.value = c
    sunUniforms.uFlicker.value = flicker

    // keep backdrop centred on camera, mountains with parallax
    if (group.current) group.current.position.set(camera.position.x, 0, camera.position.z)
    mtnRefs.current.forEach((m, i) => {
      if (!m) return
      m.position.x = -camera.position.x * (1 - LAYERS[i].parallax)
      blend3((m.material as THREE.MeshBasicMaterial).color, mtnBase[i], MTN_CHAOS, MTN_DAWN[i], c, dawn)
    })

    // fog synced to horizon colour
    if (!(scene.fog instanceof THREE.Fog)) scene.fog = new THREE.Fog('#ff8a3d', 25, 160)
    const fog = scene.fog as THREE.Fog
    fog.color.copy(skyUniforms.uHorizon.value).lerp(skyUniforms.uMid.value, 0.35)
    fog.color.multiplyScalar(1 - flicker)
    tmpB.copy(fog.color)
    if (scene.background instanceof THREE.Color) scene.background.copy(tmpB)
  })

  return (
    <group ref={group}>
      <mesh renderOrder={-10} frustumCulled={false}>
        <sphereGeometry args={[400, 32, 24]} />
        <shaderMaterial
          vertexShader={skyVert}
          fragmentShader={skyFrag}
          uniforms={skyUniforms}
          side={THREE.BackSide}
          depthWrite={false}
          fog={false}
        />
      </mesh>
      <mesh position={[0, 14, -120]} renderOrder={-9}>
        <planeGeometry args={[70, 70]} />
        <shaderMaterial vertexShader={sunVert} fragmentShader={sunFrag} uniforms={sunUniforms} depthWrite={false} fog={false} transparent />
      </mesh>
      {LAYERS.map((l, i) => (
        <mesh
          key={i}
          ref={(m) => {
            mtnRefs.current[i] = m
          }}
          geometry={geos[i]}
          position={[0, l.y, l.z]}
          renderOrder={-8 + i}
        >
          <meshBasicMaterial vertexColors color={l.base} fog={false} side={THREE.DoubleSide} />
        </mesh>
      ))}
    </group>
  )
}
