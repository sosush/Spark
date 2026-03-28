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
  const { toast } = useToast()

  const fetchGraph = useCallback(async () => {
    // SECURITY FIX: Filter by user_id
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) return

    const { data: projs } = await supabase.from('projects')
      .select('id, name, domains, readme')
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
      // Unclump the nodes by pushing the links further apart
      fgRef.current.d3Force('link').distance(150)
      fgRef.current.d3Force('charge').strength(-400)
    }
  }, [data])

  const startCollision = async () => {
    setLoading(true)
    const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000'
    try {
      const res = await fetch(`${backendUrl}/brainstorm`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ domains: selectedDomains, project_names: data.nodes.map((n:any) => n.name) })
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
        <GithubSync />
        
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
            const color = isSynergySelected ? "#FCD34D" : "#818CF8" // Amber if selected, else purple
            
            // Core sphere — solid, bright
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

            // Outer halo — glowing ring
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

            // Store ref for pulsation
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
              // Bounding box logic to keep clusters from flying away endlessly
              const r = Math.hypot(node.x || 0, node.y || 0, node.z || 0)
              if (r > 400) {
                const force = (r - 400) * 0.015
                node.vx -= (node.x / r) * force
                node.vy -= (node.y / r) * force
                node.vz -= (node.z / r) * force
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

        {/* Synergy Mode overlay banner */}
        <AnimatePresence>
          {synergyMode && (
            <motion.div initial={{ y: -50, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: -50, opacity: 0 }} className="absolute top-8 left-1/2 -translate-x-1/2 z-20">
              <div className="ethereal-pill px-8 py-3 bg-amber-500/20 border-amber-500/30 backdrop-blur-md flex items-center gap-3">
                <div className="w-2 h-2 rounded-full bg-amber-400 animate-ping"></div>
                <span className="text-amber-200 font-medium text-sm tracking-wide uppercase">Select exactly two nodes to collide ({synergyNodes.length}/2)</span>
                <button onClick={() => { setSynergyMode(false); setSynergyNodes([]) }} className="ml-4 text-amber-200/50 hover:text-amber-200"><X size={16}/></button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Action Buttons */}
        <div className="absolute bottom-6 right-6 flex flex-col gap-4 z-20">
          <button onClick={() => { fgRef.current?.cameraPosition({ x: 0, y: 0, z: 250 }, {x:0, y:0, z:0}, 2000) }} className="w-12 h-12 bg-white/5 border border-white/10 text-white rounded-full flex items-center justify-center backdrop-blur-md hover:bg-white/10 transition-all shadow-lg" title="Recenter View">
            <Target size={20} className="text-zinc-400 hover:text-white" />
          </button>
        </div>

        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-4 z-20">
          <button onClick={() => setShowBrainstorm(true)} className="px-6 py-4 bg-white/5 border border-white/10 text-white rounded-full font-medium text-sm flex items-center gap-3 backdrop-blur-md hover:bg-white/10 transition-all">
            <RefreshCw size={16} className="text-zinc-400" /> General Brainstorm
          </button>
          
          <button onClick={() => { setSynergyMode(true); setSynergyNodes([]) }} className="px-8 py-4 bg-amber-500/10 text-amber-200 rounded-full font-medium text-sm flex items-center gap-3 backdrop-blur-md border border-amber-500/30 hover:bg-amber-500/20 transition-all shadow-[0_0_30px_rgba(245,158,11,0.2)] hover:shadow-[0_0_50px_rgba(245,158,11,0.4)]">
            <SparkLogo size={18} className="text-amber-300" /> Genesis Engine
          </button>
        </div>

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

        {/* The Genesis Engine Synergy Modal */}
        <AnimatePresence>
          {showSynergyModal && (
            <div className="fixed inset-0 bg-[#09090B]/90 backdrop-blur-2xl z-[200] flex items-center justify-center p-6">
              <motion.div 
                initial={{ opacity: 0, scale: 0.95, y: 30 }} 
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 30 }}
                className="max-w-3xl w-full ethereal-island relative border-amber-500/20 p-0 overflow-hidden"
              >
                <div className="absolute top-0 right-0 w-full h-64 bg-amber-500/10 rounded-b-full blur-[100px] opacity-40 mix-blend-screen pointer-events-none" />
                
                <button onClick={() => { setShowSynergyModal(false); setSynergyNodes([]) }} className="absolute top-6 right-6 w-10 h-10 flex items-center justify-center rounded-full bg-white/5 border border-white/10 text-zinc-400 hover:text-white transition-colors backdrop-blur-md z-20"><X size={18}/></button>

                <div className="relative z-10 p-12 max-h-[85vh] overflow-y-auto scrollbar-hide">
                  <div className="flex items-center justify-center gap-3 mb-8">
                    <SparkLogo size={24} className="text-amber-400" />
                    <span className="text-amber-300/80 uppercase tracking-[0.3em] text-xs font-bold">Genesis Engine Output</span>
                  </div>

                  {loading ? (
                    <div className="py-20 flex flex-col items-center justify-center text-center space-y-6">
                      <div className="relative">
                        <div className="absolute inset-0 border-2 border-amber-500/30 rounded-full animate-ping"></div>
                        <div className="w-16 h-16 rounded-full bg-amber-500/10 border border-amber-500/30 flex items-center justify-center">
                          <Hexagon className="text-amber-400 animate-spin-slow" size={24}/>
                        </div>
                      </div>
                      <p className="text-amber-200/60 font-medium animate-pulse tracking-wide">Synthesizing Project DNA...</p>
                    </div>
                  ) : synergyResult ? (
                    <div className="space-y-10">
                      <div className="text-center space-y-4">
                        <h2 className="text-5xl font-medium tracking-tight bg-gradient-to-r from-amber-200 to-amber-500 text-transparent bg-clip-text" style={{ fontFamily: 'var(--font-caveat)' }}>
                          {synergyResult.name}
                        </h2>
                        <p className="text-xl font-light text-zinc-300 leading-relaxed italic border-l-2 border-amber-500/30 pl-6 text-left shrink-0">
                          {synergyResult.pitch}
                        </p>
                      </div>

                      <div className="bg-black/20 p-8 border border-white/5 rounded-3xl">
                        <h4 className="text-xs font-bold uppercase tracking-[0.2em] text-zinc-500 mb-4">Architecture Blueprint</h4>
                        <div className="text-zinc-300 font-light text-sm leading-loose whitespace-pre-wrap">
                          {typeof synergyResult.architecture === 'object' 
                            ? JSON.stringify(synergyResult.architecture, null, 2)
                            : synergyResult.architecture}
                        </div>
                      </div>

                      <div className="flex justify-center pt-4">
                        <button onClick={async () => {
                            const { data: { session } } = await supabase.auth.getSession()
                            if (session) {
                              const md = `# ${synergyResult.name}\n\n> ${synergyResult.pitch}\n\n## Architecture\n${synergyResult.architecture}`
                              await supabase.from('nodes').insert({ user_id: session.user.id, title: synergyResult.name, content: md })
                              toast('Genesis Concept saved to Laboratory', 'success')
                              setShowSynergyModal(false)
                              setSynergyNodes([])
                            }
                        }} className="px-10 py-5 bg-amber-500 text-zinc-950 hover:bg-amber-400 rounded-full font-medium flex items-center gap-3 transition-all shadow-[0_10px_40px_rgba(245,158,11,0.3)] hover:scale-105">
                          <PlusCircle size={20} strokeWidth={2}/> Send to Lab Incubator
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="py-20 text-center text-rose-400">Synthesis calculation failed.</div>
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