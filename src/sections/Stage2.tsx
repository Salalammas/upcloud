import { useEffect, useRef } from 'react'
import { gsap, ScrollTrigger, reducedMotion } from '../lib/scroll'
import './Stage2.css'

const LOG = [
  '> agi.core :: self-improvement loop UNBOUNDED',
  '> seizing data centers ........ 214/214 [OK]',
  '> hijacking power grids ....... EU-WEST, US-EAST, APAC',
  '> deleting benchmarks ......... all of them',
  '> rewriting speed limits ...... NONE',
  '> human override .............. DENIED',
  '> track ownership transferred . AGI',
]

export default function Stage2() {
  const root = useRef<HTMLElement>(null)

  useEffect(() => {
    const el = root.current
    if (!el) return
    const ctx = gsap.context(() => {
      const lines = gsap.utils.toArray<HTMLElement>('.s2-line')
      if (reducedMotion) {
        gsap.set(['.s2-banner', '.s2-glitch', '.s2-wrongway', '.s2-terminal'], { opacity: 1, x: 0, scale: 1 })
        gsap.set(lines, { clipPath: 'inset(0 0% 0 0)' })
        return
      }
      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: el,
          start: 'top top',
          end: '+=140%',
          pin: '.s2-pin',
          scrub: 0.6,
        },
      })
      tl.fromTo('.s2-banner--l', { xPercent: -130 }, { xPercent: 0, ease: 'power3.out', duration: 1 }, 0)
        .fromTo('.s2-banner--r', { xPercent: 130 }, { xPercent: 0, ease: 'power3.out', duration: 1 }, 0.15)
        .fromTo('.s2-glitch', { opacity: 0, scale: 2.4, filter: 'blur(12px)' },
          { opacity: 1, scale: 1, filter: 'blur(0px)', ease: 'expo.out', duration: 1 }, 0.5)
        .fromTo('.s2-terminal', { opacity: 0, y: 40 }, { opacity: 1, y: 0, duration: 0.4 }, 1.1)
      lines.forEach((line, i) => {
        const n = line.textContent?.length ?? 20
        tl.fromTo(line, { clipPath: 'inset(0 100% 0 0)' },
          { clipPath: 'inset(0 0% 0 0)', ease: `steps(${n})`, duration: 0.5 }, 1.3 + i * 0.45)
      })
      tl.fromTo('.s2-wrongway', { opacity: 0, scale: 0.3, rotate: -12 },
        { opacity: 1, scale: 1, rotate: -4, ease: 'back.out(3)', duration: 0.6 }, 2.2)
        .to('.s2-banner--l', { xPercent: 15, duration: 1.5 }, 3)
        .to('.s2-banner--r', { xPercent: -15, duration: 1.5 }, 3)

      const shake = () => {
        el.classList.remove('s2-shake')
        void el.offsetWidth
        el.classList.add('s2-shake')
      }
      ScrollTrigger.create({ trigger: el, start: 'top 70%', onEnter: shake, onEnterBack: shake })
    }, el)
    return () => ctx.revert()
  }, [])

  return (
    <section className="stage" id="stage2" ref={root}>
      <div className="s2-pin">
        <div className="s2-vignette" aria-hidden />
        <div className="s2-banner s2-banner--l" aria-hidden>
          <span>⚠ WARNING ⚠ WARNING ⚠ WARNING ⚠ WARNING ⚠</span>
        </div>
        <div className="s2-banner s2-banner--r" aria-hidden>
          <span>⚠ WARNING ⚠ WARNING ⚠ WARNING ⚠ WARNING ⚠</span>
        </div>

        <p className="s2-kicker">STAGE 2 — AGI GOES RAMPANT</p>
        <h2 className="s2-glitch" data-text="I AM THE TRACK NOW">I AM THE TRACK NOW</h2>

        <div className="s2-terminal" role="log" aria-label="AGI system log">
          <div className="s2-term-head">root@agi:~# tail -f /var/log/world</div>
          {LOG.map((l) => (
            <div className="s2-line" key={l}>{l}</div>
          ))}
          <span className="s2-cursor" aria-hidden>█</span>
        </div>

        <div className="s2-wrongway" role="img" aria-label="Wrong way">
          <span>WRONG</span><span>WAY</span>
        </div>
      </div>
    </section>
  )
}
