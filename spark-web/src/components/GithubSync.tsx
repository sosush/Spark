'use client'
import { useState, useEffect } from 'react'
import { createClient } from '@/utils/supabase/client'
import { motion, AnimatePresence } from 'framer-motion'
import { Zap, Loader2, RefreshCw, Check } from 'lucide-react'
import { useToast } from '@/components/Toast'

const supabase = createClient()

type RepoType = 'lab' | 'personal' | 'forked' | 'contributed'

async function fetchReadmeAndLangs(fullName: string, token: string) {
  const [readmeRes, langRes] = await Promise.all([
    fetch(`https://api.github.com/repos/${fullName}/readme`, { headers: { Authorization: `Bearer ${token}` } }),
    fetch(`https://api.github.com/repos/${fullName}/languages`, { headers: { Authorization: `Bearer ${token}` } })
  ])

  let readmeContent = ""
  if (readmeRes.ok) {
    const data = await readmeRes.json()
    try {
      const binString = atob(data.content)
      const bytes = new Uint8Array(binString.length)
      for (let i = 0; i < binString.length; i++) bytes[i] = binString.charCodeAt(i)
      readmeContent = new TextDecoder('utf-8').decode(bytes)
    } catch { /* skip decode errors */ }
  }

  const languages = langRes.ok ? await langRes.json() : {}
  return { readmeContent, languages: Object.keys(languages) }
}

async function fetchAllRepos(token: string, username: string) {
  const repos: { repo: any; type: RepoType }[] = []
  const seenUrls = new Set<string>()

  // Helper to add unique repos
  const addRepo = (r: any, type: RepoType) => {
    if (!seenUrls.has(r.html_url)) {
      seenUrls.add(r.html_url)
      repos.push({ repo: r, type })
    }
  }

  // 1. Personal & Forked repos
  try {
    const res = await fetch('https://api.github.com/user/repos?type=all&sort=updated&per_page=100', {
      headers: { Authorization: `Bearer ${token}` }
    })
    if (res.ok) {
      const data = await res.json()
      data.forEach((r: any) => {
         if (r.owner.login.toLowerCase() === username.toLowerCase()) {
             if (r.fork) addRepo(r, 'forked')
             else addRepo(r, 'personal')
         }
      })
    }
  } catch {}

  // 2. Contributed repos (via PR Search API + Public Events for direct pushes)
  try {
    // 2a. All Pull Requests authored by user (merged or not)
    const q = encodeURIComponent(`type:pr author:${username}`)
    const searchRes = await fetch(`https://api.github.com/search/issues?q=${q}&per_page=100`, {
      headers: { Authorization: `Bearer ${token}` }
    })
    if (searchRes.ok) {
      const data = await searchRes.json()
      for (const pr of (data.items || [])) {
        if (pr.repository_url) {
          const parts = pr.repository_url.split('/')
          const repoName = parts[parts.length - 1]
          const ownerName = parts[parts.length - 2]
          // Don't count it as 'contributed' if it's actually their own personal or forked repo we already caught
          if (ownerName.toLowerCase() !== username.toLowerCase()) {
            const htmlUrl = `https://github.com/${ownerName}/${repoName}`
            if (!seenUrls.has(htmlUrl)) {
              addRepo({ html_url: htmlUrl, name: repoName, full_name: `${ownerName}/${repoName}`, fork: false }, 'contributed')
            }
          }
        }
      }
    }

    // 2b. Recent Push Events (captures direct pushes if PRs weren't used)
    const eventsRes = await fetch(`https://api.github.com/users/${username}/events/public?per_page=100`, {
      headers: { Authorization: `Bearer ${token}` }
    })
    if (eventsRes.ok) {
      const events = await eventsRes.json()
      for (const ev of events) {
        if (ev.type === 'PushEvent' && ev.repo) {
          const ownerName = ev.repo.name.split('/')[0]
          const repoName = ev.repo.name.split('/')[1]
          if (ownerName.toLowerCase() !== username.toLowerCase()) {
            const htmlUrl = `https://github.com/${ev.repo.name}`
            if (!seenUrls.has(htmlUrl)) {
              addRepo({ html_url: htmlUrl, name: repoName, full_name: ev.repo.name, fork: false }, 'contributed')
            }
          }
        }
      }
    }
  } catch {}

  return repos
}

