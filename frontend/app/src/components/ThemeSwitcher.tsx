import { useTheme } from '@/lib/theme'
import { Moon, Sun } from 'lucide-react'

// Only two theme buttons now: Light & Dark
const items: Array<{ key: 'light'|'dark', label: string, icon: any }> = [
  { key: 'light', label: 'Light', icon: Sun },
  { key: 'dark', label: 'Dark', icon: Moon }
]

export default function ThemeSwitcher() {
  const { theme, setTheme } = useTheme()
  return (
    <div className="flex items-center gap-2">
      <div className="flex items-center gap-1">
        {items.map(({ key, icon: Icon }) => (
          <button
            key={key}
            onClick={() => setTheme(key)}
            title={key}
            className={`h-8 w-8 inline-flex items-center justify-center rounded-md border transition-colors ${theme===key? 'bg-blue-600 text-white border-blue-600':'bg-white text-gray-700 hover:bg-gray-100'}`}
          >
            <Icon className="h-4 w-4" />
          </button>
        ))}
      </div>
    </div>
  )
}
