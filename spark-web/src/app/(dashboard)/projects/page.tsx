'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@/utils/supabase/client'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, Trash2, Star, ArrowUpRight, Hexagon, RefreshCw, Loader2, Check } from 'lucide-react'
import Link from 'next/link'
import { useGithubResync } from '@/components/GithubSync'

const DOMAINS = ["Artificial Intelligence", "Machine Learning", "Data Science", "Web/Mobile Development", "Cybersecurity", "IoT", "Blockchain", "Cloud Computing"]

const containerVariants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.1 } }
}

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { type: "tween" as const, duration: 0.8, ease: [0.25, 1, 0.25, 1] as [number, number, number, number] } }
}

export default function ProjectsPage() {
  const [projects, setProjects] = useState<any[]>([])
  const supabase = createClient()
  const { syncing, resync, syncResult } = useGithubResync()
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null)

  useEffect(() => { fetchProjects() }, [])

  const fetchProjects = async () => {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) return
    const { data } = await supabase.from('projects')
      .select('*')
      .eq('user_id', session.user.id) // SECURITY FIX: Isolation
      .order('created_at', { ascending: false })
    setProjects(data || [])
  }

  const addManual = async () => {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) return
    await supabase.from('projects').insert({ 
      user_id: session.user.id, name: "New Project Space", domains: [], is_pinned: false 
    })
    fetchProjects()
  }

  const confirmDelete = async () => {
    if (!deleteTarget) return
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) return
    
    await supabase.from('projects')
      .delete()
      .eq('id', deleteTarget)
      .eq('user_id', session.user.id) // SECURITY FIX: Isolation
      
    setDeleteTarget(null)
    fetchProjects()
  }

  const togglePin = async (id: string, currentStatus: boolean) => {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) return
    
    await supabase.from('projects')
      .update({ is_pinned: !currentStatus })
      .eq('id', id)
      .eq('user_id', session.user.id) // SECURITY FIX: Isolation
      
    fetchProjects()
  }

  const updateDomains = async (id: string, domain: string, currentDomains: string[]) => {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) return

    const newDomains = currentDomains.includes(domain) 
      ? currentDomains.filter(d => d !== domain) 
      : [...currentDomains, domain];
    
    await supabase.from('projects')
      .update({ domains: newDomains })
      .eq('id', id)
      .eq('user_id', session.user.id) // SECURITY FIX: Isolation
      
    fetchProjects()
  }

  return (
    <motion.div variants={containerVariants} initial="hidden" animate="show" className="max-w-6xl mx-auto py-12 space-y-12">
      
      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {deleteTarget && (
          <div className="fixed inset-0 bg-[#09090B]/70 backdrop-blur-xl z-[200] flex items-center justify-center p-6">
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              transition={{ type: "spring", damping: 25, stiffness: 350 }}
              className="w-full max-w-sm ethereal-island p-10 flex flex-col items-center text-center relative overflow-hidden"
            >
              <div className="absolute top-0 right-0 w-48 h-48 bg-rose-500/15 rounded-full blur-[60px] opacity-60 mix-blend-screen pointer-events-none" />
              
              <div className="w-16 h-16 rounded-full bg-rose-500/10 border border-rose-500/20 flex items-center justify-center mb-6 relative z-10">
                <Trash2 className="text-rose-400" size={24} strokeWidth={1.5} />
              </div>
              
              <h2 className="text-xl font-medium text-white tracking-tight mb-2 relative z-10">Delete this space?</h2>
              <p className="text-sm font-light text-zinc-400 mb-8 relative z-10">This action is permanent and cannot be undone.</p>
              
              <div className="flex gap-3 w-full relative z-10">
                <button 
                  onClick={() => setDeleteTarget(null)}
                  className="flex-1 py-3.5 bg-white/5 hover:bg-white/10 border border-white/10 text-white rounded-full font-medium text-sm transition-all backdrop-blur-md"
                >
                  Cancel
                </button>
                <button 
                  onClick={confirmDelete}
                  className="flex-1 py-3.5 bg-rose-500/15 hover:bg-rose-500/25 border border-rose-500/30 text-rose-300 rounded-full font-medium text-sm transition-all backdrop-blur-md"
                >
                  Delete
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <motion.header variants={itemVariants} className="flex justify-between items-end border-b border-white/5 pb-8">
        <div>
          <h1 className="text-4xl font-medium tracking-tight text-white smooth-text mb-2">Vault</h1>
          <p className="text-sm font-light text-zinc-400">All synchronized spaces and projects.</p>
        </div>
        <div className="flex items-center gap-3">
          {/* GitHub Re-sync Button */}
          <button 
            onClick={() => { resync().then(() => fetchProjects()) }}
            disabled={syncing}
            className="bg-white/5 hover:bg-white/10 border border-white/10 text-white px-6 py-3 rounded-full font-medium text-sm flex items-center gap-2 transition-all backdrop-blur-md disabled:opacity-50"
          >
            {syncing ? (
              <><Loader2 size={16} className="animate-spin text-indigo-400" /> Syncing...</>
            ) : syncResult ? (
              <><Check size={16} className="text-emerald-400" /> {syncResult.added} new, {syncResult.updated} updated</>
            ) : (
              <><RefreshCw size={16} className="text-zinc-400" /> Sync GitHub</>
            )}
          </button>
          <button onClick={addManual} className="bg-white/5 hover:bg-white/10 border border-white/10 text-white px-6 py-3 rounded-full font-medium text-sm flex items-center gap-2 transition-all backdrop-blur-md">
            <Plus size={16}/> New Space
          </button>
        </div>
      </motion.header>

      <div className="grid grid-cols-1 gap-6">
        {projects.map((p) => (
          <motion.div variants={itemVariants} key={p.id} className="ethereal-island p-8 group overflow-hidden relative">
            
            {/* Soft decorative hover glow */}
            <div className={`absolute top-0 right-0 w-64 h-64 rounded-full blur-[80px] opacity-0 group-hover:opacity-30 transition-opacity duration-1000 pointer-events-none mix-blend-screen ${p.is_pinned ? 'bg-amber-500/30' : 'bg-indigo-500/30'}`} />

            <div className="flex flex-col md:flex-row justify-between items-start gap-8 relative z-10">
               
               {/* Left Info */}
               <div className="space-y-6 flex-1">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center backdrop-blur-md text-indigo-400 group-hover:text-indigo-300 transition-colors">
                      <Hexagon size={20} strokeWidth={1.5}/>
                    </div>
                    <h3 className="text-3xl font-medium text-white tracking-tight leading-tight">{p.name}</h3>
                  </div>
                  
                  {/* Domains */}
                  <div className="flex flex-wrap gap-2">
                    {DOMAINS.map((d) => (
                      <button 
                        key={d} 
                        onClick={() => updateDomains(p.id, d, p.domains || [])}
                        className={`px-4 py-1.5 rounded-full text-xs font-medium border transition-all backdrop-blur-md ${p.domains?.includes(d) ? 'bg-indigo-500/20 border-indigo-500/30 text-indigo-200' : 'bg-white/5 border-white/10 text-zinc-400 hover:text-white'}`}
                      >
                        {d}
                      </button>
                    ))}
                  </div>
               </div>

               {/* Right Actions */}
               <div className="flex gap-3 shrink-0">
                 <button onClick={() => togglePin(p.id, p.is_pinned)} className={`w-12 h-12 flex items-center justify-center rounded-full border transition-all backdrop-blur-md ${p.is_pinned ? 'bg-amber-500/10 border-amber-500/30 text-amber-400' : 'bg-white/5 border-white/10 text-zinc-500 hover:text-zinc-300'}`}>
                   <Star size={18} className={p.is_pinned ? 'fill-amber-400' : ''}/>
                 </button>
                 <button onClick={() => setDeleteTarget(p.id)} className="w-12 h-12 flex items-center justify-center rounded-full bg-white/5 border border-white/10 text-zinc-500 hover:text-rose-400 hover:bg-rose-500/10 hover:border-rose-500/20 transition-all backdrop-blur-md">
                    <Trash2 size={18}/>
                 </button>
                 <Link href={`/projects/${p.id}`} className="w-12 h-12 flex items-center justify-center rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 hover:bg-indigo-500/20 hover:text-indigo-300 transition-all backdrop-blur-md">
                    <ArrowUpRight size={18}/>
                 </Link>
               </div>
            </div>
          </motion.div>
        ))}
      </div>
    </motion.div>
  )
}