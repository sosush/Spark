'use client'
import { useRef, useEffect, useState, useCallback } from 'react'
import dynamic from 'next/dynamic'
import { createClient } from '@/utils/supabase/client'
import { X, RefreshCw, Loader2, PlusCircle, Hexagon, Target } from 'lucide-react'
import GithubSync from '@/components/GithubSync'
import { motion, AnimatePresence } from 'framer-motion'
import { useToast } from '@/components/Toast'
import SparkLogo from '@/components/SparkLogo'

const ForceGraph3D = dynamic(() => import('react-force-graph-3d'), { 
    ssr: false,
    loading: () => <div className="h-full w-full bg-transparent flex items-center justify-center text-zinc-500 animate-pulse text-sm font-light">Initializing Node Map...</div>
})

const DOMAINS = ["Artificial Intelligence", "Machine Learning", "Data Science", "Web/Mobile Development", "Cybersecurity", "IoT", "Blockchain", "Cloud Computing", "CLI/Extension Tool", "Portfolio/Profile"]

export default function ConstellationPage() {
  const [data, setData] = useState<any>({ nodes: [], links: [] })
  
  // Brainstorm standard state
  const [showBrainstorm, setShowBrainstorm] = useState(false)
  const [selectedDomains, setSelectedDomains] = useState<string[]>([])
  const [ideaResult, setIdeaResult] = useState<string | null>(null)
  
  // Synergy Engine state
  const [synergyMode, setSynergyMode] = useState(false)
  const [synergyNodes, setSynergyNodes] = useState<any[]>([])
  const [synergyResult, setSynergyResult] = useState<{name: string, pitch: string, architecture: string} | null>(null)
  const [showSynergyModal, setShowSynergyModal] = useState(false)

  const [loading, setLoading] = useState(false)
  const fgRef = useRef<any>(null)
  const supabase = createClient()
  const [filter, setFilter] = useState<'all' | 'personal' | 'forked' | 'contributed'>('all')
  const [rawProjects, setRawProjects] = useState<any[]>([])
  const { toast } = useToast()

  const fetchGraph = useCallback(async () => {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) return

    const { data: projs } = await supabase.from('projects')
      .select('id, name, domains, readme, repo_type')
      .eq('user_id', session.user.id)
      
    if (!projs) return
    setRawProjects(projs)
  }, [supabase])

  useEffect(() => {
    const projs = filter === 'all' ? rawProjects : rawProjects.filter(p => p.repo_type === filter)
    const nodes = projs.map(p => ({ 
      id: p.id, 
      name: p.name, 
      domains: p.domains || [], 
      val: 3 + (p.domains?.length || 0) * 2,
      type: p.repo_type || 'personal'
    }))
    const links: any[] = []
    for (let i = 0; i < nodes.length; i++) {
      for (let j = i + 1; j < nodes.length; j++) {
        const shared = nodes[i].domains.filter((d: string) => nodes[j].domains.includes(d))
        if (shared.length > 0) links.push({ source: nodes[i].id, target: nodes[j].id, shared, strength: shared.length })
      }
    }
    setData({ nodes, links })
  }, [rawProjects, filter])

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
      // Unclump the nodes by pushing the links further apart
      fgRef.current.d3Force('link').distance(150)
      fgRef.current.d3Force('charge').strength(-400)
    }
  }, [data])

  const startCollision = async (is_regen = false) => {
    setLoading(true)
    const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000'
    try {
      const res = await fetch(`${backendUrl}/brainstorm`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          domains: selectedDomains, 
          project_names: data.nodes.map((n:any) => n.name),
          is_regeneration: is_regen 
        })
      })
      const result = await res.json()
      setIdeaResult(result.idea)
    } catch (e) { toast('AI Brain is offline. Start the backend server.', 'error') }
    setLoading(false)
  }

  const startSynergy = async (nodeA: any, nodeB: any) => {
    setShowSynergyModal(true)
    setLoading(true)
    setSynergyResult(null)
    const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000'
    try {
      const res = await fetch(`${backendUrl}/synergy`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          project_a: { name: nodeA.name, domains: nodeA.domains, readme: (nodeA as any).readme || '' },
          project_b: { name: nodeB.name, domains: nodeB.domains, readme: (nodeB as any).readme || '' },
        })
      })
      if (!res.ok) throw new Error('Failed to reach AI')
      const result = await res.json()
      setSynergyResult(result)
    } catch (e) { toast('Genesis Engine failed. Check if AI worker is running.', 'error'); setShowSynergyModal(false); setSynergyMode(false); setSynergyNodes([]) }
    setLoading(false)
  }

  const handleNodeClick = useCallback(
    (node: any) => {
      if (synergyMode) {
        setSynergyNodes((prev) => {
          if (prev.find(n => n.id === node.id)) {
            return prev.filter(n => n.id !== node.id)
          }
          const next = [...prev, node]
          if (next.length === 2) {
            setSynergyMode(false)
            startSynergy(next[0], next[1])
          }
          return next
        })
      } else {
        const distance = 40
        const distRatio = 1 + distance/Math.hypot(node.x, node.y, node.z)
        fgRef.current?.cameraPosition(
          { x: node.x * distRatio, y: node.y * distRatio, z: node.z * distRatio },
          node, 2000
        )
      }
    },
    [synergyMode]
  )

  return (
    <div className="relative w-full" style={{ height: 'calc(100vh - 16rem)' }}>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="relative w-full h-full bg-[#030308] rounded-[2.5rem] overflow-hidden border border-white/5 shadow-2xl">
        {/* 1. NEURAL MAP ENGINE */}
        <div className="flex-1 h-full relative">
          {/* Floating Filter Controls */}
          <div className="absolute top-8 left-1/2 -translate-x-1/2 z-40 flex items-center gap-2 p-1 bg-black/40 border border-white/10 rounded-full backdrop-blur-xl shadow-2xl">
            {[
              { id: 'all', label: 'All Projects' },
              { id: 'personal', label: 'Personal' },
              { id: 'forked', label: 'Forked' },
              { id: 'contributed', label: 'Contributed' }
            ].map((btn) => (
              <button
                key={btn.id}
                onClick={() => setFilter(btn.id as any)}
                className={`px-6 py-2 rounded-full text-[11px] font-medium transition-all uppercase tracking-widest ${
                  filter === btn.id 
                    ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 shadow-[0_0_20px_rgba(99,102,241,0.2)]' 
                    : 'text-zinc-500 hover:text-zinc-300'
                }`}
              >
                {btn.label}
              </button>
            ))}
          </div>

          <ForceGraph3D
            ref={fgRef}
            graphData={data}
            backgroundColor="#030308"
            nodeRelSize={10}
            nodeResolution={32}
            nodeOpacity={1}
            nodeVal={(node: any) => node.val || 4}
            nodeLabel={(node: any) => node.name}
            onNodeClick={handleNodeClick}
            nodeThreeObject={(node: any) => {
              const THREE = require('three')
              const group = new THREE.Group()
              const isSynergySelected = synergyNodes.find(n => n.id === node.id)
              const color = isSynergySelected ? "#FCD34D" : (node.type === 'personal' ? "#818CF8" : node.type === 'forked' ? "#22d3ee" : "#fb7185")
              
              const coreMat = new THREE.MeshPhongMaterial({
                color: color,
                emissive: color,
                emissiveIntensity: 0.8,
                shininess: 100,
                transparent: true,
                opacity: 0.95
              })
              const coreGeo = new THREE.SphereGeometry(7, 32, 32)
              const core = new THREE.Mesh(coreGeo, coreMat)
              group.add(core)

              const haloMat = new THREE.MeshBasicMaterial({
                color: color,
                transparent: true,
                opacity: 0.25,
                blending: THREE.AdditiveBlending,
                depthWrite: false
              })
              const haloGeo = new THREE.SphereGeometry(13, 32, 32)
              const halo = new THREE.Mesh(haloGeo, haloMat)
              group.add(halo)

              ;(node as any).__halo = halo
              ;(node as any).__core = core
              ;(node as any).__phase = Math.random() * Math.PI * 2
              return group
            }}
            nodeThreeObjectExtend={false}
            onEngineTick={() => {
              const t = Date.now() * 0.003
              data.nodes.forEach((node: any) => {
                if (node.__halo) {
                  const pulse = 1.0 + 0.35 * Math.sin(t + (node.__phase || 0))
                  node.__halo.scale.set(pulse, pulse, pulse)
                  node.__halo.material.opacity = 0.15 + 0.12 * Math.sin(t + (node.__phase || 0))
                }
              })
            }}
            linkColor={() => 'rgba(255, 255, 255, 0.4)'}
            linkWidth={(link: any) => Math.min(0.5 + (link.strength || 1) * 0.5, 2.5)}
            linkDirectionalParticles={6}
            linkDirectionalParticleWidth={1.8}
            linkDirectionalParticleSpeed={0.003}
            linkDirectionalParticleColor={() => "#ffffff"}
            linkCurvature={0}
            linkOpacity={0.5}
            warmupTicks={80}
            cooldownTicks={200}
            enableNodeDrag={true}
            enableNavigationControls={true}
          />

          {/* Overlays */}
          <div className="absolute top-8 left-8 text-white z-10 pointer-events-none">
            <h1 className="text-2xl font-medium tracking-tight smooth-text mb-1 italic" style={{ fontFamily: 'var(--font-caveat)' }}>Constellation Map</h1>
            <p className="text-[10px] text-indigo-400 font-bold uppercase tracking-widest">{filter} PROJECTS ACTIVE</p>
          </div>

          {/* Synergy Mode overlay banner */}
          <AnimatePresence>
            {synergyMode && (
              <motion.div initial={{ y: -50, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: -50, opacity: 0 }} className="absolute top-8 left-1/2 -translate-x-1/2 z-50">
                <div className="ethereal-pill px-8 py-3 bg-amber-500/20 border-amber-500/30 backdrop-blur-md flex items-center gap-3">
                  <div className="w-2 h-2 rounded-full bg-amber-400 animate-ping"></div>
                  <span className="text-amber-200 font-bold text-[10px] tracking-[0.2em] uppercase">Select exactly two nodes to collide ({synergyNodes.length}/2)</span>
                  <button onClick={() => { setSynergyMode(false); setSynergyNodes([]) }} className="ml-4 text-amber-200/50 hover:text-amber-200 transition-colors"><X size={16}/></button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-4 z-40">
            <button onClick={() => setShowBrainstorm(true)} className="px-8 py-4 bg-white/5 border border-white/10 text-white rounded-full font-medium text-[11px] uppercase tracking-widest flex items-center gap-3 backdrop-blur-md hover:bg-white/10 transition-all group">
              <RefreshCw size={14} className="text-zinc-500 group-hover:rotate-180 transition-transform duration-500" /> Neural Ideation
            </button>
            <button onClick={() => { setSynergyMode(true); setSynergyNodes([]) }} className="px-8 py-4 bg-amber-500/10 text-amber-200 rounded-full font-medium text-[11px] uppercase tracking-widest flex items-center gap-3 backdrop-blur-md border border-amber-500/30 hover:bg-amber-500/20 transition-all shadow-[0_0_30px_rgba(245,158,11,0.2)]">
              <SparkLogo size={14} className="text-amber-400" /> Genesis Engine
            </button>
          </div>
        </div>

        {/* Neural Ideation (Brainstorm) Modal */}
        <AnimatePresence>
          {showBrainstorm && (
            <div className="fixed inset-0 bg-black/95 backdrop-blur-2xl z-[100] flex items-center justify-center p-6">
              <motion.div initial={{ y: 20, opacity: 0, scale: 0.95 }} animate={{ y: 0, opacity: 1, scale: 1 }} exit={{ y: 20, opacity: 0, scale: 0.95 }} className="max-w-4xl w-full ethereal-island relative border-indigo-500/20 p-0 overflow-hidden">
                <div className="absolute top-0 right-0 w-full h-64 bg-indigo-500/10 rounded-b-full blur-[100px] opacity-40 mix-blend-screen pointer-events-none" />
                <button onClick={() => { setShowBrainstorm(false); setIdeaResult(null); setSelectedDomains([]) }} className="absolute top-8 right-8 w-10 h-10 flex items-center justify-center rounded-full bg-white/5 border border-white/10 text-zinc-500 hover:text-white transition-colors z-20"><X size={18}/></button>

                <div className="relative z-10 p-12 max-h-[85vh] overflow-y-auto scrollbar-hide">
                  {!ideaResult ? (
                    <div className="space-y-10">
                      <div className="text-center space-y-4">
                        <div className="flex items-center justify-center gap-3 mb-2">
                          <SparkLogo size={32} className="text-indigo-400 shadow-[0_0_20px_rgba(129,140,248,0.5)]" />
                          <span className="text-indigo-300 uppercase tracking-[0.5em] text-[10px] font-bold">Neural Ideation</span>
                        </div>
                        <h2 className="text-4xl font-medium tracking-tight text-white italic" style={{ fontFamily: 'var(--font-caveat)' }}>Identify Your Focus Domains</h2>
                      </div>
                      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
                        {DOMAINS.map((domain) => (
                          <button key={domain} onClick={() => {
                            if (selectedDomains.includes(domain)) setSelectedDomains(prev => prev.filter(d => d !== domain))
                            else if (selectedDomains.length < 3) setSelectedDomains(prev => [...prev, domain])
                          }} className={`p-4 rounded-2xl border text-[10px] font-bold transition-all text-center uppercase tracking-widest ${
                            selectedDomains.includes(domain) ? 'bg-indigo-500/20 border-indigo-500/40 text-indigo-300 shadow-[0_0_20px_rgba(99,102,241,0.2)]' : 'bg-white/5 border-white/5 text-zinc-600 hover:text-zinc-400'
                          }`}>{domain}</button>
                        ))}
                      </div>
                      <div className="flex justify-center pt-6">
                        <button onClick={() => startCollision(false)} disabled={selectedDomains.length === 0 || loading} className="px-12 py-5 bg-white text-zinc-950 hover:bg-zinc-200 disabled:opacity-30 rounded-full font-bold flex items-center gap-3 transition-all">
                          {loading ? <Loader2 className="animate-spin" size={20}/> : <Target size={20} strokeWidth={2.5}/>} 
                          {loading ? 'SYNTHeSIZING...' : 'INITIALIZE GENESIS'}
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-8">
                      <div className="flex justify-between items-center mb-8 border-b border-white/5 pb-8">
                         <div className="flex items-center gap-3"><SparkLogo size={24} className="text-indigo-400"/><span className="text-indigo-300 uppercase tracking-[0.3em] text-[10px] font-bold">Neural Synthesis Result</span></div>
                         <button onClick={() => startCollision(true)} disabled={loading} className="flex items-center gap-2 text-zinc-500 hover:text-indigo-400 text-[10px] font-bold uppercase tracking-widest transition-colors">
                           <RefreshCw size={14} className={loading ? 'animate-spin' : ''}/> Pivot Concept
                         </button>
                      </div>
                      <div className="text-zinc-300 font-light text-sm leading-loose whitespace-pre-wrap">{ideaResult}</div>
                      <div className="flex justify-center pt-8 border-t border-white/5">
                        <button onClick={async () => {
                           const { data: { session } } = await supabase.auth.getSession()
                           if (session && ideaResult) {
                              const name = ideaResult.includes('NAME:') ? ideaResult.split('\n')[0].replace('PROJECT NAME:', '').trim() : 'AI Concept'
                              await supabase.from('nodes').insert({ user_id: session.user.id, title: name, content: ideaResult })
                              toast('Concept archived in Laboratory', 'success')
                              setShowBrainstorm(false)
                           }
                        }} className="px-12 py-5 bg-indigo-500 text-white hover:bg-indigo-400 rounded-full font-bold flex items-center gap-3 transition-all shadow-[0_10px_30px_rgba(99,102,241,0.3)]">Archive in Lab Incubator</button>
                      </div>
                    </div>
                  )}
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* Synergy Modal (Genesis Engine) */}
        <AnimatePresence>
          {showSynergyModal && (
            <div className="fixed inset-0 bg-black/95 backdrop-blur-2xl z-[200] flex items-center justify-center p-6">
              <motion.div initial={{ opacity: 0, scale: 0.95, y: 30 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 30 }} className="max-w-3xl w-full ethereal-island relative border-amber-500/20 p-0 overflow-hidden">
                <div className="absolute top-0 right-0 w-full h-64 bg-amber-500/10 rounded-b-full blur-[100px] opacity-40 mix-blend-screen pointer-events-none" />
                <button onClick={() => { setShowSynergyModal(false); setSynergyNodes([]) }} className="absolute top-8 right-8 w-10 h-10 flex items-center justify-center rounded-full bg-white/5 border border-white/10 text-zinc-500 hover:text-white transition-colors z-20"><X size={18}/></button>

                <div className="relative z-10 p-12 max-h-[85vh] overflow-y-auto scrollbar-hide text-center">
                  <div className="flex items-center justify-center gap-3 mb-4">
                    <SparkLogo size={32} className="text-amber-400" />
                    <span className="text-amber-300 uppercase tracking-[0.5em] text-[10px] font-bold">Genesis Engine Synthesis</span>
                  </div>

                  {loading ? (
                    <div className="py-20 flex flex-col items-center justify-center space-y-6">
                      <div className="w-16 h-16 rounded-full bg-amber-500/10 border border-amber-500/30 flex items-center justify-center animate-pulse"><Hexagon className="text-amber-400 animate-spin-slow" size={24}/></div>
                      <p className="text-amber-200/60 font-bold uppercase tracking-[0.2em] text-[10px] animate-pulse">Synthesizing Project DNA...</p>
                    </div>
                  ) : synergyResult ? (
                    <div className="space-y-10 text-left">
                      <div className="text-center space-y-4">
                        <h2 className="text-5xl font-medium tracking-tight bg-gradient-to-r from-amber-200 to-amber-500 text-transparent bg-clip-text italic" style={{ fontFamily: 'var(--font-caveat)' }}>{synergyResult.name}</h2>
                        <p className="text-lg font-light text-zinc-300 leading-relaxed italic border-l-2 border-amber-500/30 pl-6">{synergyResult.pitch}</p>
                      </div>
                      <div className="bg-black/20 p-8 border border-white/5 rounded-3xl">
                        <h4 className="text-[10px] font-bold uppercase tracking-[0.3em] text-zinc-500 mb-6">Structural DNA & Architecture</h4>
                        <div className="text-zinc-300 font-light text-sm leading-loose whitespace-pre-wrap">{synergyResult.architecture}</div>
                      </div>
                      <div className="flex justify-center pt-4">
                        <button onClick={async () => {
                            const { data: { session } } = await supabase.auth.getSession()
                            if (session && synergyResult) {
                              const md = `# ${synergyResult.name}\n\n> ${synergyResult.pitch}\n\n## Architecture\n${synergyResult.architecture}`
                              await supabase.from('nodes').insert({ user_id: session.user.id, title: synergyResult.name, content: md })
                              toast('Genesis Concept archived', 'success'); setShowSynergyModal(false); setSynergyNodes([])
                            }
                        }} className="px-12 py-5 bg-amber-500 text-zinc-950 hover:bg-amber-400 rounded-full font-bold flex items-center gap-3 transition-all shadow-xl">Archiving Prototype</button>
                      </div>
                    </div>
                  ) : <div className="py-20 text-rose-400 uppercase tracking-[0.2em] text-[10px] font-bold">Synthesis calculation aborted.</div>}
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </motion.div>
      <GithubSync />
    </div>
  )
}