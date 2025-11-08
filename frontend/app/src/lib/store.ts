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

export const useStore = create<State & Actions>((set) => ({
  apiBase: import.meta.env?.VITE_API_BASE || 'http://localhost:8000',
  indexName: null,
  mode: null,
  lastDebug: [],
  setApiBase: (b) => set({ apiBase: b }),
  setIndexName: (n) => set({ indexName: n }),
  setMode: (m) => set({ mode: m }),
  setLastDebug: (d) => set({ lastDebug: d }),
}))
