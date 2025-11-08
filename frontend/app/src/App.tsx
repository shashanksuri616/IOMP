import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import Hyperspeed from '@/components/Hyperspeed'
import { GridScan as GridScanJsx } from '@/components/GridScan'
import FaultyTerminal from '@/components/FaultyTerminal'
import { useTheme } from '@/lib/theme'
import Landing from '@/pages/Landing'
import Workbench from '@/pages/Workbench'

export default function App() {
  const { bg, theme } = useTheme()
  const terminalTint = theme === 'light' ? '#8ec5ff' : theme === 'sapphire' ? '#60a5fa' : '#7dd3fc'
  const terminalBrightness = theme === 'light' ? 1.2 : theme === 'sapphire' ? 1.1 : 1.05
  return (
    <>
      {/* Global background effect (behind everything) */}
      {bg === 'gridscan' && (
        <GridScanJsx
          className="gridscan--full"
          style={{}}
          enableWebcam={false}
          showPreview={false}
          enablePost={false}
          scanOpacity={0.25}
        />
      )}
      {bg === 'terminal' && (
        <div className="fixed inset-0 -z-10 pointer-events-none">
          <FaultyTerminal
            className="w-full h-full"
            style={{ width: '100%', height: '100%' }}
            mouseReact={false}
            pageLoadAnimation={false}
            brightness={terminalBrightness}
            scanlineIntensity={0.35}
            glitchAmount={1.05}
            flickerAmount={0.3}
            noiseAmp={0.4}
            timeScale={0.4}
            digitSize={1.8}
            tint={terminalTint}
          />
        </div>
      )}
      {bg === 'hyperspeed' && <Hyperspeed />}
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
