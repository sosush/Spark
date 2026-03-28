'use client'
import { useState } from 'react'
import { createClient } from '@/utils/supabase/client'
import { Plus, X, Cpu, Loader2, Link2, Box } from 'lucide-react'
import { useToast } from '@/components/Toast'

export default function AddProject({ onProjectAdded }: { onProjectAdded: () => void }) {
  const [isOpen, setIsOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({ name: '', github_link: '', segment: 'General' })

  const supabase = createClient()
  const { toast } = useToast()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    
    const { data: { session } } = await supabase.auth.getSession()
    const user = session?.user
    
    if (user) {
      // 1. Insert into Database
      const { data, error } = await supabase.from('projects').insert([
        { 
          ...formData, 
          user_id: user.id,
          project_type: 'Personal'
        }
      ]).select().single()
      
      if (error) {
        toast('Failed to add project: ' + error.message, 'error')
      } else if (data) {
        // 2. Trigger Local AI Brain (FastAPI)
        // We don't "await" this because it might take a while, 
        const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000'
        fetch(`${backendUrl}/analyze/${data.id}`).catch(err => console.log("Brain offline"))
        
        setIsOpen(false)
        setFormData({ name: '', github_link: '', segment: 'General' })
        onProjectAdded() // Re-sparks the map
      }
    }
    setLoading(false)
  }

  return (
    <div className="fixed bottom-10 right-10 flex flex-col items-end gap-4 z-50">
      {isOpen && (
        <div className="bg-[#0a0a0a] border border-blue-500/30 p-6 rounded-2xl w-80 shadow-[0_0_50px_rgba(0,0,0,1)] border-b-4 border-b-blue-600 animate-in fade-in zoom-in duration-200">
          <div className="flex justify-between items-center mb-6">
            <div className="flex items-center gap-2">
              <Cpu size={14} className="text-blue-500 animate-pulse" />
              <h2 className="text-blue-500 font-mono text-[10px] font-black tracking-widest">INJECT_NEW_NODE</h2>
            </div>
            <button onClick={() => setIsOpen(false)}><X size={16} className="text-gray-600 hover:text-white" /></button>
          </div>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1">
              <input 
                required placeholder="IDENTIFIER (Project Name)"
                className="w-full bg-[#111] border border-gray-800 rounded-lg p-3 text-xs outline-none focus:border-blue-500 transition-all font-mono"
                onChange={e => setFormData({...formData, name: e.target.value})}
              />
            </div>
            <div className="relative">
              <Link2 size={12} className="absolute left-3 top-3.5 text-gray-600" />
              <input 
                required placeholder="GITHUB_URL"
                className="w-full bg-[#111] border border-gray-800 rounded-lg p-3 pl-9 text-xs outline-none focus:border-blue-500 font-mono"
                onChange={e => setFormData({...formData, github_link: e.target.value})}
              />
            </div>
            <div className="relative">
              <Box size={12} className="absolute left-3 top-3.5 text-gray-600" />
              <select 
                className="w-full bg-[#111] border border-gray-800 rounded-lg p-3 pl-9 text-xs outline-none focus:border-blue-500 font-mono appearance-none"
                onChange={e => setFormData({...formData, segment: e.target.value})}
              >
                <option value="General">DOMAIN: GENERAL</option>
                <option value="AI/ML">DOMAIN: AI/ML</option>
                <option value="Cybersecurity">DOMAIN: CYBERSECURITY</option>
                <option value="UI/UX">DOMAIN: UI/UX</option>
              </select>
            </div>
            
            <button 
              type="submit" disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-500 py-4 rounded-xl font-black text-[10px] tracking-[0.2em] flex items-center justify-center gap-2 transition-all active:scale-95 shadow-[0_0_20px_rgba(37,99,235,0.3)]"
            >
              {loading ? <Loader2 className="animate-spin" size={14} /> : 'SPARK_CONSTELLATION'}
            </button>
          </form>
        </div>
      )}

      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="bg-blue-600 w-16 h-16 rounded-2xl flex items-center justify-center shadow-[0_0_30px_rgba(37,99,235,0.4)] hover:rotate-90 hover:rounded-full transition-all duration-500 active:scale-90"
      >
        <Plus size={32} className="text-white" />
      </button>
    </div>
  )
}