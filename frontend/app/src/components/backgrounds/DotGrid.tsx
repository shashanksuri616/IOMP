// Dotted grid background
export function DotGrid({ className = '' }: { className?: string }) {
  return (
    <div className={`pointer-events-none fixed inset-0 -z-10 ${className}`}>
      <div className="absolute inset-0" style={{
        backgroundImage: `radial-gradient(rgba(99,102,241,0.25) 1px, transparent 1px)`,
        backgroundSize: '18px 18px'
      }} />
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-white/20 to-transparent" />
    </div>
  )
}
