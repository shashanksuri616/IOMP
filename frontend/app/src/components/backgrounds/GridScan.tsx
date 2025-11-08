import { useEffect, useRef } from 'react'

// Subtle scanning grid background inspired by reactbits.dev
export function GridScan({ className = '' }: { className?: string }) {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    let raf = 0
    let t = 0
    const el = ref.current
    if (!el) return
    const step = () => {
      t += 0.5
      el.style.setProperty('--scan-y', `${(Math.sin(t / 40) * 20) + 50}%`)
      raf = requestAnimationFrame(step)
    }
    raf = requestAnimationFrame(step)
    return () => cancelAnimationFrame(raf)
  }, [])

  return (
    <div ref={ref} className={`pointer-events-none absolute inset-0 -z-10 overflow-hidden ${className}`}>
      <div className="absolute inset-0 opacity-60"
        style={{
          backgroundImage:
            'linear-gradient(to right, rgba(100,116,139,0.15) 1px, transparent 1px), linear-gradient(to bottom, rgba(100,116,139,0.15) 1px, transparent 1px)'
          , backgroundSize: '48px 48px'
        }}
      />
      <div className="absolute inset-0"
        style={{
          background:
            'linear-gradient(to bottom, transparent 0%, rgba(59,130,246,0.10) var(--scan-y,50%), transparent 100%)'
        }}
      />
    </div>
  )
}
