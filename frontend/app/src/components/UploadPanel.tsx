import { useState, ChangeEvent } from 'react'
import { useTheme } from '@/lib/theme'
import { api } from '@/lib/api'
import { motion } from 'framer-motion'
import { Button } from './ui/Button'

export default function UploadPanel() {
  const [files, setFiles] = useState<File[]>([])
  const [status, setStatus] = useState('')
  const [health, setHealth] = useState<string>('')
  const [cfg, setCfg] = useState<string>('')
  const { theme } = useTheme()
  async function onBuild() {
    if (!files.length) {
      alert('Select one or more files')
      return
    }
    setStatus('Uploading and building...')
    try {
      const res: any = await api.upload(files)
      setStatus(`Built: ${res.documents} docs, ${res.chunks} chunks (index ${res.index_name})`)
    } catch (e: any) {
      setStatus('Error: ' + (e?.detail || e?.error || 'failed'))
    }
  }
  async function onHealth() {
    try {
      const h = await api.health()
      setHealth(typeof h === 'string' ? h : JSON.stringify(h))
    } catch (e: any) {
      setHealth('Error')
    }
  }
  async function onConfig() {
    try {
      const c = await api.config()
      setCfg(JSON.stringify(c))
    } catch (e: any) {
      setCfg('Error')
    }
  }
  return (
    <motion.section initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
      <div className="grid md:grid-cols-3 gap-3 items-end">
        <div className="md:col-span-2">
          <label className={`block text-sm font-medium mb-1 ${theme==='light' ? 'text-slate-800' : 'text-white'}`}>Upload files</label>
          <div className="flex items-center gap-2">
            <input
              id="file-input"
              type="file"
              multiple
              className="hidden"
              onChange={(e: ChangeEvent<HTMLInputElement>)=>setFiles(Array.from(e.target.files||[]))}
            />
            {files.length === 0 ? (
              <Button onClick={() => document.getElementById('file-input')?.click()}>Choose documents</Button>
            ) : (
              <Button variant="secondary" onClick={() => document.getElementById('file-input')?.click()}>Change</Button>
            )}
          </div>
          {files.length > 0 && (
            <div
              className={`mt-3 rounded-lg border px-4 py-3 ${
                theme==='light'
                  ? 'bg-white/95 border-slate-200 text-slate-800 shadow-[0_4px_16px_rgba(0,0,0,0.06)]'
                  : 'bg-black/20 border-white/10 text-white'
              }`}
            >
              <div className="text-sm font-semibold mb-1">Selected document{files.length>1?'s':''}</div>
              <ul className="list-disc pl-5 space-y-1">
                {files.map((f, idx) => (
                  <li key={idx} className="text-base md:text-lg">{f.name}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
        <div className="flex gap-2">
          <Button onClick={onBuild}>Build Index</Button>
          <Button variant="secondary" onClick={onHealth}>Check Health</Button>
          <Button variant="secondary" onClick={onConfig}>Check Config</Button>
        </div>
      </div>
      <p className={`text-sm mt-2 ${theme==='light' ? 'text-slate-600' : 'text-white/70'}`}>{status}</p>
      {(health || cfg) && (
        <div className="mt-2 space-y-1">
          {health && <p className={`text-xs ${theme==='light' ? 'text-slate-600' : 'text-white/70'}`}>Health: {health}</p>}
          {cfg && <p className={`text-xs ${theme==='light' ? 'text-slate-600' : 'text-white/70'}`}>Config: {cfg}</p>}
        </div>
      )}
    </motion.section>
  )
}
