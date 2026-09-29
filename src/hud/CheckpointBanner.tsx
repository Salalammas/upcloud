import { useEffect, useRef, useState } from 'react'
import { gsap, scrollState, stageIndex, reducedMotion } from '../lib/scroll'
import './CheckpointBanner.css'

const labelFor = (stage: number) =>
  stage === 2 ? 'DANGER!' : stage === 5 ? 'NEW RECORD!' : 'CHECKPOINT!'
const subFor = (stage: number) =>
  stage === 2 ? 'EXTENDED PLAY' : stage === 5 ? 'COURSE CLEAR' : stage === 4 ? 'FINAL STAGE' : `STAGE ${stage}`

export default function CheckpointBanner() {
  const rootRef = useRef<HTMLDivElement>(null)
  const textRef = useRef<HTMLDivElement>(null)
  const [stage, setStage] = useState(0)
  const tlRef = useRef<gsap.core.Timeline | null>(null)

  // Poll stage in rAF; bump state only when reaching a new, higher stage.
  useEffect(() => {
    let raf = 0
    let best = stageIndex(scrollState.progress)
    const tick = () => {
      const s = stageIndex(scrollState.progress)
      if (s > best) {
        best = s
        setStage(s)
      }
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [])

  useEffect(() => {
    if (stage === 0 || !rootRef.current || !textRef.current) return
    tlRef.current?.kill()
    const root = rootRef.current
    const el = textRef.current
    const tl = gsap.timeline()
    tlRef.current = tl
    if (reducedMotion) {
      tl.set(root, { autoAlpha: 1 })
        .fromTo(el, { autoAlpha: 0, x: 0, skewX: -12, scale: 1 }, { autoAlpha: 1, duration: 0.2 })
        .to(el, { autoAlpha: 0, duration: 0.3 }, '+=1')
        .set(root, { autoAlpha: 0 })
      return () => { tl.kill() }
    }
    tl.set(root, { autoAlpha: 1 })
      .fromTo(
        el,
        { xPercent: 0, x: () => window.innerWidth * 1.1, skewX: -40, scale: 1.3, autoAlpha: 1 },
        { x: 0, skewX: -12, scale: 1, duration: 0.45, ease: 'back.out(2.6)' },
      )
      .to(el, { scaleY: 1.15, scaleX: 0.92, duration: 0.07, yoyo: true, repeat: 1, ease: 'power1.inOut' })
      .to(el, { scale: 1.04, duration: 0.8, ease: 'none' })
      .to(el, { scale: 3.2, autoAlpha: 0, skewX: -4, duration: 0.35, ease: 'power3.in' })
      .set(root, { autoAlpha: 0 })
    return () => { tl.kill() }
  }, [stage])

  return (
    <div className="cp-banner" ref={rootRef} aria-live="polite">
      <div className="cp-banner__text" ref={textRef} key={stage}>
        <span className="cp-banner__main" data-text={labelFor(stage)}>{labelFor(stage)}</span>
        <span className="cp-banner__sub">{subFor(stage)}</span>
      </div>
    </div>
  )
}
