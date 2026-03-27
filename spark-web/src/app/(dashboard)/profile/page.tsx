'use client'
import { useState, useEffect } from 'react'
import { createClient } from '@/utils/supabase/client'
import { Save, Plus, Trash2, User, Globe, Upload, Loader2, FileText, Eye } from 'lucide-react'
import { motion } from 'framer-motion'
import { useToast } from '@/components/Toast'

export default function Profile() {
  const supabase = createClient()
  const { toast } = useToast()
  const [profile, setProfile] = useState<any>({ username: '', full_name: '', avatar_url: '', resume_url: '', urls: [''] })
  const [updating, setUpdating] = useState(false)
  const [loading, setLoading] = useState(true)
  const [imgError, setImgError] = useState(false)

  useEffect(() => {
    async function loadIdentity() {
      const { data: { session } } = await supabase.auth.getSession()
      if (session) {
        const { data } = await supabase.from('profiles').select('*').eq('id', session.user.id).single()
        if (data) {
          setProfile({
            ...data,
            urls: data.urls && data.urls.length > 0 ? data.urls : ['']
          })
        }
      }
      setLoading(false)
    }
    loadIdentity()
  }, [supabase])

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, bucket: 'avatars' | 'resumes') => {
    const file = e.target.files?.[0]
    if (!file) return
    setUpdating(true)
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) return

    const filePath = `${session.user.id}/${Date.now()}-${file.name}`
    const { error: uploadError } = await supabase.storage.from(bucket).upload(filePath, file, { upsert: true })
    
    if (uploadError) {
      toast('Upload failed: ' + uploadError.message, 'error')
    } else {
      const { data: { publicUrl } } = supabase.storage.from(bucket).getPublicUrl(filePath)
      const field = bucket === 'avatars' ? 'avatar_url' : 'resume_url'
      
      const { error: dbUpdateError } = await supabase.from('profiles').update({ [field]: publicUrl }).eq('id', session.user.id)
      
      if (!dbUpdateError) {
        setProfile((prev: any) => ({ ...prev, [field]: publicUrl }))
      }
    }
    setUpdating(false)
  }

  const syncIdentity = async () => {
    setUpdating(true)
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) return

    const filteredUrls = profile.urls
      .filter((u: string) => u.trim() !== '')
      .map((u: string) => {
        const trimmed = u.trim()
        if (trimmed && !trimmed.startsWith('http://') && !trimmed.startsWith('https://')) {
          return trimmed.startsWith('www.') ? `https://${trimmed}` : `https://${trimmed}`
        }
        return trimmed
      })
    
    const { error } = await supabase.from('profiles').update({
        username: profile.username,
        full_name: profile.full_name,
        urls: filteredUrls,
        avatar_url: profile.avatar_url,
        resume_url: profile.resume_url
    }).eq('id', session.user.id)
    
    if (error) {
      toast('Sync failed: ' + error.message, 'error')
    } else {
      setProfile((prev: any) => ({ ...prev, urls: filteredUrls.length > 0 ? filteredUrls : [''] }))
      toast('Profile saved successfully', 'success')
    }
    setUpdating(false)
  }

  if (loading) return null

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="max-w-6xl mx-auto py-12 space-y-12">
      
      {/* HEADER SECTION */}
      <div className="ethereal-island p-10 flex flex-col md:flex-row gap-10 items-center overflow-hidden relative group">
        
        {/* Decorative Glow */}
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-indigo-500/10 rounded-full blur-[100px] opacity-40 mix-blend-screen pointer-events-none group-hover:opacity-60 transition-opacity duration-1000" />
        
        <div className="relative group/avatar cursor-pointer z-10 shrink-0">
          <div className="w-36 h-36 rounded-full bg-white/5 border border-white/10 flex items-center justify-center overflow-hidden transition-all duration-700 backdrop-blur-md shadow-2xl">
             {profile.avatar_url && !imgError ? (
               <img 
                 src={profile.avatar_url} 
                 className="w-full h-full object-cover group-hover/avatar:scale-110 transition-transform duration-700" 
                 onError={() => setImgError(true)}
               />
             ) : (
                <div className="w-full h-full flex items-center justify-center bg-zinc-800 text-zinc-500">
                  <User size={64} strokeWidth={1.5} />
                </div>
             )}
          </div>
          <label className="absolute inset-0 bg-black/40 opacity-0 group-hover/avatar:opacity-100 transition-opacity rounded-full flex flex-col items-center justify-center cursor-pointer backdrop-blur-sm">
            <Upload size={20} className="text-white mb-2" />
            <span className="text-[10px] text-white font-medium uppercase tracking-widest">Update</span>
            <input type="file" className="hidden" accept="image/*" onChange={(e) => handleFileUpload(e, 'avatars')} />
          </label>
        </div>
        
        <div className="flex-1 z-10 text-center md:text-left">
           <h1 className="text-4xl md:text-5xl font-medium tracking-tight text-white smooth-text mb-2">{profile.full_name || 'Anonymous User'}</h1>
           <p className="text-zinc-400 font-light text-lg">@{profile.username || 'unknown'}</p>
        </div>

        <button onClick={syncIdentity} disabled={updating} className="px-8 py-4 bg-white/5 hover:bg-white/10 border border-white/10 text-white rounded-full font-medium text-sm shadow-xl flex items-center gap-3 transition-all backdrop-blur-md z-10">
          {updating ? <Loader2 size={16} className="animate-spin text-indigo-400" /> : <Save size={16} className="text-zinc-400"/>} Save Profile
        </button>
      </div>

      {/* SPECS SECTION */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <section className="ethereal-island p-10 space-y-10 relative overflow-hidden">
          <div className="flex items-center gap-3 text-lg font-medium tracking-tight text-white z-10 relative">
            Identity References
          </div>
          
          <div className="space-y-6 z-10 relative">
            <div className="space-y-2">
              <label className="text-xs font-light text-zinc-400 tracking-wide">Display Name</label>
              <input value={profile.full_name} onChange={e => setProfile({...profile, full_name: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-sm text-white outline-none focus:border-indigo-500/50 backdrop-blur-md transition-colors" />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-light text-zinc-400 tracking-wide">Handle</label>
              <input value={profile.username} onChange={e => setProfile({...profile, username: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-sm text-white outline-none focus:border-indigo-500/50 backdrop-blur-md transition-colors" />
            </div>

            <div className="pt-4 space-y-4">
              <label className="text-xs font-light text-zinc-400 tracking-wide">Connected Links</label>
              {profile.urls.map((url: string, i: number) => (
                <div key={i} className="flex gap-4 items-center">
                  <input value={url} onChange={e => {
                     const u = [...profile.urls]; u[i] = e.target.value; setProfile({...profile, urls: u})
                  }} className="flex-1 bg-white/5 border border-white/10 rounded-2xl px-5 py-3 text-sm text-white outline-none focus:border-indigo-500/50 backdrop-blur-md transition-colors" placeholder="https://..."/>
                  
                  {i === profile.urls.length - 1 ? (
                    <button onClick={() => setProfile({...profile, urls: [...profile.urls, '']})} className="w-12 h-12 flex items-center justify-center rounded-2xl bg-white/5 border border-white/10 text-zinc-400 hover:text-white transition-colors backdrop-blur-md"><Plus size={18}/></button>
                  ) : (
                    <button onClick={() => setProfile({...profile, urls: profile.urls.filter((_:any, idx:any) => idx !== i)})} className="w-12 h-12 flex items-center justify-center rounded-2xl bg-white/5 border border-white/10 text-zinc-500 hover:text-rose-400 hover:border-rose-500/30 transition-colors backdrop-blur-md"><Trash2 size={18}/></button>
                  )}
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* RESUME SECTION */}
        <aside className="ethereal-island p-10 flex flex-col justify-between relative overflow-hidden">
           <div className="absolute top-0 right-0 w-64 h-64 bg-teal-500/10 rounded-full blur-[80px] opacity-40 mix-blend-screen pointer-events-none" />

           <div>
              <h3 className="text-lg font-medium tracking-tight text-white mb-8 flex items-center gap-3 relative z-10"><FileText size={20} className="text-teal-400"/> Resume Document</h3>
              
              {profile.resume_url ? (
                <div className="w-full aspect-[3/4] rounded-3xl relative group overflow-hidden border border-white/10 z-10">
                   {/* Live embedded PDF preview — shows the actual first page */}
                   <iframe 
                     src={`${profile.resume_url}#toolbar=0&navpanes=0&scrollbar=0&view=FitH`} 
                     className="w-full h-full rounded-3xl bg-white pointer-events-none"
                     title="Resume Preview"
                   />
                   {/* Clickable overlay to open full-screen */}
                   <button 
                     onClick={() => window.open(profile.resume_url, '_blank')} 
                     className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 flex flex-col items-center justify-end pb-6 gap-2 cursor-pointer"
                   >
                      <div className="w-12 h-12 bg-white/20 border border-white/30 rounded-full flex items-center justify-center text-white shadow-2xl backdrop-blur-md">
                        <Eye size={20} />
                      </div>
                      <span className="text-xs font-medium text-white/90">Open Full Document</span>
                   </button>
                </div>
              ) : (
                <div className="w-full h-64 border border-dashed border-white/10 bg-white/5 rounded-3xl flex flex-col items-center justify-center text-zinc-500 font-light text-sm backdrop-blur-md relative z-10">No Document Uploaded</div>
              )}
           </div>

           <label className="w-full flex items-center justify-center gap-3 py-4 mt-8 bg-white/5 hover:bg-white/10 border border-white/10 rounded-full font-medium text-sm text-white cursor-pointer transition-all backdrop-blur-md relative z-10">
             <Upload size={18} className="text-zinc-400"/> {profile.resume_url ? 'Replace Document' : 'Upload PDF'}
             <input type="file" className="hidden" accept=".pdf" onChange={(e) => handleFileUpload(e, 'resumes')} />
           </label>
        </aside>
      </div>
    </motion.div>
  )
}