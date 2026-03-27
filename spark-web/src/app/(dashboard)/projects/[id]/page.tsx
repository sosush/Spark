'use client'
import { useEffect, useState, use } from 'react'
import { createClient } from '@/utils/supabase/client'
import { 
  ArrowLeft, Code2, Globe, Brain, 
  Loader2, RefreshCw, Save, Check, FileCode 
} from 'lucide-react'
import SparkLogo from '@/components/SparkLogo'
import Link from 'next/link'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import rehypeRaw from 'rehype-raw'
import { motion } from 'framer-motion'
import { useToast } from '@/components/Toast'

export default function ProjectDeepDive({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const supabase = createClient()
  const { toast } = useToast()
  
  const [p, setP] = useState<any>(null)
  const [loadingAi, setLoadingAi] = useState<string | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [editMode, setEditMode] = useState(false)

  useEffect(() => {
    async function load() {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) return

      const { data } = await supabase.from('projects')
        .select('*')
        .eq('id', id)
        .eq('user_id', session.user.id) // SECURITY FIX: Isolation
        .single()
      setP(data)
    }
    load()
  }, [id, supabase])

  const saveChanges = async () => {
    setIsSaving(true)
    const { error } = await supabase.from('projects').update({
      name: p.name,
      readme: p.readme
    }).eq('id', id)
    
    if (!error) {
      setIsSaving(false)
      setEditMode(false)
    }
  }

  const askAI = async (task: 'improve' | 'readme') => {
    setLoadingAi(task)
    try {
      const res = await fetch(`http://localhost:8000/${task}/${id}`)
      const data = await res.json()
      const field = task === 'improve' ? 'ai_report' : 'readme'
      // Automatically sync AI results to DB
      await supabase.from('projects').update({ [field]: data.result }).eq('id', id)
      setP({ ...p, [field]: data.result })
    } catch (e) { toast('AI Brain is offline. Start the backend server.', 'error') }
    setLoadingAi(null)
  }

  if (!p) return <div className="h-screen flex items-center justify-center font-mono text-indigo-500 animate-pulse uppercase tracking-[1em]">decrypting_manifest...</div>

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="max-w-[1200px] mx-auto py-12 px-6 space-y-12 pb-40">
      
      {/* 1. TOP NAVIGATION & GLOBAL ACTIONS */}
      <div className="flex justify-between items-center">
      <Link href="/projects" className="inline-flex items-center gap-2 text-zinc-400 hover:text-indigo-400 transition text-sm font-medium group">
          <ArrowLeft size={14} className="group-hover:-translate-x-1 transition-transform"/> Back to Projects
        </Link>
        
        <div className="flex gap-3">
            <button 
              onClick={() => setEditMode(!editMode)} 
              className={`px-6 py-3 rounded-full font-medium text-sm transition-all ${editMode ? 'bg-indigo-500/20 border border-indigo-500/30 text-indigo-300' : 'bg-white/5 text-zinc-400 border border-white/10 hover:bg-white/10'}`}
            >
              {editMode ? 'Preview' : 'Edit Document'}
            </button>
            <button 
              onClick={saveChanges} 
              disabled={isSaving}
              className="px-6 py-3 bg-white/5 hover:bg-white/10 border border-white/10 text-white rounded-full font-medium text-sm flex items-center gap-2 transition-all disabled:opacity-50"
            >
              {isSaving ? <Loader2 size={14} className="animate-spin text-indigo-400"/> : <Save size={14} className="text-zinc-400"/>} Save
            </button>
        </div>
      </div>

      {/* 2. HEADER: EDITABLE TITLE & DOMAINS */}
      <header className="space-y-6">
        {editMode ? (
          <input 
            value={p.name} 
            onChange={(e) => setP({...p, name: e.target.value})}
            className="text-5xl md:text-6xl font-medium tracking-tight text-white bg-white/5 border border-white/10 rounded-2xl outline-none w-full p-4"
          />
        ) : (
          <h1 className="text-5xl md:text-6xl font-medium tracking-tight text-white smooth-text break-words">
            {p.name}
          </h1>
        )}

        <div className="flex flex-wrap gap-2 pt-2">
            {p.domains?.map((d: string) => (
                <span key={d} className="px-4 py-1.5 bg-white/5 border border-white/10 rounded-full text-xs font-medium text-zinc-300 backdrop-blur-md">
                    {d}
                </span>
            ))}
            {(!p.domains || p.domains.length === 0) && <span className="text-xs text-zinc-500 font-light">No domains assigned</span>}
        </div>

        <div className="flex gap-4 pt-4">
            <a href={p.github_link} target="_blank" className="flex items-center gap-2 text-sm text-indigo-400 hover:text-white transition-colors font-medium"><Code2 size={16}/> Repository</a>
            {p.hosted_url && <a href={p.hosted_url} target="_blank" className="flex items-center gap-2 text-sm text-emerald-400 hover:text-white transition-colors font-medium"><Globe size={16}/> Live Site</a>}
        </div>
      </header>

      {/* 3. MAIN DOCUMENTATION (Full Width) */}
      <section className="space-y-6">
        <div className="flex items-center gap-3 text-sm font-medium text-zinc-400">
            <FileCode size={16}/> Project Documentation
        </div>
        
        <div className="ethereal-island overflow-hidden min-h-[400px]">
            {editMode ? (
                <textarea 
                  value={p.readme || ''}
                  onChange={(e) => setP({...p, readme: e.target.value})}
                  className="w-full h-[600px] bg-transparent p-12 text-sm text-zinc-300 outline-none transition-all resize-none leading-relaxed"
                  placeholder="Paste Markdown content here..."
                />
            ) : (
                <div className="p-12 md:p-16">
                    <article className="prose prose-invert prose-indigo max-w-none 
                        prose-p:text-zinc-400 prose-p:text-base prose-p:leading-relaxed prose-p:font-light
                        prose-headings:text-white prose-headings:font-medium prose-headings:tracking-tight
                        prose-pre:bg-black/40 prose-pre:p-8 prose-pre:rounded-2xl prose-pre:border prose-pre:border-white/5
                        prose-code:text-indigo-400 prose-img:rounded-2xl prose-table:border-white/5
                        prose-strong:text-white prose-strong:font-semibold">
                        <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeRaw]}>
                            {p.readme || "_No documentation provided._"}
                        </ReactMarkdown>
                    </article>
                </div>
            )}
        </div>
      </section>

      {/* 4. AI ACTION CONTROLS */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <button onClick={() => askAI('readme')} disabled={!!loadingAi} className="py-5 px-8 bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 rounded-full font-medium text-sm flex items-center justify-center gap-3 hover:bg-indigo-500/20 transition-all active:scale-[0.98] disabled:opacity-50 backdrop-blur-md">
            {loadingAi === 'readme' ? <RefreshCw className="animate-spin" size={16}/> : <Brain size={18}/>} 
            AI Rewrite Documentation
        </button>
        <button onClick={() => askAI('improve')} disabled={!!loadingAi} className="py-5 px-8 bg-white/5 border border-white/10 text-white rounded-full font-medium text-sm flex items-center justify-center gap-3 hover:bg-white/10 transition-all active:scale-[0.98] disabled:opacity-50 backdrop-blur-md">
            {loadingAi === 'improve' ? <RefreshCw className="animate-spin" size={16}/> : <SparkLogo size={18} className="text-amber-200"/>} 
            AI Generate Feedback
        </button>
      </div>

      {/* 5. INTELLIGENCE FEEDBACK (Full Width Bottom) — Rendered as Markdown */}
      <section className="space-y-6">
        <div className="flex items-center gap-3 text-sm font-medium text-indigo-400">
            <Brain size={16}/> Intelligence Report
        </div>
        <div className="ethereal-island p-12 relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 rounded-full blur-[80px] opacity-30 mix-blend-screen pointer-events-none" />
            <div className="prose prose-invert max-w-none prose-p:text-zinc-300 prose-p:leading-relaxed prose-p:font-light prose-headings:text-white prose-headings:font-medium prose-strong:text-white prose-strong:font-semibold relative z-10">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                    {p.ai_report || "_Architecture analysis not initialized. Use the AI Feedback button above to generate a report._"}
                </ReactMarkdown>
            </div>
        </div>
      </section>

    </motion.div>
  )
}