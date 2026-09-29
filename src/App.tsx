import { useEffect } from 'react'
import { initScroll } from './lib/scroll'
import Scene from './three/Scene'
import Hud from './hud/Hud'
import { sections } from './sections'

export default function App() {
  useEffect(() => {
    const lenis = initScroll()
    return () => lenis.destroy()
  }, [])
  return (
    <>
      <Scene />
      <Hud />
      <main>
        {sections.map(({ id, Comp }) => (
          <Comp key={id} />
        ))}
      </main>
    </>
  )
}
