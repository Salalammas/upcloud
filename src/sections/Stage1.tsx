import { useEffect, useRef } from 'react'
import { gsap, ScrollTrigger, reducedMotion } from '../lib/scroll'
import './Stage1.css'

const W = 1000
const H = 500
const K = 5
const curveY = (t: number) => H - 20 - (H - 60) * ((Math.exp(K * t) - 1) / (Math.exp(K) - 1))
const PATH = Array.from({ length: 81 }, (_, i) => {
  const t = i / 80
  return `${i ? 'L' : 'M'}${(40 + t * (W - 80)).toFixed(1)},${curveY(t).toFixed(1)}`
}).join(' ')

const MILESTONES = [
  { t: 0.3, label: 'CHATBOT' },
  { t: 0.6, label: 'CODER' },
  { t: 0.82, label: 'SCIENTIST' },
  { t: 0.97, label: '???' },
]

const BEATS = ['LAP TIMES FALLING.', 'FASTER.', 'FASTER.']

const fmt = (exp: number, unit: string) => {
  const e = Math.floor(exp)
  const m = Math.pow(10, exp - e)
  return `${m.toFixed(2)}E${e} ${unit}`
}

export default function Stage1() {
  const root = useRef<HTMLElement>(null)
  const pin = useRef<HTMLDivElement>(null)
  const path = useRef<SVGPathElement>(null)
  const params = useRef<HTMLSpanElement>(null)
  const compute = useRef<HTMLSpanElement>(null)

  useEffect(() => {
    const el = root.current
    const p = path.current
    if (!el || !p) return
    const len = p.getTotalLength()
    const setCounters = (pr: number) => {
      if (params.current) params.current.textContent = fmt(6 + pr * 7, 'PARAMS')
      if (compute.current) compute.current.textContent = fmt(18 + pr * 9, 'FLOP')
    }
    const ctx = gsap.context(() => {
      const marks = gsap.utils.toArray<HTMLElement>('.s1-mile', el)
      const beats = gsap.utils.toArray<HTMLElement>('.s1-beat', el)
      if (reducedMotion) {
        gsap.set(p, { strokeDasharray: len, strokeDashoffset: 0 })
        gsap.set([...marks, ...beats], { opacity: 1 })
        setCounters(1)
        return
      }
      gsap.set(p, { strokeDasharray: len, strokeDashoffset: len })
      gsap.set(marks, { opacity: 0, scale: 0.4 })
      gsap.set(beats, { opacity: 0, x: -80 })
      setCounters(0)
      const tl = gsap.timeline({
        defaults: { ease: 'none' },
        scrollTrigger: {
          trigger: pin.current,
          start: 'top top',
          end: '+=180%',
          pin: pin.current,
          scrub: 0.6,
          onUpdate: (self) => setCounters(self.progress * self.progress),
        },
      })
      tl.to(p, { strokeDashoffset: 0, duration: 1 }, 0)
      MILESTONES.forEach((m, i) => {
        tl.to(marks[i], { opacity: 1, scale: 1, duration: 0.06, ease: 'back.out(3)' }, m.t * 0.95)
      })
      beats.forEach((b, i) => {
        tl.to(b, { opacity: 1, x: 0, duration: 0.08, ease: 'power3.out' }, 0.35 + i * 0.2)
      })
    }, el)
    ScrollTrigger.refresh()
    return () => ctx.revert()
  }, [])

  return (
    <section className="stage" id="stage1" ref={root}>
      <div className="s1-pin" ref={pin}>
        <div className="s1-card">
          <span className="s1-card-num">STAGE 1</span>
          <span className="s1-card-name">DESERT — CAPABILITY CURVE</span>
        </div>

        <div className="s1-grid">
          <div className="s1-chart">
            <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" aria-label="Exponential AI capability curve">
              <defs>
                <linearGradient id="s1-grad" x1="0" x2="1" y1="0" y2="0">
                  <stop offset="0" stopColor="var(--sunset-3)" />
                  <stop offset="0.6" stopColor="var(--sunset-2)" />
                  <stop offset="1" stopColor="var(--sunset-1)" />
                </linearGradient>
              </defs>
              {[1, 2, 3, 4].map((i) => (
                <line key={i} className="s1-gridline" x1={40} x2={W - 40} y1={(H / 5) * i} y2={(H / 5) * i} />
              ))}
              <line className="s1-axis" x1={40} x2={W - 40} y1={H - 20} y2={H - 20} />
              <line className="s1-axis" x1={40} x2={40} y1={20} y2={H - 20} />
              <path ref={path} d={PATH} className="s1-curve" stroke="url(#s1-grad)" />
            </svg>
            {MILESTONES.map((m) => (
              <div
                key={m.label}
                className={`s1-mile${m.label === '???' ? ' s1-mile--q' : ''}`}
                style={{ left: `${((40 + m.t * (W - 80)) / W) * 100}%`, top: `${(curveY(m.t) / H) * 100}%` }}
              >
                <i />
                <span>{m.label}</span>
              </div>
            ))}
            <span className="s1-axis-label s1-axis-label--x">TIME →</span>
            <span className="s1-axis-label s1-axis-label--y">CAPABILITY ↑</span>
          </div>

          <div className="s1-side">
            <div className="s1-counter">
              <label>PARAMETERS</label>
              <span ref={params}>1.00E6 PARAMS</span>
            </div>
            <div className="s1-counter">
              <label>COMPUTE</label>
              <span ref={compute}>1.00E18 FLOP</span>
            </div>
            <div className="s1-beats">
              {BEATS.map((b, i) => (
                <p key={i} className="s1-beat" style={{ fontSize: `${1 + i * 0.35}em` }}>
                  {b}
                </p>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
