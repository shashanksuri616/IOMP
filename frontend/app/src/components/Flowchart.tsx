import React from 'react'

type Props = {
  title?: string
  steps: string[]
  className?: string
}

export default function Flowchart({ title, steps, className }: Props) {
  return (
    <div className={`max-w-3xl mx-auto ${className ?? ''}`}>
      {title && <h3 className="text-lg font-semibold text-center mb-6">{title}</h3>}
      <div className="space-y-5">
        {steps.map((s, i) => (
          <div key={i} className="flex flex-col items-center">
            <div className="w-full">
              <div className="rounded-xl border border-black/10 dark:border-white/20 px-4 py-3 bg-white dark:bg-white/10 shadow-sm">
                <span className="text-sm text-slate-900 dark:text-white/90">{s}</span>
              </div>
            </div>
            {i < steps.length - 1 && (
              <div className="flex flex-col items-center" aria-hidden="true">
                <div className="h-6 border-l border-current/20" />
                <svg width="18" height="18" viewBox="0 0 24 24" className="opacity-60">
                  <path d="M12 5v14M19 12l-7 7-7-7" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                <div className="h-6 border-l border-current/20" />
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
