import { lazy, Suspense } from 'react'

// Heavy 3D code (three, R3F, drei, postprocessing) is split into its own chunks
// and fetched after the HTML/HUD has painted.
const SceneCanvas = lazy(() => import('./SceneCanvas'))

const fallbackStyle: React.CSSProperties = {
  position: 'fixed',
  inset: 0,
  zIndex: 0,
  background: 'linear-gradient(180deg, #1a0633 0%, #3a0a5e 35%, #b8336a 65%, #ff6b6b 82%, #ffb86b 100%)',
}

export default function Scene() {
  return (
    <Suspense fallback={<div className="scene" style={fallbackStyle} aria-hidden />}>
      <SceneCanvas />
    </Suspense>
  )
}
