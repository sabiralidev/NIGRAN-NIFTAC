import { useEffect, useRef } from 'react'

/*
 * SignalField - the NIGRAN auth signature.
 *
 * A lightweight 2D <canvas> radar/sonar sweep drawn over the brand gradient:
 * concentric rings, a rotating sweep wedge with a trailing glow, and a handful
 * of drifting "signal" nodes that light up as the sweep passes over them
 * (green = live, amber = watch, red = alert), echoing the status legend.
 *
 * Pure Canvas 2D + requestAnimationFrame (no deps). DPR-capped, paused when the
 * tab is hidden, cleaned up on unmount, and reduced to a single static frame
 * under prefers-reduced-motion. Purely decorative (aria-hidden).
 */

const NODE_COLORS = {
  live: 'rgba(52, 211, 153, ', // emerald-400
  watch: 'rgba(251, 191, 36, ', // amber-400
  alert: 'rgba(248, 113, 113, ', // red-400
  signal: 'rgba(255, 224, 181, ', // warm sand
}

// Deterministic node layout so the field reads the same on every mount.
const NODES = [
  { a: 0.35, r: 0.82, size: 2.6, drift: 0.00042, type: 'live' },
  { a: 1.15, r: 0.55, size: 2.2, drift: 0.00030, type: 'signal' },
  { a: 1.95, r: 0.9, size: 3.0, drift: 0.00024, type: 'watch' },
  { a: 2.55, r: 0.4, size: 2.0, drift: 0.00050, type: 'signal' },
  { a: 3.05, r: 0.72, size: 2.4, drift: 0.00028, type: 'live' },
  { a: 3.7, r: 0.5, size: 2.1, drift: 0.00038, type: 'signal' },
  { a: 4.25, r: 0.95, size: 3.2, drift: 0.00020, type: 'alert' },
  { a: 4.9, r: 0.63, size: 2.3, drift: 0.00034, type: 'signal' },
  { a: 5.45, r: 0.35, size: 1.9, drift: 0.00046, type: 'live' },
  { a: 5.95, r: 0.86, size: 2.7, drift: 0.00026, type: 'signal' },
  { a: 0.85, r: 0.98, size: 2.5, drift: 0.00022, type: 'signal' },
  { a: 2.2, r: 0.68, size: 2.2, drift: 0.00036, type: 'signal' },
  { a: 3.35, r: 0.28, size: 1.8, drift: 0.00052, type: 'live' },
  { a: 4.55, r: 0.45, size: 2.0, drift: 0.00040, type: 'signal' },
  { a: 5.7, r: 0.6, size: 2.3, drift: 0.00032, type: 'watch' },
  { a: 6.05, r: 0.5, size: 2.1, drift: 0.00030, type: 'signal' },
]

const TWO_PI = Math.PI * 2
const SWEEP_SPEED = 0.011 // radians per frame (~60fps)
const FADE = 1.7 // angular trail length (radians) over which a hit node fades

