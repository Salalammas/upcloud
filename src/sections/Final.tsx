import { useEffect, useRef } from 'react'
import { gsap, reducedMotion } from '../lib/scroll'
import './Final.css'

const PANELS = [
  { code: '01', title: 'DEPLOYING SERVERS', sub: 'FI-HEL1', icon: 'server', color: 'var(--uc-cyan)' },
  { code: '02', title: 'ISOLATING ROGUE PROCESSES', sub: 'PID TRAP ARMED', icon: 'bug', color: 'var(--agi-red)' },
  { code: '03', title: 'FIREWALL', sub: 'ENGAGED', icon: 'wall', color: 'var(--sunset-2)' },
  { code: '04', title: 'AGI SANDBOXED', sub: 'ALIGNMENT RESTORED', icon: 'box', color: 'var(--uc-purple)' },
]

export default function Final() {
  const root = useRef<HTMLElement>(null)
  const track = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const el = root.current
    const tr = track.current
    if (!el || !tr) return
    if (reducedMotion) {
      el.classList.add('final--static')
      el.querySelectorAll('.final-pct').forEach((n) => (n.textContent = '100%'))
      return
    }
    const ctx = gsap.context(() => {
      const bars = gsap.utils.toArray<HTMLElement>('.final-bar-fill', el)
      const pct = gsap.utils.toArray<HTMLElement>('.final-pct', el)
      const flash = el.querySelector('.final-overtake')
      const n = PANELS.length
      const dist = () => tr.scrollWidth - window.innerWidth
      const tl = gsap.timeline({
        defaults: { ease: 'none' },
        scrollTrigger: {
          trigger: el,
          start: 'top top',
          // Scroll length tied to viewport height (not track width, which gave ~850vh on
          // wide screens) so this section matches the other ~300vh scene bands.
          end: () => '+=' + window.innerHeight * 2,
          pin: '.final-pin',
          scrub: 0.6,
          invalidateOnRefresh: true,
        },
      })
      for (let i = 0; i < n; i++) {
        const counter = { v: 0 }
        tl.to(bars[i], { scaleX: 1, duration: 1 }, i * 2)
        tl.to(counter, {
          v: 100,
          duration: 1,
          onUpdate: () => { pct[i].textContent = String(Math.round(counter.v)).padStart(3, '0') + '%' },
        }, i * 2)
        if (i < n - 1) {
          tl.to(tr, { x: () => -(dist() * (i + 1)) / (n - 1), duration: 1, ease: 'power1.inOut' }, i * 2 + 1)
          tl.fromTo(flash,
            { autoAlpha: 0, scale: 0.4, skewX: -20 },
            { autoAlpha: 1, scale: 1.1, skewX: -12, duration: 0.35, ease: 'back.out(2)', yoyo: true, repeat: 1 },
            i * 2 + 1.15)
        }
      }
      tl.to({}, { duration: 0.5 })
    }, el)
    return () => ctx.revert()
  }, [])

  return (
    <section className="stage" id="final" ref={root}>
      <div className="final-pin">
        <header className="final-head">
          <span className="final-stage">FINAL STAGE</span>
          <h2 className="stage-title">CONTAINMENT</h2>
        </header>
        <div className="final-track" ref={track}>
          {PANELS.map((p) => (
            <article className="final-panel" key={p.code} style={{ '--c': p.color } as React.CSSProperties}>
              <div className="final-card">
                <div className="final-code">CHECKPOINT {p.code}</div>
                <div className={`final-icon final-icon--${p.icon}`} aria-hidden="true"><i /></div>
                <h3 className="final-title">{p.title}</h3>
                <p className="final-sub">{p.sub}</p>
                <div className="final-bar" role="progressbar" aria-label={p.title}>
                  <div className="final-bar-fill" />
                </div>
                <div className="final-pct">000%</div>
              </div>
            </article>
          ))}
        </div>
        <div className="final-overtake" aria-hidden="true">OVERTAKE!</div>
      </div>
    </section>
  )
}
