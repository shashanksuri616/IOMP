import { ChangeEvent, useMemo, useState } from 'react'
import { api } from '@/lib/api'
import { motion } from 'framer-motion'
import { toast } from 'sonner'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Switch } from '@/components/ui/Switch'

export default function WebBuildPanel({ compact = false }: { compact?: boolean }) {
  type Opts = {
    reddit_only: boolean
    include_forums: boolean
    include_github_forums: boolean
    english_worldwide: boolean
    strict_en_only: boolean
    per_domain_limit: number
    min_distinct_sources: number
    min_keyword_hits: number
    min_keyword_ratio: number
    timelimit: string
    block_domains: string
  }
  const [query, setQuery] = useState('')
  const [status, setStatus] = useState('')
  const [debugOpen, setDebugOpen] = useState(false)
  const [debugItems, setDebugItems] = useState<any[]>([])

  const [opts, setOpts] = useState<Opts>({
    reddit_only: false,
    include_forums: true,
    include_github_forums: false,
    english_worldwide: true,
    strict_en_only: true,
    per_domain_limit: 3,
    min_distinct_sources: 5,
    min_keyword_hits: 2,
    min_keyword_ratio: 0.25,
    timelimit: '',
    block_domains: ''
  })

  async function onBuild() {
    if (!query.trim()) { alert('Enter a query'); return }
    setStatus('Building from web...')
    setDebugItems([])
    try {
      const payload = {
        query,
        top_k: 5,
        strict_en_only: opts.strict_en_only,
        english_worldwide: opts.english_worldwide,
        timelimit: opts.timelimit || null,
        per_domain_limit: opts.per_domain_limit,
  block_domains: opts.block_domains.split(',').map((s: string)=>s.trim()).filter(Boolean),
        include_pdfs: false,
        use_wikipedia_fallback: opts.reddit_only ? false : true,
        include_forums: opts.include_forums,
        include_github_forums: opts.include_github_forums,
        min_distinct_sources: opts.min_distinct_sources,
        min_keyword_hits: opts.min_keyword_hits,
        min_keyword_ratio: opts.min_keyword_ratio,
        reddit_only: opts.reddit_only,
        debug: true,
      }
      const res = await api.webBuild(payload)
      setStatus(`Built: ${res.documents} docs, ${res.chunks} chunks (index ${res.index_name})`)
      toast.success('Index built from web', { description: `${res.documents} docs, ${res.chunks} chunks` })
      setDebugItems(res.debug || [])
    } catch (e: any) {
      const detail = e?.detail || e
      const hint = 'Try "Reddit only", enable forums, or reduce keyword thresholds.'
      setStatus('Build error: ' + (detail?.error || detail) + `\n${hint}`)
      toast.error('Build failed', { description: (detail?.error || detail || 'Unknown error') })
      if (detail?.debug) setDebugItems(detail.debug)
    }
  }

  async function onBuildSafe() {
    setOpts((o: Opts) => ({...o, reddit_only: false, include_forums: true, include_github_forums: false, min_distinct_sources: 5, per_domain_limit: 3}))
    await onBuild()
  }

  const accepted = useMemo(() => debugItems.filter((x: any)=>x.accepted), [debugItems])
  const sites = new Map<string, number>()
  const subs = new Map<string, number>()
  for (const it of accepted) {
    const dom = it.domain || ''
    const sk = it.source_key || ''
    if (dom) sites.set(dom, (sites.get(dom)||0) + 1)
    if (sk && sk.startsWith('reddit:')) subs.set(sk, (subs.get(sk)||0) + 1)
  }

  return (
    <motion.section initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
      <div className="grid md:grid-cols-2 gap-4">
        <div className="md:col-span-2">
          <label className="block text-sm font-medium mb-1">Web query</label>
          <Input value={query} onChange={(e: ChangeEvent<HTMLInputElement>)=>setQuery(e.target.value)} placeholder="e.g., Elden Ring Strength build" />
        </div>
        {!compact && (
          <>
            <Switch checked={opts.reddit_only} onChange={(e: ChangeEvent<HTMLInputElement>)=>setOpts((o: Opts)=>({...o, reddit_only: e.target.checked}))} label="Reddit only" />
            <Switch checked={opts.include_forums} onChange={(e: ChangeEvent<HTMLInputElement>)=>setOpts((o: Opts)=>({...o, include_forums: e.target.checked}))} label="Include forums" />
            <Switch checked={opts.include_github_forums} onChange={(e: ChangeEvent<HTMLInputElement>)=>setOpts((o: Opts)=>({...o, include_github_forums: e.target.checked}))} label="Include GitHub Discussions" />
            <Switch checked={opts.english_worldwide} onChange={(e: ChangeEvent<HTMLInputElement>)=>setOpts((o: Opts)=>({...o, english_worldwide: e.target.checked}))} label="English (worldwide)" />
            <Switch checked={opts.strict_en_only} onChange={(e: ChangeEvent<HTMLInputElement>)=>setOpts((o: Opts)=>({...o, strict_en_only: e.target.checked}))} label="Strict English only" />
            <div>
              <label className="block text-sm font-medium mb-1">Per-source limit</label>
              <Input type="number" min={0} value={opts.per_domain_limit} onChange={(e: ChangeEvent<HTMLInputElement>)=>setOpts((o: Opts)=>({...o, per_domain_limit: parseInt(e.target.value)||0}))} />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Min distinct sources</label>
              <Input type="number" min={1} value={opts.min_distinct_sources} onChange={(e: ChangeEvent<HTMLInputElement>)=>setOpts((o: Opts)=>({...o, min_distinct_sources: parseInt(e.target.value)||1}))} />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Min keyword hits</label>
              <Input type="number" min={0} value={opts.min_keyword_hits} onChange={(e: ChangeEvent<HTMLInputElement>)=>setOpts((o: Opts)=>({...o, min_keyword_hits: parseInt(e.target.value)||0}))} />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Min keyword ratio</label>
              <Input type="number" min={0} max={1} step={0.05} value={opts.min_keyword_ratio} onChange={(e: ChangeEvent<HTMLInputElement>)=>setOpts((o: Opts)=>({...o, min_keyword_ratio: parseFloat(e.target.value)||0}))} />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Timeframe</label>
              <select value={opts.timelimit} onChange={(e: ChangeEvent<HTMLSelectElement>)=>setOpts((o)=>({...o, timelimit: e.target.value}))} className="w-full h-10 px-2 rounded-md border border-gray-300 bg-white">
                <option value="">Any time</option>
                <option value="d">Day</option>
                <option value="w">Week</option>
                <option value="m">Month</option>
                <option value="y">Year</option>
              </select>
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium mb-1">Block domains (comma)</label>
              <Input value={opts.block_domains} onChange={(e: ChangeEvent<HTMLInputElement>)=>setOpts((o)=>({...o, block_domains: e.target.value}))} placeholder="wikipedia.org, github.com" />
            </div>
          </>
        )}
      </div>
      {compact ? (
        <details className="rounded-xl border p-3 backdrop-blur bg-black/10 border-white/10 dark:bg-white/5 dark:border-white/10">
          <summary className="cursor-pointer text-sm font-medium">Additional settings</summary>
          <div className="mt-3 space-y-3">
            <div className="grid md:grid-cols-2 gap-4">
              <Switch checked={opts.reddit_only} onChange={(e: ChangeEvent<HTMLInputElement>)=>setOpts((o: Opts)=>({...o, reddit_only: e.target.checked}))} label="Reddit only" />
              <Switch checked={opts.include_forums} onChange={(e: ChangeEvent<HTMLInputElement>)=>setOpts((o: Opts)=>({...o, include_forums: e.target.checked}))} label="Include forums" />
              <Switch checked={opts.include_github_forums} onChange={(e: ChangeEvent<HTMLInputElement>)=>setOpts((o: Opts)=>({...o, include_github_forums: e.target.checked}))} label="Include GitHub Discussions" />
              <Switch checked={opts.english_worldwide} onChange={(e: ChangeEvent<HTMLInputElement>)=>setOpts((o: Opts)=>({...o, english_worldwide: e.target.checked}))} label="English (worldwide)" />
              <Switch checked={opts.strict_en_only} onChange={(e: ChangeEvent<HTMLInputElement>)=>setOpts((o: Opts)=>({...o, strict_en_only: e.target.checked}))} label="Strict English only" />
              <div>
                <label className="block text-sm font-medium mb-1">Per-source limit</label>
                <Input type="number" min={0} value={opts.per_domain_limit} onChange={(e: ChangeEvent<HTMLInputElement>)=>setOpts((o: Opts)=>({...o, per_domain_limit: parseInt(e.target.value)||0}))} />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Min distinct sources</label>
                <Input type="number" min={1} value={opts.min_distinct_sources} onChange={(e: ChangeEvent<HTMLInputElement>)=>setOpts((o: Opts)=>({...o, min_distinct_sources: parseInt(e.target.value)||1}))} />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Min keyword hits</label>
                <Input type="number" min={0} value={opts.min_keyword_hits} onChange={(e: ChangeEvent<HTMLInputElement>)=>setOpts((o: Opts)=>({...o, min_keyword_hits: parseInt(e.target.value)||0}))} />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Min keyword ratio</label>
                <Input type="number" min={0} max={1} step={0.05} value={opts.min_keyword_ratio} onChange={(e: ChangeEvent<HTMLInputElement>)=>setOpts((o: Opts)=>({...o, min_keyword_ratio: parseFloat(e.target.value)||0}))} />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Timeframe</label>
                <select value={opts.timelimit} onChange={(e: ChangeEvent<HTMLSelectElement>)=>setOpts((o)=>({...o, timelimit: e.target.value}))} className="w-full h-10 px-2 rounded-md border border-gray-300 bg-white">
                  <option value="">Any time</option>
                  <option value="d">Day</option>
                  <option value="w">Week</option>
                  <option value="m">Month</option>
                  <option value="y">Year</option>
                </select>
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium mb-1">Block domains (comma)</label>
                <Input value={opts.block_domains} onChange={(e: ChangeEvent<HTMLInputElement>)=>setOpts((o)=>({...o, block_domains: e.target.value}))} placeholder="wikipedia.org, github.com" />
              </div>
            </div>
            <div className="flex gap-2">
              <Button variant="secondary" onClick={onBuildSafe}>Try safe defaults</Button>
              <button onClick={()=>setDebugOpen(x=>!x)} className="text-sm underline">{debugOpen? 'Hide debug':'Show debug'}</button>
            </div>
            {debugOpen && (
              <div className="mt-2 text-xs rounded p-2 whitespace-pre-wrap border border-white/10 bg-black/10 dark:bg-white/5">
                <p>Accepted: {accepted.length}</p>
                <p>Sites: {[...sites.entries()].map(([k,v])=>`${k} x${v}`).join(', ')}</p>
                <p>Subreddits: {[...subs.entries()].map(([k,v])=>`${k} x${v}`).join(', ')}</p>
                <hr className="my-2" />
                <pre>{JSON.stringify(debugItems, null, 2)}</pre>
              </div>
            )}
          </div>
        </details>
      ) : (
        <details className="rounded-xl border p-3 backdrop-blur bg-black/10 border-white/10 dark:bg-white/5 dark:border-white/10">
          <summary className="cursor-pointer text-sm font-medium">Advanced options</summary>
          <p className="text-xs mt-1 text-gray-700 dark:text-gray-300">Tune acceptance thresholds and diversity constraints. If results look sparse, try lowering thresholds.</p>
        </details>
      )}
      <div className="flex gap-2">
        <Button onClick={onBuild}>Build from Web</Button>
        {!compact && <Button variant="secondary" onClick={onBuildSafe}>Try safe defaults</Button>}
      </div>
      <p className="text-sm text-gray-600 whitespace-pre-wrap">{status}</p>
      {!compact && (
        <div>
          <button onClick={()=>setDebugOpen(x=>!x)} className="text-sm underline">{debugOpen? 'Hide debug':'Show debug'}</button>
          {debugOpen && (
            <div className="mt-2 text-xs rounded p-2 whitespace-pre-wrap border border-white/10 bg-black/10 dark:bg-white/5">
              <p>Accepted: {accepted.length}</p>
              <p>Sites: {[...sites.entries()].map(([k,v])=>`${k} x${v}`).join(', ')}</p>
              <p>Subreddits: {[...subs.entries()].map(([k,v])=>`${k} x${v}`).join(', ')}</p>
              <hr className="my-2" />
              <pre>{JSON.stringify(debugItems, null, 2)}</pre>
            </div>
          )}
        </div>
      )}
    </motion.section>
  )
}
