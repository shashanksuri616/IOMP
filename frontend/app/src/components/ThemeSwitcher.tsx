import { useTheme } from '@/lib/theme'
import { Moon, Sun, Gem, Scan, Rocket, Terminal } from 'lucide-react'

const items: Array<{ key: 'light'|'dark'|'sapphire', label: string, icon: any }> = [
  { key: 'light', label: 'Light', icon: Sun },
  { key: 'dark', label: 'Dark', icon: Moon },
  { key: 'sapphire', label: 'Sapphire', icon: Gem },
]

export default function ThemeSwitcher() {
  const { theme, setTheme, bg, setBg } = useTheme()
  return (
    <div className="flex items-center gap-2">
      <div className="flex items-center gap-1">
        {items.map(({ key, icon: Icon }) => (
          <button
            key={key}
            onClick={() => setTheme(key)}
            title={key}
            className={`h-8 w-8 inline-flex items-center justify-center rounded-md border ${theme===key? 'bg-blue-600 text-white border-blue-600':'bg-white text-gray-700 hover:bg-gray-100'}`}
          >
            <Icon className="h-4 w-4" />
          </button>
        ))}
      </div>
      <span className="w-px h-6 bg-gray-300/70" />
      <div className="flex items-center gap-1" title="Background">
        <button
          onClick={() => setBg('hyperspeed')}
          className={`h-8 w-8 inline-flex items-center justify-center rounded-md border ${bg==='hyperspeed'? 'bg-blue-600 text-white border-blue-600':'bg-white text-gray-700 hover:bg-gray-100'}`}
          aria-label="Hyperspeed background"
        >
          <Rocket className="h-4 w-4" />
        </button>
        <button
          onClick={() => setBg('gridscan')}
          className={`h-8 w-8 inline-flex items-center justify-center rounded-md border ${bg==='gridscan'? 'bg-blue-600 text-white border-blue-600':'bg-white text-gray-700 hover:bg-gray-100'}`}
          aria-label="Grid Scan background"
        >
          <Scan className="h-4 w-4" />
        </button>
        <button
          onClick={() => setBg('terminal')}
          className={`h-8 w-8 inline-flex items-center justify-center rounded-md border ${bg==='terminal'? 'bg-blue-600 text-white border-blue-600':'bg-white text-gray-700 hover:bg-gray-100'}`}
          aria-label="Terminal background"
        >
          <Terminal className="h-4 w-4" />
        </button>
      </div>
    </div>
  )
}
