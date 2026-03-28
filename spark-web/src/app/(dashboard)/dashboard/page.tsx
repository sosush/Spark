'use client'
import { useEffect, useState, Suspense } from 'react'
import { createClient } from '@/utils/supabase/client'
import { FolderOpen, Lightbulb, Hexagon, Code2, ArrowRight } from 'lucide-react'
import { motion } from 'framer-motion'
import { useSearchParams } from 'next/navigation'
import { useToast } from '@/components/Toast'
import Link from 'next/link'
import GithubSync from '@/components/GithubSync'

const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.15, delayChildren: 0.1 }
  }
}

const itemVariants = {
  hidden: { opacity: 0, y: 30 },
  show: { opacity: 1, y: 0, transition: { type: "tween" as const, duration: 0.8, ease: [0.25, 1, 0.25, 1] as const } }
}

const supabase = createClient()

function DashboardContent() {
  const [profile, setProfile] = useState<any>(null)
  const [pinned, setPinned] = useState<any[]>([])
  const [stats, setStats] = useState({ projs: 0, ideas: 0 })
  const [hasGithub, setHasGithub] = useState(true)

  const searchParams = useSearchParams()
  const errorParam = searchParams.get('error')
  const errorDesc = searchParams.get('description')
  const { toast } = useToast()

  useEffect(() => {
    if (errorParam && errorDesc) {
      if (errorDesc.includes('Multiple accounts')) {
        toast('Account Conflict: This email is already linked to a separate identity. Please delete the extra account in your Supabase dashboard to link them.', 'error')
      } else {
        toast(errorDesc, 'error')
      }
    }
  }, [errorParam, errorDesc, toast])

  useEffect(() => {
    async function loadData() {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        const { data: p } = await supabase.from('profiles').select('*').eq('id', user.id).single()
        setProfile(p)
        
        // SECURITY FIX: Filter by user_id
        const { data: projs } = await supabase.from('projects')
          .select('*')
          .eq('user_id', user.id)
          .eq('is_pinned', true)
          .order('created_at', { ascending: false })
        setPinned(projs || [])

        const { count: pCount } = await supabase.from('projects').select('*', { count: 'exact', head: true }).eq('user_id', user.id)
        const { count: iCount } = await supabase.from('nodes').select('*', { count: 'exact', head: true }).eq('user_id', user.id)
        setStats({ projs: pCount || 0, ideas: iCount || 0 })
        
        const providers = user.app_metadata?.providers || []
        setHasGithub(providers.includes('github'))
      }
    }
    loadData()
  }, [])

  const greeting = new Date().getHours() < 12 ? 'Good morning' : new Date().getHours() < 18 ? 'Good afternoon' : 'Good evening'

  return (
    <motion.div 
      variants={containerVariants}
      initial="hidden"
      animate="show"
      className="space-y-16"
    >
      {/* Soft Editorial Header */}
      <motion.header variants={itemVariants} className="max-w-3xl">
        <h1 className="text-5xl md:text-6xl font-medium tracking-tight text-white mb-6 smooth-text flex flex-col gap-2">
          <span className="text-zinc-400 text-3xl font-light">{greeting},</span>
          <span>{profile?.name || profile?.username || 'Architect'}</span>
        </h1>
        <p className="text-lg text-zinc-400 font-light leading-relaxed max-w-xl">
          Welcome back to your workspace. Here is a calm overview of your active projects and ideas.
        </p>
      </motion.header>

      {/* Floating Islands: Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full">
        <motion.div variants={itemVariants} className="ethereal-island p-10 flex flex-col justify-between min-h-[240px] group relative overflow-hidden">
          {/* Extremely soft decorative blob */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 rounded-full blur-[80px] opacity-40 group-hover:bg-indigo-500/20 group-hover:scale-110 transition-all duration-1000 ease-out" />
          
          <div className="relative z-10 flex items-start justify-between">
            <div className="w-12 h-12 rounded-2xl bg-white/5 shadow-sm flex items-center justify-center border border-white/10 backdrop-blur-md">
              <FolderOpen className="text-indigo-400" size={24} strokeWidth={1.5} />
            </div>
          </div>

          <div className="relative z-10 mt-12">
            <h3 className="text-6xl font-light tracking-tight text-white mb-2">
              {stats.projs}
            </h3>
            <p className="text-sm font-medium text-zinc-400">Active Projects</p>
          </div>
        </motion.div>

        <motion.div variants={itemVariants} className="ethereal-island p-10 flex flex-col justify-between min-h-[240px] group relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-teal-500/10 rounded-full blur-[80px] opacity-40 group-hover:bg-teal-500/20 group-hover:scale-110 transition-all duration-1000 ease-out" />
          
          <div className="relative z-10 flex items-start justify-between">
            <div className="w-12 h-12 rounded-2xl bg-white/5 shadow-sm flex items-center justify-center border border-white/10 backdrop-blur-md">
              <Lightbulb className="text-teal-400" size={24} strokeWidth={1.5} />
            </div>
          </div>

          <div className="relative z-10 mt-12">
            <h3 className="text-6xl font-light tracking-tight text-white mb-2">
              {stats.ideas}
            </h3>
            <p className="text-sm font-medium text-zinc-400">Laboratory Concepts</p>
          </div>
        </motion.div>
      </div>

      {/* Floating Islands: Pinned Projects Grid */}
      <motion.section variants={itemVariants} className="pt-8">
         <div className="flex items-center justify-between mb-8">
           <h2 className="text-2xl font-medium tracking-tight text-white smooth-text">
             Featured Spaces
           </h2>
         </div>
         
         <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
           {pinned.map((p) => (
             <motion.div 
               variants={itemVariants}
               key={p.id} 
               className="ethereal-island p-8 flex flex-col justify-between min-h-[280px] group cursor-pointer"
             >
               <div>
                 <div className="flex justify-between items-start mb-6">
                   <div className="w-10 h-10 rounded-full bg-white/5 shadow-sm flex items-center justify-center border border-white/10 text-indigo-400 group-hover:text-indigo-300 transition-colors backdrop-blur-md">
                     <Hexagon size={18} strokeWidth={1.5} />
                   </div>
                   <span className="ethereal-pill px-3 py-1 text-[10px] font-medium text-zinc-300 capitalize bg-white/5">
                     Verified
                   </span>
                 </div>
                 
                 <h4 className="text-2xl font-medium text-white tracking-tight leading-snug mb-4 group-hover:text-indigo-300 transition-colors">
                   {p.name}
                 </h4>
                 
                 <div className="flex flex-wrap gap-2">
                    {p.domains && p.domains.length > 0 ? (
                      p.domains.slice(0,3).map((domain: string) => (
                        <span key={domain} className="px-3 py-1 bg-white/5 border border-white/10 text-zinc-300 text-[11px] font-medium rounded-full backdrop-blur-md">
                          {domain}
                        </span>
                      ))
                    ) : (
                      <span className="px-3 py-1 bg-white/5 border border-white/10 text-zinc-500 text-[11px] font-medium rounded-full backdrop-blur-md">No tags</span>
                    )}
                 </div>
               </div>
             </motion.div>
           ))}

           {pinned.length === 0 && (
              <motion.div variants={itemVariants} className="ethereal-island p-10 flex flex-col items-center justify-center text-center min-h-[280px] col-span-3 bg-white/5 border-dashed border-white/20">
                 <div className="w-16 h-16 rounded-full bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center mb-6 backdrop-blur-md">
                   <FolderOpen size={24} className="text-indigo-400" strokeWidth={1.5}/>
                 </div>
                 <h3 className="text-lg font-medium text-zinc-300 mb-2">No Featured Spaces</h3>
                 <p className="text-sm text-zinc-500 font-light max-w-sm">Pin your most important projects from your workspace to access them quickly from here.</p>
                 <Link href="/projects" className="mt-8 ethereal-pill px-6 py-2.5 text-sm font-medium text-indigo-400 hover:scale-105 transition-transform">
                   Go to Projects
                 </Link>
              </motion.div>
           )}
         </div>
      </motion.section>

      {/* Conditional GitHub Linking for Google Users */}
      {!hasGithub && (
        <motion.section variants={itemVariants} className="pt-8">
           <div className="ethereal-island p-10 flex flex-col md:flex-row items-center justify-between gap-8 relative overflow-hidden group border-indigo-500/30">
              <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 rounded-full blur-[80px] opacity-40 mix-blend-screen pointer-events-none" />
              
              <div className="flex items-center gap-6 relative z-10">
                <div className="w-16 h-16 rounded-3xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center backdrop-blur-md">
                  <Code2 className="text-indigo-400" size={28} strokeWidth={1.5} />
                </div>
                <div>
                  <h3 className="text-2xl font-medium text-white tracking-tight mb-2">Connect GitHub</h3>
                  <p className="text-sm font-light text-zinc-400 max-w-lg">Unlock continuous repository syncing by linking your GitHub profile to your Spark workspace.</p>
                </div>
              </div>

              <button 
                onClick={() => supabase.auth.signInWithOAuth({ 
                  provider: 'github',
                  options: { redirectTo: `${window.location.origin}/auth/callback?mode=link` }
                })}
                className="group relative z-10 bg-indigo-500 hover:bg-indigo-400 text-white px-8 py-4 rounded-full font-medium text-sm flex items-center gap-3 transition-all hover:scale-105 active:scale-95 shadow-[0_0_40px_rgba(99,102,241,0.2)]"
              >
                Link Profile <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
              </button>
           </div>
        </motion.section>
      )}
      
      {/* GitHub Sync Modal for new users */}
      <GithubSync />

    </motion.div>
  )
}

export default function Dashboard() {
  return <Suspense><DashboardContent /></Suspense>
}