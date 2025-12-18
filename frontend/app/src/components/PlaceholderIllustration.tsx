import React from 'react'

type Props = {
  theme?: 'light' | 'dark'
  className?: string
}

export default function PlaceholderIllustration({ theme = 'dark', className }: Props) {
  const bg = theme === 'light' ? '#f8fafc' : '#0b0f1a'
  const accentA = theme === 'light' ? '#0ea5e9' : '#22d3ee'
  const accentB = theme === 'light' ? '#6366f1' : '#a78bfa'
  const grid = theme === 'light' ? 'rgba(15,23,42,0.08)' : 'rgba(255,255,255,0.12)'

  return (
    <svg viewBox="0 0 600 300" xmlns="http://www.w3.org/2000/svg" className={className}>
      <defs>
        <linearGradient id="g1" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor={accentA} />
          <stop offset="100%" stopColor={accentB} />
        </linearGradient>
        <pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse">
          <path d="M 20 0 L 0 0 0 20" fill="none" stroke={grid} strokeWidth="1" />
        </pattern>
      </defs>
      <rect x="0" y="0" width="600" height="300" fill={bg} />
      <rect x="0" y="0" width="600" height="300" fill="url(#grid)" />
      <g transform="translate(100,80)">
        <rect x="0" y="0" width="400" height="140" rx="18" fill="url(#g1)" opacity="0.2" />
        <rect x="0" y="0" width="400" height="140" rx="18" fill="none" stroke={accentA} strokeWidth="2" opacity="0.35" />
        <g transform="translate(24,24)">
          <rect x="0" y="0" width="80" height="80" rx="12" fill={accentA} opacity="0.25" />
          <circle cx="40" cy="40" r="24" fill="none" stroke={accentA} strokeWidth="3" />
          <path d="M25 45 L35 55 L55 30" fill="none" stroke={accentB} strokeWidth="3" strokeLinecap="round" />
        </g>
        <g transform="translate(130,24)" fill={theme === 'light' ? '#0f172a' : '#e5e7eb'}>
          <rect x="0" y="0" width="230" height="14" rx="7" />
          <rect x="0" y="24" width="260" height="10" rx="5" opacity="0.7" />
          <rect x="0" y="42" width="200" height="10" rx="5" opacity="0.6" />
          <rect x="0" y="60" width="180" height="10" rx="5" opacity="0.5" />
        </g>
      </g>
    </svg>
  )
}
