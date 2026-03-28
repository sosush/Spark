'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LayoutDashboard, Lightbulb, Network, User, FolderOpen, LogOut } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import Background from '@/components/Background'
import SparkLogo from '@/components/SparkLogo'
import { createClient } from '@/utils/supabase/client'

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null)
  const [user, setUser] = useState<any>(null)
  const [profile, setProfile] = useState<any>(null)
  const [mounted, setMounted] = useState(false)
  const [imgError, setImgError] = useState(false)
  const [isLocked, setIsLocked] = useState(true) // Default true until verified
  const [enteredPassword, setEnteredPassword] = useState('')
  const [unlocking, setUnlocking] = useState(false)
  const [unlockError, setUnlockError] = useState(false)
  const supabase = createClient()

  useEffect(() => {
    setMounted(true)
    async function getUser() {
      const { data: { session } } = await supabase.auth.getSession()
      if (session?.user) {
        setUser(session.user)
        const { data: profileData } = await supabase.from('profiles').select('avatar_url, has_password').eq('id', session.user.id).single()
        setProfile(profileData)

        if (profileData?.has_password && !sessionStorage.getItem('spark_unlocked')) {
          setIsLocked(true)
        } else {
          setIsLocked(false)
        }
      } else {
        setIsLocked(false)
      }
    }
    getUser()
  }, [supabase])

  const handleUnlock = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user?.email) return
    setUnlocking(true)
    setUnlockError(false)
    const { error } = await supabase.auth.signInWithPassword({
      email: user.email,
      password: enteredPassword
    })
    if (error) {
      setUnlockError(true)
    } else {
      sessionStorage.setItem('spark_unlocked', 'true')
      setIsLocked(false)
    }
    setUnlocking(false)
  }

  const menuItems = [
    { name: 'Dashboard', icon: LayoutDashboard, href: '/dashboard' },
    { name: 'Projects', icon: FolderOpen, href: '/projects' },
    { name: 'Network', icon: Network, href: '/constellation' },
    { name: 'Ideas', icon: Lightbulb, href: '/work' },
    { name: 'Profile', icon: User, href: '/profile' },
  ]

  return (
    <div className="min-h-screen text-[var(--foreground)] flex flex-col overflow-hidden relative bg-transparent font-sans">
      <Background />

      {/* PRIVACY SHIELD OVERLAY */}
      <AnimatePresence>
        {isLocked && mounted && profile?.has_password && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-2xl"
          >
            <div className="ethereal-island p-12 w-full max-w-md relative overflow-hidden text-center">
              <div className="absolute top-0 right-0 w-64 h-64 bg-violet-500/20 rounded-full blur-[80px] opacity-40 mix-blend-screen pointer-events-none" />
              <div className="w-20 h-20 rounded-full bg-white/5 border border-white/10 flex items-center justify-center mx-auto mb-6 backdrop-blur-md shadow-2xl relative z-10">
                <SparkLogo size={40} className="text-violet-400" />
              </div>
              <h2 className="text-2xl font-medium tracking-tight text-white mb-2 relative z-10">Workspace Locked</h2>
              <p className="text-sm text-zinc-400 font-light mb-8 relative z-10">Enter your master password to access your encrypted environment.</p>

              <form onSubmit={handleUnlock} className="space-y-4 relative z-10">
                <input
                  type="password"
                  value={enteredPassword}
                  onChange={(e) => { setEnteredPassword(e.target.value); setUnlockError(false); }}
                  placeholder="Master Password"
                  className={`w-full bg-white/5 border ${unlockError ? 'border-red-500/50' : 'border-white/10'} rounded-full px-6 py-4 text-sm text-center text-white outline-none focus:border-violet-500/50 backdrop-blur-md transition-colors`}
                  autoFocus
                />
                <button type="submit" disabled={unlocking || !enteredPassword} className="w-full py-4 bg-violet-500/10 hover:bg-violet-500/20 border border-violet-500/20 text-violet-300 rounded-full font-medium text-sm transition-all disabled:opacity-50">
                  {unlocking ? 'Decrypting...' : 'Unlock Workspace'}
                </button>
              </form>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating Header (Branding) */}
      <header className="fixed top-8 left-12 z-50 flex items-center gap-4">
        <SparkLogo size={40} className="text-indigo-400" />
        <h1 className="text-4xl text-white font-normal relative -top-1" style={{ fontFamily: 'var(--font-caveat)' }}>
          Spark
        </h1>
      </header>

      {/* Right side status & Profile */}
      <div className="fixed top-8 right-12 z-50 flex items-center gap-6">
        <div className="hidden md:flex items-center gap-2 px-3 py-1.5 bg-white/5 rounded-full border border-white/10 backdrop-blur-md">
          <div className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_12px_rgba(52,211,153,0.6)]" />
          <span className="text-[10px] text-zinc-400 font-medium tracking-wide uppercase">Synced</span>
        </div>

        <div className="flex items-center gap-4">
          <button 
            onClick={async () => {
              await supabase.auth.signOut()
              window.location.href = '/login'
            }}
            className="text-xs text-zinc-500 hover:text-red-400 transition-colors flex items-center gap-2 group p-2"
          >
            <LogOut size={18} strokeWidth={1.5} className="group-hover:-translate-x-1 transition-transform" />
          </button>

          <Link href="/profile" className="relative group">
            <div className="w-10 h-10 rounded-full bg-white/5 border border-white/10 p-0.5 shadow-xl shadow-black/20 overflow-hidden backdrop-blur-md hover:scale-105 transition-transform active:scale-95 border-indigo-500/30">
              {mounted && profile?.avatar_url && profile.avatar_url.includes('/avatars/') && !imgError ? (
                <img
                  src={profile.avatar_url}
                  alt="Profile"
                  className="w-full h-full object-cover rounded-full"
                  onError={() => setImgError(true)}
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-zinc-800 text-zinc-500 rounded-full">
                  <User size={20} strokeWidth={1.5} />
                </div>
              )}
            </div>
            {/* Soft highlight ring around avatar */}
            <div className="absolute inset-0 rounded-full ring-2 ring-indigo-500/0 group-hover:ring-indigo-500/20 transition-all pointer-events-none" />
          </Link>
        </div>
      </div>

      {/* Main Spacious Content */}
      <main className="flex-1 relative z-10 w-full max-w-7xl mx-auto pt-32 pb-48 px-8 md:px-16 overflow-y-auto scrollbar-hide">
        {children}
      </main>

      {/* The Floating Pill Dock */}
      <div className="fixed bottom-12 left-0 right-0 z-50 flex justify-center pointer-events-none">
        <nav className="pointer-events-auto ethereal-pill px-4 py-3 flex items-center gap-2">
          {menuItems.map((item, index) => {
            const isActive = pathname === item.href
            const isHovered = hoveredIndex === index
            const isNeighbor = hoveredIndex !== null && Math.abs(hoveredIndex - index) === 1

            // Mac-OS style dock magnification logic
            let scale = 1
            let y = 0
            if (isHovered) { scale = 1.3; y = -10 }
            else if (isNeighbor) { scale = 1.15; y = -4 }

            return (
              <Link
                key={item.name}
                href={item.href}
                className="relative group outline-none"
                onMouseEnter={() => setHoveredIndex(index)}
                onMouseLeave={() => setHoveredIndex(null)}
              >
                <motion.div
                  animate={{ scale, y }}
                  transition={{ type: "spring", stiffness: 300, damping: 20 }}
                  className={`w-12 h-12 flex items-center justify-center rounded-full transition-colors duration-300 relative ${isActive ? 'bg-white/10' : 'hover:bg-white/5'}`}
                >
                  <item.icon
                    size={20}
                    strokeWidth={isActive ? 2 : 1.5}
                    className={isActive ? 'text-indigo-400' : 'text-zinc-400 group-hover:text-zinc-200'}
                  />

                  {/* Active dot indicator */}
                  {isActive && (
                    <motion.div
                      layoutId="activeDockDot"
                      className="absolute -bottom-1 w-1 h-1 rounded-full bg-indigo-400 shadow-[0_0_8px_rgba(129,140,248,0.8)]"
                    />
                  )}
                </motion.div>

                {/* Tooltip */}
                <AnimatePresence>
                  {isHovered && (
                    <motion.div
                      initial={{ opacity: 0, y: 10, scale: 0.9 }}
                      animate={{ opacity: 1, y: -8, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.9 }}
                      className="absolute -top-10 left-1/2 -translate-x-1/2 px-3 py-1.5 bg-zinc-900 border border-white/10 text-zinc-200 text-[10px] font-medium tracking-wide rounded-full shadow-lg whitespace-nowrap backdrop-blur-md"
                    >
                      {item.name}
                    </motion.div>
                  )}
                </AnimatePresence>
              </Link>
            )
          })}
        </nav>
      </div>

    </div>
  )
}