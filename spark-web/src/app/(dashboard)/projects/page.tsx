'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@/utils/supabase/client'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, Trash2, Star, ArrowUpRight, Hexagon, RefreshCw, Loader2, Check, ChevronDown, GitFork, StarIcon, Users, FolderOpen } from 'lucide-react'
import Link from 'next/link'
import { useGithubResync } from '@/components/GithubSync'

const DOMAINS = ["Artificial Intelligence", "Machine Learning", "Data Science", "Web/Mobile Development", "Cybersecurity", "IoT", "Blockchain", "Cloud Computing", "CLI/Extension Tool", "Portfolio/Profile"]

const REPO_SECTIONS: { key: string; label: string; icon: any; color: string }[] = [
  { key: 'lab', label: 'Laboratory', icon: Hexagon, color: 'teal' },
  { key: 'personal', label: 'Personal', icon: FolderOpen, color: 'indigo' },
  { key: 'forked', label: 'Forked', icon: GitFork, color: 'emerald' },
  { key: 'contributed', label: 'Contributed', icon: Users, color: 'amber' },
]

const containerVariants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.1 } }
}

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { type: "tween" as const, duration: 0.8, ease: [0.25, 1, 0.25, 1] as [number, number, number, number] } }
}

const supabase = createClient()

export default function ProjectsPage() {
  const [projects, setProjects] = useState<any[]>([])
  const { syncing, resync, syncResult } = useGithubResync()
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null)
  const [showArchived, setShowArchived] = useState(false)

  useEffect(() => { fetchProjects() }, [])

  const fetchProjects = async () => {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) return
    const { data } = await supabase.from('projects')
      .select('*')
      .eq('user_id', session.user.id)
      .order('created_at', { ascending: false })
    setProjects(data || [])
  }

  const addManual = async () => {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) return
    await supabase.from('projects').insert({
      user_id: session.user.id, name: "New Project Space", domains: [], is_pinned: false, repo_type: 'personal'
    })
    fetchProjects()
  }

  const confirmDelete = async () => {
    if (!deleteTarget) return
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) return
    await supabase.from('projects').update({ is_deleted: true }).eq('id', deleteTarget).eq('user_id', session.user.id)
    setDeleteTarget(null)
    fetchProjects()
  }

  const togglePin = async (id: string, currentStatus: boolean) => {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) return
    await supabase.from('projects').update({ is_pinned: !currentStatus }).eq('id', id).eq('user_id', session.user.id)
    fetchProjects()
  }

  const updateDomains = async (id: string, domain: string, currentDomains: string[]) => {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) return
    const newDomains = currentDomains.includes(domain)
      ? currentDomains.filter(d => d !== domain)
      : [...currentDomains, domain]
    await supabase.from('projects').update({ domains: newDomains }).eq('id', id).eq('user_id', session.user.id)
    await supabase.from('projects').update({ domains: newDomains }).eq('id', id).eq('user_id', session.user.id)
    fetchProjects()
  }

  const updateRepoType = async (id: string, type: string) => {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) return
    await supabase.from('projects').update({ repo_type: type }).eq('id', id).eq('user_id', session.user.id)
    fetchProjects()
  }

  const restoreProject = async (id: string) => {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) return
    await supabase.from('projects').update({ is_deleted: false }).eq('id', id).eq('user_id', session.user.id)
    fetchProjects()
  }

  // Separate active vs archived
  const activeProjects = projects.filter(p => !p.is_deleted)
  const archivedProjects = projects.filter(p => p.is_deleted === true)

  // Group active projects by repo_type
  const grouped = REPO_SECTIONS.map(section => ({
    ...section,
    projects: activeProjects.filter(p => (p.repo_type || 'personal') === section.key)
  })).filter(s => s.projects.length > 0)

  // Projects without a specific type go to "personal"
  const uncategorized = activeProjects.filter(p => !p.repo_type && !grouped.find(g => g.key === 'personal')?.projects.includes(p))

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
                <button onClick={() => setDeleteTarget(null)} className="flex-1 py-3.5 bg-white/5 hover:bg-white/10 border border-white/10 text-white rounded-full font-medium text-sm transition-all backdrop-blur-md">Cancel</button>
                <button onClick={confirmDelete} className="flex-1 py-3.5 bg-rose-500/15 hover:bg-rose-500/25 border border-rose-500/30 text-rose-300 rounded-full font-medium text-sm transition-all backdrop-blur-md">Delete</button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <motion.header variants={itemVariants} className="flex justify-between items-end border-b border-white/5 pb-8">
        <div>
          <h1 className="text-4xl font-medium tracking-tight text-white smooth-text mb-2">Vault</h1>
          <p className="text-sm font-light text-zinc-400">All synchronized spaces and projects, organized by type.</p>
        </div>
        <div className="flex items-center gap-3">
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
          <button onClick={() => setShowArchived(!showArchived)} className={`bg-white/5 hover:bg-white/10 border text-white px-6 py-3 rounded-full font-medium text-sm transition-all backdrop-blur-md ${showArchived ? 'border-indigo-500/50 text-indigo-300' : 'border-white/10'}`}>
            {showArchived ? 'Active Vault' : 'Ignored Repos'}
          </button>
          <button onClick={addManual} className="bg-white/5 hover:bg-white/10 border border-white/10 text-white px-6 py-3 rounded-full font-medium text-sm flex items-center gap-2 transition-all backdrop-blur-md">
            <Plus size={16}/> New Space
          </button>
        </div>
      </motion.header>

      {showArchived ? (
        <motion.section variants={itemVariants} className="space-y-4">
          <div className="flex items-center gap-4 w-full">
            <div className="w-10 h-10 rounded-2xl text-rose-400 bg-rose-500/10 border border-rose-500/20 flex items-center justify-center backdrop-blur-md">
              <Trash2 size={18} />
            </div>
            <h2 className="text-xl font-medium text-white tracking-tight">Archived / Ignored Repositories</h2>
          </div>
          
          <div className="grid grid-cols-1 gap-4 pt-2">
            {archivedProjects.length === 0 ? (
              <div className="text-center py-10 text-zinc-500 text-sm font-light border border-white/5 rounded-3xl bg-white/5 border-dashed">No ignored repositories.</div>
            ) : archivedProjects.map((p: any) => (
              <div key={p.id} className="ethereal-island p-6 flex justify-between items-center bg-black/40 border-rose-500/10 hover:border-rose-500/20 transition-all group">
                <div>
                  <h3 className="text-lg font-medium text-zinc-400 line-through decoration-rose-500/30">{p.name}</h3>
                  <p className="text-xs text-zinc-600">{p.github_link}</p>
                </div>
                <button onClick={() => restoreProject(p.id)} className="px-5 py-2 rounded-full border border-emerald-500/30 text-emerald-400 bg-emerald-500/10 hover:bg-emerald-500/20 transition-colors text-xs font-medium">
                  Restore to Vault
                </button>
              </div>
            ))}
          </div>
        </motion.section>
      ) : (
        <>
          {/* Grouped Sections */}
      {grouped.map(section => {
        const SectionIcon = section.icon
        const colorMap: Record<string, string> = {
          indigo: 'text-indigo-400 bg-indigo-500/10 border-indigo-500/20',
          teal: 'text-teal-400 bg-teal-500/10 border-teal-500/20',
          amber: 'text-amber-400 bg-amber-500/10 border-amber-500/20',
          emerald: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
        }
        const colors = colorMap[section.color] || colorMap.indigo

        return (
          <motion.section key={section.key} variants={itemVariants} className="space-y-4">
            <div className="flex items-center gap-4 w-full">
              <div className={`w-10 h-10 rounded-2xl ${colors} border flex items-center justify-center backdrop-blur-md`}>
                <SectionIcon size={18} />
              </div>
              <h2 className="text-xl font-medium text-white tracking-tight">{section.label}</h2>
              <span className="text-xs text-zinc-500 font-medium bg-white/5 px-3 py-1 rounded-full border border-white/10">
                {section.projects.length}
              </span>
            </div>

            <div className="grid grid-cols-1 gap-4 pt-2">
              {section.projects.map((p: any) => (
                <motion.div variants={itemVariants} key={p.id} className="ethereal-island p-8 group overflow-hidden relative">
                  <div className={`absolute top-0 right-0 w-64 h-64 rounded-full blur-[80px] opacity-0 group-hover:opacity-30 transition-opacity duration-1000 pointer-events-none mix-blend-screen ${p.is_pinned ? 'bg-amber-500/30' : 'bg-indigo-500/30'}`} />

                  <div className="flex flex-col md:flex-row justify-between items-start gap-8 relative z-10">
                    <div className="space-y-6 flex-1">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center backdrop-blur-md text-indigo-400 group-hover:text-indigo-300 transition-colors">
                          <Hexagon size={20} strokeWidth={1.5}/>
                        </div>
                        <div>
                          <h3 className="text-2xl font-medium text-white tracking-tight leading-tight flex items-center gap-3">
                            {p.name}
                            
                            {/* Manual Category Override Dropdown */}
                            <div className="relative group/dropdown">
                               <button className="flex items-center gap-1 text-[10px] uppercase font-bold tracking-widest bg-white/5 hover:bg-white/10 border border-white/10 px-2 py-1 rounded text-zinc-400 hover:text-white transition-all">
                                 {section.label} <ChevronDown size={12}/>
                               </button>
                               <div className="absolute left-0 top-full mt-1 w-36 bg-[#09090B] border border-white/10 rounded-xl shadow-2xl opacity-0 translate-y-2 pointer-events-none group-hover/dropdown:opacity-100 group-hover/dropdown:translate-y-0 group-hover/dropdown:pointer-events-auto transition-all z-50 overflow-hidden">
                                 {REPO_SECTIONS.map(s => (
                                   <button key={s.key} onClick={() => updateRepoType(p.id, s.key)} className="w-full text-left px-4 py-2 text-xs font-medium text-zinc-400 hover:bg-white/5 hover:text-white transition-colors">
                                     {s.label}
                                   </button>
                                 ))}
                               </div>
                            </div>
                          </h3>
                          {p.github_link && (
                            <a href={p.github_link} target="_blank" className="text-xs text-zinc-500 hover:text-indigo-400 transition-colors truncate block max-w-md">{p.github_link}</a>
                          )}
                        </div>
                      </div>

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
          </motion.section>
        )
      })}

      {projects.length === 0 && (
        <motion.div variants={itemVariants} className="ethereal-island p-12 flex flex-col items-center text-center">
          <div className="w-20 h-20 rounded-full bg-white/5 border border-white/10 backdrop-blur-md flex items-center justify-center mb-6">
            <FolderOpen size={32} className="text-zinc-600" strokeWidth={1.5} />
          </div>
          <p className="text-lg text-white font-medium mb-2">Vault is Empty</p>
          <p className="text-zinc-400 font-light text-sm max-w-sm">Sync your GitHub repos or create a new project space to get started.</p>
        </motion.div>
      )}
      </>
      )}
    </motion.div>
  )
}