'use client'

import { useEffect, useRef, useState } from 'react'
import { motion } from 'framer-motion'

// Seeded random for consistent stars
function seededRandom(seed: number) {
  const x = Math.sin(seed) * 10000
  return x - Math.floor(x)
}

function generateStars(count: number) {
  return Array.from({ length: count }, (_, i) => ({
    id: i,
    x: seededRandom(i * 3 + 1) * 100,
    y: seededRandom(i * 3 + 2) * 100,
    size: seededRandom(i * 3 + 3) * 2 + 0.5,
    opacity: seededRandom(i * 7) * 0.6 + 0.15,
    delay: seededRandom(i * 11) * 8,
    duration: seededRandom(i * 13) * 4 + 3,
  }))
}

const STARS = generateStars(100)

export default function Background() {
  const [mounted, setMounted] = useState(false)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const mouseRef = useRef({ x: -1000, y: -1000, active: false })

  useEffect(() => {
    setMounted(true)
  }, [])

  // Interactive Neural Net Effect
  useEffect(() => {
    if (!mounted) return
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const resize = () => {
      canvas.width = window.innerWidth
      canvas.height = window.innerHeight
    }
    resize()

    const handleMouseMove = (e: MouseEvent) => {
      mouseRef.current = { x: e.clientX, y: e.clientY, active: true }
    }
    const handleMouseLeave = () => {
      mouseRef.current.active = false
    }

    window.addEventListener('resize', resize)
    window.addEventListener('mousemove', handleMouseMove)
    window.addEventListener('mouseleave', handleMouseLeave)

    interface Particle {
      x: number; y: number; vx: number; vy: number;
      size: number; baseSize: number; color: string;
    }

    const particles: Particle[] = []
    const particleCount = Math.min(Math.floor(window.innerWidth / 15), 100)
    const connectionDist = 180
    const mouseDist = 250

    for (let i = 0; i < particleCount; i++) {
      particles.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        vx: (Math.random() - 0.5) * 0.4,
        vy: (Math.random() - 0.5) * 0.4,
        baseSize: Math.random() * 2 + 1,
        size: 0,
        color: `rgba(99, 102, 241, ${Math.random() * 0.5 + 0.2})` // Indigo-500
      })
    }

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      
      particles.forEach((p, i) => {
        // Standard movement
        p.x += p.vx
        p.y += p.vy

        // Wrap around screen
        if (p.x < 0) p.x = canvas.width
        if (p.x > canvas.width) p.x = 0
        if (p.y < 0) p.y = canvas.height
        if (p.y > canvas.height) p.y = 0

        // Mouse interaction (Repulsion)
        if (mouseRef.current.active) {
          const dx = mouseRef.current.x - p.x
          const dy = mouseRef.current.y - p.y
          const dist = Math.sqrt(dx * dx + dy * dy)
          
          if (dist < mouseDist) {
            const force = (mouseDist - dist) / mouseDist
            const angle = Math.atan2(dy, dx)
            p.x -= Math.cos(angle) * force * 1.5
            p.y -= Math.sin(angle) * force * 1.5
          }
        }

        // Pulse the node scale
        p.size = p.baseSize + Math.sin(Date.now() * 0.002 + i) * 0.5

        // Draw connections (the "Net")
        for (let j = i + 1; j < particles.length; j++) {
          const p2 = particles[j]
          const dx = p.x - p2.x
          const dy = p.y - p2.y
          const dist = Math.sqrt(dx * dx + dy * dy)

          if (dist < connectionDist) {
            const opacity = (1 - dist / connectionDist) * 0.5
            ctx.beginPath()
            ctx.lineWidth = 0.8
            ctx.strokeStyle = `rgba(129, 140, 248, ${opacity})` // Indigo-400
            ctx.moveTo(p.x, p.y)
            ctx.lineTo(p2.x, p2.y)
            ctx.stroke()
          }
        }

        // Also connect to mouse if active
        if (mouseRef.current.active) {
          const dx = mouseRef.current.x - p.x
          const dy = mouseRef.current.y - p.y
          const dist = Math.sqrt(dx * dx + dy * dy)
          if (dist < connectionDist) {
            const opacity = (1 - dist / connectionDist) * 0.6
            ctx.beginPath()
            ctx.lineWidth = 1.2
            ctx.strokeStyle = `rgba(139, 92, 246, ${opacity})` // Violet-500
            ctx.moveTo(p.x, p.y)
            ctx.lineTo(mouseRef.current.x, mouseRef.current.y)
            ctx.stroke()
          }
        }

        // Draw node
        ctx.fillStyle = p.color
        ctx.shadowBlur = 10
        ctx.shadowColor = p.color
        ctx.beginPath()
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2)
        ctx.fill()
        ctx.shadowBlur = 0
      })

      requestAnimationFrame(animate)
    }

    const raf = requestAnimationFrame(animate)
    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('resize', resize)
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('mouseleave', handleMouseLeave)
    }
  }, [mounted])

  if (!mounted) return <div className="fixed inset-0 bg-[#06060F] -z-50" />

  return (
    <div className="fixed inset-0 overflow-hidden bg-[#06060F] -z-50 pointer-events-none">
      
      {/* Nebulae for depth */}
      <motion.div
        animate={{
          x: ["0vw", "3vw", "-2vw", "0vw"],
          y: ["0vh", "-2vh", "3vh", "0vh"],
          opacity: [0.08, 0.14, 0.06, 0.08],
        }}
        transition={{ duration: 60, repeat: Infinity, ease: "easeInOut" }}
        className="absolute top-[-15%] left-[-10%] w-[70vw] h-[70vw] rounded-full bg-[#3B0764] blur-[200px]"
      />
      <motion.div
        animate={{
          x: ["0vw", "-4vw", "2vw", "0vw"],
          y: ["0vh", "4vh", "-3vh", "0vh"],
          opacity: [0.06, 0.12, 0.05, 0.06],
        }}
        transition={{ duration: 75, repeat: Infinity, ease: "easeInOut" }}
        className="absolute bottom-[-10%] right-[-15%] w-[65vw] h-[65vw] rounded-full bg-[#172554] blur-[220px]"
      />

      {/* Background Star Field (Subtle backdrop) */}
      {STARS.map(star => (
        <motion.div
          key={`s-${star.id}`}
          animate={{
            opacity: [star.opacity, star.opacity * 0.3, star.opacity],
          }}
          transition={{
            duration: star.duration,
            repeat: Infinity,
            delay: star.delay,
            ease: "easeInOut",
          }}
          className="absolute rounded-full bg-white/20"
          style={{
            left: `${star.x}%`,
            top: `${star.y}%`,
            width: `${star.size}px`,
            height: `${star.size}px`,
          }}
        />
      ))}

      {/* The Particle Net Layer */}
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full"
        style={{ opacity: 0.8 }}
      />

      {/* Subtle grain overlay */}
      <div 
        className="absolute inset-0 opacity-[0.02] mix-blend-overlay" 
        style={{ 
          backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=%220 0 256 256%22 xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cfilter id=%22n%22%3E%3CfeTurbulence type=%22fractalNoise%22 baseFrequency=%220.9%22 numOctaves=%224%22 stitchTiles=%22stitch%22/%3E%3C/filter%3E%3Crect width=%22100%25%22 height=%22100%25%22 filter=%22url(%23n)%22/%3E%3C/svg%3E")',
          backgroundSize: '200px 200px'
        }} 
      />
    </div>
  )
}
