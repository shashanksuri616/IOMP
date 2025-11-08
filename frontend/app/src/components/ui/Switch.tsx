import { forwardRef } from 'react'
import { cn } from '@/lib/ui/cn'

interface SwitchProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label?: string
}

export const Switch = forwardRef<HTMLInputElement, SwitchProps>(({ className, label, ...props }, ref) => (
  <label className={cn('inline-flex items-center gap-2 cursor-pointer select-none', className)}>
    <input ref={ref} type="checkbox" className="peer sr-only" {...props} />
    <span className="w-10 h-6 rounded-full bg-gray-300 peer-checked:bg-blue-600 transition-colors relative">
      <span className="absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white shadow transition-all peer-checked:translate-x-4" />
    </span>
    {label && <span className="text-sm text-gray-800">{label}</span>}
  </label>
))
Switch.displayName = 'Switch'
