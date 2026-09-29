import { useEffect, useRef } from 'react'
import { scrollState, chaos, reducedMotion } from '../lib/scroll'
import './GlitchOverlay.css'

const MAX_BARS = 10

export default function GlitchOverlay() {
  const rootRef = useRef<HTMLDivElement>(null)
  const barsRef = useRef<(HTMLDivElement | null)[]>([])
  const vignetteRef = useRef<HTMLDivElement>(null)
  const tearRef = useRef<HTMLDivElement>(null)
  const tagRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (reducedMotion) return
    let raf = 0
    let frame = 0
    let tearFrames = 0
    let tagFlip = 0
    const loop = (t: number) => {
      raf = requestAnimationFrame(loop)
      frame++
      const k = chaos(scrollState.progress)
      const root = rootRef.current
      if (!root) return
      if (k <= 0.001) {
        if (root.style.opacity !== '0') root.style.opacity = '0'
        return
      }
      root.style.opacity = '1'

      // Glitch bars: reposition every few frames (faster at high chaos)
      const every = k > 0.6 ? 2 : 4
      if (frame % every === 0) {
        const active = Math.round(k * MAX_BARS)
        barsRef.current.forEach((bar, i) => {
          if (!bar) return
          if (i < active && Math.random() < 0.4 + k * 0.6) {
            const h = 2 + Math.random() * (6 + k * 40)
            bar.style.top = `${Math.random() * 100}%`
            bar.style.height = `${h}px`
            bar.style.left = `${Math.random() * 20 - 10}%`
            bar.style.width = `${60 + Math.random() * 60}%`
            bar.style.transform = `translateX(${(Math.random() - 0.5) * 60 * k}px)`
            bar.style.opacity = String(Math.min(1, (0.3 + Math.random() * 0.7) * k * 1.4))
            const hue = Math.floor(Math.random() * 360)
            bar.style.backdropFilter = Math.random() < 0.3 * k
              ? `invert(1) hue-rotate(${hue}deg)`
              : `hue-rotate(${hue}deg) saturate(${2 + k * 3})`
            ;(bar.style as CSSStyleDeclaration & { webkitBackdropFilter: string }).webkitBackdropFilter =
              bar.style.backdropFilter
          } else {
            bar.style.opacity = '0'
          }
        })
      }

      // Red vignette pulse
      const v = vignetteRef.current
      if (v) {
        const pulse = 0.5 + 0.5 * Math.sin(t * 0.004 * (1 + k * 2))
        v.style.opacity = String(k * (0.35 + 0.5 * pulse))
      }

      // Occasional RGB tear flash
      const tear = tearRef.current
      if (tear) {
        if (tearFrames > 0) {
          tearFrames--
          tear.style.transform = `translateX(${(Math.random() - 0.5) * 30 * k}px) skewX(${(Math.random() - 0.5) * 8}deg)`
          if (tearFrames === 0) tear.style.opacity = '0'
        } else if (Math.random() < 0.012 * k) {
          tearFrames = 3 + Math.floor(Math.random() * 4)
          tear.style.opacity = String(0.35 + 0.45 * k)
        }
      }

      // Corner tag
      const tag = tagRef.current
      if (tag) {
        if (frame % 30 === 0 && Math.random() < 0.5) {
          tagFlip ^= 1
          tag.textContent = tagFlip ? 'AGI.EXE' : 'SIGNAL LOST'
        }
        tag.style.opacity = Math.random() < 0.08 * k ? '0.15' : String(Math.min(1, 0.4 + k))
        tag.style.transform = Math.random() < 0.1 * k ? `translate(${(Math.random() - 0.5) * 8}px, 0)` : 'none'
      }
    }
    raf = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(raf)
  }, [])

  if (reducedMotion) return null

  return (
    <div ref={rootRef} className="glitch-overlay" aria-hidden="true" style={{ opacity: 0 }}>
      <div ref={vignetteRef} className="glitch-vignette" />
      {Array.from({ length: MAX_BARS }, (_, i) => (
        <div key={i} ref={(el) => { barsRef.current[i] = el }} className="glitch-bar" />
      ))}
      <div ref={tearRef} className="glitch-tear" />
      <div ref={tagRef} className="glitch-tag">SIGNAL LOST</div>
    </div>
  )
}
