import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { StarButton } from '@/components/ui/StarButton'

export default function FloatingPillNav() {
  const [visible, setVisible] = useState(true)
  const lastY = useRef(0)
  const nav = useRef<HTMLDivElement>(null)
  const navigate = useNavigate()

  useEffect(() => {
    lastY.current = window.scrollY
    const onScroll = () => {
      const y = window.scrollY
      const goingDown = y > lastY.current
      lastY.current = y
      setVisible(!goingDown)
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <div className="fixed top-4 inset-x-0 z-30 flex justify-center pointer-events-none">
      <div
        ref={nav}
        className={`pointer-events-auto transition-transform duration-200 ${visible ? 'translate-y-0' : '-translate-y-16'}`}
      >
        <div className="rounded-full border bg-white/80 backdrop-blur px-3 py-1.5 shadow-sm">
          <ul className="flex items-center gap-2 text-sm">
            <li><a href="#home" className="px-3 py-1 rounded-full hover:bg-gray-100">Home</a></li>
            <li><a href="#learn" className="px-3 py-1 rounded-full hover:bg-gray-100">Features</a></li>
            <li><a href="#docs" className="px-3 py-1 rounded-full hover:bg-gray-100">HOW IT WORKS</a></li>
            <li>
              <StarButton size="sm" tone="accent" onClick={()=>navigate('/app')}>Try now</StarButton>
            </li>
          </ul>
        </div>
      </div>
    </div>
  )
}
