import { z } from 'zod'

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:8000'

export const schemas = {
  config: z.object({
    use_mongo_vector: z.boolean().optional(),
    mongo_db: z.string().nullable().optional(),
    mongo_vcoll: z.string().nullable().optional(),
    mongo_search_stage: z.string().nullable().optional(),
    active_index_name: z.string().nullable().optional(),
  }),
  webBuildResp: z.object({
    status: z.string(),
    documents: z.number(),
    chunks: z.number(),
    index_name: z.string(),
    collection: z.string().optional(),
    mongo_stats: z.object({ backend: z.string(), attempted: z.number(), inserted: z.number() }).optional(),
    debug: z.array(z.any()).optional(),
  }),
  askResp: z.object({
    answer: z.string().default(''),
    sources: z.array(z.any()).default([]),
  })
}

async function req<T>(path: string, init?: RequestInit) {
  const res = await fetch(`${API_BASE}${path}`, init)
  const data = await res.json().catch(() => ({}))
  if (!res.ok) throw data
  return data as T
}

export const api = {
  config: () => req(`/config`).then(d => schemas.config.parse(d)),
  webBuild: (body: any) => req(`/web_build`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
    .then(d => schemas.webBuildResp.parse(d)),
  webBuildUrls: (body: any) => req(`/web_build_urls`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
    .then(d => schemas.webBuildResp.parse(d)),
  ask: (question: string, k: number) => req(`/ask`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ question, k }) })
    .then(d => schemas.askResp.parse(d)),
  upload: (files: File[]) => {
    const fd = new FormData()
    files.forEach(f => fd.append('files', f))
    return req(`/upload`, { method: 'POST', body: fd })
  }
}

export const safeDefaults = {
  reddit_only: false,
  include_forums: true,
  include_github_forums: false,
  min_distinct_sources: 5,
  per_domain_limit: 3,
  english_worldwide: true,
  strict_en_only: true,
  min_keyword_hits: 2,
  min_keyword_ratio: 0.25,
  debug: true,
}