function drawFrame(ctx, w, h, sweep, nodes) {
  ctx.clearRect(0, 0, w, h)

  const cx = w * 0.52
  const cy = h * 0.5
  const maxR = Math.min(w, h) * 0.46

  // --- concentric rings ---
  ctx.lineWidth = 1
  for (let i = 1; i <= 4; i++) {
    ctx.beginPath()
    ctx.arc(cx, cy, maxR * (i / 4), 0, TWO_PI)
    ctx.strokeStyle = `rgba(255, 233, 204, ${0.035 + (4 - i) * 0.011})`
    ctx.stroke()
  }

  // --- crosshair + diagonal spokes ---
  ctx.strokeStyle = 'rgba(255, 233, 204, 0.04)'
  for (let k = 0; k < 4; k++) {
    const ang = (k * Math.PI) / 4
    ctx.beginPath()
    ctx.moveTo(cx - Math.cos(ang) * maxR, cy - Math.sin(ang) * maxR)
    ctx.lineTo(cx + Math.cos(ang) * maxR, cy + Math.sin(ang) * maxR)
    ctx.stroke()
  }

  // --- trailing sweep wedge ---
  const segments = 26
  const wedge = 0.95
  for (let i = 0; i < segments; i++) {
    const t0 = sweep - wedge * (i / segments)
    const t1 = sweep - wedge * ((i + 1) / segments)
    const alpha = 0.1 * (1 - i / segments)
    ctx.beginPath()
    ctx.moveTo(cx, cy)
    ctx.arc(cx, cy, maxR, t1, t0)
    ctx.closePath()
    ctx.fillStyle = `rgba(255, 198, 138, ${alpha})`
    ctx.fill()
  }

  // --- leading sweep line ---
  ctx.beginPath()
  ctx.moveTo(cx, cy)
  ctx.lineTo(cx + Math.cos(sweep) * maxR, cy + Math.sin(sweep) * maxR)
  ctx.strokeStyle = 'rgba(255, 210, 150, 0.42)'
  ctx.lineWidth = 1.5
  ctx.stroke()
  ctx.lineWidth = 1

  // --- signal nodes ---
  for (const node of nodes) {
    const na = ((node.a % TWO_PI) + TWO_PI) % TWO_PI
    const x = cx + Math.cos(na) * node.r * maxR
    const y = cy + Math.sin(na) * node.r * maxR

    // how far the sweep has rotated past this node (0 = just hit)
    let delta = (sweep - na) % TWO_PI
    if (delta < 0) delta += TWO_PI
    const glow = Math.max(0, 1 - delta / FADE)

    const base = NODE_COLORS[node.type] || NODE_COLORS.signal

    // expanding ping ring for freshly-lit nodes
    if (glow > 0.02) {
      const ringR = node.size + (1 - glow) * 16
      ctx.beginPath()
      ctx.arc(x, y, ringR, 0, TWO_PI)
      ctx.strokeStyle = `${base}${(glow * 0.5).toFixed(3)})`
      ctx.stroke()
    }

    // the node dot: faint at rest, bright when the sweep passes
    ctx.beginPath()
    ctx.arc(x, y, node.size, 0, TWO_PI)
    ctx.fillStyle = `${base}${(0.28 + glow * 0.7).toFixed(3)})`
    ctx.fill()
  }
}

export default function SignalField() {
  const canvasRef = useRef(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const reduced =
      typeof window.matchMedia === 'function' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches

    // Local, mutable copy so drift never accumulates across remounts.
    const nodes = NODES.map((n) => ({ ...n }))

    let w = 0
    let h = 0
    let dpr = 1
    let sweep = 0
    let raf = 0
    let running = true

    const setSize = () => {
      const rect = canvas.getBoundingClientRect()
      w = rect.width
      h = rect.height
      dpr = Math.min(window.devicePixelRatio || 1, 2)
      canvas.width = Math.max(1, Math.round(w * dpr))
      canvas.height = Math.max(1, Math.round(h * dpr))
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    }

    const renderStatic = () => {
      setSize()
      // A composed still frame: sweep placed so several nodes read as "lit".
      drawFrame(ctx, w, h, 4.2, nodes)
    }

    const loop = () => {
      if (!running) return
      sweep = (sweep + SWEEP_SPEED) % TWO_PI
      for (const n of nodes) n.a += n.drift
      drawFrame(ctx, w, h, sweep, nodes)
      raf = requestAnimationFrame(loop)
    }

    let ro
    if (reduced) {
      renderStatic()
    } else {
      setSize()
      ro = new ResizeObserver(() => {
        setSize()
      })
      ro.observe(canvas)
      loop()
    }

    const onVisibility = () => {
      if (reduced) return
      if (document.hidden) {
        running = false
        cancelAnimationFrame(raf)
      } else if (!running) {
        running = true
        loop()
      }
    }
    document.addEventListener('visibilitychange', onVisibility)

    return () => {
      running = false
      cancelAnimationFrame(raf)
      document.removeEventListener('visibilitychange', onVisibility)
      if (ro) ro.disconnect()
    }
  }, [])

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className="absolute inset-0 h-full w-full"
    />
  )
}
