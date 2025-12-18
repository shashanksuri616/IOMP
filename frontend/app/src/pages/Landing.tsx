import { useTheme } from '@/lib/theme'
import ThemeSwitcher from '@/components/ThemeSwitcher'
import PillNav from '@/components/PillNav'
import PillNavLight from '@/components/PillNavLight'
// Background now provided globally via Hyperspeed
import { StarButton } from '@/components/ui/StarButton'
import StockImage from '@/components/StockImage'
import { useNavigate } from 'react-router-dom'

export default function Landing() {
  const { theme } = useTheme()
  const navigate = useNavigate()

  return (
    <div id="home" className="relative min-h-screen overflow-hidden">
  {/* Global background is injected at App level (Hyperspeed) */}

      {/* Floating pill nav (React Bits) */}
      {theme === 'light' ? (
      <PillNavLight
        logo={"data:image/svg+xml;utf8,<?xml version='1.0' encoding='UTF-8'?><svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%23ffffff' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'><path d='M3 10.5L12 3l9 7.5'/><path d='M5 10v10h14V10'/><path d='M9 20V12h6v8'/></svg>"}
        logoAlt="Hype_RAG"
        logoHref="#home"
        items={[
          { label: 'Features', href: '#learn' },
          { label: 'HOW IT WORKS', href: '/docs' },
          { label: 'Try now', href: '/app', ariaLabel: 'Open Workbench' }
        ]}
        activeHref={undefined}
        baseColor="#ffffff"
        onMobileMenuClick={() => {}}
        initialLoadAnimation={true}
        className=""
      />) : (
      <PillNav
        logo={"data:image/svg+xml;utf8,<?xml version='1.0' encoding='UTF-8'?><svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%23000000' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'><path d='M3 10.5L12 3l9 7.5'/><path d='M5 10v10h14V10'/><path d='M9 20V12h6v8'/></svg>"}
        logoAlt="Hype_RAG"
        logoHref="#home"
        items={[
          { label: 'Features', href: '#learn' },
          { label: 'HOW IT WORKS', href: '/docs' },
          { label: 'Try now', href: '/app', ariaLabel: 'Open Workbench' }
        ]}
        activeHref={undefined}
        baseColor="rgba(255,255,255,0.18)"
        onMobileMenuClick={() => {}}
        initialLoadAnimation={true}
        className=""
      />)}

      {/* Theme switcher */}
      <div className="fixed top-4 right-4 z-40">
        <div className="rounded-lg border bg-white/80 backdrop-blur px-2 py-1 shadow-sm">
          <ThemeSwitcher />
        </div>
      </div>

      {/* Hero with punchline and CTAs */}
      <section className="relative min-h-screen flex items-center justify-center">
        <div className="text-center px-4">
          <h1 className={`text-6xl md:text-8xl font-black tracking-tight drop-shadow-sm select-none ${theme==='light' ? 'text-slate-900' : ''}`}>Hype_RAG</h1>
          <p className={`mt-4 text-lg md:text-xl max-w-2xl mx-auto ${theme==='light' ? 'text-slate-600' : 'text-gray-300'}`}>
            Ask once; get grounded, concise answers.
          </p>
          <div className="mt-8 flex items-center justify-center gap-3">
            <StarButton ariaLabel="Try now" tone="accent" size="lg" onClick={() => navigate('/app')}>Try now</StarButton>
            <StarButton ariaLabel="Learn more" tone="accent" size="lg" as="a" href="#learn">Learn more</StarButton>
          </div>
        </div>
      </section>

      {/* Content sections (image/text alternating) */}
      <section id="learn" className="container-narrow py-24 space-y-24">

        {/* 1. Local‑first retrieval */}
        <div className="grid md:grid-cols-2 gap-8 items-center">
          <div>
            <StockImage
              src="https://images.unsplash.com/photo-1517694712202-14dd9538aa97?q=80&w=1200&auto=format&fit=crop"
              alt="Printed documents and notebook on desk"
              className="w-full h-72"
              fallbackSrc="/images/docs-placeholder.svg"
            />
          </div>
          <div>
            <h3 className={`text-2xl font-semibold ${theme==='light' ? 'text-slate-900' : ''}`}>Local‑first retrieval</h3>
            <p className={`mt-3 leading-7 ${theme==='light' ? 'text-slate-700' : 'text-white/90'}`}>
              IOMP focuses on your documents, not the open web. Upload PDFs, TXT or CSV files and build a private,
              per‑user index with fast lookup. No external crawling or online aggregation is required—everything is
              grounded in the data you provide. Indexes persist so you can reopen the app and continue asking without
              rebuilding each time.
            </p>
            <p className={`mt-3 leading-7 ${theme==='light' ? 'text-slate-700' : 'text-white/80'}`}>
              Each user gets an isolated index name, and you can replace or delete indexes as needed. Source
              attributions are preserved so answers include provenance links/snippets. You control files entirely:
              nothing is fetched from the internet unless you explicitly add it.
            </p>
          </div>
        </div>

        {/* 2. Smart chunking + ranking */}
        <div className="grid md:grid-cols-2 gap-8 items-center">
          <div className="md:order-2">
            <StockImage
              src="https://images.unsplash.com/photo-1519389950473-47ba0277781c?q=80&w=1200&auto=format&fit=crop"
              alt="Charts and analytics visuals"
              className="w-full h-72"
            />
          </div>
          <div className="md:order-1">
            <h3 className={`text-2xl font-semibold ${theme==='light' ? 'text-slate-900' : ''}`}>Smart chunking and ranking</h3>
            <p className={`mt-3 leading-7 ${theme==='light' ? 'text-slate-700' : 'text-white/90'}`}>
              Documents are split with semantic‑aware strategies for cleaner context windows, then embedded and indexed
              for quick retrieval. For tougher queries, optional MMR and LLM reranking can be enabled to promote clearer
              chunks. The pipeline aims for deterministic behavior first, so answers stay consistent and grounded.
            </p>
            <p className={`mt-3 leading-7 ${theme==='light' ? 'text-slate-700' : 'text-white/80'}`}>
              Embeddings can be provided by local models or lightweight libraries; FAISS is used for fast vector
              search with persistence on disk. Fallbacks keep the system responsive even on constrained machines.
            </p>
          </div>
        </div>

        {/* 3. Fast build + ask loop */}
        <div className="grid md:grid-cols-2 gap-8 items-center">
          <div>
            <StockImage
              src="https://images.unsplash.com/photo-1498050108023-c5249f4df085?q=80&w=1200&auto=format&fit=crop"
              alt="Hands working on laptop with code"
              className="w-full h-72"
            />
          </div>
          <div>
            <h3 className={`text-2xl font-semibold ${theme==='light' ? 'text-slate-900' : ''}`}>Fast build and ask</h3>
            <p className={`mt-3 leading-7 ${theme==='light' ? 'text-slate-700' : 'text-white/90'}`}>
              Drag‑and‑drop documents, hit “Build Index”, then ask. Health and Config buttons help validate the backend,
              and answers return with source snippets so you can inspect exactly where content came from. Status updates
              show how many docs were ingested and how many chunks were created.
            </p>
            <p className={`mt-3 leading-7 ${theme==='light' ? 'text-slate-700' : 'text-white/80'}`}>
              Queries support adjustable top‑k retrieval, and responses are concise by default. If you need more detail,
              you can ask follow‑ups to narrow focus or expand scope without rebuilding your index.
            </p>
          </div>
        </div>

        {/* 4. Clean Workbench experience */}
        <div className="grid md:grid-cols-2 gap-8 items-center">
          <div className="md:order-2">
            <StockImage
              src="https://images.unsplash.com/photo-1515879218367-8466d910aaa4?q=80&w=1200&auto=format&fit=crop"
              alt="Clean workbench interface"
              className="w-full h-72"
            />
          </div>
          <div className="md:order-1">
            <h3 className={`text-2xl font-semibold ${theme==='light' ? 'text-slate-900' : ''}`}>Clean Workbench experience</h3>
            <p className={`mt-3 leading-7 ${theme==='light' ? 'text-slate-700' : 'text-white/90'}`}>
              A theme‑aware UI with clear controls: a prominent upload button, health/config checks, and a simple ask
              panel. The nav stays translucent, and a floating home button appears on scroll for quick navigation. A
              Docs page can display your project PDF directly in the app.
            </p>
            <p className={`mt-3 leading-7 ${theme==='light' ? 'text-slate-700' : 'text-white/80'}`}>
              Dark is the default theme, and you can toggle to light at any time. Backgrounds and accents adjust
              automatically so content remains readable and the UI feels consistent across sections.
            </p>
          </div>
        </div>

        {/* 5. Evaluation + reproducibility */}
        <div className="grid md:grid-cols-2 gap-8 items-center">
          <div>
            <StockImage
              src="https://images.unsplash.com/photo-1529107386315-e1a2ed48a620?q=80&w=1200&auto=format&fit=crop"
              alt="Whiteboard with charts and planning"
              className="w-full h-72"
            />
          </div>
          <div>
            <h3 className={`text-2xl font-semibold ${theme==='light' ? 'text-slate-900' : ''}`}>Evaluation and reproducibility</h3>
            <p className={`mt-3 leading-7 ${theme==='light' ? 'text-slate-700' : 'text-white/90'}`}>
              The repo includes evaluation notebooks and datasets to benchmark retrieval quality. Environment settings
              and per‑user IDs keep runs consistent, and indexes can be persisted for repeatable testing. Configure API
              bases and embeddings in one place and verify with quick curl commands or the Upload panel.
            </p>
            <p className={`mt-3 leading-7 ${theme==='light' ? 'text-slate-700' : 'text-white/80'}`}>
              You can compare different chunking strategies, embedding providers, and reranking toggles, then export
              results. The goal is to keep workflows measurable and easy to reproduce between machines.
            </p>
          </div>
        </div>

        {/* 6. Security & privacy */}
        <div className="grid md:grid-cols-2 gap-8 items-center">
          <div className="md:order-2">
            <StockImage
              src="https://images.unsplash.com/photo-1556157382-97eda2d62296?q=80&w=1200&auto=format&fit=crop"
              alt="Security and privacy"
              className="w-full h-72"
            />
          </div>
          <div className="md:order-1">
            <h3 className={`text-2xl font-semibold ${theme==='light' ? 'text-slate-900' : ''}`}>Security and privacy</h3>
            <p className={`mt-3 leading-7 ${theme==='light' ? 'text-slate-700' : 'text-white/90'}`}>
              Indices are per‑user and local to your environment. Uploaded files remain on your machine, and no remote
              queries are made unless you explicitly enable them. This keeps sensitive documents within your control
              while still offering fast, helpful answers.
            </p>
          </div>
        </div>

        {/* 7. Performance & persistence */}
        <div className="grid md:grid-cols-2 gap-8 items-center">
          <div>
            <StockImage
              src="https://images.unsplash.com/photo-1518770660439-4636190af475?q=80&w=1200&auto=format&fit=crop"
              alt="Server racks representing performance"
              className="w-full h-72"
            />
          </div>
          <div>
            <h3 className={`text-2xl font-semibold ${theme==='light' ? 'text-slate-900' : ''}`}>Performance and persistence</h3>
            <p className={`mt-3 leading-7 ${theme==='light' ? 'text-slate-700' : 'text-white/90'}`}>
              The system is optimized for quick builds and low‑memory retrieval. Vector indexes are stored on disk so the
              app restarts quickly with the same context. Optional settings let you tune memory usage and ranking without
              sacrificing responsiveness.
            </p>
          </div>
        </div>
      </section>

      {/* Docs now lives as a separate page at /docs */}
    </div>
  )
}
