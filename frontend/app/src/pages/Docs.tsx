import { useTheme } from '@/lib/theme'
import PillNav from '@/components/PillNav'
import ThemeSwitcher from '@/components/ThemeSwitcher'
import PixelCard from '@/components/PixelCard'
import Stepper, { Step } from '@/components/Stepper'
import ScrollStack, { ScrollStackItem } from '@/components/ScrollStack'
import MagicBento from '@/components/MagicBento'

export default function Docs() {
    const { theme } = useTheme()
    const apiBase = (import.meta as any).env?.VITE_API_BASE || 'http://localhost:8000'
    const pdfUrl = (import.meta as any).env?.VITE_DOC_URL || '/IOMP_Report_Final.pdf'

    return (
    <div className="relative min-h-screen overflow-hidden">
        {/* Theme toggle for Docs, sticky on scroll */}
        <div className="fixed top-3 right-3 z-40">
        <ThemeSwitcher />
        </div>
        {/* Navbar consistent with app */}
        <PillNav
        logo={"data:image/svg+xml;utf8,<?xml version='1.0' encoding='UTF-8'?><svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%23000000' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'><path d='M3 10.5L12 3l9 7.5'/><path d='M5 10v10h14V10'/><path d='M9 20V12h6v8'/></svg>"}
        logoAlt="Home"
        logoHref="/"
        items={[
            { label: 'Features', href: '/#learn' },
            { label: 'HOW IT WORKS', href: '/docs' },
            { label: 'Try now', href: '/app', ariaLabel: 'Open Workbench' }
        ]}
        activeHref={'/docs'}
        baseColor={theme==='light' ? 'rgba(0,0,0,0.18)' : 'rgba(255,255,255,0.18)'}
        pillColor={theme==='light' ? '#000000' : '#ffffff'}
        hoveredPillTextColor={theme==='light' ? '#ffffff' : '#000000'}
        pillTextColor={theme==='light' ? '#ffffff' : '#000000'}
        onMobileMenuClick={() => {}}
        initialLoadAnimation={true}
        homeFabScrollToTop={true}
        />

        <main>
        {/* Hero: only thing visible on first view */}
        <section className="relative min-h-screen flex items-center justify-center px-6">
            <div className="text-center">
            <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight">
                Here’s how we did it
            </h1>
            <p className="mt-4 text-sm md:text-base opacity-80 max-w-2xl mx-auto">
                Architecture, data flow, and the little tricks that made it feel fast.
            </p>
            <div className="mt-10">
                <a href="#details" className="inline-flex items-center gap-2 px-5 py-2 rounded-full border border-current opacity-80 hover:opacity-100 transition">
                <span>See the details</span>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <path d="M12 5v14M19 12l-7 7-7-7"/>
                </svg>
                </a>
            </div>
            </div>
        </section>

        {/* Details anchor (no duplicate heading) */}
        <section id="details" className="h-0" aria-hidden="true" />

        {/* Architecture overview timeline using PixelCard */}
        <section className="mb-10 max-w-5xl mx-auto px-6">
            <h2 className={`text-xl md:text-2xl font-bold mb-6 ${theme==='light' ? 'text-slate-900' : ''}`}>Architecture Overview</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 justify-items-center">
            {[
                { label: 'User', title: 'Question / Upload' },
                { label: 'Frontend', title: 'Vite + React' },
                { label: 'Backend', title: 'FastAPI' },
                { label: 'Vector Store', title: 'FAISS' },
                { label: 'Retriever', title: 'Top‑K + MMR' },
                { label: 'Generator', title: 'LLM + Citations' }
            ].map((item, i) => (
                <PixelCard key={i} variant={theme==='light' ? 'default' : 'blue'} className="pixel-small" gap={theme==='light' ? 5 : 10} speed={theme==='light' ? 35 : 25} colors={theme==='light' ? '#f8fafc,#f1f5f9,#cbd5e1' : '#e0f2fe,#7dd3fc,#0ea5e9'} noFocus={false}>
                <div className="relative z-10 w-full h-full flex items-center justify-center p-4">
                    <div className="text-center w-full">
                    <div className={`mx-auto max-w-[85%] rounded-xl border ${theme==='light'?'bg-white/95 border-black/10':'bg-black/40 border-white/20'} px-4 py-3 shadow-sm`}
                    >
                        <div className={`${theme==='light'?'text-slate-700':'text-white/80'} text-base md:text-lg mb-1`}>{item.label}</div>
                        <div className={`${theme==='light'?'text-slate-900':'text-white'} text-xl md:text-2xl font-bold`}>{item.title}</div>
                    </div>
                    </div>
                </div>
                </PixelCard>
            ))}
            </div>
        </section>

        {/* Ingestion details */}
        <section className="space-y-2 mb-8 max-w-4xl mx-auto px-6">
            <h2 className={`text-xl font-semibold ${theme==='light' ? 'text-slate-900' : ''}`}>Ingestion — making documents queryable</h2>
            <ul className={`list-disc pl-5 ${theme==='light' ? 'text-slate-700' : 'text-white/80'}`}>
            <li>Parse PDFs/TXT/CSV and normalize text.</li>
            <li>Chunk with semantic‑aware splitters to keep context coherent.</li>
            <li>Embed chunks and persist a FAISS index on disk per user.</li>
            </ul>
            <div className="mt-4">
            <Stepper initialStep={1} disableStepIndicators={false} nextButtonText="Next" renderStepIndicator={undefined}>
                <Step>
                <div className="p-5 rounded-md border text-base md:text-lg font-medium">Upload → PDF / Text / CSV</div>
                </Step>
                <Step>
                <div className="p-5 rounded-md border text-base md:text-lg font-medium">Parse → Extract text + metadata</div>
                </Step>
                <Step>
                <div className="p-5 rounded-md border text-base md:text-lg font-medium">Chunk → Semantic splitter w/ overlap</div>
                </Step>
                <Step>
                <div className="p-5 rounded-md border text-base md:text-lg font-medium">Embed → Provider (OpenAI/HF/etc)</div>
                </Step>
                <Step>
                <div className="p-5 rounded-md border text-base md:text-lg font-medium">Index → Persisted FAISS on disk</div>
                </Step>
            </Stepper>
            </div>
        </section>

        <section className="space-y-2 mb-8 max-w-4xl mx-auto px-6">
            <h2 className={`text-xl font-semibold ${theme==='light' ? 'text-slate-900' : ''}`}>Retrieval & ranking — picking the best context</h2>
            <div className={`${theme==='light' ? 'text-slate-700' : 'text-white/80'}`}>
            <ul className="list-disc pl-5 mt-2">
                <li>Vector search retrieves top‑K candidates efficiently.</li>
                <li>Optional MMR balances relevance and diversity.</li>
                <li>Optional LLM reranking promotes clarity when queries are tricky.</li>
            </ul>
            </div>
            <div className="mt-4">
            <Stepper initialStep={1} disableStepIndicators={false} nextButtonText="Next" renderStepIndicator={undefined}>
                <Step>
                <div className="p-5 rounded-md border text-base md:text-lg font-medium">Query → User intent + constraints</div>
                </Step>
                <Step>
                <div className="p-5 rounded-md border text-base md:text-lg font-medium">Search → KNN on FAISS</div>
                </Step>
                <Step>
                <div className="p-5 rounded-md border text-base md:text-lg font-medium">Refine → Optional MMR / LLM rerank</div>
                </Step>
                <Step>
                <div className="p-5 rounded-md border text-base md:text-lg font-medium">Assemble → Context window w/ citations</div>
                </Step>
                <Step>
                <div className="p-5 rounded-md border text-base md:text-lg font-medium">Generate → LLM answers grounded to sources</div>
                </Step>
            </Stepper>
            </div>
        </section>

        <section className="space-y-2 mb-12 max-w-4xl mx-auto px-6">
            <h2 className={`text-xl font-semibold ${theme==='light' ? 'text-slate-900' : ''}`}>Lessons learned</h2>
            <ul className={`list-disc pl-5 ${theme==='light' ? 'text-slate-700' : 'text-white/80'}`}>
            <li>Semantic chunking improves answer stability versus fixed windows.</li>
            <li>Persisted FAISS indexes make restarts fast and reproducible.</li>
            <li>MMR helps reduce redundancy; LLM rerank is best used selectively.</li>
            </ul>
        </section>

        {/* Roadmap with ScrollStack */}
        <section className="mb-8 max-w-4xl mx-auto px-6">
            <h2 className={`text-xl md:text-2xl font-bold mb-4 ${theme==='light' ? 'text-slate-900' : ''}`}>Roadmap</h2>
            <ScrollStack useWindowScroll={true} itemDistance={70} itemStackDistance={16} baseScale={0.96} scaleEndPosition={'18%'} stackPosition={'28%'} onStackComplete={undefined}>
            <ScrollStackItem>
                <div className={`p-7 rounded-xl border shadow-sm ${theme==='light' ? 'bg-amber-50 border-amber-200 text-amber-900' : 'bg-amber-500/10 border-amber-400/30 text-amber-200'}`}>
                <div className="font-semibold mb-1">Setup</div>
                <div className="text-base md:text-lg opacity-80">Env vars + providers + local dev</div>
                </div>
            </ScrollStackItem>
            <ScrollStackItem>
                <div className={`p-7 rounded-xl border shadow-sm ${theme==='light' ? 'bg-sky-50 border-sky-200 text-sky-900' : 'bg-sky-500/10 border-sky-400/30 text-sky-200'}`}>
                <div className="font-semibold mb-1">Ingestion</div>
                <div className="text-base md:text-lg opacity-80">Parsing, chunking, embedding, indexing</div>
                </div>
            </ScrollStackItem>
            <ScrollStackItem>
                <div className={`p-7 rounded-xl border shadow-sm ${theme==='light' ? 'bg-violet-50 border-violet-200 text-violet-900' : 'bg-violet-500/10 border-violet-400/30 text-violet-200'}`}>
                <div className="font-semibold mb-1">Retrieval</div>
                <div className="text-base md:text-lg opacity-80">Top‑K, MMR, rerank</div>
                </div>
            </ScrollStackItem>
            <ScrollStackItem>
                <div className={`p-7 rounded-xl border shadow-sm ${theme==='light' ? 'bg-emerald-50 border-emerald-200 text-emerald-900' : 'bg-emerald-500/10 border-emerald-400/30 text-emerald-200'}`}>
                <div className="font-semibold mb-1">Generation</div>
                <div className="text-base md:text-lg opacity-80">Grounded answers with citations</div>
                </div>
            </ScrollStackItem>
            <div className="scroll-stack-end h-6" />
            </ScrollStack>
        </section>

        {/* Components grid with MagicBento */}
        <section className="mb-8 max-w-5xl mx-auto px-6">
            <h2 className={`text-xl md:text-2xl font-bold mb-4 ${theme==='light' ? 'text-slate-900' : ''}`}>System Components</h2>
            <MagicBento />
        </section>

        <section className="space-y-2 mb-8 max-w-4xl mx-auto px-6">
            <h2 className={`text-xl font-semibold ${theme==='light' ? 'text-slate-900' : ''}`}>API & configuration</h2>
            <div className={`${theme==='light' ? 'text-slate-700' : 'text-white/80'}`}>
            <p>Base: <code>VITE_API_BASE</code> (dev fallback: <code>http://localhost:8000</code>)</p>
            <ul className="list-disc pl-5 mt-2">
                <li><code>GET /health</code>, <code>GET /config</code>, <code>GET /status</code></li>
                <li><code>POST /upload</code> — form‑data: <code>files[]</code>, <code>user_id</code></li>
                <li><code>POST /ask</code> — JSON: <code>{`{ question, k, user_id }`}</code></li>
            </ul>
            <h3 className="text-lg font-semibold mt-4">Curl examples</h3>
            <pre className="p-3 rounded-md border overflow-auto"><code>{`# Health\ncurl -s ${apiBase}/health\n\n# Config\ncurl -s ${apiBase}/config\n\n# Upload\ncurl -s -X POST -F "user_id=local" -F "files=@your.pdf" ${apiBase}/upload\n\n# Ask\ncurl -s -X POST -H "Content-Type: application/json" \\\n  -d '{"question":"What is in the report?","k":5,"user_id":"local"}' \\\n  ${apiBase}/ask`}</code></pre>
            </div>
        </section>

        <section className="space-y-2 mb-8 max-w-4xl mx-auto px-6">
            <h2 className={`text-xl font-semibold ${theme==='light' ? 'text-slate-900' : ''}`}>Resources</h2>
            <div className="flex gap-2">
            <a href={pdfUrl} target="_blank" rel="noreferrer" className="underline">Open Project Report (PDF)</a>
            </div>
        </section>
        </main>
    </div>
    )
}

