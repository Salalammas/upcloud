import { useEffect, useRef } from 'react'
import { scrollState, stageIndex, chaos, reducedMotion } from '../lib/scroll'
import './Speedometer.css'

const CX = 110
const CY = 110
const R = 92
const START = -225 // degrees (SVG angle, 0 = +x)
const SWEEP = 270
const MAX_SPEED = 299
const REDLINE = 0.8 // fraction of sweep where redline begins

const polar = (deg: number, r: number) => {
  const a = (deg * Math.PI) / 180
  return [CX + r * Math.cos(a), CY + r * Math.sin(a)] as const
}
const arcPath = (a0: number, a1: number, r: number) => {
  const [x0, y0] = polar(a0, r)
  const [x1, y1] = polar(a1, r)
  const large = a1 - a0 > 180 ? 1 : 0
  return `M ${x0} ${y0} A ${r} ${r} 0 ${large} 1 ${x1} ${y1}`
}

/* 7-segment map: a b c d e f g */
const SEGS: Record<string, number[]> = {
  '0': [1, 1, 1, 1, 1, 1, 0], '1': [0, 1, 1, 0, 0, 0, 0], '2': [1, 1, 0, 1, 1, 0, 1],
  '3': [1, 1, 1, 1, 0, 0, 1], '4': [0, 1, 1, 0, 0, 1, 1], '5': [1, 0, 1, 1, 0, 1, 1],
  '6': [1, 0, 1, 1, 1, 1, 1], '7': [1, 1, 1, 0, 0, 0, 0], '8': [1, 1, 1, 1, 1, 1, 1],
  '9': [1, 1, 1, 1, 0, 1, 1], ' ': [0, 0, 0, 0, 0, 0, 0],
}
/* segment polygons in a 24x40 digit box */
const SEG_POLYS = [
  '4,1 20,1 17,4 7,4', // a
  '21,2 21,19 18,17 18,5', // b
  '21,21 21,38 18,35 18,23', // c
  '4,39 20,39 17,36 7,36', // d
  '3,21 6,23 6,35 3,38', // e
  '3,2 6,5 6,17 3,19', // f
  '4,20 7,18 17,18 20,20 17,22 7,22', // g
]

function Digit({ refCb, x }: { refCb: (el: SVGGElement | null) => void; x: number }) {
  return (
    <g ref={refCb} transform={`translate(${x} 0)`} className="spd-digit">
      {SEG_POLYS.map((p, i) => (
        <polygon key={i} points={p} className="spd-seg" />
      ))}
    </g>
  )
}

export default function Speedometer() {
  const rootRef = useRef<HTMLDivElement>(null)
  const needleRef = useRef<SVGGElement>(null)
  const gearRef = useRef<HTMLSpanElement>(null)
  const digitRefs = useRef<(SVGGElement | null)[]>([])

  useEffect(() => {
    let raf = 0
    let speed = 0
    let lastStr = ''
    let lastGear = -1
    let lastRed = false
    let lastNeedle = ''
    const setDigits = (str: string) => {
      for (let d = 0; d < 3; d++) {
        const g = digitRefs.current[d]
        if (!g) continue
        const on = SEGS[str[d]] ?? SEGS[' ']
        const polys = g.children
        for (let s = 0; s < 7; s++) polys[s].classList.toggle('on', on[s] === 1)
      }
    }
    const tick = () => {
      const target = Math.min(MAX_SPEED, Math.abs(scrollState.velocity) * 7)
      const k = target > speed ? 0.12 : 0.04
      speed += (target - speed) * k
      if (speed < 0.05) speed = 0
      const p = scrollState.progress
      const c = chaos(p)
      const red = c > 0.6
      let frac = speed / MAX_SPEED
      if (red) {
        const base = Math.max(frac, REDLINE + 0.04)
        const jitter = reducedMotion ? 0 : (Math.random() - 0.5) * 0.08 * c
        frac = Math.min(1.02, base + jitter)
      }
      const deg = START + SWEEP * Math.max(0, frac) + 90
      const needle = `rotate(${deg.toFixed(1)} ${CX} ${CY})`
      if (needle !== lastNeedle && needleRef.current) {
        needleRef.current.setAttribute('transform', needle)
        lastNeedle = needle
      }
      const shown = red ? Math.max(Math.round(speed), Math.round(frac * MAX_SPEED)) : Math.round(speed)
      const str = String(Math.min(MAX_SPEED, shown)).padStart(3, ' ')
      if (str !== lastStr) { setDigits(str); lastStr = str }
      const gear = stageIndex(p) + 1
      if (gear !== lastGear && gearRef.current) { gearRef.current.textContent = String(gear); lastGear = gear }
      if (red !== lastRed && rootRef.current) { rootRef.current.classList.toggle('is-redline', red); lastRed = red }
      raf = requestAnimationFrame(tick)
    }
    setDigits('  0')
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [])

  const ticks = []
  for (let i = 0; i <= 30; i++) {
    const f = i / 30
    const a = START + SWEEP * f
    const major = i % 5 === 0
    const [x0, y0] = polar(a, R - (major ? 16 : 8))
    const [x1, y1] = polar(a, R - 2)
    ticks.push(
      <line key={i} x1={x0} y1={y0} x2={x1} y2={y1}
        className={`spd-tick${major ? ' major' : ''}${f >= REDLINE ? ' red' : ''}`} />,
    )
    if (major) {
      const [lx, ly] = polar(a, R - 28)
      ticks.push(
        <text key={`l${i}`} x={lx} y={ly} className={`spd-label${f >= REDLINE ? ' red' : ''}`}
          textAnchor="middle" dominantBaseline="middle">{Math.round(f * 10)}</text>,
      )
    }
  }

  return (
    <div className="spd" ref={rootRef} aria-hidden="true">
      <svg className="spd-dial" viewBox="0 0 220 220">
        <circle cx={CX} cy={CY} r={R + 10} className="spd-bezel" />
        <path d={arcPath(START, START + SWEEP * REDLINE, R)} className="spd-arc" />
        <path d={arcPath(START + SWEEP * REDLINE, START + SWEEP, R - 5)} className="spd-redzone" />
        {ticks}
        <text x={CX} y={CY + 34} className="spd-unit" textAnchor="middle">x1000rpm</text>
        <g ref={needleRef} transform={`rotate(${START + 90} ${CX} ${CY})`}>
          <polygon points={`${CX - 4},${CY + 14} ${CX + 4},${CY + 14} ${CX + 1.5},${CY - R + 10} ${CX - 1.5},${CY - R + 10}`} className="spd-needle" />
        </g>
        <circle cx={CX} cy={CY} r={9} className="spd-hub" />
      </svg>
      <div className="spd-readout">
        <div className="spd-gear"><small>GEAR</small><span ref={gearRef}>1</span></div>
        <div className="spd-digital">
          <svg viewBox="0 0 84 40" className="spd-7seg">
            {[0, 1, 2].map((d) => (
              <Digit key={d} x={d * 28} refCb={(el) => { digitRefs.current[d] = el }} />
            ))}
          </svg>
          <span className="spd-kmh">KM/H</span>
        </div>
      </div>
    </div>
  )
}
