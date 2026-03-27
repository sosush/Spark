'use client'
import { useRef, useEffect, useState, useCallback } from 'react'
import dynamic from 'next/dynamic'
import { createClient } from '@/utils/supabase/client'
import { X, RefreshCw, Loader2, PlusCircle } from 'lucide-react'
import GithubSync from '@/components/GithubSync'
import { motion, AnimatePresence } from 'framer-motion'
import { useToast } from '@/components/Toast'
import SparkLogo from '@/components/SparkLogo'

const ForceGraph3D = dynamic(() => import('react-force-graph-3d'), { 
    ssr: false,
    loading: () => <div className="h-full w-full bg-transparent flex items-center justify-center text-zinc-500 animate-pulse text-sm font-light">Initializing Node Map...</div>
})

const DOMAINS = ["Artificial Intelligence", "Machine Learning", "Data Science", "Web/Mobile Development", "Cybersecurity", "IoT", "Blockchain", "Cloud Computing"]

const DOMAIN_COLORS: Record<string, string> = {
  "Artificial Intelligence": "#818CF8",
  "Machine Learning": "#A78BFA",
  "Data Science": "#67E8F9",
  "Web/Mobile Development": "#34D399",
  "Cybersecurity": "#FB923C",
  "IoT": "#F472B6",
  "Blockchain": "#FBBF24",
  "Cloud Computing": "#60A5FA",
}

function getNodeColor(node: any) {
  const domains: string[] = node.domains || []
  if (domains.length > 0 && DOMAIN_COLORS[domains[0]]) return DOMAIN_COLORS[domains[0]]
  return "#818CF8"
}

