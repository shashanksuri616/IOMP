import React from 'react'
import ReactDOM from 'react-dom/client'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { AnimatePresence } from 'framer-motion'
import { Toaster } from 'sonner'
import { ThemeProvider } from '@/lib/theme'
import App from './App'
import './index.css'

const qc = new QueryClient()

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <QueryClientProvider client={qc}>
      <AnimatePresence mode="wait">
        <ThemeProvider>
          <Toaster position="top-right" richColors closeButton />
          <App />
        </ThemeProvider>
      </AnimatePresence>
    </QueryClientProvider>
  </React.StrictMode>
)
