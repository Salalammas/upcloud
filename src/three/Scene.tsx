import { Canvas } from '@react-three/fiber'

export default function Scene() {
  return (
    <div className="scene">
      <Canvas camera={{ position: [0, 2, 8], fov: 55 }} dpr={[1, 1.75]}>
        <color attach="background" args={['#1a0633']} />
        <ambientLight intensity={0.6} />
      </Canvas>
    </div>
  )
}
