'use client'

import { useEffect, useRef, useState } from 'react'
import { motion } from 'framer-motion'

// Seeded random for consistent star positions across renders
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

const STARS = generateStars(120)
const BRIGHT_STARS = generateStars(20).map(s => ({
  ...s,
  size: s.size * 1.8 + 1,
  opacity: s.opacity * 0.6 + 0.4,
}))

export default function Background() {
  const [mounted, setMounted] = useState(false)
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    setMounted(true)
  }, [])

  // Subtle shooting star canvas effect
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
    window.addEventListener('resize', resize)

    interface ShootingStar {
      x: number; y: number; len: number; speed: number;
      angle: number; opacity: number; life: number; maxLife: number
    }

    const shootingStars: ShootingStar[] = []

    const spawnStar = () => {
      shootingStars.push({
        x: Math.random() * canvas.width * 0.8,
        y: Math.random() * canvas.height * 0.4,
        len: Math.random() * 80 + 40,
        speed: Math.random() * 3 + 2,
        angle: Math.PI / 4 + (Math.random() - 0.5) * 0.3,
        opacity: 0,
        life: 0,
        maxLife: Math.random() * 60 + 40,
      })
    }

    let frame = 0
    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      frame++

      // Spawn a shooting star every ~5 seconds on average
      if (Math.random() < 0.003) spawnStar()

      for (let i = shootingStars.length - 1; i >= 0; i--) {
        const s = shootingStars[i]
        s.life++
        s.x += Math.cos(s.angle) * s.speed
        s.y += Math.sin(s.angle) * s.speed

        // Fade in then out
        const progress = s.life / s.maxLife
        s.opacity = progress < 0.2 ? progress * 5 : (1 - progress) * 1.2
        s.opacity = Math.min(s.opacity, 0.7)

        const tailX = s.x - Math.cos(s.angle) * s.len
        const tailY = s.y - Math.sin(s.angle) * s.len

        const gradient = ctx.createLinearGradient(tailX, tailY, s.x, s.y)
        gradient.addColorStop(0, `rgba(255,255,255,0)`)
        gradient.addColorStop(1, `rgba(200,210,255,${s.opacity})`)

        ctx.strokeStyle = gradient
        ctx.lineWidth = 1.5
        ctx.lineCap = 'round'
        ctx.beginPath()
        ctx.moveTo(tailX, tailY)
        ctx.lineTo(s.x, s.y)
        ctx.stroke()

        if (s.life >= s.maxLife) shootingStars.splice(i, 1)
      }

      requestAnimationFrame(animate)
    }

    const raf = requestAnimationFrame(animate)
    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('resize', resize)
    }
  }, [mounted])

  if (!mounted) return <div className="fixed inset-0 bg-[#06060F] -z-50" />

  return (
    <div className="fixed inset-0 overflow-hidden bg-[#06060F] -z-50 pointer-events-none">
      
      {/* Deep cosmic nebula layers — very subtle, very far away */}
      
      {/* Distant violet nebula */}
      <motion.div
        animate={{
          x: ["0vw", "3vw", "-2vw", "0vw"],
          y: ["0vh", "-2vh", "3vh", "0vh"],
          opacity: [0.08, 0.14, 0.06, 0.08],
        }}
        transition={{ duration: 60, repeat: Infinity, ease: "easeInOut" }}
        className="absolute top-[-15%] left-[-10%] w-[70vw] h-[70vw] rounded-full bg-[#3B0764] blur-[200px]"
      />
      
      {/* Deep blue cosmic dust */}
      <motion.div
        animate={{
          x: ["0vw", "-4vw", "2vw", "0vw"],
          y: ["0vh", "4vh", "-3vh", "0vh"],
          opacity: [0.06, 0.12, 0.05, 0.06],
        }}
        transition={{ duration: 75, repeat: Infinity, ease: "easeInOut" }}
        className="absolute bottom-[-10%] right-[-15%] w-[65vw] h-[65vw] rounded-full bg-[#172554] blur-[220px]"
      />

      {/* Faint indigo mist */}
      <motion.div
        animate={{
          opacity: [0.04, 0.09, 0.03, 0.04],
        }}
        transition={{ duration: 50, repeat: Infinity, ease: "easeInOut" }}
        className="absolute top-[30%] left-[20%] w-[50vw] h-[50vw] rounded-full bg-[#312E81] blur-[180px]"
      />

      {/* Star field — static tiny dots with twinkling */}
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
          className="absolute rounded-full bg-white"
          style={{
            left: `${star.x}%`,
            top: `${star.y}%`,
            width: `${star.size}px`,
            height: `${star.size}px`,
          }}
        />
      ))}

      {/* Brighter accent stars with a soft glow */}
      {BRIGHT_STARS.map(star => (
        <motion.div
          key={`b-${star.id}`}
          animate={{
            opacity: [star.opacity, star.opacity * 0.4, star.opacity],
            scale: [1, 1.3, 1],
          }}
          transition={{
            duration: star.duration + 2,
            repeat: Infinity,
            delay: star.delay,
            ease: "easeInOut",
          }}
          className="absolute rounded-full"
          style={{
            left: `${star.x}%`,
            top: `${star.y}%`,
            width: `${star.size}px`,
            height: `${star.size}px`,
            background: `radial-gradient(circle, rgba(200,210,255,${star.opacity}) 0%, rgba(130,140,220,${star.opacity * 0.3}) 50%, transparent 70%)`,
            boxShadow: `0 0 ${star.size * 3}px rgba(165,180,252,${star.opacity * 0.3})`,
          }}
        />
      ))}

      {/* Shooting stars canvas layer */}
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full"
        style={{ mixBlendMode: 'screen' }}
      />

      {/* Ultra-subtle grain overlay for that analog sky feel */}
      <div 
        className="absolute inset-0 opacity-[0.03] mix-blend-overlay" 
        style={{ 
          backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=%220 0 256 256%22 xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cfilter id=%22n%22%3E%3CfeTurbulence type=%22fractalNoise%22 baseFrequency=%220.9%22 numOctaves=%224%22 stitchTiles=%22stitch%22/%3E%3C/filter%3E%3Crect width=%22100%25%22 height=%22100%25%22 filter=%22url(%23n)%22/%3E%3C/svg%3E")',
          backgroundSize: '200px 200px'
        }} 
      />
    </div>
  )
}
