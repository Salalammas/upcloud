import { useEffect, useRef } from 'react'
import { scrollState, chaos, STAGE_COUNT } from '../lib/scroll'
import './Minimap.css'

const COURSE =
  'M30 150 C 10 110, 20 60, 60 50 S 110 90, 130 60 S 150 10, 185 25 S 220 80, 190 110 S 140 110, 150 145 S 200 175, 170 190 S 90 185, 80 165 S 50 175, 30 150'

export default function Minimap() {
  const pathRef = useRef<SVGPathElement>(null)
  const playerRef = useRef<SVGCircleElement>(null)
  const agiRef = useRef<SVGGElement>(null)
  const cpRefs = useRef<(SVGCircleElement | null)[]>([])
  const cpGroupRef = useRef<SVGGElement>(null)

  useEffect(() => {
    const path = pathRef.current
    if (!path) return
    const len = path.getTotalLength()
    // Place checkpoints at the start of each stage band.
    cpRefs.current.forEach((c, i) => {
      if (!c) return
      const pt = path.getPointAtLength(((i + 0.5) / STAGE_COUNT) * len)
      c.setAttribute('cx', String(pt.x))
      c.setAttribute('cy', String(pt.y))
    })
    let raf = 0
    let lastPassed = -1
    const tick = (t: number) => {
      const p = Math.min(1, Math.max(0, scrollState.progress))
      const pt = path.getPointAtLength(p * len)
      playerRef.current?.setAttribute('transform', `translate(${pt.x} ${pt.y})`)
      const passed = Math.floor(p * STAGE_COUNT + 0.5) - 1
      if (passed !== lastPassed) {
        lastPassed = passed
        cpRefs.current.forEach((c, i) => c?.classList.toggle('is-passed', i <= passed || p >= 0.999))
      }
      const agi = agiRef.current
      if (agi) {
        const c = chaos(p)
        if (c > 0.02) {
          // AGI chases slightly ahead of the player, jittering with chaos.
          const ap = path.getPointAtLength(((p + 0.04 + 0.03 * Math.sin(t / 300)) % 1) * len)
          const j = c * 3
          agi.setAttribute(
            'transform',
            `translate(${ap.x + Math.sin(t / 47) * j} ${ap.y + Math.cos(t / 53) * j})`,
          )
          agi.style.opacity = String(Math.min(1, c * 1.5))
        } else {
          agi.style.opacity = '0'
        }
      }
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [])

  return (
    <div className="minimap" aria-hidden="true">
      <div className="minimap__label">COURSE</div>
      <svg className="minimap__svg" viewBox="0 0 220 210">
        <path className="minimap__track-edge" d={COURSE} />
        <path ref={pathRef} className="minimap__track" d={COURSE} />
        <g ref={cpGroupRef}>
          {Array.from({ length: STAGE_COUNT }, (_, i) => (
            <circle
              key={i}
              ref={(el) => {
                cpRefs.current[i] = el
              }}
              className="minimap__cp"
              r={5}
            />
          ))}
        </g>
        <g ref={agiRef} className="minimap__agi" style={{ opacity: 0 }}>
          <circle className="minimap__agi-ring" r={9} />
          <circle className="minimap__agi-dot" r={5} />
        </g>
        <g ref={playerRef}>
          <circle className="minimap__player" r={6} />
        </g>
      </svg>
    </div>
  )
}
