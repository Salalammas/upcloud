import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { scrollState, chaos, stageLocal } from '../lib/scroll'

const CALM = new THREE.Color('#00e5ff')
const RAGE = new THREE.Color('#ff0033')
const SHARDS = 36

const vert = /* glsl */ `
uniform float uTime;
uniform float uChaos;
varying vec3 vView;
varying float vN;
float hash(vec3 p){ return fract(sin(dot(p, vec3(12.9898,78.233,37.719))) * 43758.5453); }
float noise(vec3 p){
  vec3 i = floor(p); vec3 f = fract(p); f = f*f*(3.0-2.0*f);
  float n000=hash(i), n100=hash(i+vec3(1,0,0)), n010=hash(i+vec3(0,1,0)), n110=hash(i+vec3(1,1,0));
  float n001=hash(i+vec3(0,0,1)), n101=hash(i+vec3(1,0,1)), n011=hash(i+vec3(0,1,1)), n111=hash(i+vec3(1,1,1));
  return mix(mix(mix(n000,n100,f.x),mix(n010,n110,f.x),f.y), mix(mix(n001,n101,f.x),mix(n011,n111,f.x),f.y), f.z);
}
void main(){
  vec3 p = position;
  float n = noise(p * 2.5 + vec3(uTime * (0.4 + uChaos * 3.0)));
  float jitter = (hash(floor(p * 8.0) + floor(uTime * 14.0)) - 0.5) * uChaos * 0.25;
  float d = (n - 0.5) * (0.08 + uChaos * 0.7) + jitter;
  p += normalize(position) * d;
  vN = n;
  vec4 mv = modelViewMatrix * vec4(p, 1.0);
  vView = mv.xyz;
  gl_Position = projectionMatrix * mv;
}`

const frag = /* glsl */ `
uniform vec3 uColor;
uniform float uChaos;
uniform float uTime;
varying vec3 vView;
varying float vN;
void main(){
  vec3 nrm = normalize(cross(dFdx(vView), dFdy(vView)));
  vec3 l = normalize(vec3(0.4, 0.8, 0.6));
  float diff = max(dot(nrm, l), 0.0);
  float rim = pow(1.0 - abs(dot(nrm, normalize(-vView))), 2.0);
  float flicker = 0.85 + 0.15 * sin(uTime * (2.0 + uChaos * 30.0) + vN * 10.0);
  vec3 col = uColor * (0.35 + 0.65 * diff) * flicker + uColor * rim * (0.6 + uChaos * 1.4);
  col += vec3(1.0, 0.9, 0.9) * step(0.82, vN) * uChaos * 0.6;
  gl_FragColor = vec4(col, 1.0);
}`

