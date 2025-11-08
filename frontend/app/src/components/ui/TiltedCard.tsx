import { HTMLAttributes, useCallback, useRef } from 'react'
import { cn } from '@/lib/ui/cn'

export function TiltedCard({ className, children, ...props }: HTMLAttributes<HTMLDivElement>) {
  const ref = useRef<HTMLDivElement>(null)

  const onMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const el = ref.current
    if (!el) return
    const rect = el.getBoundingClientRect()
    const px = (e.clientX - rect.left) / rect.width - 0.5
    const py = (e.clientY - rect.top) / rect.height - 0.5
    const rx = (-py * 8).toFixed(2)
    const ry = (px * 12).toFixed(2)
    el.style.transform = `perspective(800px) rotateX(${rx}deg) rotateY(${ry}deg)`
    const shine = el.querySelector('.tilt-shine') as HTMLDivElement | null
    if (shine) {
      const sx = px * 100 + 50
      const sy = py * 100 + 50
      shine.style.background = `radial-gradient(400px circle at ${sx}% ${sy}%, rgba(59,130,246,0.25), transparent 40%)`
    }
  }, [])

  const onLeave = useCallback(() => {
    const el = ref.current
    if (!el) return
    el.style.transform = 'perspective(800px) rotateX(0deg) rotateY(0deg)'
    const shine = el.querySelector('.tilt-shine') as HTMLDivElement | null
    if (shine) shine.style.background = 'transparent'
  }, [])

  return (
    <div
      ref={ref}
      onMouseMove={onMove}
      onMouseLeave={onLeave}
      className={cn('relative transition-transform duration-150 will-change-transform rounded-xl border bg-white shadow-sm', className)}
      {...props}
    >
      <div className="tilt-shine pointer-events-none absolute inset-0 rounded-xl" />
      <div className="relative z-[1]">{children}</div>
    </div>
  )
}
