import { cn } from '@/lib/ui/cn'
import { PropsWithChildren, CSSProperties } from 'react'

type Props = PropsWithChildren<{
  as?: 'button' | 'a'
  href?: string
  onClick?: () => void
  className?: string
  tone?: 'accent' | 'neutral'
  size?: 'sm' | 'md' | 'lg'
  ariaLabel?: string
}>

// Star-border animated button inspired by reactbits.dev
export function StarButton({ as = 'button', href, onClick, className, tone = 'accent', size = 'md', ariaLabel, children }: Props) {
  const Comp: any = as
  const padding = size === 'sm' ? 'px-3 py-1.5 text-sm' : size === 'lg' ? 'px-6 py-3 text-base' : 'px-5 py-2.5'
  const style: CSSProperties = {
    backgroundImage: `linear-gradient(to right, var(${tone === 'accent' ? '--accent-from' : '--neutral-from'}), var(${tone === 'accent' ? '--accent-to' : '--neutral-to'}))`,
  }
  // Use dark text when in light theme (document root data-theme) by checking the DOM; fallback to white.
  const isLight = typeof document !== 'undefined' && document.documentElement.getAttribute('data-theme') === 'light'
  return (
    <Comp
      href={href}
      onClick={onClick}
      aria-label={ariaLabel}
      className={cn(
        'relative inline-flex items-center justify-center rounded-xl font-medium',
        isLight ? 'text-slate-900 shadow-[0_4px_16px_rgba(0,0,0,0.15)]' : 'text-white shadow-[0_8px_30px_rgba(99,102,241,0.35)]',
        'focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500',
        padding,
        className
      )}
      style={style}
    >
      <span className="relative z-10">{children}</span>
      <span className="absolute inset-0 rounded-xl p-[1px]">
        <span className={cn('absolute inset-0 rounded-xl', isLight ? 'bg-[radial-gradient(circle_at_10%_10%,rgba(0,0,0,0.08),transparent_40%),radial-gradient(circle_at_90%_90%,rgba(0,0,0,0.06),transparent_45%)]' : 'bg-[radial-gradient(circle_at_10%_10%,rgba(255,255,255,0.5),transparent_35%),radial-gradient(circle_at_90%_90%,rgba(255,255,255,0.4),transparent_40%)]')} />
      </span>
      <span className="pointer-events-none absolute -inset-[2px] rounded-[14px]" style={{ background: isLight ? 'conic-gradient(from 180deg at 50% 50%, rgba(99,102,241,0.25), transparent, rgba(99,102,241,0.25))' : 'conic-gradient(from 180deg at 50% 50%, var(--accent-glow), transparent, var(--accent-glow))', opacity: isLight ? 0.5 : 0.6, filter: 'blur(6px)' }} />
    </Comp>
  )}
