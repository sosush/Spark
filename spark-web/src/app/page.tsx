'use client'

import Link from 'next/link'
import Background from '@/components/Background'
import { 
  Hexagon, Sparkles, Brain, Code2, ArrowRight, 
  GitBranch, Database, Zap, Share2, Rocket, 
  Compass, LayoutDashboard as Layout, FolderOpen, Network, Lightbulb,
  Star, Shield, Users, Cpu, Globe, Terminal, Layers, Box
} from 'lucide-react'
import SparkLogo from '@/components/SparkLogo'
import { motion, Variants, useInView } from 'framer-motion'
import { useRef, useEffect, useState, useCallback } from 'react'

const fadeIn: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: { 
    opacity: 1, 
    y: 0, 
    transition: { duration: 0.8, ease: "easeOut" } 
  }
}

const staggerContainer: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.15 } }
}

// Animated counter hook
function useCountUp(target: number, duration = 2000) {
  const [count, setCount] = useState(0)
  const ref = useRef<HTMLDivElement>(null)
  const inView = useInView(ref, { once: true })
  
  useEffect(() => {
    if (!inView) return
    let start = 0
    const increment = target / (duration / 16)
    const timer = setInterval(() => {
      start += increment
      if (start >= target) {
        setCount(target)
        clearInterval(timer)
      } else {
        setCount(Math.floor(start))
      }
    }, 16)
    return () => clearInterval(timer)
  }, [inView, target, duration])

  return { count, ref }
}

// Mini constellation canvas for the landing page
function MiniConstellation() {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    canvas.width = canvas.offsetWidth * 2
    canvas.height = canvas.offsetHeight * 2
    ctx.scale(2, 2)

    const w = canvas.offsetWidth
    const h = canvas.offsetHeight

    interface Node { x: number; y: number; vx: number; vy: number; r: number; color: string; phase: number }
    const nodes: Node[] = []
    const colors = ['#818CF8', '#A78BFA', '#67E8F9', '#34D399', '#FB923C', '#F472B6']
    
    for (let i = 0; i < 18; i++) {
      nodes.push({
        x: Math.random() * w,
        y: Math.random() * h,
        vx: (Math.random() - 0.5) * 0.3,
        vy: (Math.random() - 0.5) * 0.3,
        r: Math.random() * 3 + 2,
        color: colors[Math.floor(Math.random() * colors.length)],
        phase: Math.random() * Math.PI * 2
      })
    }

    let raf: number
    const draw = () => {
      ctx.clearRect(0, 0, w, h)
      const t = Date.now() * 0.002

      // Draw connections
      for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
          const dx = nodes[i].x - nodes[j].x
          const dy = nodes[i].y - nodes[j].y
          const dist = Math.sqrt(dx * dx + dy * dy)
          if (dist < 200) {
            ctx.beginPath()
            ctx.strokeStyle = `rgba(129, 140, 248, ${(1 - dist / 200) * 0.3})`
            ctx.lineWidth = 0.5
            ctx.moveTo(nodes[i].x, nodes[i].y)
            ctx.lineTo(nodes[j].x, nodes[j].y)
            ctx.stroke()
          }
        }
      }

      // Draw nodes
      nodes.forEach((n) => {
        n.x += n.vx
        n.y += n.vy
        if (n.x < 0 || n.x > w) n.vx *= -1
        if (n.y < 0 || n.y > h) n.vy *= -1

        const pulse = 1 + 0.3 * Math.sin(t + n.phase)
        
        // Glow
        ctx.beginPath()
        ctx.fillStyle = n.color.replace(')', ', 0.15)')
        ctx.arc(n.x, n.y, n.r * 3 * pulse, 0, Math.PI * 2)
        ctx.fill()

        // Core
        ctx.beginPath()
        ctx.fillStyle = n.color
        ctx.arc(n.x, n.y, n.r * pulse, 0, Math.PI * 2)
        ctx.fill()
      })

      raf = requestAnimationFrame(draw)
    }
    draw()
    return () => cancelAnimationFrame(raf)
  }, [])

  return <canvas ref={canvasRef} className="w-full h-full" />
}

