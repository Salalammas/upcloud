import { useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import { scrollState, reducedMotion, stageIndex, stageLocal, chaos } from '../lib/scroll'

const V = (x: number, y: number, z: number) => new THREE.Vector3(x, y, z)
const ease = (t: number) => t * t * (3 - 2 * t)

const AGI = V(0, 8, -40)
const ORBIT_CENTER = V(0, 4, -20)

const tmpA = new THREE.Vector3()
const tmpB = new THREE.Vector3()

/** Target camera pose for a given scroll progress. Writes into pos/look, returns roll (rad). */
function poseAt(p: number, pos: THREE.Vector3, look: THREE.Vector3, time: number): number {
  const i = stageIndex(p)
  const t = ease(stageLocal(p, i))
  switch (i) {
    case 0: // low wide shot at start line
      pos.lerpVectors(tmpA.set(3.4, 0.9, 11), tmpB.set(4, 1.3, 9), t)
      look.lerpVectors(tmpA.set(0, 0.6, -6), tmpB.set(0, 0.8, -12), t)
      return 0.03 * t
    case 1: // rising drone over the desert
      pos.lerpVectors(tmpA.set(4, 1.3, 9), tmpB.set(-6, 16, 6), t)
      look.lerpVectors(tmpA.set(0, 0.8, -12), tmpB.set(0, 0, -22), t)
      return THREE.MathUtils.lerp(0.03, -0.06, t)
    case 2: // tilt up toward AGI
      pos.lerpVectors(tmpA.set(-6, 16, 6), tmpB.set(-1.5, 2, 12), t)
      look.lerpVectors(tmpA.set(0, 0, -22), AGI, t)
      return THREE.MathUtils.lerp(-0.06, 0, t)
    case 3: { // low chase cam behind car, dutch angle swinging in
      pos.lerpVectors(tmpA.set(-1.2, 1.9, 8), tmpB.set(0.4, 1.8, 6.6), t)
      look.lerpVectors(tmpA.set(0, 2.5, -20), tmpB.set(0, 1.1, -12), t)
      pos.x += Math.sin(time * 0.8) * 0.15
      return Math.sin(t * Math.PI) * 0.38
    }
    case 4: { // orbit around car + AGI
      const a = t * Math.PI * 1.25
      const r = THREE.MathUtils.lerp(24, 30, t)
      // elliptical (x * 0.5) so the camera stays clear of the roadside hills (up to ~10u high at |x|>20)
      pos.set(Math.sin(a) * r * 0.5, THREE.MathUtils.lerp(4, 10, t), ORBIT_CENTER.z + Math.cos(a) * r)
      look.copy(ORBIT_CENTER)
      return 0.1 * Math.sin(t * Math.PI)
    }
    default: // victory wide: pull up and back
      pos.lerpVectors(tmpA.set(-10.6, 10, -41.2), tmpB.set(0, 42, 45), t) // starts at stage-4 end pose
      look.lerpVectors(ORBIT_CENTER, tmpB.set(0, 2, -15), t)
      return 0
  }
}

export default function CameraRig() {
  const camera = useThree((s) => s.camera) as THREE.PerspectiveCamera
  const pointer = useThree((s) => s.pointer)
  const state = useRef({
    pos: new THREE.Vector3(3.4, 0.9, 11),
    look: new THREE.Vector3(0, 0.6, -6),
    roll: 0,
    fov: 55,
    targetPos: new THREE.Vector3(),
    targetLook: new THREE.Vector3(),
    px: 0,
    py: 0,
    init: false,
  })

  useFrame((s, dt) => {
    const st = state.current
    const d = Math.min(dt, 0.1)
    const time = s.clock.elapsedTime
    const p = scrollState.progress
    const targetRoll = poseAt(p, st.targetPos, st.targetLook, time)

    if (!st.init) {
      st.pos.copy(st.targetPos)
      st.look.copy(st.targetLook)
      st.roll = targetRoll
      st.init = true
    }

    const k = reducedMotion ? 12 : 3.2
    const damp = 1 - Math.exp(-k * d)
    st.pos.lerp(st.targetPos, damp)
    st.look.lerp(st.targetLook, damp)
    st.roll = THREE.MathUtils.lerp(st.roll, targetRoll, damp)

    // mouse parallax
    const pd = 1 - Math.exp(-2.5 * d)
    const pm = reducedMotion ? 0.3 : 1
    st.px = THREE.MathUtils.lerp(st.px, pointer.x * pm, pd)
    st.py = THREE.MathUtils.lerp(st.py, pointer.y * pm, pd)

    camera.position.copy(st.pos)
    camera.position.x += st.px * 0.8
    camera.position.y += st.py * 0.4

    // chaos shake
    if (!reducedMotion) {
      const c = chaos(p)
      if (c > 0.001) {
        const amp = c * 0.35
        camera.position.x += (Math.sin(time * 37.1) + Math.sin(time * 23.7) * 0.6) * amp * 0.5
        camera.position.y += (Math.sin(time * 41.3) + Math.sin(time * 17.9) * 0.5) * amp * 0.5
        camera.position.z += Math.sin(time * 29.3) * amp * 0.3
      }
    }

    camera.lookAt(st.look)
    let roll = st.roll
    if (!reducedMotion) roll += chaos(p) * Math.sin(time * 19.7) * 0.025
    camera.rotateZ(roll)

    // FOV kick with scroll velocity
    if ('fov' in camera) {
      const v = reducedMotion ? 0 : Math.min(Math.abs(scrollState.velocity), 60)
      const targetFov = 55 + v * 0.35
      st.fov = THREE.MathUtils.lerp(st.fov, targetFov, 1 - Math.exp(-4 * d))
      if (Math.abs(camera.fov - st.fov) > 0.01) {
        camera.fov = st.fov
        camera.updateProjectionMatrix()
      }
    }
  })

  return null
}
