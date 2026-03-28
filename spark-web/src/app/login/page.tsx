'use client'
import { createClient } from '@/utils/supabase/client'
import { motion, AnimatePresence } from 'framer-motion'
import { Globe, Code2, Mail, Lock, Eye, EyeOff, ArrowRight, User } from 'lucide-react'
import { useSearchParams } from 'next/navigation'
import { Suspense, useEffect, useState } from 'react'
import Background from '@/components/Background'
import SparkLogo from '@/components/SparkLogo'

const supabase = createClient()

function LoginContent() {
  const error = useSearchParams().get('error')
  const [mode, setMode] = useState<'signin' | 'signup'>('signin')
  const [authMethod, setAuthMethod] = useState<'oauth' | 'email'>('oauth')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [fullName, setFullName] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [successMsg, setSuccessMsg] = useState<string | null>(null)

  useEffect(() => {
    if (!error || error === 'not_found') {
       supabase.auth.signOut().then(() => {
         window.localStorage.removeItem('sb-qobxnzaftlgxwbeasvmr-auth-token')
       })
    }
  }, [error])

  const handleOAuth = (provider: 'github' | 'google') => {
    supabase.auth.signInWithOAuth({
      provider,
      options: { 
        redirectTo: `${window.location.origin}/auth/callback`,
        scopes: provider === 'github' ? 'repo read:user' : undefined
      }
    })
  }

  const handleEmailAuth = async () => {
    setErrorMsg(null)
    setSuccessMsg(null)
    setLoading(true)

    if (!email || !password) {
      setErrorMsg('Please fill in all fields.')
      setLoading(false)
      return
    }

    if (mode === 'signup') {
      if (password !== confirmPassword) {
        setErrorMsg('Passwords do not match.')
        setLoading(false)
        return
      }
      if (password.length < 6) {
        setErrorMsg('Password must be at least 6 characters.')
        setLoading(false)
        return
      }

      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { full_name: fullName || email.split('@')[0] },
          emailRedirectTo: `${window.location.origin}/auth/callback`
        }
      })

      if (error) {
        setErrorMsg(error.message)
      } else {
        setSuccessMsg('Account created! Check your email to confirm, or sign in if confirmation is disabled.')
        // Try auto-login
        const { error: signInError } = await supabase.auth.signInWithPassword({ email, password })
        if (!signInError) {
          window.location.href = '/dashboard'
          return
        }
      }
    } else {
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) {
        setErrorMsg(error.message === 'Invalid login credentials' 
          ? 'Invalid email or password. If you signed up with Google/GitHub, set a password in your profile first.'
          : error.message
        )
      } else {
        window.location.href = '/dashboard'
        return
      }
    }
    setLoading(false)
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 1, ease: [0.25, 1, 0.25, 1] }}
      className="w-full max-w-lg ethereal-island px-10 py-12 md:py-16 md:px-16 flex flex-col items-center relative overflow-hidden"
    >
      <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/20 rounded-full blur-[80px] opacity-60 mix-blend-screen pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-64 h-64 bg-violet-500/20 rounded-full blur-[80px] opacity-60 mix-blend-screen pointer-events-none" />

      <div className="w-20 h-20 rounded-full bg-white/5 shadow-2xl flex items-center justify-center border border-white/10 mb-8 z-10 relative backdrop-blur-md">
        <SparkLogo className="text-indigo-400" size={40} />
      </div>

      <div className="text-center mb-8 z-10 relative">
        <h1 className="text-3xl md:text-4xl font-medium tracking-tight text-white smooth-text mb-3">
          {mode === 'signin' ? 'Enter Workspace' : 'Create Account'}
        </h1>
        <p className="text-sm font-light text-zinc-400 max-w-xs mx-auto">
          {mode === 'signin' 
            ? 'Welcome back to your multiverse.' 
            : 'Initialize your technical constellation.'}
        </p>
      </div>

      {/* Auth Method Toggle */}
      <div className="w-full flex gap-2 mb-6 z-10 relative bg-white/5 p-1 rounded-full border border-white/10 backdrop-blur-md">
        <button
          onClick={() => setAuthMethod('oauth')}
          className={`flex-1 py-2.5 rounded-full text-xs font-medium transition-all ${authMethod === 'oauth' ? 'bg-white/10 text-white shadow-sm' : 'text-zinc-400 hover:text-zinc-300'}`}
        >
          OAuth
        </button>
        <button
          onClick={() => setAuthMethod('email')}
          className={`flex-1 py-2.5 rounded-full text-xs font-medium transition-all ${authMethod === 'email' ? 'bg-white/10 text-white shadow-sm' : 'text-zinc-400 hover:text-zinc-300'}`}
        >
          Email
        </button>
      </div>

      {/* Error / Success Messages */}
      <AnimatePresence mode="wait">
        {errorMsg && (
          <motion.div
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="w-full mb-4 p-3 bg-rose-500/10 border border-rose-500/20 rounded-2xl text-rose-400 text-xs font-medium z-10 relative backdrop-blur-md text-center"
          >
            {errorMsg}
          </motion.div>
        )}
        {successMsg && (
          <motion.div
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="w-full mb-4 p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl text-emerald-400 text-xs font-medium z-10 relative backdrop-blur-md text-center"
          >
            {successMsg}
          </motion.div>
        )}
      </AnimatePresence>

      <div className="w-full space-y-3 z-10 relative">
        <AnimatePresence mode="wait">
          {authMethod === 'oauth' ? (
            <motion.div
              key="oauth"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.3 }}
              className="space-y-3"
            >
              <button
                onClick={() => handleOAuth('google')}
                className="w-full relative flex items-center justify-center gap-3 py-4 px-6 rounded-full bg-white/5 text-zinc-200 font-medium hover:bg-white/10 hover:scale-[1.02] active:scale-[0.98] shadow-sm border border-white/10 transition-all duration-300 group backdrop-blur-md"
              >
                <Globe size={18} strokeWidth={1.5} className="text-zinc-400 group-hover:text-white transition-colors" />
                Continue with Google
              </button>
              <button
                onClick={() => handleOAuth('github')}
                className="w-full relative flex items-center justify-center gap-3 py-4 px-6 rounded-full bg-indigo-500/10 text-indigo-300 font-medium hover:bg-indigo-500/20 hover:scale-[1.02] active:scale-[0.98] border border-indigo-500/30 transition-all duration-300 group backdrop-blur-md"
              >
                <Code2 size={18} strokeWidth={1.5} className="text-indigo-400 group-hover:text-indigo-300 transition-colors" />
                Continue with GitHub
              </button>
            </motion.div>
          ) : (
            <motion.div
              key="email"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
              className="space-y-3"
            >
              {mode === 'signup' && (
                <div className="relative">
                  <User size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500" />
                  <input
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Full Name"
                    className="w-full bg-white/5 border border-white/10 rounded-full pl-11 pr-5 py-3.5 text-sm text-white outline-none focus:border-indigo-500/50 backdrop-blur-md transition-colors placeholder:text-zinc-500"
                  />
                </div>
              )}

              <div className="relative">
                <Mail size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Email address"
                  className="w-full bg-white/5 border border-white/10 rounded-full pl-11 pr-5 py-3.5 text-sm text-white outline-none focus:border-indigo-500/50 backdrop-blur-md transition-colors placeholder:text-zinc-500"
                  onKeyDown={(e) => e.key === 'Enter' && handleEmailAuth()}
                />
              </div>

              <div className="relative">
                <Lock size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Password"
                  className="w-full bg-white/5 border border-white/10 rounded-full pl-11 pr-11 py-3.5 text-sm text-white outline-none focus:border-indigo-500/50 backdrop-blur-md transition-colors placeholder:text-zinc-500"
                  onKeyDown={(e) => e.key === 'Enter' && handleEmailAuth()}
                />
                <button onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300 transition-colors">
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>

              {mode === 'signup' && (
                <div className="relative">
                  <Lock size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Confirm Password"
                    className="w-full bg-white/5 border border-white/10 rounded-full pl-11 pr-5 py-3.5 text-sm text-white outline-none focus:border-indigo-500/50 backdrop-blur-md transition-colors placeholder:text-zinc-500"
                    onKeyDown={(e) => e.key === 'Enter' && handleEmailAuth()}
                  />
                </div>
              )}

              <button
                onClick={handleEmailAuth}
                disabled={loading}
                className="w-full py-4 bg-indigo-500/20 hover:bg-indigo-500/30 text-indigo-200 font-medium rounded-full flex items-center justify-center gap-3 border border-indigo-500/30 transition-all hover:scale-[1.02] active:scale-[0.98] backdrop-blur-md disabled:opacity-50"
              >
                {loading ? (
                  <div className="w-4 h-4 border-2 border-indigo-400/30 border-t-indigo-400 rounded-full animate-spin" />
                ) : (
                  <ArrowRight size={18} />
                )}
                {mode === 'signin' ? 'Sign In' : 'Create Account'}
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Mode Toggle */}
      <div className="mt-8 text-center z-10 relative">
        <p className="text-xs font-medium text-zinc-500">
          {mode === 'signin' ? "Don't have an account? " : "Already have an account? "}
          <button
            onClick={() => { setMode(mode === 'signin' ? 'signup' : 'signin'); setErrorMsg(null); setSuccessMsg(null) }}
            className="text-indigo-400 hover:text-indigo-300 transition-colors relative after:absolute after:bottom-0 after:left-0 after:h-px after:w-0 hover:after:w-full after:bg-indigo-400 after:transition-all"
          >
            {mode === 'signin' ? 'Create one' : 'Sign in'}
          </button>
        </p>
      </div>

      <div className="mt-4 text-center z-10 relative">
        <p className="text-[10px] text-zinc-600">
          By continuing, you agree to our terms and the neural workspace manifest.
        </p>
      </div>
    </motion.div>
  )
}

export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center p-6 text-[var(--foreground)] relative font-sans selection:bg-indigo-500/30 selection:text-indigo-100 overflow-hidden">
      <Background />
      <Suspense><LoginContent /></Suspense>
    </div>
  )
}