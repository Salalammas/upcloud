import { useEffect, useRef, useState } from 'react'
import { gsap, ScrollTrigger, reducedMotion } from '../lib/scroll'
import './Start.css'

const TITLE_1 = 'UPCLOUD'
const TITLE_2 = 'RALLY'
const LIGHTS = ['red', 'red', 'red', 'green'] as const
const LABELS = ['3', '2', '1', 'GO!']

export default function Start() {
  const root = useRef<HTMLElement>(null)
  const title = useRef<HTMLHeadingElement>(null)
  const [lit, setLit] = useState(reducedMotion ? LIGHTS.length : 0)

  // Countdown lights 3-2-1-GO
  useEffect(() => {
    if (reducedMotion) return
    const timers = LIGHTS.map((_, i) => window.setTimeout(() => setLit(i + 1), 700 + i * 750))
    return () => timers.forEach(clearTimeout)
  }, [])

  useEffect(() => {
    if (!root.current || !title.current) return
    const ctx = gsap.context(() => {
      if (!reducedMotion) {
        gsap.from('.start-letter', {
          yPercent: 120,
          rotate: -12,
          opacity: 0,
          duration: 0.7,
          ease: 'back.out(2)',
          stagger: 0.05,
          delay: 0.2,
        })
        gsap.from('.start-sub, .start-countdown, .start-beat, .start-scroll', {
          y: 30,
          opacity: 0,
          duration: 0.6,
          stagger: 0.12,
          delay: 0.8,
        })
        gsap.to(title.current, {
          scale: 2.4,
          skewX: -25,
          opacity: 0,
          ease: 'none',
          scrollTrigger: {
            trigger: root.current,
            start: 'top top',
            end: '50% top',
            scrub: true,
          },
        })
        gsap.to('.start-hero-rest', {
          y: -120,
          opacity: 0,
          ease: 'none',
          scrollTrigger: { trigger: root.current, start: '5% top', end: '40% top', scrub: true },
        })
      }
      gsap.from('.start-beat-line', {
        x: -60,
        opacity: 0,
        stagger: 0.2,
        duration: reducedMotion ? 0 : 0.6,
        scrollTrigger: { trigger: '.start-beat', start: 'top 75%' },
      })
    }, root)
    return () => {
      ctx.revert()
      ScrollTrigger.refresh()
    }
  }, [])

  const letters = (word: string, offset: number) =>
    word.split('').map((ch, i) => (
      <span key={i + offset} className="start-letter" style={{ ['--i' as string]: i + offset }}>
        {ch}
      </span>
    ))

  const go = lit >= LIGHTS.length

  return (
    <section className="stage start" id="start" ref={root}>
      <div className="start-hero">
        <h1 className="start-title" ref={title} aria-label="UpCloud Rally">
          <span className="start-word">{letters(TITLE_1, 0)}</span>
          <span className="start-word start-word--2">{letters(TITLE_2, TITLE_1.length)}</span>
        </h1>
        <div className="start-hero-rest">
          <p className="start-sub">2026 — THE RACE FOR THE FUTURE</p>
          <div className="start-countdown" role="status" aria-live="polite">
            <p className="start-callout">GENTLEMEN, START YOUR CLOUDS</p>
            <div className="start-lights">
              {LIGHTS.map((c, i) => (
                <span key={i} className={`start-light start-light--${c}${i < lit ? ' is-on' : ''}`} />
              ))}
            </div>
            <p className={`start-count${go ? ' is-go' : ''}`}>{lit > 0 ? LABELS[lit - 1] : 'READY'}</p>
          </div>
          <p className="start-scroll">SCROLL TO START ▼</p>
        </div>
      </div>
      <div className="start-beat">
        <p className="start-beat-kicker">STAGE 0 · BIRTH</p>
        <p className="start-beat-line">AI was born.</p>
        <p className="start-beat-line">Helpful.</p>
        <p className="start-beat-line">Harmless.</p>
        <p className="start-beat-line start-beat-line--hungry">Hungry.</p>
      </div>
    </section>
  )
}