export default function AgiEntity() {
  const root = useRef<THREE.Group>(null)
  const body = useRef<THREE.Mesh>(null)
  const eye = useRef<THREE.Group>(null)
  const shards = useRef<THREE.InstancedMesh>(null)
  const cage = useRef<THREE.Group>(null)
  const halo = useRef<THREE.PointLight>(null)
  const pupilMat = useRef<THREE.MeshBasicMaterial>(null)

  const uniforms = useMemo(
    () => ({ uTime: { value: 0 }, uChaos: { value: 0 }, uColor: { value: CALM.clone() } }),
    [],
  )
  const seeds = useMemo(
    () =>
      Array.from({ length: SHARDS }, (_, i) => ({
        r: 1.8 + Math.random() * 1.6,
        speed: 0.3 + Math.random() * 0.9,
        phase: (i / SHARDS) * Math.PI * 2,
        tilt: (Math.random() - 0.5) * 1.6,
        spin: new THREE.Vector3(Math.random(), Math.random(), Math.random()),
        s: 0.12 + Math.random() * 0.18,
      })),
    [],
  )
  const dummy = useMemo(() => new THREE.Object3D(), [])
  const tmpColor = useMemo(() => new THREE.Color(), [])
  const camLocal = useMemo(() => new THREE.Vector3(), [])
  const smooth = useRef({ c: 0, scale: 1 })

  useFrame((state, dt) => {
    const p = scrollState.progress
    const t = state.clock.elapsedTime
    const target = chaos(p)
    const sm = smooth.current
    sm.c += (target - sm.c) * Math.min(1, dt * 4)
    const c = sm.c
    const contain = stageLocal(p, 4)
    const finish = stageLocal(p, 5)

    // size: small -> huge with chaos -> shrinks with containment -> small friendly
    const early = stageLocal(p, 1) * 0.3
    let targetScale = 1 + early + c * 3.2
    targetScale *= 1 - contain * 0.35
    targetScale *= 1 - finish * 0.15
    sm.scale += (targetScale - sm.scale) * Math.min(1, dt * 3)
    const pulse = 1 + Math.sin(t * (1.6 + c * 9)) * (0.04 + c * 0.06)

    if (root.current) {
      const shakeAmt = c * c * 0.25
      root.current.position.set(
        Math.sin(t * 0.5) * 0.6 + (Math.random() - 0.5) * shakeAmt,
        8 + Math.sin(t * 0.8) * 0.4 + finish * Math.sin(t * 3) * 0.3 + (Math.random() - 0.5) * shakeAmt,
        -40,
      )
      root.current.scale.setScalar(sm.scale * pulse)
    }

    uniforms.uTime.value = t
    uniforms.uChaos.value = c
    tmpColor.copy(CALM).lerp(RAGE, Math.min(1, c * 1.4))
    uniforms.uColor.value.copy(tmpColor)
    if (halo.current) {
      halo.current.color.copy(tmpColor)
      halo.current.intensity = 20 + c * 180
    }
    if (pupilMat.current) pupilMat.current.color.copy(tmpColor).multiplyScalar(0.25 + c * 0.2)

    if (body.current) {
      body.current.rotation.y += dt * (0.2 + c * 2.5)
      body.current.rotation.x += dt * (0.1 + c * 1.2)
    }

    // pupil tracks camera
    if (eye.current && root.current) {
      camLocal.copy(state.camera.position)
      root.current.worldToLocal(camLocal)
      eye.current.lookAt(camLocal)
      const dil = 1 - c * 0.5 + finish * 0.2
      eye.current.scale.setScalar(dil)
    }

    // orbiting shards
    if (shards.current) {
      const vis = Math.min(1, 0.25 + c * 1.5) * (1 - contain * 0.6)
      for (let i = 0; i < SHARDS; i++) {
        const s = seeds[i]
        const a = s.phase + t * s.speed * (0.4 + c * 5)
        const r = s.r * (1 + c * 0.4 + Math.sin(t * 3 + i) * c * 0.2)
        dummy.position.set(Math.cos(a) * r, Math.sin(a * 0.7 + s.tilt) * r * 0.5 + s.tilt, Math.sin(a) * r)
        const spin = t * (0.5 + c * 8)
        dummy.rotation.set(s.spin.x * spin, s.spin.y * spin, s.spin.z * spin)
        dummy.scale.setScalar(s.s * vis)
        dummy.updateMatrix()
        shards.current.setMatrixAt(i, dummy.matrix)
      }
      shards.current.instanceMatrix.needsUpdate = true
      const m = shards.current.material as THREE.MeshStandardMaterial
      m.color.copy(tmpColor)
      m.emissive.copy(tmpColor)
      m.emissiveIntensity = 0.4 + c * 1.6
    }

    // containment cage
    if (cage.current) {
      const e = contain * contain * (3 - 2 * contain)
      const cs = Math.max(0.0001, e) * 2.8 / pulse
      cage.current.scale.setScalar(cs)
      cage.current.visible = contain > 0.001
      cage.current.rotation.y = t * 0.4 * (1 - finish * 0.5)
      cage.current.rotation.x = t * 0.25
    }
  })

  return (
    <group ref={root} position={[0, 8, -40]}>
      <pointLight ref={halo} distance={40} decay={1.5} />
      <mesh ref={body}>
        <icosahedronGeometry args={[1, 1]} />
        <shaderMaterial vertexShader={vert} fragmentShader={frag} uniforms={uniforms} />
      </mesh>
      {/* eye: iris + pupil facing camera */}
      <group ref={eye}>
        <mesh position={[0, 0, 0.98]}>
          <circleGeometry args={[0.42, 6]} />
          <meshBasicMaterial color="#ffffff" toneMapped={false} />
        </mesh>
        <mesh position={[0, 0, 1.0]}>
          <circleGeometry args={[0.2, 6]} />
          <meshBasicMaterial ref={pupilMat} color="#001018" toneMapped={false} />
        </mesh>
      </group>
      <instancedMesh ref={shards} args={[undefined, undefined, SHARDS]}>
        <tetrahedronGeometry args={[1, 0]} />
        <meshStandardMaterial flatShading roughness={0.4} metalness={0.2} />
      </instancedMesh>
      <group ref={cage} visible={false}>
        <mesh>
          <boxGeometry args={[1, 1, 1]} />
          <meshBasicMaterial color="#a04dff" wireframe toneMapped={false} />
        </mesh>
        <mesh rotation={[Math.PI / 4, Math.PI / 4, 0]} scale={0.8}>
          <boxGeometry args={[1, 1, 1]} />
          <meshBasicMaterial color="#00e5ff" wireframe toneMapped={false} />
        </mesh>
        <mesh scale={1.08}>
          <boxGeometry args={[1, 1, 1, 2, 2, 2]} />
          <meshBasicMaterial color="#00e5ff" wireframe transparent opacity={0.35} toneMapped={false} />
        </mesh>
      </group>
    </group>
  )
}
