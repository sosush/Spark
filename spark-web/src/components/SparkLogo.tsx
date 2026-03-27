'use client'

import { motion } from 'framer-motion'

export default function SparkLogo({ size = 24, className = '' }: { size?: number, className?: string }) {
  return (
    <div className={`relative flex items-center justify-center ${className}`} style={{ width: size, height: size }}>
      <svg
        width={size}
        height={size}
        viewBox="0 0 100 100"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="overflow-visible"
      >
        {/* Core Glow */}
        <motion.circle
          cx="50"
          cy="50"
          r="25"
          fill="currentColor"
          className="opacity-20"
          animate={{ r: [20, 28, 20], opacity: [0.15, 0.3, 0.15] }}
          transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
        />
        
        {/* Constellation Lines */}
        <motion.path
          d="M50 20 L25 50 L50 80 L75 50 Z"
          stroke="currentColor"
          strokeWidth="4"
          strokeLinecap="round"
          strokeLinejoin="round"
          animate={{ strokeDasharray: ["0 300", "200 300"] }}
          transition={{ duration: 8, repeat: Infinity, ease: 'linear' }}
          className="opacity-40"
        />
        <path d="M50 20 L50 80" stroke="currentColor" strokeWidth="2" strokeDasharray="4 4" className="opacity-30" />
        <path d="M25 50 L75 50" stroke="currentColor" strokeWidth="2" strokeDasharray="4 4" className="opacity-30" />

        {/* Outer Orbitals */}
        <motion.path
          d="M15 50 A 35 35 0 1 1 85 50 A 35 35 0 1 1 15 50"
          stroke="currentColor"
          strokeWidth="2"
          strokeOpacity="0.2"
          fill="none"
          strokeDasharray="40 120"
          animate={{ rotate: 360 }}
          transition={{ duration: 15, repeat: Infinity, ease: 'linear' }}
          style={{ transformOrigin: '50px 50px' }}
        />

        {/* Nodes */}
        <circle cx="50" cy="20" r="5" fill="currentColor" />
        <circle cx="25" cy="50" r="5" fill="currentColor" />
        <circle cx="75" cy="50" r="5" fill="currentColor" />
        <circle cx="50" cy="80" r="5" fill="currentColor" />
        
        {/* Central Pulsing Spark */}
        <motion.circle 
          cx="50" cy="50" r="6" fill="currentColor" 
          animate={{ scale: [1, 1.4, 1] }} 
          transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }} 
        />
        
        {/* Star highlights */}
        <motion.path
          d="M50 0 L52 48 L100 50 L52 52 L50 100 L48 52 L0 50 L48 48 Z"
          fill="currentColor"
          className="opacity-0"
          animate={{ opacity: [0, 0.3, 0], scale: [0.8, 1.1, 0.8] }}
          transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut', delay: 1 }}
        />
      </svg>
    </div>
  )
}
