import { Component, lazy, Suspense, type ErrorInfo, type ReactNode } from 'react'
import { hasWebGL } from './webgl'

// Heavy 3D code (three, R3F, drei, postprocessing) is split into its own chunks
// and fetched after the HTML/HUD has painted.
const SceneCanvas = lazy(() => import('./SceneCanvas'))

const fallbackStyle: React.CSSProperties = {
  position: 'fixed',
  inset: 0,
  zIndex: 0,
  background: 'linear-gradient(180deg, #1a0633 0%, #3a0a5e 35%, #b8336a 65%, #ff6b6b 82%, #ffb86b 100%)',
}

const Fallback = () => <div className="scene" style={fallbackStyle} aria-hidden="true" />

/** Keeps the page (and story text) alive if the 3D scene throws at runtime. */
class SceneErrorBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false }

  static getDerivedStateFromError() {
    return { failed: true }
  }

  componentDidCatch(error: unknown, info: ErrorInfo) {
    console.warn('[Scene] 3D scene failed, using fallback background.', error, info.componentStack)
  }

  render() {
    return this.state.failed ? <Fallback /> : this.props.children
  }
}

export default function Scene() {
  if (!hasWebGL()) return <Fallback />
  return (
    <SceneErrorBoundary>
      <Suspense fallback={<Fallback />}>
        <SceneCanvas />
      </Suspense>
    </SceneErrorBoundary>
  )
}
