import { useState, ChangeEvent } from 'react'
import { useTheme } from '@/lib/theme'
import { api } from '@/lib/api'
import { motion } from 'framer-motion'
import { toast } from 'sonner'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'

export default function AskPanel({ context }: { context?: 'web'|'upload' }) {
  const [q, setQ] = useState('')
  const [k, setK] = useState(5)
  const [status, setStatus] = useState('')
  const [answer, setAnswer] = useState('')
  const [sources, setSources] = useState<any[]>([])
  const { theme } = useTheme()

  async function onAsk() {
    if (!q.trim()) { alert('Ask a question'); return }
    setStatus('Thinking...')
    setAnswer('')
    setSources([])
    try {
      const res = await api.ask(q, k)
      setAnswer(res.answer)
      setSources(res.sources || [])
      setStatus('')
      toast.success('Answer ready')
    } catch (e: any) {
      setStatus('Ask error: ' + (e?.detail || e?.error || 'failed'))
      toast.error('Ask failed', { description: e?.detail || e?.error || 'failed' })
    }
  }

  return (
    <motion.section initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className={`p-4 rounded-xl border backdrop-blur space-y-3
      ${theme==='light' ? 'border-slate-200 bg-white/95 shadow-[0_4px_16px_rgba(0,0,0,0.08)]' : 'border-white/10 bg-black/10'} dark:bg-white/5`}>
      <div className="grid md:grid-cols-6 gap-3 items-end">
        <div className="md:col-span-5">
          <label className={`block text-sm font-medium mb-1 ${theme==='light' ? 'text-slate-800' : 'text-white'}`}>{context==='web' ? 'Ask from Web-built index' : 'Ask from uploaded index'}</label>
          <Input value={q} onChange={(e: ChangeEvent<HTMLInputElement>)=>setQ(e.target.value)} placeholder="Your question" />
        </div>
        <div>
          <label className={`block text-sm font-medium mb-1 ${theme==='light' ? 'text-slate-800' : 'text-white'}`}>Top K</label>
          <Input type="number" min={1} max={20} value={k} onChange={(e: ChangeEvent<HTMLInputElement>)=>setK(parseInt(e.target.value)||5)} />
        </div>
      </div>
      <div>
        <Button onClick={onAsk}>Ask</Button>
      </div>
  {status && <p className={`text-sm ${theme==='light' ? 'text-slate-600' : 'text-white/70'}`}>{status}</p>}
      {answer && (
        <div className="space-y-2">
          <h3 className={`font-semibold ${theme==='light' ? 'text-slate-900' : 'text-white'}`}>Answer</h3>
          <p className={`whitespace-pre-wrap ${theme==='light' ? 'text-slate-700' : 'text-white/90'}`}>{answer}</p>
        </div>
      )}
      {!!sources.length && (
        <div className="space-y-2">
          <h3 className={`font-semibold ${theme==='light' ? 'text-slate-900' : 'text-white'}`}>Sources</h3>
          <ul className={`list-disc pl-5 text-sm ${theme==='light' ? 'text-slate-600' : 'text-white/80'}`}>
            {sources.map((s, i)=> (
              <li key={i} className="break-words">{typeof s === 'string' ? s : (s.url || s.title || JSON.stringify(s))}</li>
            ))}
          </ul>
        </div>
      )}
    </motion.section>
  )
}