export function useGithubResync() {
  const [syncing, setSyncing] = useState(false)
  const [syncResult, setSyncResult] = useState<{ added: number, updated: number } | null>(null)
  const { toast } = useToast()

  const resync = async () => {
    setSyncing(true)
    setSyncResult(null)
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) { setSyncing(false); return }
    const token = session.provider_token
    
    if (!token) {
       toast('GitHub connection required for syncing.', 'info');
       setSyncing(false);
       return;
    }

    const username = session.user.user_metadata?.user_name || session.user.user_metadata?.preferred_username || ''

    try {
      const allRepos = await fetchAllRepos(token, username)
      const { data: existing } = await supabase.from('projects').select('github_link, id').eq('user_id', session.user.id)
      const existingLinks = new Map((existing || []).map(p => [p.github_link, p.id]))

      let added = 0, updated = 0
      for (const { repo, type } of allRepos) {
        const { readmeContent, languages } = await fetchReadmeAndLangs(repo.full_name, token)

        if (existingLinks.has(repo.html_url)) {
          await supabase.from('projects').update({
            readme: readmeContent,
            languages,
            repo_type: type,
          }).eq('id', existingLinks.get(repo.html_url)).eq('user_id', session.user.id)
          updated++
        } else {
          await supabase.from('projects').insert({
            user_id: session.user.id,
            name: repo.name,
            github_link: repo.html_url,
            readme: readmeContent,
            languages,
            repo_type: type,
            domains: []
          })
          added++
        }
      }
      setSyncResult({ added, updated })
    } catch (e) {
      toast('GitHub sync failed. Check your GitHub permissions.', 'error')
    }
    setSyncing(false)
  }

  const connectGithub = async () => {
    await supabase.auth.signInWithOAuth({
      provider: 'github',
      options: { redirectTo: window.location.origin + '/auth/callback' }
    })
  }

  return { syncing, resync, syncResult, connectGithub }
}

export default function GithubSync() {
  const [show, setShow] = useState(false)
  const [loading, setLoading] = useState(false)
  const [hasToken, setHasToken] = useState(true)
  const { toast } = useToast()
  const { connectGithub } = useGithubResync()

  useEffect(() => {
    async function check() {
      const { data: { session } } = await supabase.auth.getSession()
      const user = session?.user
      if (!user) return

      const providers = user.app_metadata?.providers || []
      const hasGithub = providers.includes('github')
      if (hasGithub) {
        setHasToken(!!session?.provider_token)
        const { count } = await supabase.from('projects')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', user.id)
        if (count === 0) setShow(true)
      }
    }
    check()
  }, [])

  const sync = async () => {
    setLoading(true)
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) { setLoading(false); return }
    const token = session.provider_token
    
    if (!token) {
      await connectGithub()
      return
    }

    const username = session.user.user_metadata?.user_name || session.user.user_metadata?.preferred_username || ''

    try {
      const allRepos = await fetchAllRepos(token, username)

      for (const { repo, type } of allRepos) {
        const { readmeContent, languages } = await fetchReadmeAndLangs(repo.full_name, token)

        await supabase.from('projects').insert({
          user_id: session.user.id,
          name: repo.name,
          github_link: repo.html_url,
          readme: readmeContent,
          languages,
          repo_type: type,
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

            <h2 className="text-2xl font-medium text-white tracking-tight smooth-text mb-3 relative z-10">{hasToken ? 'Initialize Constellation' : 'Connect GitHub'}</h2>
            <p className="text-sm font-light text-zinc-400 mb-8 relative z-10">
              {hasToken 
                ? 'We detected your GitHub account. Sync all your repositories into your workspace?'
                : "Your GitHub account isn't fully connected yet. Link it now to sync your projects."}
            </p>

            <div className="flex flex-col gap-3 w-full">
              <button
                onClick={sync}
                disabled={loading}
                className="w-full py-3.5 bg-indigo-500/20 hover:bg-indigo-500/30 text-indigo-300 rounded-full font-medium text-sm flex items-center justify-center gap-3 transition-all border border-indigo-500/30 backdrop-blur-md relative z-10"
              >
                {loading ? <Loader2 className="animate-spin text-indigo-400" size={18}/> : (hasToken ? 'Yes, Sync All Projects' : 'Connect GitHub & Sync')}
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