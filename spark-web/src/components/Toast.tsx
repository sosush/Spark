'use client'
import { createContext, useContext, useState, useCallback, ReactNode } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Check, AlertTriangle, X, Info } from 'lucide-react'

type ToastType = 'success' | 'error' | 'info'

interface Toast {
  id: number
  message: string
  type: ToastType
}

interface ToastContextType {
  toast: (message: string, type?: ToastType) => void
}

const ToastContext = createContext<ToastContextType | null>(null)

export function useToast() {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error('useToast must be used within ToastProvider')
  return ctx
}

let toastId = 0

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])

  const toast = useCallback((message: string, type: ToastType = 'info') => {
    const id = ++toastId
    setToasts(prev => [...prev, { id, message, type }])
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id))
    }, 4000)
  }, [])

  const dismiss = (id: number) => {
    setToasts(prev => prev.filter(t => t.id !== id))
  }

  const icons = {
    success: <Check size={16} className="text-emerald-400" />,
    error: <AlertTriangle size={16} className="text-rose-400" />,
    info: <Info size={16} className="text-indigo-400" />,
  }

  const borders = {
    success: 'border-emerald-500/20',
    error: 'border-rose-500/20',
    info: 'border-white/10',
  }

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      
      {/* Toast container — fixed top-right */}
      <div className="fixed top-6 right-6 z-[200] flex flex-col gap-3 pointer-events-none">
        <AnimatePresence mode="popLayout">
          {toasts.map(t => (
            <motion.div
              key={t.id}
              layout
              initial={{ opacity: 0, x: 80, scale: 0.9 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: 80, scale: 0.9 }}
              transition={{ type: "spring", damping: 25, stiffness: 350 }}
              className={`pointer-events-auto flex items-center gap-3 px-5 py-4 bg-[#18181B]/80 backdrop-blur-xl rounded-2xl border ${borders[t.type]} shadow-2xl max-w-sm`}
            >
              <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center shrink-0">
                {icons[t.type]}
              </div>
              <p className="text-sm text-zinc-200 font-medium flex-1">{t.message}</p>
              <button onClick={() => dismiss(t.id)} className="text-zinc-500 hover:text-zinc-300 transition-colors shrink-0">
                <X size={14} />
              </button>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  )
}
