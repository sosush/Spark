'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@/utils/supabase/client'
import { Trash2, ArrowRight, Lightbulb } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'

const containerVariants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.1 } }
}

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { type: "tween" as const, duration: 0.8, ease: [0.25, 1, 0.25, 1] as const } }
}

export default function LabPage() {
  const [ideas, setIdeas] = useState<any[]>([])
  const supabase = createClient()
  const router = useRouter()

  useEffect(() => { fetchIdeas() }, [])

  const fetchIdeas = async () => {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) return
    const { data } = await supabase.from('nodes')
      .select('*')
      .eq('user_id', session.user.id) // SECURITY FIX: Isolation
      .order('created_at', { ascending: false })
    setIdeas(data || [])
  }

  const initializeProject = async (idea: any) => {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) return
    const { error } = await supabase.from('projects').insert({
        user_id: session.user.id,
        name: `Proto: ${idea.title}`,
        readme: idea.content,
        domains: ["Artificial Intelligence"]
    })
    
    if (!error) {
        await supabase.from('nodes')
          .delete()
          .eq('id', idea.id)
          .eq('user_id', session.user.id) // SECURITY FIX: Isolation
          
        router.push('/projects')
    }
  }

  return (
    <motion.div variants={containerVariants} initial="hidden" animate="show" className="max-w-6xl mx-auto py-12 space-y-12">
      <motion.header variants={itemVariants} className="border-b border-white/5 pb-8">
        <h1 className="text-4xl font-medium text-white tracking-tight smooth-text mb-2">The Laboratory</h1>
        <p className="text-sm text-zinc-400 font-light">Incubate your AI-generated concepts into reality.</p>
      </motion.header>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {ideas.map((idea) => (
          <motion.div variants={itemVariants} key={idea.id} className="ethereal-island p-10 flex flex-col justify-between relative overflow-hidden group">
            
            {/* Soft decorative hover glow */}
            <div className="absolute -top-10 -right-10 w-64 h-64 bg-teal-500/20 rounded-full blur-[80px] opacity-0 group-hover:opacity-40 transition-opacity duration-1000 pointer-events-none mix-blend-screen" />

            <div className="space-y-6 relative z-10">
               <div className="flex justify-between items-center">
                 <div className="w-12 h-12 bg-teal-500/10 border border-teal-500/20 rounded-2xl flex items-center justify-center text-teal-400 backdrop-blur-md">
                   <Lightbulb size={24} strokeWidth={1.5}/>
                 </div>
                 <button onClick={async () => { 
                   const { data: { session } } = await supabase.auth.getSession()
                   if (session) {
                    await supabase.from('nodes')
                      .delete()
                      .eq('id', idea.id)
                      .eq('user_id', session.user.id)
                    fetchIdeas(); 
                   }
                 }} className="w-10 h-10 flex items-center justify-center bg-white/5 border border-white/10 rounded-full text-zinc-500 hover:text-rose-400 hover:border-rose-500/20 hover:bg-rose-500/10 transition-colors backdrop-blur-md">
                   <Trash2 size={16}/>
                 </button>
               </div>
               
               <h3 className="text-2xl font-medium text-white tracking-tight leading-tight">{idea.title}</h3>
               <p className="text-zinc-400 font-light leading-relaxed text-sm line-clamp-4">{idea.content}</p>
            </div>
            
            <button onClick={() => initializeProject(idea)} className="mt-12 w-full py-4 bg-white/5 hover:bg-white/10 border border-white/10 text-white rounded-full font-medium flex items-center justify-center gap-3 transition-all backdrop-blur-md relative z-10">
              Launch Development <ArrowRight size={18} className="text-zinc-400"/>
            </button>
          </motion.div>
        ))}

        {ideas.length === 0 && (
          <motion.div variants={itemVariants} className="ethereal-island p-12 flex flex-col items-center text-center col-span-2">
             <div className="w-20 h-20 rounded-full bg-white/5 border border-white/10 backdrop-blur-md flex items-center justify-center mb-6">
               <Lightbulb size={32} className="text-zinc-600" strokeWidth={1.5} />
             </div>
             <p className="text-lg text-white font-medium mb-2">The Lab is Empty</p>
             <p className="text-zinc-400 font-light text-sm max-w-sm">Use the Network to Brainstorm new ideas and send them here for incubation.</p>
          </motion.div>
        )}
      </div>
    </motion.div>
  )
}