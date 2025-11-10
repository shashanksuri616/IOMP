import PillNav from '@/components/PillNav'
import { StarButton } from '@/components/ui/StarButton'
import { useNavigate } from 'react-router-dom'
import ThemeSwitcher from '@/components/ThemeSwitcher'
import UploadPanel from '@/components/UploadPanel'
import AskPanel from '@/components/AskPanel'
import { useState } from 'react'
import { useTheme } from '@/lib/theme'

export default function Workbench() {
  const navigate = useNavigate()
  const [mode, setMode] = useState<'none'|'upload'>('none')
  const { theme } = useTheme()

  function scrollToId(id: string) {
    const el = document.getElementById(id)
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  return (
    <div className="relative min-h-screen overflow-hidden">
      {/* PillNav at top */}
      <PillNav
        logo={"data:image/svg+xml;utf8,<?xml version='1.0' encoding='UTF-8'?><svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%23ffffff' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'><path d='M3 10.5L12 3l9 7.5'/><path d='M5 10v10h14V10'/><path d='M9 20V12h6v8'/></svg>"}
        logoAlt="Home"
        logoHref="/"
        items={[
          { label: 'How it works', href: '/#learn' },
          { label: 'Docs', href: '/#docs' },
          { label: 'Try now', href: '/app', ariaLabel: 'Open Workbench' }
        ]}
        activeHref={undefined}
        baseColor="rgba(255,255,255,0.18)"
        pillColor="#ffffff"
        hoveredPillTextColor="#060010"
        pillTextColor="#060010"
        onMobileMenuClick={() => {}}
        initialLoadAnimation={true}
      />

      {/* Theme switcher top-right */}
      <div className="pointer-events-auto fixed top-3 right-3 z-40">
        <ThemeSwitcher />
      </div>

  {/* Minimal intro with two buttons */}
  <main className="min-h-screen flex items-center justify-center px-4 pb-12 md:pb-24">
        <div className="text-center max-w-2xl">
          <h1 className={`text-4xl md:text-5xl font-black tracking-tight ${theme==='light' ? 'text-slate-900' : ''}`}>Let’s get you started</h1>
          <p className={`mt-3 ${theme==='light' ? 'text-slate-600' : 'text-white/80'}`}>Choose how you want to begin.</p>
          <div className="mt-8 flex items-center justify-center gap-3">
            <StarButton ariaLabel="Upload a PDF" tone="accent" size="lg" onClick={() => { setMode('upload'); setTimeout(()=>scrollToId('work-section'), 0) }}>
              Upload a PDF
            </StarButton>
          </div>
        </div>
      </main>

      {/* Simple forms below intro */}
      <section id="work-section" className="px-4 pb-16">
        <div className="max-w-3xl mx-auto space-y-10">
          {mode === 'upload' && (
            <div id="upload-section" className={`rounded-xl p-4 md:p-6 space-y-6 backdrop-blur border ${theme==='light' ? 'bg-white/95 border-slate-200 shadow-[0_4px_16px_rgba(0,0,0,0.08)]' : 'bg-black/10 border-white/10'}`}>
              <div>
                <h2 className="text-xl font-semibold mb-4">Upload a PDF</h2>
                <UploadPanel />
              </div>
              <div>
                <h3 className="text-lg font-semibold mb-2">Ask a question</h3>
                <AskPanel />
              </div>
            </div>
          )}

          {/* Web build & ask flow removed for minimal IOMP version */}
        </div>
      </section>
    </div>
  )
}
