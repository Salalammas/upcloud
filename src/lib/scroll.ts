import Lenis from 'lenis'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

gsap.registerPlugin(ScrollTrigger)

/** Global scroll progress 0..1, read by the 3D scene every frame. */
export const scrollState = { progress: 0, velocity: 0 }

export const reducedMotion =
  typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches

/** Dispatched on window when the Intro overlay has finished and unlocked scroll. */
export const INTRO_DONE_EVENT = 'intro:done'

let current: Lenis | null = null
let locked = false

/** The live Lenis instance (null before App mounts / after unmount). */
export const getLenis = () => current

/** Lock/unlock smooth scrolling (used by the Intro). Safe to call before initScroll. */
export function setScrollLocked(v: boolean) {
  locked = v
  if (!current) return
  if (v) current.stop()
  else current.start()
}

export function initScroll() {
  const lenis = new Lenis({ lerp: reducedMotion ? 1 : 0.09 })
  lenis.on('scroll', (e: { progress: number; velocity: number }) => {
    scrollState.progress = e.progress
    scrollState.velocity = e.velocity
    ScrollTrigger.update()
  })
  const tick = (t: number) => lenis.raf(t * 1000)
  gsap.ticker.add(tick)
  gsap.ticker.lagSmoothing(0)
  // Make destroy() also detach from the gsap ticker (StrictMode mounts twice).
  const destroy = lenis.destroy.bind(lenis)
  lenis.destroy = () => {
    gsap.ticker.remove(tick)
    if (current === lenis) current = null
    destroy()
  }
  current = lenis
  if (locked) lenis.stop()
  return lenis
}

export { gsap, ScrollTrigger }

/** Six equal scroll bands: 0 start, 1 stage1 (AI evolves), 2 stage2 (AGI rampant),
 *  3 stage3 (UpCloud arrives), 4 final (containment), 5 finish (saved). */
export const STAGE_COUNT = 6
export const stageIndex = (p: number) => Math.min(STAGE_COUNT - 1, Math.floor(p * STAGE_COUNT))
/** 0..1 progress within a given stage band. */
export const stageLocal = (p: number, i: number) => Math.min(1, Math.max(0, p * STAGE_COUNT - i))
/** 0..1 "chaos" level: rises in stage 2, peaks, falls to 0 by finish. */
export const chaos = (p: number) => {
  const s = p * STAGE_COUNT
  if (s < 1.5) return 0
  if (s < 3) return (s - 1.5) / 1.5
  if (s < 4.8) return 1 - (s - 3) / 1.8
  return 0
}
