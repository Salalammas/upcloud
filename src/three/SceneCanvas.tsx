import { Suspense, useState } from 'react'
import { Canvas } from '@react-three/fiber'
import { AdaptiveDpr, PerformanceMonitor } from '@react-three/drei'
import Sky from './Sky'
import Track from './Track'
import Car from './Car'
import AgiEntity from './AgiEntity'
import Particles from './Particles'
import CameraRig from './CameraRig'
import Effects from './Effects'

const MAX_DPR = 1.75
const MIN_DPR = 0.75

export default function SceneCanvas() {
  const [dpr, setDpr] = useState(() => Math.min(MAX_DPR, typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 1))
  return (
    <div className="scene" aria-hidden>
      <Canvas eventSource={document.getElementById('root')!} eventPrefix="client" camera={{ position: [0, 2, 8], fov: 55, far: 400 }} dpr={dpr} gl={{ antialias: false, powerPreference: 'high-performance' }}>
        <PerformanceMonitor
          onIncline={() => setDpr((d) => Math.min(MAX_DPR, d + 0.25))}
          onDecline={() => setDpr((d) => Math.max(MIN_DPR, d - 0.25))}
          onFallback={() => setDpr(1)}
          flipflops={3}
        />
        <AdaptiveDpr pixelated />
        <color attach="background" args={['#1a0633']} />
        <fog attach="fog" args={['#ff6b6b', 30, 160]} />
        <ambientLight intensity={0.5} />
        <hemisphereLight args={['#ffb86b', '#3a0a5e', 0.8]} />
        <directionalLight position={[-10, 12, -20]} intensity={1.6} color="#ffd29a" />
        <Suspense fallback={null}>
          <Sky />
          <Track />
          <Car />
          <AgiEntity />
          <Particles />
        </Suspense>
        <CameraRig />
        <Effects />
      </Canvas>
    </div>
  )
}
