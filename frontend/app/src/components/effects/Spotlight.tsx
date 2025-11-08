import { HTMLAttributes, useCallback } from 'react'
import { cn } from '@/lib/ui/cn'

export function Spotlight({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  const onMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect()
    const x = ((e.clientX - rect.left) / rect.width) * 100
    const y = ((e.clientY - rect.top) / rect.height) * 100
    e.currentTarget.style.setProperty('--mx', `${x}%`)
    e.currentTarget.style.setProperty('--my', `${y}%`)
  }, [])

  return <div onMouseMove={onMouseMove} className={cn('spotlight-mask', className)} {...props} />
}
