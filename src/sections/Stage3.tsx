import { useEffect, useRef } from 'react'
import { gsap, reducedMotion } from '../lib/scroll'
import './Stage3.css'

const STATS = [
  { label: 'SPEED', value: 'MaxIOPS', pct: 98 },
  { label: 'RELIABILITY', value: '100% SLA', pct: 100 },
  { label: 'ORIGIN', value: 'FINLAND / EUROPE', pct: 90 },
  { label: 'DATA SOVEREIGNTY', value: 'GDPR', pct: 100 },
]

export default function Stage3() {
  const root = useRef<HTMLElement>(null)

  useEffect(() => {
    const el = root.current
    if (!el) return
    const ctx = gsap.context(() => {
      if (reducedMotion) {
        gsap.set('.s3-bar-fill', { scaleX: (_i: number, t: HTMLElement) => Number(t.dataset.pct) / 100 })
        return
      }
      const tl = gsap.timeline({
        scrollTrigger: { trigger: el, start: 'top 70%', end: 'bottom 60%', scrub: 0.6 },
      })
      tl.fromTo('.s3-lines', { opacity: 0, scale: 0.6 }, { opacity: 1, scale: 1.2, duration: 1 }, 0)
        .fromTo('.s3-here', { xPercent: -140, skewX: -25, opacity: 0 }, { xPercent: 0, skewX: -12, opacity: 1, duration: 0.6, ease: 'back.out(2)' }, 0.1)
        .fromTo('.s3-new', { xPercent: 140, skewX: 25, opacity: 0 }, { xPercent: 0, skewX: -12, opacity: 1, duration: 0.6, ease: 'back.out(2)' }, 0.3)
        .fromTo('.s3-challenger', { scale: 4, opacity: 0, rotate: -8 }, { scale: 1, opacity: 1, rotate: -4, duration: 0.5, ease: 'power4.in' }, 0.6)
        .fromTo('.s3-flash', { opacity: 0.9 }, { opacity: 0, duration: 0.4 }, 1.1)
        .fromTo('.s3-card', { yPercent: 40, opacity: 0, rotateX: 50 }, { yPercent: 0, opacity: 1, rotateX: 0, duration: 0.7, ease: 'power3.out' }, 1.3)
        .fromTo('.s3-row', { x: -60, opacity: 0 }, { x: 0, opacity: 1, stagger: 0.15, duration: 0.4 }, 1.7)
        .fromTo('.s3-bar-fill', { scaleX: 0 }, { scaleX: (_i: number, t: HTMLElement) => Number(t.dataset.pct) / 100, stagger: 0.15, duration: 0.6, ease: 'power2.out' }, 1.9)
        .fromTo('.s3-ready', { opacity: 0, scale: 0.5 }, { opacity: 1, scale: 1, duration: 0.3, ease: 'back.out(3)' }, 2.7)
    }, el)
    return () => ctx.revert()
  }, [])

  return (
    <section className="stage" id="stage3" ref={root}>
      <div className="s3-sticky">
        <div className="s3-lines" aria-hidden="true" />
        <div className="s3-flash" aria-hidden="true" />
        <p className="s3-stage-tag">STAGE 3 — A CHALLENGER APPROACHES</p>
        <h2 className="s3-banner">
          <span className="s3-here">HERE COMES</span>
          <span className="s3-new">A NEW</span>
          <span className="s3-challenger">CHALLENGER!</span>
        </h2>
        <div className="s3-card" role="group" aria-label="UpCloud driver stats">
          <div className="s3-card-head">
            <span className="s3-p2">P2</span>
            <span className="s3-name">UPCLOUD</span>
            <span className="s3-class">EURO CLOUD CLASS</span>
          </div>
          <ul className="s3-stats">
            {STATS.map((s) => (
              <li className="s3-row" key={s.label}>
                <span className="s3-label">{s.label}</span>
                <span className="s3-bar"><span className="s3-bar-fill" data-pct={s.pct} /></span>
                <span className="s3-value">{s.value}</span>
              </li>
            ))}
          </ul>
          <p className="s3-ready">PRESS START TO SAVE THE WORLD</p>
        </div>
      </div>
    </section>
  )
}
