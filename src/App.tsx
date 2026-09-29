import { useEffect } from 'react'
import 'lenis/dist/lenis.css'
import { initScroll, ScrollTrigger, INTRO_DONE_EVENT } from './lib/scroll'
import Scene from './three/Scene'
import Hud from './hud/Hud'
import Intro from './hud/Intro'
import { sections } from './sections'

export default function App() {
  useEffect(() => {
    // Always start the race at the top (Intro covers the page anyway).
    if ('scrollRestoration' in history) history.scrollRestoration = 'manual'
    window.scrollTo(0, 0)

    const lenis = initScroll()

    // Recalculate pin spacing / trigger positions once layout is final.
    let raf = requestAnimationFrame(() => ScrollTrigger.refresh())
    let alive = true
    const refresh = () => {
      if (!alive) return
      cancelAnimationFrame(raf)
      raf = requestAnimationFrame(() => ScrollTrigger.refresh())
    }
    document.fonts?.ready.then(refresh).catch(() => {})
    window.addEventListener(INTRO_DONE_EVENT, refresh)

    return () => {
      alive = false
      cancelAnimationFrame(raf)
      window.removeEventListener(INTRO_DONE_EVENT, refresh)
      lenis.destroy()
    }
  }, [])
  return (
    <>
      <Scene />
      <Hud />
      <Intro />
      <main>
        {sections.map(({ id, Comp }) => (
          <Comp key={id} />
        ))}
      </main>
    </>
  )
}
