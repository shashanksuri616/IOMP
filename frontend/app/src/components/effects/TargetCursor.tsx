import { useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'

export function TargetCursor() {
  const elRef = useRef<HTMLDivElement | null>(null)
  const hostRef = useRef<HTMLDivElement | null>(null)

  if (!hostRef.current && typeof document !== 'undefined') {
    hostRef.current = document.createElement('div')
  }

  useEffect(() => {
    const host = hostRef.current!
    document.body.appendChild(host)
    elRef.current = document.createElement('div')
    host.appendChild(elRef.current)

    const el = elRef.current
    if (el) {
      el.style.position = 'fixed'
      el.style.width = '24px'
      el.style.height = '24px'
      el.style.border = '2px solid rgba(59,130,246,0.8)'
      el.style.borderRadius = '9999px'
      el.style.transform = 'translate(-50%, -50%)'
      el.style.pointerEvents = 'none'
      el.style.zIndex = '50'
      el.style.transition = 'transform 80ms ease'
      el.style.boxShadow = '0 0 0 6px rgba(59,130,246,0.15) inset'
      ;(el.style as any).mixBlendMode = 'multiply'
    }

    const onMove = (e: MouseEvent) => {
      if (!el) return
      el.style.left = `${e.clientX}px`
      el.style.top = `${e.clientY}px`
      el.style.transform = 'translate(-50%, -50%) scale(1)'
    }
    window.addEventListener('mousemove', onMove)
    return () => {
      window.removeEventListener('mousemove', onMove)
      host.remove()
    }
  }, [])

  return hostRef.current ? createPortal(null, hostRef.current) : null
}
