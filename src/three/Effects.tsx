import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import {
  EffectComposer,
  Bloom,
  ChromaticAberration,
  Glitch,
  Noise,
  Vignette,
  Scanline,
} from '@react-three/postprocessing'
import { BlendFunction, GlitchMode } from 'postprocessing'
import type { ChromaticAberrationEffect, GlitchEffect } from 'postprocessing'
import { Vector2 } from 'three'
import { scrollState, chaos } from '../lib/scroll'

function isLowEnd() {
  if (typeof window === 'undefined') return false
  const cores = navigator.hardwareConcurrency ?? 8
  return window.devicePixelRatio < 1.5 && cores <= 4
}

const BASE_CA = 0.0006
const MAX_CA = 0.006

export default function Effects() {
  const lowEnd = useMemo(isLowEnd, [])
  const caRef = useRef<ChromaticAberrationEffect>(null)
  const glitchRef = useRef<GlitchEffect>(null)
  const caOffset = useMemo(() => new Vector2(BASE_CA, BASE_CA), [])
  const glitchOn = useRef(false)

  useFrame(() => {
    const c = chaos(scrollState.progress)
    const ca = caRef.current
    if (ca) {
      const o = BASE_CA + c * c * (MAX_CA - BASE_CA)
      ca.offset.set(o, o * 0.6)
    }
    const g = glitchRef.current
    if (g) {
      const want = c > 0.6
      if (want !== glitchOn.current) {
        glitchOn.current = want
        g.mode = want ? GlitchMode.SPORADIC : GlitchMode.DISABLED
      }
    }
  })

  if (lowEnd) {
    return (
      <EffectComposer multisampling={0}>
        <Bloom luminanceThreshold={0.6} luminanceSmoothing={0.2} intensity={0.9} mipmapBlur />
        <Vignette offset={0.3} darkness={0.7} />
      </EffectComposer>
    )
  }

  return (
    <EffectComposer multisampling={0}>
      <Bloom luminanceThreshold={0.6} luminanceSmoothing={0.2} intensity={0.9} mipmapBlur />
      <ChromaticAberration
        ref={caRef}
        offset={caOffset}
        radialModulation={false}
        modulationOffset={0}
      />
      <Glitch
        ref={glitchRef}
        active={false}
        delay={new Vector2(0.4, 1.2)}
        duration={new Vector2(0.1, 0.3)}
        strength={new Vector2(0.1, 0.3)}
        ratio={0.85}
      />
      <Scanline blendFunction={BlendFunction.OVERLAY} density={1.4} opacity={0.08} />
      <Noise premultiply blendFunction={BlendFunction.SOFT_LIGHT} opacity={0.12} />
      <Vignette offset={0.3} darkness={0.7} />
    </EffectComposer>
  )
}