export default function ConstellationPage() {
  const [data, setData] = useState<any>({ nodes: [], links: [] })
  const [showBrainstorm, setShowBrainstorm] = useState(false)
  const [selectedDomains, setSelectedDomains] = useState<string[]>([])
  const [ideaResult, setIdeaResult] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const fgRef = useRef<any>(null)
  const supabase = createClient()
  const { toast } = useToast()

  const fetchGraph = useCallback(async () => {
    // SECURITY FIX: Filter by user_id
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) return

    const { data: projs } = await supabase.from('projects')
      .select('id, name, domains')
      .eq('user_id', session.user.id)
      
    if (!projs) return
    const nodes = projs.map(p => ({ id: p.id, name: p.name, domains: p.domains || [], val: 3 + (p.domains?.length || 0) * 2 }))
    const links: any[] = []
    for (let i = 0; i < nodes.length; i++) {
      for (let j = i + 1; j < nodes.length; j++) {
        const shared = nodes[i].domains.filter((d: string) => nodes[j].domains.includes(d))
        if (shared.length > 0) links.push({ source: nodes[i].id, target: nodes[j].id, shared, strength: shared.length })
      }
    }
    setData({ nodes, links })
  }, [supabase])

  useEffect(() => { fetchGraph() }, [fetchGraph])

  // Apply neural-link styling once the graph engine is ready
  useEffect(() => {
    if (fgRef.current) {
      // Slow down the camera orbit for a meditative feel
      const controls = fgRef.current.controls()
      if (controls) {
        controls.autoRotate = true
        controls.autoRotateSpeed = 0.4
      }
    }
  }, [data])

  const startCollision = async () => {
    setLoading(true)
    try {
      const res = await fetch('http://localhost:8000/brainstorm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ domains: selectedDomains, project_names: data.nodes.map((n:any) => n.name) })
      })
      const result = await res.json()
      setIdeaResult(result.idea)
    } catch (e) { toast('AI Brain is offline. Start the backend server.', 'error') }
    setLoading(false)
  }

  return (
    <div className="relative w-full" style={{ height: 'calc(100vh - 16rem)' }}>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="relative w-full h-full bg-[#030308] rounded-[2.5rem] overflow-hidden border border-white/5 shadow-2xl">
        <GithubSync />
        
        <ForceGraph3D
          ref={fgRef}
          graphData={data}
          backgroundColor="#030308"
          nodeColor={(node: any) => getNodeColor(node)}
          nodeRelSize={4}
          nodeResolution={32}
          nodeOpacity={0.9}
          nodeVal={(node: any) => node.val || 3}
          nodeLabel={(node: any) => node.name}
          linkColor={(link: any) => {
            const s = link.strength || 1
            return `rgba(129,140,248,${Math.min(0.12 + s * 0.1, 0.45)})`
          }}
          linkWidth={(link: any) => Math.min(0.3 + (link.strength || 1) * 0.3, 1.8)}
          linkDirectionalParticles={4}
          linkDirectionalParticleWidth={1.0}
          linkDirectionalParticleSpeed={0.002}
          linkDirectionalParticleColor={() => "#A78BFA"}
          linkCurvature={0.25}
          linkOpacity={0.35}
          linkLabel={(link: any) => `Shared: ${link.shared.join(', ')}`}
          warmupTicks={80}
          cooldownTicks={200}
          d3AlphaDecay={0.01}
          d3VelocityDecay={0.15}
          d3AlphaMin={0.001}
          enableNodeDrag={true}
          enableNavigationControls={true}
        />

        {/* Title overlay */}
        <div className="absolute top-8 left-8 text-white z-10 pointer-events-none">
          <h1 className="text-2xl font-medium tracking-tight smooth-text mb-1">Network</h1>
          <p className="text-xs text-zinc-400 font-light">Interactive constellation of your project domains</p>
        </div>

        {/* Node count badge */}
        <div className="absolute top-8 right-8 z-10 pointer-events-none ethereal-pill px-4 py-2 text-xs text-zinc-300 font-medium">
          {data.nodes.length} nodes · {data.links.length} connections
        </div>

        {/* Brainstorm button */}
        <button onClick={() => setShowBrainstorm(true)} className="absolute bottom-6 left-1/2 -translate-x-1/2 px-8 py-4 bg-white/10 text-white rounded-full font-medium text-sm flex items-center gap-3 backdrop-blur-md border border-white/10 hover:bg-white/20 transition-all shadow-[0_0_40px_rgba(129,140,241,0.15)] hover:shadow-[0_0_60px_rgba(129,140,241,0.25)] z-20">
          <SparkLogo size={18} className="text-amber-200" /> Brainstorm Node
        </button>

        <AnimatePresence>
          {showBrainstorm && (
            <div className="fixed inset-0 bg-[#09090B]/80 backdrop-blur-xl z-[150] flex items-center justify-center p-6">
              <motion.div 
                initial={{ y: 20, opacity: 0, scale: 0.95 }} 
                animate={{ y: 0, opacity: 1, scale: 1 }}
                exit={{ y: 20, opacity: 0, scale: 0.95 }}
                className="max-w-2xl w-full ethereal-island p-12 relative overflow-y-auto max-h-[85vh] scrollbar-hide"
              >
                <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/10 rounded-full blur-[80px] opacity-40 mix-blend-screen pointer-events-none" />

                <button onClick={() => setShowBrainstorm(false)} className="absolute top-8 right-8 w-10 h-10 flex items-center justify-center rounded-full bg-white/5 border border-white/10 text-zinc-400 hover:text-white transition-colors backdrop-blur-md z-10"><X size={18}/></button>
                
                <h2 className="text-3xl font-medium text-white tracking-tight smooth-text mb-2 relative z-10">Neural Combination</h2>
                <p className="text-sm font-light text-zinc-400 mb-8 relative z-10">Select domains to collide with your existing active nodes.</p>
                
                <div className="flex flex-wrap gap-2 mb-10 relative z-10">
                  {DOMAINS.map((d: string) => (
                    <button key={d} onClick={() => setSelectedDomains(prev => prev.includes(d) ? prev.filter(x => x !== d) : [...prev, d])}
                      className={`px-4 py-2 rounded-full text-xs font-medium border transition-all backdrop-blur-md ${selectedDomains.includes(d) ? 'bg-amber-500/20 border-amber-500/30 text-amber-200' : 'bg-white/5 border-white/10 text-zinc-400 hover:text-white'}`}>{d}</button>
                  ))}
                </div>

                {ideaResult && (
                  <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="p-8 bg-white/5 border border-white/10 rounded-3xl mb-8 text-zinc-300 font-light text-sm leading-relaxed whitespace-pre-wrap backdrop-blur-md relative z-10 shadow-inner">
                    {ideaResult}
                  </motion.div>
                )}

                <div className="flex gap-4 relative z-10 mt-12">
                  <button onClick={startCollision} disabled={loading} className="flex-1 py-4 bg-white/5 border border-white/10 hover:bg-white/10 text-white rounded-full font-medium flex items-center justify-center gap-3 transition-all text-sm backdrop-blur-md">
                    {loading ? <Loader2 className="animate-spin text-amber-200" size={18}/> : <RefreshCw size={18} className="text-zinc-400"/>} 
                    {ideaResult ? 'Regenerate Concept' : 'Synthesize'}
                  </button>
                  {ideaResult && (
                    <button onClick={async () => {
                        const { data: { session } } = await supabase.auth.getSession()
                        if (session) {
                          await supabase.from('nodes').insert({ user_id: session.user.id, title: "Lab Idea", content: ideaResult })
                          toast('Idea saved to Laboratory', 'success')
                          setShowBrainstorm(false)
                        }
                    }} className="px-8 py-4 bg-amber-500/10 border border-amber-500/30 text-amber-300 hover:bg-amber-500/20 rounded-full font-medium flex items-center gap-2 shadow-xl transition-all backdrop-blur-md">
                      <PlusCircle size={18} strokeWidth={1.5}/> Save to Lab
                    </button>
                  )}
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  )
}