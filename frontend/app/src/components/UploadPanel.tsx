import { useState, ChangeEvent } from 'react'
import { useTheme } from '@/lib/theme'
import { api } from '@/lib/api'
import { motion } from 'framer-motion'
import { Button } from './ui/Button'

export default function UploadPanel() {
  const [files, setFiles] = useState<File[]>([])
  const [status, setStatus] = useState('')
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
  return (
    <motion.section initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
      <div className="grid md:grid-cols-3 gap-3 items-end">
        <div className="md:col-span-2">
          <label className={`block text-sm font-medium mb-1 ${theme==='light' ? 'text-slate-800' : 'text-white'}`}>Upload files</label>
          <input
            type="file"
            multiple
            className={`w-full h-10 px-2 rounded-md border backdrop-blur file:border-0 file:bg-transparent file:mr-2
              ${theme==='light'
                ? 'border-slate-300 bg-white text-slate-800 placeholder:text-slate-400 file:text-slate-600'
                : 'border-white/20 bg-white/10 text-white placeholder:text-white/60 file:text-white'}`}
            onChange={(e: ChangeEvent<HTMLInputElement>)=>setFiles(Array.from(e.target.files||[]))}
          />
        </div>
        <div>
          <Button onClick={onBuild}>Build Index</Button>
        </div>
      </div>
      <p className={`text-sm mt-2 ${theme==='light' ? 'text-slate-600' : 'text-white/70'}`}>{status}</p>
    </motion.section>
  )
}
