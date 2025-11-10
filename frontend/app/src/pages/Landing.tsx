import { useTheme } from '@/lib/theme'
import ThemeSwitcher from '@/components/ThemeSwitcher'
import PillNav from '@/components/PillNav'
import PillNavLight from '@/components/PillNavLight'
// Background now provided globally via Hyperspeed
import { StarButton } from '@/components/ui/StarButton'
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
          { label: 'How it works', href: '#learn' },
          { label: 'Docs', href: '#docs' },
          { label: 'Try now', href: '/app', ariaLabel: 'Open Workbench' }
        ]}
        activeHref={undefined}
        baseColor="#ffffff"
        pillColor="#ffffff"
        hoveredPillTextColor="#1e293b"
        pillTextColor="#0f172a"
        onMobileMenuClick={() => {}}
        initialLoadAnimation={true}
        className=""
      />) : (
      <PillNav
        logo={"data:image/svg+xml;utf8,<?xml version='1.0' encoding='UTF-8'?><svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%23ffffff' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'><path d='M3 10.5L12 3l9 7.5'/><path d='M5 10v10h14V10'/><path d='M9 20V12h6v8'/></svg>"}
        logoAlt="Hype_RAG"
        logoHref="#home"
        items={[
          { label: 'How it works', href: '#learn' },
          { label: 'Docs', href: '#docs' },
          { label: 'Try now', href: '/app', ariaLabel: 'Open Workbench' }
        ]}
        activeHref={undefined}
        baseColor="rgba(255,255,255,0.18)"
        pillColor="#ffffff"
        hoveredPillTextColor="#060010"
        pillTextColor="#060010"
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
            RAG ’n’ roll—ask once, get rock‑solid answers.
          </p>
          <div className="mt-8 flex items-center justify-center gap-3">
            <StarButton ariaLabel="Try now" tone="accent" size="lg" onClick={() => navigate('/app')}>Try now</StarButton>
            <StarButton ariaLabel="Learn more" tone="neutral" as="a" href="#learn">Learn more</StarButton>
          </div>
        </div>
      </section>

      {/* Content sections (image/text alternating) */}
      <section id="learn" className="container-narrow py-24 space-y-24">

        {/* 1. Reddit‑centric retrieval */}
        <div className="grid md:grid-cols-2 gap-8 items-center">
          <div>
            <img
              src="https://images.unsplash.com/photo-1515879218367-8466d910aaa4?q=80&w=1200&auto=format&fit=crop"
              alt="Threads and conversations"
              className="w-full h-72 object-cover rounded-xl border shadow-sm"
              loading="lazy"
            />
          </div>
          <div>
            <h3 className={`text-2xl font-semibold ${theme==='light' ? 'text-slate-900' : ''}`}>Reddit‑centric retrieval</h3>
            <p className={`mt-3 leading-7 ${theme==='light' ? 'text-slate-700' : 'text-white/90'}`}>
              Hype_RAG is tuned to where the most useful real‑world answers often live: Reddit. You can aggregate
              content from multiple subreddits, boost relevance with topic‑aware ranking, and merge forum signals
              without polluting results with GitHub by default. The goal is to surface grounded, practical knowledge
              shaped by practitioners—not just boilerplate docs. We dedupe aggressively, track distinct sources per
              domain, and respect your limits for how much each site can contribute. Whether you’re researching a
              framework quirk, a tuning trick, or a deployment gotcha, Reddit‑first retrieval keeps answers current
              and opinionated in the right way. It’s built to be robust under noisy threads, variable quality, and
              shifting trends, so you get crisp results without manual curating.
            </p>
          </div>
        </div>

        {/* 2. Smart fusion + reranking */}
        <div className="grid md:grid-cols-2 gap-8 items-center">
          <div className="md:order-2">
            <img
              src="https://images.unsplash.com/photo-1518779578993-ec3579fee39f?q=80&w=1200&auto=format&fit=crop"
              alt="Signals blending"
              className="w-full h-72 object-cover rounded-xl border shadow-sm"
              loading="lazy"
            />
          </div>
          <div className="md:order-1">
            <h3 className={`text-2xl font-semibold ${theme==='light' ? 'text-slate-900' : ''}`}>Smart fusion and reranking</h3>
            <p className={`mt-3 leading-7 ${theme==='light' ? 'text-slate-700' : 'text-white/90'}`}>
              We combine diverse retrieval signals using fusion techniques, then apply reranking to elevate the most
              contextually relevant chunks for your query. Instead of trusting a single embedding pass, Hype_RAG blends
              lexical and semantic evidence, balances recency with authority, and prevents a single domain from
              dominating answers. The reranker rewards clarity and coverage, not just keyword overlap, which reduces
              hallucinations and tangents. The pipeline is designed for transparency: you can inspect where each answer
              came from, why it scored, and which alternatives got trimmed. It’s retrieval that feels fair and fast—
              built to help you ask better follow‑ups and converge on the answer, not hunt through long link lists.
            </p>
          </div>
        </div>

        {/* 3. Upload or Web build */}
        <div className="grid md:grid-cols-2 gap-8 items-center">
          <div>
            <img
              src="https://images.unsplash.com/photo-1488590528505-98d2b5aba04b?q=80&w=1200&auto=format&fit=crop"
              alt="Documents and web content"
              className="w-full h-72 object-cover rounded-xl border shadow-sm"
              loading="lazy"
            />
          </div>
          <div>
            <h3 className={`text-2xl font-semibold ${theme==='light' ? 'text-slate-900' : ''}`}>Upload documents or build from the web</h3>
            <p className={`mt-3 leading-7 ${theme==='light' ? 'text-slate-700' : 'text-white/90'}`}>
              Bring your own documents—PDFs, text, CSVs—or point Hype_RAG at curated web sources to assemble a research
              set on the fly. We chunk intelligently, capture structure where it matters, and maintain links back to
              original material so you can audit any claim. Settings like per‑domain limits and minimum distinct
              sources keep results balanced. You can switch contexts quickly: build a new set, ask a few questions,
              and iterate as your focus evolves. It’s ideal for technical comparisons, upgrade planning, or learning a
              new tool where a mix of docs and lived experience creates the clearest picture.
            </p>
          </div>
        </div>

        {/* 4. Beautiful interactions */}
        <div className="grid md:grid-cols-2 gap-8 items-center">
          <div className="md:order-2">
            <img
              src="https://images.unsplash.com/photo-1515879218367-8466d910aaa4?q=80&w=1200&auto=format&fit=crop"
              alt="Polished UI"
              className="w-full h-72 object-cover rounded-xl border shadow-sm"
              loading="lazy"
            />
          </div>
          <div className="md:order-1">
            <h3 className={`text-2xl font-semibold ${theme==='light' ? 'text-slate-900' : ''}`}>Beautiful, fast interactions</h3>
            <p className={`mt-3 leading-7 ${theme==='light' ? 'text-slate-700' : 'text-white/90'}`}>
              The interface leans into subtle motion and theme‑aware accents so the product feels premium without being
              distracting. React Bits‑style effects give depth, while practical components—buttons, inputs, switches—
              keep flow efficient. You’ll notice the small things: responsive spacing, snappy feedback, consistent
              semantics, and layouts that adapt from quick checks to deep sessions. Dark and Sapphire themes are first‑
              class, and the landing intentionally gives the hero room to breathe so your attention goes to the brand
              and purpose first. It’s a modern app that doesn’t fight you: clarity over clutter, and speed over spectacle.
            </p>
          </div>
        </div>
      </section>

      <footer id="docs" className="container-narrow py-10 text-sm text-gray-500">
        <p>Docs are coming soon. For now, explore the Workbench.</p>
      </footer>
    </div>
  )
}
