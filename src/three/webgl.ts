let cached: boolean | null = null

/** True if the browser can create a WebGL2 or WebGL1 context. Result is cached. */
export function hasWebGL(): boolean {
  if (cached !== null) return cached
  try {
    if (typeof document === 'undefined' || typeof window === 'undefined') return (cached = false)
    const canvas = document.createElement('canvas')
    const gl =
      canvas.getContext('webgl2') ??
      canvas.getContext('webgl') ??
      (canvas.getContext('experimental-webgl') as WebGLRenderingContext | null)
    cached = !!gl
    // Release the probe context right away.
    ;(gl as WebGLRenderingContext | null)?.getExtension('WEBGL_lose_context')?.loseContext()
  } catch {
    cached = false
  }
  return cached
}
