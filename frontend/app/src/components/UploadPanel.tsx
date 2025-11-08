import { useState, ChangeEvent } from 'react'
import { api } from '@/lib/api'
import { motion } from 'framer-motion'
import { Button } from './ui/Button'

export default function UploadPanel() {
  const [files, setFiles] = useState<File[]>([])
  const [status, setStatus] = useState('')
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
          <label className="block text-sm font-medium mb-1 text-white">Upload files</label>
          <input
            type="file"
            multiple
            className="w-full h-10 px-2 rounded-md border border-white/20 bg-white/10 text-white placeholder:text-white/60 backdrop-blur file:border-0 file:bg-transparent file:text-white file:mr-2"
            onChange={(e: ChangeEvent<HTMLInputElement>)=>setFiles(Array.from(e.target.files||[]))}
          />
        </div>
        <div>
          <Button onClick={onBuild}>Build Index</Button>
        </div>
      </div>
      <p className="text-sm text-white/70 mt-2">{status}</p>
    </motion.section>
  )
}
