import { useEffect, useRef, useState } from 'react'
import { gsap, ScrollTrigger, reducedMotion } from '../lib/scroll'
import './Finish.css'

const PODIUM = [
  { place: 2, name: 'HUMANITY', cls: 'p2' },
  { place: 1, name: 'UPCLOUD', cls: 'p1' },
  { place: 3, name: 'THE ALIGNED AI', cls: 'p3' },
]

const SCORES = [
  { rank: '1ST', init: 'UPC', score: '99,999,999', note: 'EU REGION' },
  { rank: '2ND', init: 'HUM', score: '42,000,000', note: 'STILL HERE' },
  { rank: '3RD', init: 'AAI', score: '31,415,926', note: 'NICE BOT' },
  { rank: '4TH', init: 'GDP', score: '20,160,425', note: 'GDPR OK' },
  { rank: '5TH', init: 'K8S', score: '12,000,000', note: 'POD LIFE' },
  { rank: '6TH', init: 'SSD', score: '09,999,999', note: 'MAXIOPS' },
  { rank: '7TH', init: 'AGI', score: '00,000,001', note: 'CONTAINED' },
]

const COUNT_FROM = 9

export default function Finish() {
  const root = useRef<HTMLElement>(null)
  const [count, setCount] = useState(COUNT_FROM)
  const [started, setStarted] = useState(false)
  const [initials, setInitials] = useState('')

  useEffect(() => {
    const el = root.current
    if (!el) return
    const ctx = gsap.context(() => {
      if (reducedMotion) {
        gsap.set('.fin-podium-block', { yPercent: 0, opacity: 1 })
        return
      }
      gsap.from('.fin-banner > *', {
        y: 60, opacity: 0, stagger: 0.15, duration: 0.8, ease: 'back.out(2)',
        scrollTrigger: { trigger: '.fin-banner', start: 'top 80%' },
      })
      gsap.fromTo('.fin-podium-block',
        { yPercent: 100, opacity: 0 },
        {
          yPercent: 0, opacity: 1, ease: 'power2.out', stagger: 0.2,
          scrollTrigger: { trigger: '.fin-podium', start: 'top 85%', end: 'bottom 60%', scrub: 1 },
        })
      gsap.from('.fin-scores tbody tr', {
        x: -40, opacity: 0, stagger: 0.08, duration: 0.4, ease: 'steps(4)',
        scrollTrigger: { trigger: '.fin-scores', start: 'top 80%' },
      })
    }, el)
    const st = ScrollTrigger.create({
      trigger: el.querySelector('.fin-continue'),
      start: 'top 75%',
      once: true,
      onEnter: () => setStarted(true),
    })
    return () => { st.kill(); ctx.revert() }
  }, [])

  useEffect(() => {
    if (!started) return
    if (reducedMotion) { setCount(0); return }
    if (count <= 0) return
    const t = setTimeout(() => setCount((c) => c - 1), 700)
    return () => clearTimeout(t)
  }, [started, count])

  const done = count <= 0

  return (
    <section className="stage fin" id="finish" ref={root}>
      <div className="fin-flags" aria-hidden="true">
        <div className="fin-flag fin-flag-l" />
        <div className="fin-flag fin-flag-r" />
      </div>

      <div className="fin-banner">
        <p className="fin-kicker">FINAL LAP COMPLETE</p>
        <h2 className="stage-title fin-title">WORLD SAVED</h2>
        <p className="fin-sub">COURSE CLEAR</p>
      </div>

      <div className="fin-podium" role="list" aria-label="Podium">
        {PODIUM.map((p) => (
          <div key={p.name} className={`fin-podium-col ${p.cls}`} role="listitem">
            <span className="fin-podium-name">{p.name}</span>
            <div className="fin-podium-block">
              <span className="fin-podium-num">{p.place}</span>
            </div>
          </div>
        ))}
      </div>

      <div className="fin-scores-wrap">
        <h3 className="fin-h3">ENTER YOUR INITIALS</h3>
        <label className="fin-initials">
          <span className="sr-only">Your initials</span>
          <input
            value={initials}
            maxLength={3}
            onChange={(e) => setInitials(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ''))}
            placeholder="___"
            aria-label="Enter your initials"
          />
        </label>
        <table className="fin-scores">
          <thead>
            <tr><th>RANK</th><th>NAME</th><th>SCORE</th><th>NOTE</th></tr>
          </thead>
          <tbody>
            {SCORES.map((s) => (
              <tr key={s.rank}>
                <td>{s.rank}</td><td className="fin-init">{s.init}</td><td>{s.score}</td><td>{s.note}</td>
              </tr>
            ))}
            {initials && (
              <tr className="fin-you">
                <td>NEW</td><td className="fin-init">{initials}</td><td>??,???,???</td><td>YOU</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="fin-continue">
        {!done ? (
          <p className="fin-countdown" aria-live="polite">
            CONTINUE? <span className="fin-count">{count}</span>
          </p>
        ) : (
          <a className="fin-cta" href="https://upcloud.com" target="_blank" rel="noopener noreferrer">
            DEPLOY ON UPCLOUD
          </a>
        )}
        <p className="fin-insert">{done ? 'PRESS START' : 'INSERT COIN'}</p>
      </div>

      <footer className="fin-footer">Fan-made tribute. Not affiliated with SEGA.</footer>
    </section>
  )
}
