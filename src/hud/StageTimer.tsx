import { useEffect, useRef } from 'react'
import { scrollState, stageIndex, STAGE_COUNT, INTRO_DONE_EVENT } from '../lib/scroll'
import './StageTimer.css'

const LABELS = ['START', 'STAGE 1', 'STAGE 2', 'STAGE 3', 'FINAL', 'FINISH']
const SPLIT_LABELS = ['ST1', 'ST2', 'ST3', 'FIN', 'GOAL']

const fmt = (ms: number) => {
  const t = Math.max(0, ms)
  const m = Math.floor(t / 60000)
  const s = Math.floor((t % 60000) / 1000)
  const cs = Math.floor((t % 1000) / 10)
  return `${m}'${String(s).padStart(2, '0')}"${String(cs).padStart(2, '0')}`
}

export default function StageTimer() {
  const stageRef = useRef<HTMLSpanElement>(null)
  const stageNumRef = useRef<HTMLSpanElement>(null)
  const timeRef = useRef<HTMLDivElement>(null)
  const timeWrapRef = useRef<HTMLDivElement>(null)
  const lapRef = useRef<HTMLSpanElement>(null)
  const splitRefs = useRef<(HTMLLIElement | null)[]>([])

  useEffect(() => {
    let start = performance.now()
    const timers: number[] = []
    const reached: (number | null)[] = Array(STAGE_COUNT).fill(null)
    reached[0] = 0
    // Reset split rows (StrictMode remount / HMR may leave stale state).
    splitRefs.current.forEach((li) => {
      if (!li) return
      li.classList.remove('is-set', 'is-new', 'is-current')
      const t = li.querySelector('.st-split-t')
      if (t) t.textContent = `-'--"--`
    })
    let lastStage = -1
    let lastTime = ''
    let lastLow: boolean | null = null
    let raf = 0
    // The clock runs from when the Intro unlocks scroll (if no stage reached yet).
    const onIntroDone = () => {
      if (reached.every((r, i) => i === 0 || r === null)) start = performance.now()
    }
    window.addEventListener(INTRO_DONE_EVENT, onIntroDone)

    const tick = (now: number) => {
      const p = scrollState.progress
      const idx = stageIndex(p)
      const elapsed = now - start

      for (let i = 1; i <= idx; i++) {
        if (reached[i] === null) {
          reached[i] = elapsed
          const li = splitRefs.current[i - 1]
          if (li) {
            const t = li.querySelector('.st-split-t')
            if (t) t.textContent = fmt(elapsed)
            li.classList.add('is-set', 'is-new')
            timers.push(window.setTimeout(() => li.classList.remove('is-new'), 900))
          }
        }
      }

      if (idx !== lastStage) {
        lastStage = idx
        if (stageRef.current) stageRef.current.textContent = LABELS[idx]
        if (stageNumRef.current) stageNumRef.current.textContent = `${idx + 1}/${STAGE_COUNT}`
        if (lapRef.current) lapRef.current.textContent = `${Math.min(idx + 1, STAGE_COUNT - 1)}/${STAGE_COUNT - 1}`
        splitRefs.current.forEach((li, i) => li?.classList.toggle('is-current', i === idx))
      }

      const t = Math.max(0, 60 * (1 - p))
      const txt = String(Math.ceil(t)).padStart(2, '0')
      if (txt !== lastTime && timeRef.current) {
        lastTime = txt
        timeRef.current.textContent = txt
      }
      const low = t < 10 && idx < STAGE_COUNT - 1
      if (low !== lastLow && timeWrapRef.current) {
        lastLow = low
        timeWrapRef.current.classList.toggle('is-low', low)
      }
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener(INTRO_DONE_EVENT, onIntroDone)
      timers.forEach((id) => window.clearTimeout(id))
    }
  }, [])

  return (
    <div className="stage-timer" aria-hidden="true">
      <div className="st-left">
        <div className="st-label">STAGE</div>
        <div className="st-stage">
          <span ref={stageRef}>START</span>
          <span className="st-stage-num" ref={stageNumRef}>1/6</span>
        </div>
        <div className="st-pos">
          <span className="st-label">POS</span> <span className="st-pos-num">1</span>
          <span className="st-pos-of">/1</span>
        </div>
      </div>

      <div className="st-center" ref={timeWrapRef}>
        <div className="st-time-label">TIME</div>
        <div className="st-time" ref={timeRef}>60</div>
      </div>

      <div className="st-right">
        <div className="st-lap">
          <span className="st-label">LAP</span> <span ref={lapRef}>1/5</span>
        </div>
        <ol className="st-splits">
          {SPLIT_LABELS.map((l, i) => (
            <li key={l} ref={(el) => { splitRefs.current[i] = el }}>
              <span className="st-split-l">{l}</span>
              <span className="st-split-t">-'--"--</span>
            </li>
          ))}
        </ol>
      </div>
    </div>
  )
}
