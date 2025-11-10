import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import Waves from '@/components/Waves'
import { useTheme } from '@/lib/theme'
import Landing from '@/pages/Landing'
import Workbench from '@/pages/Workbench'

export default function App() {
  const { bg, theme } = useTheme()
  // Waves variant for both themes; parameters differ for contrast
  const waveProps = theme === 'light'
    ? { backgroundColor: '#ffffff', lineColor: '#94a3b8', waveAmpX: 32, waveAmpY: 16 } // slate-400 for softer lines
    : { backgroundColor: '#030712', lineColor: 'rgba(255,255,255,0.12)', waveAmpX: 42, waveAmpY: 20 }
  return (
    <>
      {/* Background: Waves for both themes (dark variant has darker bg + faint light lines) */}
      <div className="fixed inset-0 -z-10 pointer-events-none">
        <Waves {...waveProps} />
      </div>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/app" element={<Workbench />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </>
  )
}