// Tech marquee items
const TECH_ITEMS = [
  { name: 'React', icon: Code2 },
  { name: 'Next.js', icon: Layers },
  { name: 'TypeScript', icon: Terminal },
  { name: 'Python', icon: Cpu },
  { name: 'TensorFlow', icon: Brain },
  { name: 'Node.js', icon: Box },
  { name: 'PostgreSQL', icon: Database },
  { name: 'Docker', icon: Box },
  { name: 'AWS', icon: Globe },
  { name: 'GraphQL', icon: Share2 },
  { name: 'Rust', icon: Shield },
  { name: 'Kubernetes', icon: Layers },
]

export default function RootPage() {
  const stat1 = useCountUp(500)
  const stat2 = useCountUp(50)
  const stat3 = useCountUp(1200)
  const stat4 = useCountUp(98)

  return (
    <div className="min-h-screen relative font-sans text-white overflow-x-hidden selection:bg-indigo-500/30 selection:text-indigo-100">
      <Background />
      
      {/* Navbar */}
      <nav className="fixed top-0 inset-x-0 z-50 px-6 lg:px-12 py-6 flex items-center justify-between pointer-events-none">
        <motion.div 
          initial={{ x: -20, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          className="flex items-center gap-2 pointer-events-auto"
        >
          <SparkLogo className="text-indigo-400" size={32} />
          <span className="text-3xl font-normal relative -top-0.5 tracking-tight" style={{ fontFamily: 'var(--font-caveat)' }}>Spark</span>
        </motion.div>
        
        <motion.div 
          initial={{ x: 20, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          className="flex items-center gap-4 pointer-events-auto"
        >
          <Link href="/login" className="text-sm font-medium bg-white text-zinc-950 px-8 py-2.5 rounded-full hover:scale-105 active:scale-95 transition-all shadow-lg shadow-white/10 border border-white/20">
            Enter Workspace
          </Link>
        </motion.div>
      </nav>

      {/* Hero Section */}
      <main className="relative z-10 flex flex-col items-center justify-center min-h-screen px-6 pt-32 pb-32 text-center">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[80vw] max-w-3xl h-[80vw] max-h-3xl bg-indigo-500/10 rounded-full blur-[120px] mix-blend-screen pointer-events-none" />

        <motion.div 
          variants={fadeIn}
          initial="hidden"
          animate="visible"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 text-indigo-300 text-xs font-medium mb-8 backdrop-blur-md"
        >
           <Hexagon size={14} className="animate-spin-slow text-indigo-400" /> Intelligently mapping your project multiverse
        </motion.div>

        <motion.h1 
          variants={fadeIn}
          initial="hidden"
          animate="visible"
          className="text-6xl md:text-8xl lg:text-9xl font-medium tracking-tighter smooth-text mb-8 max-w-5xl leading-[0.9]"
        >
          The constellation of your{' '}
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-300 via-teal-200 to-violet-400 animate-gradient-text italic">
            ideas.
          </span>
        </motion.h1>
        
        <motion.p 
          variants={fadeIn}
          initial="hidden"
          animate="visible"
          transition={{ delay: 0.2 }}
          className="text-lg md:text-xl text-zinc-400 font-light max-w-2xl mb-12 leading-relaxed"
        >
          Spark completely automates your technical lifecycle. Sync your GitHub footprint, visualize your domain connections in 3D, and forge new concepts in the Laboratory.
        </motion.p>

        <motion.div 
          variants={fadeIn}
          initial="hidden"
          animate="visible"
          transition={{ delay: 0.3 }}
          className="flex flex-col sm:flex-row items-center gap-4"
        >
          <Link href="/login" className="group flex items-center gap-3 bg-indigo-500 hover:bg-indigo-400 text-white px-8 py-4 rounded-full font-medium transition-all hover:scale-105 active:scale-95 shadow-[0_0_40px_rgba(99,102,241,0.3)]">
            Initialize Workspace <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
          </Link>
          <a href="#workflow" className="px-8 py-4 rounded-full font-medium text-zinc-300 hover:text-white bg-white/5 hover:bg-white/10 border border-white/10 transition-all backdrop-blur-md">
            How it Works
          </a>
        </motion.div>
        
        {/* Scroll Indicator */}
        <motion.div 
          animate={{ y: [0, 10, 0] }}
          transition={{ repeat: Infinity, duration: 2 }}
          className="absolute bottom-12 text-zinc-600"
        >
          <div className="w-[1px] h-12 bg-gradient-to-b from-indigo-500/50 to-transparent mx-auto" />
        </motion.div>
      </main>


      {/* The Workflow Section */}
      <section id="workflow" className="relative z-10 max-w-7xl mx-auto px-6 py-40">
        <motion.div 
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          variants={staggerContainer}
          className="text-center mb-24"
        >
          <h2 className="text-4xl md:text-5xl font-medium tracking-tight mb-4">A unified intelligence lifecycle.</h2>
          <p className="text-zinc-500 font-light text-lg">Four steps from repository to reality.</p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 relative">
          <div className="hidden md:block absolute top-12 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-indigo-500/20 to-transparent z-0" />
          
          {[
            { step: '01', icon: GitBranch, title: 'Sync', desc: 'Connect GitHub to pull all repos — owned, forked, starred & contributed.' },
            { step: '02', icon: Network, title: 'Map', desc: 'Visualize domain links in a dynamic 3D constellation with glowing nodes.' },
            { step: '03', icon: Brain, title: 'Synthesize', desc: 'Merge existing project DNA into new startup concepts using AI.' },
            { step: '04', icon: Rocket, title: 'Build', desc: 'Launch incubated ideas back into the production cycle.' }
          ].map((item, i) => (
            <motion.div 
              key={item.title}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={fadeIn}
              transition={{ delay: i * 0.1 }}
              className="relative z-10 flex flex-col items-center text-center p-8 ethereal-island group"
            >
              <div className="w-16 h-16 rounded-full bg-white/5 border border-white/10 flex items-center justify-center mb-6 group-hover:scale-110 group-hover:bg-indigo-500/10 group-hover:border-indigo-500/30 transition-all duration-500 animate-pulse-glow">
                <item.icon className="text-zinc-500 group-hover:text-indigo-400 transition-colors" size={24} />
              </div>
              <span className="text-[10px] font-bold text-indigo-500/50 uppercase tracking-[0.2em] mb-2">{item.step}</span>
              <h3 className="text-xl font-medium mb-2">{item.title}</h3>
              <p className="text-sm font-light text-zinc-500 leading-relaxed">{item.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Interactive Demo Preview */}
      <section className="relative z-10 max-w-5xl mx-auto px-6 py-24">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={fadeIn}
          className="bg-[#030308] overflow-hidden relative border border-white/5 rounded-[2.5rem] shadow-2xl"
        >
          <div className="p-8 pb-0 z-10 relative">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-3 h-3 rounded-full bg-rose-500/60" />
              <div className="w-3 h-3 rounded-full bg-amber-500/60" />
              <div className="w-3 h-3 rounded-full bg-emerald-500/60" />
              <span className="text-xs text-zinc-600 ml-2 font-mono">constellation.spark</span>
            </div>
          </div>
          <div className="h-[350px] relative">
            <MiniConstellation />
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 px-4 py-2 bg-white/5 border border-white/10 rounded-full text-[10px] text-zinc-400 font-medium backdrop-blur-md">
              18 nodes · 24 connections · Live preview
            </div>
          </div>
        </motion.div>
      </section>

      {/* Feature Bento Grid */}
      <section className="relative z-10 max-w-7xl mx-auto px-6 py-40">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 auto-rows-[300px]">
          
          {/* Main Vault Feature */}
          <motion.div 
            whileInView="visible" initial="hidden" viewport={{ once: true }} variants={fadeIn}
            className="md:col-span-8 ethereal-island p-10 flex flex-col justify-end group relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/10 rounded-full blur-[100px] opacity-40 group-hover:opacity-60 transition-opacity" />
            <FolderOpen className="text-indigo-400 mb-6 animate-float" size={40} />
            <h3 className="text-3xl font-medium tracking-tight mb-4 text-white">The Vault Repository</h3>
            <p className="max-w-md text-zinc-400 font-light leading-relaxed">Your centralized archive for technical knowledge. Each project is automatically parsed, generating standardized READMEs and stack analysis powered by AI.</p>
            <div className="mt-8 flex gap-4">
              <div className="px-3 py-1 bg-white/5 border border-white/10 rounded-full text-[10px] uppercase font-bold text-zinc-500 tracking-widest">Stack Analysis</div>
              <div className="px-3 py-1 bg-white/5 border border-white/10 rounded-full text-[10px] uppercase font-bold text-zinc-500 tracking-widest">README Gen</div>
              <div className="px-3 py-1 bg-white/5 border border-white/10 rounded-full text-[10px] uppercase font-bold text-zinc-500 tracking-widest">File Tree</div>
            </div>
          </motion.div>

          {/* Neural Collision */}
          <motion.div 
            whileInView="visible" initial="hidden" viewport={{ once: true }} variants={fadeIn}
            className="md:col-span-4 ethereal-island p-10 flex flex-col justify-end group border-teal-500/10"
          >
            <Zap className="text-teal-400 mb-6 animate-float" size={40} style={{ animationDelay: '1s' }} />
            <h3 className="text-2xl font-medium tracking-tight mb-4 text-white">Neural Collision</h3>
            <p className="text-sm text-zinc-500 font-light leading-relaxed">Smash technical domains together to spark high-probability venture concepts based on your existing skills.</p>
          </motion.div>

          {/* Interactive Network */}
          <motion.div 
            whileInView="visible" initial="hidden" viewport={{ once: true }} variants={fadeIn}
            className="md:col-span-4 ethereal-island p-10 flex flex-col justify-end group border-amber-500/10"
          >
            <Share2 className="text-amber-300 mb-6 animate-float" size={40} style={{ animationDelay: '2s' }} />
            <h3 className="text-2xl font-medium tracking-tight mb-4 text-white">3D Constellation</h3>
            <p className="text-sm text-zinc-500 font-light leading-relaxed">Interactive node mapping that visualizes the invisible links between your scattered projects through shared technical DNA.</p>
          </motion.div>

          {/* Intelligence Report */}
          <motion.div 
            whileInView="visible" initial="hidden" viewport={{ once: true }} variants={fadeIn}
            className="md:col-span-8 ethereal-island p-10 flex flex-col justify-end group relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-500/10 rounded-full blur-[100px] opacity-40 group-hover:opacity-60 transition-opacity" />
            <Layout className="text-emerald-400 mb-6 animate-float" size={40} style={{ animationDelay: '0.5s' }} />
            <h3 className="text-3xl font-medium tracking-tight mb-4 text-white">Project Deep Dive</h3>
            <p className="max-w-md text-zinc-400 font-light leading-relaxed">Detailed architecture reports, file trees, and AI-generated improvements for every workspace unit. Understand what you built at a superhuman scale.</p>
          </motion.div>

        </div>
      </section>

      {/* Tech Stack Marquee */}
      <section className="relative z-10 py-20 overflow-hidden">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={fadeIn}
          className="text-center mb-12"
        >
          <p className="text-xs text-zinc-600 font-medium uppercase tracking-[0.3em]">Works with your stack</p>
        </motion.div>
        
        <div className="relative [perspective:1000px] overflow-hidden">
          <div className="absolute left-0 top-0 bottom-0 w-32 bg-gradient-to-r from-[#09090B] to-transparent z-10 pointer-events-none" />
          <div className="absolute right-0 top-0 bottom-0 w-32 bg-gradient-to-l from-[#09090B] to-transparent z-10 pointer-events-none" />
          
          <div className="flex animate-marquee whitespace-nowrap [transform-style:preserve-3d] [transform:rotateX(15deg)_rotateY(-5deg)] py-10">
            {[...TECH_ITEMS, ...TECH_ITEMS, ...TECH_ITEMS].map((tech, i) => (
              <div key={i} className="inline-flex items-center gap-3 mx-6 px-6 py-3 bg-white/5 border border-white/10 rounded-full backdrop-blur-md shadow-[0_10px_30px_rgba(0,0,0,0.3)]">
                <tech.icon size={16} className="text-indigo-400" />
                <span className="text-sm text-zinc-400 font-medium">{tech.name}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Who It's For */}
      <section className="relative z-10 max-w-6xl mx-auto px-6 py-32">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={staggerContainer}
          className="text-center mb-16"
        >
          <motion.h2 variants={fadeIn} className="text-4xl md:text-5xl font-medium tracking-tight mb-4">Built for builders.</motion.h2>
          <motion.p variants={fadeIn} className="text-zinc-500 font-light text-lg">Whether you're a solo dev or leading a team.</motion.p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {[
            { 
              icon: Terminal, 
              title: 'Solo Developers', 
              desc: 'Track all your side projects, open-source contributions, and experiments in one intelligent workspace.',
              gradient: 'from-indigo-500/20 to-violet-500/20'
            },
            { 
              icon: Users, 
              title: 'Startup Founders', 
              desc: 'Map your technical landscape and discover untapped opportunities where your skills intersect with market needs.',
              gradient: 'from-teal-500/20 to-emerald-500/20'
            },
            { 
              icon: Star, 
              title: 'Tech Leads', 
              desc: 'Audit your team\'s project portfolio, identify knowledge gaps, and generate architectural improvement reports.',
              gradient: 'from-amber-500/20 to-orange-500/20'
            },
          ].map((persona, i) => (
            <motion.div
              key={persona.title}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={fadeIn}
              transition={{ delay: i * 0.15 }}
              className="ethereal-island p-10 relative overflow-hidden group"
            >
              <div className={`absolute -top-20 -right-20 w-64 h-64 bg-gradient-to-br ${persona.gradient} rounded-full blur-[80px] opacity-0 group-hover:opacity-60 transition-opacity duration-1000 pointer-events-none`} />
              <div className="w-14 h-14 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform backdrop-blur-md relative z-10">
                <persona.icon size={24} className="text-zinc-400 group-hover:text-white transition-colors" />
              </div>
              <h3 className="text-xl font-medium text-white mb-3 relative z-10">{persona.title}</h3>
              <p className="text-sm text-zinc-500 font-light leading-relaxed relative z-10">{persona.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Navigation Guide Section */}
      <section className="relative z-10 max-w-5xl mx-auto px-6 py-40">
        <motion.div 
          initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeIn}
          className="ethereal-island p-12 md:p-20 overflow-hidden relative"
        >
          <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-indigo-500/5 rounded-full blur-[120px] mix-blend-screen pointer-events-none" />
          
          <div className="flex flex-col md:flex-row gap-16 items-center">
            <div className="flex-1 space-y-8">
              <h2 className="text-4xl font-medium tracking-tight text-white mb-6">Designed for Navigation.</h2>
              
              <div className="space-y-6">
                {[
                  { icon: FolderOpen, title: 'The Vault', desc: 'Access your synced project archive with categorized sections — owned, forked, starred & contributed.' },
                  { icon: Network, title: 'The Network', desc: 'Interact with your domain constellation in a fully immersive 3D graph with glowing nodes.' },
                  { icon: Lightbulb, title: 'The Laboratory', desc: 'Develop, refine, and incubate new concepts from your project DNA.' }
                ].map((nav) => (
                  <div key={nav.title} className="flex gap-6 group">
                    <div className="shrink-0 w-12 h-12 bg-white/5 border border-white/10 rounded-2xl flex items-center justify-center text-zinc-500 group-hover:text-indigo-400 transition-colors backdrop-blur-md">
                      <nav.icon size={20} />
                    </div>
                    <div>
                      <h4 className="font-medium text-white mb-1">{nav.title}</h4>
                      <p className="text-sm text-zinc-500 font-light leading-relaxed">{nav.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="w-full md:w-80 space-y-4 shrink-0">
               <div className="ethereal-island p-8 border-indigo-500/20 bg-indigo-500/5">
                  <Compass className="text-indigo-400 mb-4 animate-spin-slow" size={32} />
                  <p className="text-xs text-zinc-400 leading-relaxed font-light italic">"Navigate through the dashboard using the floating navigation dock at the bottom of the screen."</p>
               </div>
            </div>
          </div>
        </motion.div>
      </section>

      {/* Final CTA */}
      <section className="relative z-10 text-center py-40">
         <motion.div 
           initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeIn}
           className="max-w-3xl mx-auto px-6"
         >
           <h2 className="text-5xl md:text-6xl font-medium tracking-tight text-white mb-4">
             Ready to map your{' '}
             <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-300 via-teal-200 to-violet-400 animate-gradient-text">
               multiverse?
             </span>
           </h2>
           <p className="text-zinc-500 font-light text-lg mb-10 max-w-lg mx-auto">Join thousands of developers who have already transformed the way they understand their technical portfolio.</p>
           <Link href="/login" className="inline-flex items-center gap-3 bg-white text-zinc-950 px-10 py-5 rounded-full font-medium transition-all hover:scale-110 shadow-[0_0_60px_rgba(255,255,255,0.2)] hover:bg-zinc-100">
             Start Syncing Now <Sparkles size={18} className="text-indigo-600" />
           </Link>
         </motion.div>
      </section>

      <footer className="relative z-10 text-center py-12 border-t border-white/5 text-xs text-zinc-500 font-light mt-20 flex justify-center items-center gap-2">
        <SparkLogo size={18} className="text-zinc-600" />
        Spark Intelligent Workspace &bull; {new Date().getFullYear()}
      </footer>
    </div>
  )
}