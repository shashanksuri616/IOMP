import { create } from 'zustand'

type State = {
  apiBase: string
  indexName: string | null
  mode: 'mongo' | 'faiss' | null
  lastDebug: any[]
}

type Actions = {
  setApiBase: (b: string) => void
  setIndexName: (n: string | null) => void
  setMode: (m: State['mode']) => void
  setLastDebug: (d: any[]) => void
}

export const useStore = create<State & Actions>((set: any) => ({
  // Use env in all cases; only fall back to localhost during Vite dev
  apiBase: (typeof import.meta !== 'undefined' && (import.meta as any).env?.VITE_API_BASE !== undefined)
    ? (import.meta as any).env.VITE_API_BASE
    : (typeof import.meta !== 'undefined' && (import.meta as any).env?.DEV ? 'http://localhost:8000' : ''),
  indexName: null,
  mode: null,
  lastDebug: [],
  setApiBase: (b: string) => set({ apiBase: b }),
  setIndexName: (n: string | null) => set({ indexName: n }),
  setMode: (m: State['mode']) => set({ mode: m }),
  setLastDebug: (d: any[]) => set({ lastDebug: d }),
}))
