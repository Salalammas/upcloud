import { useEffect, useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { scrollState, stageIndex, stageLocal, chaos } from '../lib/scroll'

const COUNT = 4000
const BURST_COUNT = 700

const mainVert = /* glsl */ `
  attribute vec4 aSeed;
  uniform float uTime;
  uniform float uTravel;
  uniform float uSpeed;
  uniform float uChaos;
  uniform float uCelebrate;
  uniform float uPixelRatio;
  varying float vMode;   // 0 dust, 1 data bit, 2 confetti
  varying vec3 vColor;
  varying float vAlpha;
  varying float vStretch;

  vec3 confetti(float s) {
    if (s < 0.2) return vec3(1.0, 0.25, 0.35);
    if (s < 0.4) return vec3(1.0, 0.85, 0.15);
    if (s < 0.6) return vec3(0.2, 0.9, 0.45);
    if (s < 0.8) return vec3(0.25, 0.6, 1.0);
    return vec3(0.85, 0.35, 1.0);
  }

  void main() {
    float span = 70.0;
    // --- speed dust streaming toward camera (camera ~ z=8)
    vec3 dust = position;
    dust.z = mod(position.z + uTravel * (0.6 + aSeed.x * 0.8), span) - span + 8.0;
    vec3 p = dust;
    vec3 col = mix(vec3(0.75, 0.8, 1.0), vec3(1.0, 0.8, 0.55), aSeed.y);
    float mode = 0.0;
    float alpha = 0.35 + 0.4 * aSeed.z;

    // --- chaos: red glitch data bits swirling into the AGI at (0,8,-40)
    float conv = smoothstep(aSeed.w, aSeed.w + 0.15, uChaos * 1.1);
    if (conv > 0.0) {
      vec3 agi = vec3(0.0, 8.0, -40.0);
      float cyc = fract(uTime * (0.08 + aSeed.x * 0.12) + aSeed.y);
      float r = mix(26.0 * (0.4 + aSeed.z), 0.6, cyc * cyc);
      float a = aSeed.w * 6.2831 + uTime * (0.6 + aSeed.x * 1.4) + cyc * 9.0;
      vec3 sw = agi + vec3(cos(a) * r, sin(a * 0.7 + aSeed.z * 6.0) * r * 0.45, sin(a) * r * 0.6);
      // digital jitter: snap to grid occasionally
      float g = step(0.93, fract(uTime * 3.0 + aSeed.x * 17.0));
      sw = mix(sw, floor(sw * 1.5) / 1.5, g);
      p = mix(p, sw, conv);
      vec3 red = mix(vec3(1.0, 0.08, 0.15), vec3(1.0, 0.45, 0.2), step(0.85, aSeed.z));
      col = mix(col, red, conv);
      mode = mix(mode, 1.0, step(0.5, conv));
      alpha = mix(alpha, 0.55 + 0.45 * (1.0 - cyc), conv);
    }

    // --- celebration: confetti sparks fountaining up
    if (uCelebrate > 0.0) {
      float t = fract(uTime * (0.18 + aSeed.x * 0.2) + aSeed.w);
      float ang = aSeed.y * 6.2831;
      float spd = 4.0 + aSeed.z * 9.0;
      vec3 origin = vec3((aSeed.x - 0.5) * 30.0, -1.0, -10.0 - aSeed.w * 25.0);
      vec3 v = vec3(cos(ang) * spd * 0.5, 8.0 + aSeed.z * 10.0, sin(ang) * spd * 0.5);
      vec3 cp = origin + v * t * 2.0 + vec3(0.0, -9.8, 0.0) * t * t * 2.0;
      cp.x += sin(uTime * 3.0 + aSeed.x * 20.0) * 0.4;
      p = mix(p, cp, uCelebrate);
      col = mix(col, confetti(aSeed.z), uCelebrate);
      mode = mix(mode, 2.0, step(0.5, uCelebrate));
      alpha = mix(alpha, 1.0 - t * 0.7, uCelebrate);
    }

    vec4 mv = modelViewMatrix * vec4(p, 1.0);
    gl_Position = projectionMatrix * mv;
    float base = mode > 1.5 ? 7.0 : (mode > 0.5 ? 6.0 : 3.0);
    float stretch = mode < 0.5 ? clamp(uSpeed, 0.0, 1.0) : 0.0;
    float size = base * (0.6 + aSeed.z) * (1.0 + stretch * 1.5);
    gl_PointSize = size * uPixelRatio * (40.0 / max(1.0, -mv.z));
    vMode = mode;
    vColor = col;
    vAlpha = alpha * smoothstep(0.5, 4.0, -mv.z);
    vStretch = stretch;
  }
`

const mainFrag = /* glsl */ `
  uniform float uTime;
  varying float vMode;
  varying vec3 vColor;
  varying float vAlpha;
  varying float vStretch;
  void main() {
    vec2 uv = gl_PointCoord - 0.5;
    float a;
    if (vMode > 1.5) {
      // confetti: little diamond sparkle
      float d = abs(uv.x) + abs(uv.y);
      a = 1.0 - smoothstep(0.2, 0.5, d);
    } else if (vMode > 0.5) {
      // data bit: hard square with scanline glitch
      a = step(max(abs(uv.x), abs(uv.y)), 0.42);
      a *= 0.6 + 0.4 * step(0.5, fract(gl_PointCoord.y * 4.0 + uTime * 6.0));
    } else {
      // speed streak: vertically elongated soft ellipse
      vec2 q = uv * vec2(1.0 + vStretch * 5.0, 1.0);
      a = 1.0 - smoothstep(0.0, 0.5, length(q));
    }
    if (a < 0.01) discard;
    gl_FragColor = vec4(vColor * a, a * vAlpha);
  }
`

const burstVert = /* glsl */ `
  attribute vec4 aSeed;
  uniform float uTime;
  uniform float uActive;
  uniform float uPixelRatio;
  varying float vAlpha;
  varying float vTone;
  void main() {
    float t = fract(uTime * (0.9 + aSeed.x * 0.8) + aSeed.w);
    vec3 origin = vec3(0.0, 0.0, 2.9) + vec3((aSeed.y - 0.5) * 1.6, 0.05, 0.0);
    vec3 v = vec3((aSeed.y - 0.5) * 3.0, 1.2 + aSeed.z * 2.2, 3.0 + aSeed.x * 4.0);
    vec3 p = origin + v * t + vec3(0.0, -3.5, 0.0) * t * t;
    p.y = max(p.y, 0.0);
    vec4 mv = modelViewMatrix * vec4(p, 1.0);
    gl_Position = projectionMatrix * mv;
    gl_PointSize = (6.0 + 22.0 * t) * (0.5 + aSeed.z) * uPixelRatio * (8.0 / max(1.0, -mv.z));
    vAlpha = uActive * (1.0 - t) * smoothstep(0.0, 0.1, t) * 0.5;
    vTone = aSeed.z;
  }
`

const burstFrag = /* glsl */ `
  varying float vAlpha;
  varying float vTone;
  void main() {
    float d = length(gl_PointCoord - 0.5);
    float a = (1.0 - smoothstep(0.1, 0.5, d)) * vAlpha;
    if (a < 0.005) discard;
    vec3 col = mix(vec3(0.85, 0.65, 0.4), vec3(1.0, 0.9, 0.7), vTone);
    gl_FragColor = vec4(col * a, a);
  }
`

function makeSeeds(n: number) {
  const s = new Float32Array(n * 4)
  for (let i = 0; i < s.length; i++) s[i] = Math.random()
  return s
}

export default function Particles() {
  const mainGeo = useMemo(() => {
    const g = new THREE.BufferGeometry()
    const pos = new Float32Array(COUNT * 3)
    for (let i = 0; i < COUNT; i++) {
      const r = 1.5 + Math.pow(Math.random(), 0.7) * 22
      const a = Math.random() * Math.PI * 2
      pos[i * 3] = Math.cos(a) * r
      pos[i * 3 + 1] = Math.sin(a) * r * 0.55 + 2
      pos[i * 3 + 2] = Math.random() * 70
    }
    g.setAttribute('position', new THREE.BufferAttribute(pos, 3))
    g.setAttribute('aSeed', new THREE.BufferAttribute(makeSeeds(COUNT), 4))
    g.boundingSphere = new THREE.Sphere(new THREE.Vector3(0, 0, -20), 200)
    return g
  }, [])

  const burstGeo = useMemo(() => {
    const g = new THREE.BufferGeometry()
    g.setAttribute('position', new THREE.BufferAttribute(new Float32Array(BURST_COUNT * 3), 3))
    g.setAttribute('aSeed', new THREE.BufferAttribute(makeSeeds(BURST_COUNT), 4))
    g.boundingSphere = new THREE.Sphere(new THREE.Vector3(0, 0, 2), 50)
    return g
  }, [])

  const mainMat = useMemo(
    () =>
      new THREE.ShaderMaterial({
        vertexShader: mainVert,
        fragmentShader: mainFrag,
        uniforms: {
          uTime: { value: 0 },
          uTravel: { value: 0 },
          uSpeed: { value: 0 },
          uChaos: { value: 0 },
          uCelebrate: { value: 0 },
          uPixelRatio: { value: 1 },
        },
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
      }),
    [],
  )

  const burstMat = useMemo(
    () =>
      new THREE.ShaderMaterial({
        vertexShader: burstVert,
        fragmentShader: burstFrag,
        uniforms: { uTime: { value: 0 }, uActive: { value: 0 }, uPixelRatio: { value: 1 } },
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
      }),
    [],
  )

  useEffect(
    () => () => {
      mainGeo.dispose()
      burstGeo.dispose()
      mainMat.dispose()
      burstMat.dispose()
    },
    [mainGeo, burstGeo, mainMat, burstMat],
  )

  const smooth = useRef({ speed: 0, chaos: 0, celebrate: 0, burst: 0, travel: 0 })

  useFrame((state, dt) => {
    const d = Math.min(dt, 0.05)
    const p = scrollState.progress
    const s = smooth.current
    const k = 1 - Math.exp(-d * 4)
    const targetSpeed = Math.min(1, Math.abs(scrollState.velocity) / 40)
    s.speed += (targetSpeed - s.speed) * k
    s.chaos += (chaos(p) - s.chaos) * k
    const si = stageIndex(p)
    const celeb = si >= 5 ? Math.min(1, stageLocal(p, 5) * 3) : 0
    s.celebrate += (celeb - s.celebrate) * k
    s.burst += ((si >= 3 ? 0.4 + s.speed * 0.6 : 0) - s.burst) * k
    s.travel += d * (3 + s.speed * 60) * (1 - s.celebrate * 0.8)

    const t = state.clock.elapsedTime
    const pr = state.gl.getPixelRatio()
    const mu = mainMat.uniforms
    mu.uTime.value = t
    mu.uTravel.value = s.travel
    mu.uSpeed.value = s.speed
    mu.uChaos.value = s.chaos
    mu.uCelebrate.value = s.celebrate
    mu.uPixelRatio.value = pr
    const bu = burstMat.uniforms
    bu.uTime.value = t
    bu.uActive.value = s.burst
    bu.uPixelRatio.value = pr
  })

  return (
    <group>
      <points geometry={mainGeo} material={mainMat} frustumCulled={false} />
      <points geometry={burstGeo} material={burstMat} frustumCulled={false} />
    </group>
  )
}
