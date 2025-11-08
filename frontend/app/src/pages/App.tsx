import React, { useState } from 'react'

const API_BASE = (import.meta as any).env?.VITE_API_BASE || 'http://localhost:8000'

export default function App() {
  const [files, setFiles] = useState<File[]>([])
  const [status, setStatus] = useState('')
  const [q, setQ] = useState('')
  const [k, setK] = useState(5)
  const [answer, setAnswer] = useState('')
  const [sources, setSources] = useState<{label?: string, source?: string}[]>([])

  async function onUpload() {
    if (!files.length) { alert('Pick files'); return }
    setStatus('Uploading & building...')
    setAnswer(''); setSources([])
    const fd = new FormData()
    files.forEach(f => fd.append('files', f))
    try {
      const res = await fetch(`${API_BASE}/upload?chunk_size=1000&chunk_overlap=200`, { method: 'POST', body: fd })
      const data = await res.json()
      if (!res.ok) throw data
      setStatus(`Built: ${data.documents} docs, ${data.chunks} chunks (index ${data.index_name})`)
    } catch (e: any) {
      setStatus(`Upload error: ${e?.detail || e?.error || 'failed'}`)
    }
  }

  async function onAsk() {
    if (!q.trim()) { alert('Ask a question'); return }
    setStatus('Thinking...')
    setAnswer(''); setSources([])
    try {
      const res = await fetch(`${API_BASE}/ask`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ question: q, k }) })
      const data = await res.json()
      if (!res.ok) throw data
      setAnswer(data.answer || '')
      setSources(data.sources || [])
      setStatus('')
    } catch (e: any) {
      setStatus(`Ask error: ${e?.detail || e?.error || 'failed'}`)
    }
  }

  return (
    <div style={{ minHeight: '100vh', padding: '24px', display: 'grid', gap: 16, background: '#0a0a0a', color: 'white' }}>
      <h1 style={{ fontSize: 28, fontWeight: 900 }}>IOMP — Upload only</h1>

      <section style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: 12, padding: 16 }}>
        <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 8 }}>Upload files</h2>
        <input type="file" multiple onChange={(e)=> setFiles(Array.from(e.target.files || []))} style={{ display: 'block', marginBottom: 8 }} />
        <button onClick={onUpload} style={{ padding: '8px 12px', borderRadius: 8, background: 'white', color: '#0a0a0a', fontWeight: 600 }}>Build Index</button>
      </section>

      <section style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: 12, padding: 16 }}>
        <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 8 }}>Ask a question</h2>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 120px', gap: 8, alignItems: 'end' }}>
          <div>
            <label style={{ display: 'block', fontSize: 12, opacity: 0.9, marginBottom: 4 }}>Question</label>
            <input value={q} onChange={(e)=>setQ(e.target.value)} placeholder="Your question"
              style={{ width: '100%', height: 40, padding: '0 10px', borderRadius: 8, border: '1px solid rgba(255,255,255,0.25)', background: 'rgba(255,255,255,0.08)', color: 'white' }} />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: 12, opacity: 0.9, marginBottom: 4 }}>Top K</label>
            <input type="number" min={1} max={20} value={k} onChange={(e)=>setK(parseInt(e.target.value)||5)}
              style={{ width: '100%', height: 40, padding: '0 10px', borderRadius: 8, border: '1px solid rgba(255,255,255,0.25)', background: 'rgba(255,255,255,0.08)', color: 'white' }} />
          </div>
        </div>
        <div style={{ marginTop: 8 }}>
          <button onClick={onAsk} style={{ padding: '8px 12px', borderRadius: 8, background: 'white', color: '#0a0a0a', fontWeight: 600 }}>Ask</button>
        </div>
        {status && <p style={{ marginTop: 8, opacity: 0.9 }}>{status}</p>}
        {answer && (
          <div style={{ marginTop: 12 }}>
            <h3 style={{ fontWeight: 700, marginBottom: 4 }}>Answer</h3>
            <p style={{ whiteSpace: 'pre-wrap' }}>{answer}</p>
          </div>
        )}
        {!!sources.length && (
          <div style={{ marginTop: 12 }}>
            <h3 style={{ fontWeight: 700, marginBottom: 4 }}>Sources</h3>
            <ul>
              {sources.map((s, i)=> (
                <li key={i} style={{ opacity: 0.9, wordBreak: 'break-word' }}>{s.source || ''}</li>
              ))}
            </ul>
          </div>
        )}
      </section>
    </div>
  )
}
