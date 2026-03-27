'use client'
import { createClient } from '@/utils/supabase/client'
import { motion } from 'framer-motion'
import { Globe, Code2, AlertCircle, Sparkles } from 'lucide-react'
import { useSearchParams } from 'next/navigation'
import { Suspense, useEffect } from 'react'
import Background from '@/components/Background'
import Link from 'next/link'
import SparkLogo from '@/components/SparkLogo'

function LoginContent() {
  const supabase = createClient()
  const error = useSearchParams().get('error')

  useEffect(() => { supabase.auth.signOut() }, [])

  const handleAuth = (provider: 'github' | 'google') => {
    supabase.auth.signInWithOAuth({
      provider,
      options: { redirectTo: `${window.location.origin}/auth/callback?mode=login` }
    })
  }

  return (
    <motion.div 
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 1, ease: [0.25, 1, 0.25, 1] }}
      className="w-full max-w-lg ethereal-island px-10 py-12 md:py-16 md:px-16 flex flex-col items-center relative overflow-hidden"
    >
      <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/20 rounded-full blur-[80px] opacity-60 mix-blend-screen pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-64 h-64 bg-rose-500/20 rounded-full blur-[80px] opacity-60 mix-blend-screen pointer-events-none" />

      {/* Emblem */}
      <div className="w-16 h-16 rounded-full bg-white/5 shadow-2xl flex items-center justify-center border border-white/10 mb-10 z-10 relative backdrop-blur-md">
        <SparkLogo className="text-indigo-400" size={32} />
      </div>

      <div className="text-center mb-10 z-10 relative">
        <h1 className="text-3xl md:text-4xl font-medium tracking-tight text-white smooth-text mb-3">
          Welcome back
        </h1>
        <p className="text-sm font-light text-zinc-400 max-w-xs mx-auto">
          Sign in to your workspace and pick up exactly where you left off.
        </p>
      </div>

      {error === 'not_found' && (
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }} 
          animate={{ opacity: 1, scale: 1 }}
          className="mb-8 w-full p-4 bg-rose-500/10 border border-rose-500/20 rounded-3xl text-rose-400 text-xs font-medium flex items-center gap-3 z-10 relative backdrop-blur-md"
        >
          <div className="w-6 h-6 rounded-full bg-rose-500/20 flex items-center justify-center shrink-0">
            <AlertCircle size={14} />
          </div>
          <span>We couldn't find an account. Feel free to register.</span>
        </motion.div>
      )}

      {/* Auth Actions */}
      <div className="w-full space-y-4 z-10 relative">
        <button 
          onClick={() => handleAuth('google')} 
          className="w-full relative flex items-center justify-center gap-3 py-4 px-6 rounded-full bg-white/5 text-zinc-200 font-medium hover:bg-white/10 hover:scale-[1.02] active:scale-[0.98] shadow-sm border border-white/10 transition-all duration-300 group backdrop-blur-md"
        >
          <Globe size={18} strokeWidth={1.5} className="text-zinc-400 group-hover:text-white transition-colors"/> 
          Continue with Google
        </button>
        <button 
          onClick={() => handleAuth('github')} 
          className="w-full relative flex items-center justify-center gap-3 py-4 px-6 rounded-full bg-indigo-500/10 text-indigo-300 font-medium hover:bg-indigo-500/20 hover:scale-[1.02] active:scale-[0.98] border border-indigo-500/30 transition-all duration-300 group backdrop-blur-md"
        >
          <Code2 size={18} strokeWidth={1.5} className="text-indigo-400 group-hover:text-indigo-300 transition-colors"/> 
          Continue with GitHub
        </button>
      </div>

      <div className="mt-10 text-center z-10 relative">
         <p className="text-xs font-medium text-zinc-500">
           Don't have an account?{' '}
           <Link href="/signup" className="text-indigo-400 hover:text-indigo-300 transition-colors relative after:absolute after:bottom-0 after:left-0 after:h-px after:w-0 hover:after:w-full after:bg-indigo-400 after:transition-all">
             Create one
           </Link>
         </p>
      </div>
    </motion.div>
  )
}

export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center p-6 text-[var(--foreground)] relative font-sans selection:bg-indigo-500/30 selection:text-indigo-100">
      <Background />
      <Suspense><LoginContent /></Suspense>
    </div>
  )
}