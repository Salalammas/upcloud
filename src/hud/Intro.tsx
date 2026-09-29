import { useCallback, useEffect, useRef, useState } from 'react'
import { gsap, reducedMotion, setScrollLocked, INTRO_DONE_EVENT } from '../lib/scroll'
import './Intro.css'

type Phase = 'boot' | 'ready' | 'powering' | 'done'

export default function Intro() {
  const [phase, setPhase] = useState<Phase>('boot')
  const [pct, setPct] = useState(0)
  const rootRef = useRef<HTMLDivElement>(null)
  const lineRef = useRef<HTMLDivElement>(null)
  const flashRef = useRef<HTMLDivElement>(null)
  const startedRef = useRef(false)

  const done = phase === 'done'

  // Lock scroll (native + Lenis) while visible. The component stays mounted after
  // it renders null, so the lock must key off `done`, not unmount.
  useEffect(() => {
    if (done) return
    const el = document.documentElement
    const prev = el.style.overflow
    el.style.overflow = 'hidden'
    setScrollLocked(true)
    return () => {
      el.style.overflow = prev
      setScrollLocked(false)
    }
  }, [done])

  useEffect(() => {
    if (done) window.dispatchEvent(new Event(INTRO_DONE_EVENT))
  }, [done])

  // Fake loading bar
  useEffect(() => {
    const dur = reducedMotion ? 300 : 1600
    const t0 = performance.now()
    let raf = 0
    const tick = (now: number) => {
      const k = Math.min(1, (now - t0) / dur)
      // chunky, stepped progress for a 90s feel
      setPct(Math.floor((k * 100) / 5) * 5)
      if (k < 1) raf = requestAnimationFrame(tick)
      else setPhase((p) => (p === 'boot' ? 'ready' : p))
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [])

  const start = useCallback(() => {
    if (startedRef.current) return
    startedRef.current = true
    setPhase('powering')
    const finish = () => setPhase('done')
    if (reducedMotion || !lineRef.current || !flashRef.current || !rootRef.current) {
      if (rootRef.current) gsap.to(rootRef.current, { opacity: 0, duration: 0.3, onComplete: finish })
      else finish()
      return
    }
    const tl = gsap.timeline({ onComplete: finish })
    tl.set(lineRef.current, { display: 'block', scaleX: 0, scaleY: 1, opacity: 1 })
      .to(lineRef.current, { scaleX: 1, duration: 0.25, ease: 'power2.out' })
      .to(lineRef.current, { scaleY: 400, duration: 0.3, ease: 'power3.in' })
      .set(flashRef.current, { opacity: 1 })
      .to(flashRef.current, { opacity: 0, duration: 0.45, ease: 'power1.out' })
      .to(rootRef.current, { opacity: 0, duration: 0.35 }, '-=0.3')
  }, [])

  // Any key / auto-start after 4s
  useEffect(() => {
    const onKey = () => start()
    window.addEventListener('keydown', onKey)
    const t = window.setTimeout(start, 4000)
    return () => {
      window.removeEventListener('keydown', onKey)
      window.clearTimeout(t)
    }
  }, [start])

  if (done) return null

  return (
    <div
      ref={rootRef}
      className={`intro intro--${phase}`}
      onClick={start}
      role="dialog"
      aria-label="Intro"
    >
      <div className="intro__screen">
        <div className="intro__boot">
          <p className="intro__line">SYS CHECK ....... OK</p>
          <p className="intro__line">GFX BOARD ....... OK</p>
          <p className="intro__line">LOADING COURSE DATA...</p>
          <div className="intro__bar" aria-hidden="true">
            <div className="intro__fill" style={{ width: `${pct}%` }} />
          </div>
          <p className="intro__pct">{pct}%</p>
        </div>
        {phase !== 'boot' && (
          <div className="intro__cta">
            <p className="intro__coin">INSERT COIN</p>
            <button
              type="button"
              className="intro__start"
              onClick={(e) => {
                e.stopPropagation()
                start()
              }}
              autoFocus
            >
              PRESS START
            </button>
            <p className="intro__credit">CREDIT 01</p>
          </div>
        )}
      </div>
      <div className="intro__scan" aria-hidden="true" />
      <div ref={lineRef} className="intro__powerline" aria-hidden="true" />
      <div ref={flashRef} className="intro__flash" aria-hidden="true" />
    </div>
  )
}
