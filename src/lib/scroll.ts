import Lenis from 'lenis'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

gsap.registerPlugin(ScrollTrigger)

/** Global scroll progress 0..1, read by the 3D scene every frame. */
export const scrollState = { progress: 0, velocity: 0 }

export const reducedMotion =
  typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches

export function initScroll() {
  const lenis = new Lenis({ lerp: reducedMotion ? 1 : 0.09 })
  lenis.on('scroll', (e: { progress: number; velocity: number }) => {
    scrollState.progress = e.progress
    scrollState.velocity = e.velocity
    ScrollTrigger.update()
  })
  gsap.ticker.add((t) => lenis.raf(t * 1000))
  gsap.ticker.lagSmoothing(0)
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
