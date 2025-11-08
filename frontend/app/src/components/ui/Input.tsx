import { forwardRef, InputHTMLAttributes } from 'react'
import { cn } from '@/lib/ui/cn'

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, ...props }, ref) => (
    <input
      ref={ref}
      className={cn(
        // Light theme
        'w-full h-10 px-3 rounded-md border bg-white/90 text-gray-900 placeholder:text-gray-500 border-gray-300',
        // Dark/terminal theme
        'dark:bg-white/10 dark:text-white dark:placeholder:text-white/60 dark:border-white/20 backdrop-blur',
        // Focus states
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/40 focus-visible:ring-offset-0',
        'transition-colors',
        className,
      )}
      {...props}
    />
  )
)
Input.displayName = 'Input'
