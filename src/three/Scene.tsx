import { Suspense } from 'react'
import { Canvas } from '@react-three/fiber'
import Sky from './Sky'
import Track from './Track'
import Car from './Car'
import AgiEntity from './AgiEntity'
import Particles from './Particles'
import CameraRig from './CameraRig'
import Effects from './Effects'

export default function Scene() {
  return (
    <div className="scene" aria-hidden>
      <Canvas camera={{ position: [0, 2, 8], fov: 55, far: 400 }} dpr={[1, 1.75]} gl={{ antialias: false, powerPreference: 'high-performance' }}>
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
