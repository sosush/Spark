'use client'
import { useState, useEffect } from 'react'
import { createClient } from '@/utils/supabase/client'
import { motion, AnimatePresence } from 'framer-motion'
import { Zap, Loader2, RefreshCw, Check } from 'lucide-react'
import { useToast } from '@/components/Toast'

/**
 * GithubSync — Two modes:
 * 1. First-time modal (auto-shows when 0 projects exist)
 * 2. Manual re-sync function (exported for use in other components)
 */

export function useGithubResync() {
  const [syncing, setSyncing] = useState(false)
  const [syncResult, setSyncResult] = useState<{ added: number, updated: number } | null>(null)
  const supabase = createClient()
  const { toast } = useToast()

  const resync = async () => {
    setSyncing(true)
    setSyncResult(null)
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) { setSyncing(false); return }
    const token = session.provider_token

    try {
      const res = await fetch('https://api.github.com/user/repos?sort=updated&per_page=30', {
        headers: { Authorization: `Bearer ${token}` }
      })
      const repos = await res.json()
      
      // Get existing projects to match by github_link (SCOPED to user)
      const { data: existing } = await supabase.from('projects')
        .select('github_link, id')
        .eq('user_id', session.user.id)
      const existingLinks = new Map((existing || []).map(p => [p.github_link, p.id]))

      let added = 0, updated = 0

      for (const repo of repos) {
        // Fetch README and languages
        const [readmeRes, langRes] = await Promise.all([
          fetch(`https://api.github.com/repos/${repo.full_name}/readme`, { headers: { Authorization: `Bearer ${token}` } }),
          fetch(`https://api.github.com/repos/${repo.full_name}/languages`, { headers: { Authorization: `Bearer ${token}` } })
        ])
        
        let readmeContent = ""
        if (readmeRes.ok) {
          const data = await readmeRes.json()
          const binString = atob(data.content)
          const bytes = new Uint8Array(binString.length)
          for (let i = 0; i < binString.length; i++) bytes[i] = binString.charCodeAt(i)
          readmeContent = new TextDecoder('utf-8').decode(bytes)
        }
        
        const languages = await langRes.json()

        if (existingLinks.has(repo.html_url)) {
          // UPDATE existing project with latest README and languages
          await supabase.from('projects').update({
            readme: readmeContent,
            languages: Object.keys(languages),
          }).eq('id', existingLinks.get(repo.html_url))
            .eq('user_id', session.user.id) // SECURITY FIX: Isolation
          updated++
        } else {
          // INSERT new project
          await supabase.from('projects').insert({
            user_id: session.user.id,
            name: repo.name,
            github_link: repo.html_url,
            readme: readmeContent,
            languages: Object.keys(languages),
            domains: []
          })
          added++
        }
      }
      setSyncResult({ added, updated })
    } catch (e) { 
      toast('GitHub sync failed. Make sure you signed in with GitHub.', 'error')
    }
    setSyncing(false)
  }

  return { syncing, resync, syncResult }
}

export default function GithubSync() {
  const [show, setShow] = useState(false)
  const [loading, setLoading] = useState(false)
  const supabase = createClient()
  const { toast } = useToast()

  useEffect(() => {
    async function check() {
      const { data: { session } } = await supabase.auth.getSession()
      const user = session?.user
      if (!user) return

      // Only show the auto-sync modal if they actually have GitHub linked
      const providers = user.app_metadata?.providers || []
      const hasGithub = providers.includes('github')

      if (hasGithub) {
        const { count } = await supabase.from('projects')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', user.id) // SECURITY FIX: Isolation
        if (count === 0) setShow(true)
      }
    }
    check()
  }, [supabase])

  const sync = async () => {
    setLoading(true)
    const { data: { session } } = await supabase.auth.getSession()
    const token = session?.provider_token

    try {
      const res = await fetch('https://api.github.com/user/repos?sort=updated&per_page=12', {
        headers: { Authorization: `Bearer ${token}` }
      })
      const repos = await res.json()

      for (const repo of repos) {
        const [readmeRes, langRes] = await Promise.all([
          fetch(`https://api.github.com/repos/${repo.full_name}/readme`, { headers: { Authorization: `Bearer ${token}` }}),
          fetch(`https://api.github.com/repos/${repo.full_name}/languages`, { headers: { Authorization: `Bearer ${token}` }})
        ])
        
        let readmeContent = ""
        if (readmeRes.ok) {
           const data = await readmeRes.json()
           const binString = atob(data.content)
           const bytes = new Uint8Array(binString.length)
           for (let i = 0; i < binString.length; i++) bytes[i] = binString.charCodeAt(i)
           readmeContent = new TextDecoder('utf-8').decode(bytes)
        }
        
        const languages = await langRes.json()

        await supabase.from('projects').insert({
          user_id: session?.user.id,
          name: repo.name,
          github_link: repo.html_url,
          readme: readmeContent,
          languages: Object.keys(languages),
          domains: [] 
        })
      }
      window.location.reload()
    } catch (e) { toast('Sync failed. Try signing out and back in with GitHub.', 'error') }
    setLoading(false)
  }

  return (
    <AnimatePresence>
      {show && (
        <div className="fixed inset-0 bg-[#09090B]/80 backdrop-blur-xl z-[100] flex items-center justify-center p-6">
          <motion.div 
            initial={{ y: 20, opacity: 0, scale: 0.95 }} 
            animate={{ y: 0, opacity: 1, scale: 1 }} 
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="w-full max-w-sm ethereal-island p-10 flex flex-col items-center text-center relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 w-48 h-48 bg-indigo-500/20 rounded-full blur-[60px] opacity-60 mix-blend-screen pointer-events-none" />
            
            <div className="w-16 h-16 rounded-full bg-white/5 border border-white/10 flex items-center justify-center mb-8 relative z-10 backdrop-blur-md">
              <Zap className="text-indigo-400" size={24} strokeWidth={1.5} />
            </div>
            
            <h2 className="text-2xl font-medium text-white tracking-tight smooth-text mb-3 relative z-10">Initialize Constellation</h2>
            <p className="text-sm font-light text-zinc-400 mb-8 relative z-10">We detected your GitHub account. Do you want to sync your active repositories into your workspace?</p>
            
            <div className="flex flex-col gap-3 w-full">
              <button 
                onClick={sync} 
                disabled={loading} 
                className="w-full py-3.5 bg-indigo-500/20 hover:bg-indigo-500/30 text-indigo-300 rounded-full font-medium text-sm flex items-center justify-center gap-3 transition-all border border-indigo-500/30 backdrop-blur-md relative z-10"
              >
                {loading ? <Loader2 className="animate-spin text-indigo-400" size={18}/> : 'Yes, Sync All Projects'}
              </button>
              <button 
                onClick={() => setShow(false)} 
                disabled={loading} 
                className="w-full py-3.5 bg-white/5 hover:bg-white/10 text-white rounded-full font-medium text-sm flex items-center justify-center transition-all border border-white/10 backdrop-blur-md relative z-10"
              >
                Skip for now
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}