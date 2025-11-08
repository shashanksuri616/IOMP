import { useQuery } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { motion } from 'framer-motion'
import { Database, Rocket } from 'lucide-react'
import ThemeSwitcher from '@/components/ThemeSwitcher'
import { TargetCursor } from '@/components/effects/TargetCursor'

export default function Header() {
  const { data } = useQuery({ queryKey: ['config'], queryFn: api.config })
  const mode = data?.use_mongo_vector ? 'Mongo' : 'FAISS'
  return (
    <motion.header initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} className="sticky top-0 z-20 backdrop-blur supports-[backdrop-filter]:bg-white/80 bg-white/90 border-b">
      <TargetCursor />
      <div className="container-narrow h-16 flex items-center justify-between">
        <div className="flex items-center gap-3 min-w-0">
          <Rocket className="h-6 w-6 text-indigo-600 shrink-0" />
          <div className="truncate">
            <div className="flex items-center gap-2 truncate">
              <span className="font-semibold text-lg tracking-tight truncate">HyPE RAG</span>
              <span className="text-[11px] px-2 py-0.5 rounded-full border bg-gray-50 whitespace-nowrap">{mode} mode</span>
            </div>
            <div className="text-[11px] text-gray-600 truncate">
              {data ? (
                <>
                  {data.active_index_name ? `active: ${data.active_index_name}` : 'no active index'}
                </>
              ) : (
                <span className="skeleton inline-block h-3 w-40" />
              )}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="hidden sm:flex items-center gap-2 text-xs text-gray-600">
            <Database className="h-4 w-4" />
            <span>{data?.mongo_db || 'local'}</span>
          </div>
          <ThemeSwitcher />
        </div>
      </div>
    </motion.header>
  )
}
