"use client"

import { useRef, useState, useEffect, useCallback } from "react"
import { motion, useScroll, useTransform } from "framer-motion"
import { ArrowRight, Sparkles } from "lucide-react"
import Link from "next/link"

const videos = [
  { src: "https://assets.mixkit.co/videos/42480/42480-720.mp4", label: "Pizza" },
  { src: "https://assets.mixkit.co/videos/52414/52414-720.mp4", label: "Drinks" },
  { src: "https://assets.mixkit.co/videos/43044/43044-720.mp4", label: "Plating" },
  { src: "https://assets.mixkit.co/videos/42479/42479-720.mp4", label: "Prep" },
]

const DURATION = 6000

export default function HeroVideo() {
  const ref = useRef<HTMLDivElement>(null)
  const [active, setActive] = useState(0)
  const [nextActive, setNextActive] = useState(1)
  const [transitioning, setTransitioning] = useState(false)
  const timerRef = useRef<ReturnType<typeof setTimeout>>(undefined)

  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start start", "end start"],
  })
  const opacity = useTransform(scrollYProgress, [0, 1], [1, 0])
  const scale = useTransform(scrollYProgress, [0, 1], [1, 1.15])

  const advance = useCallback(() => {
    setTransitioning(true)
    setTimeout(() => {
      setActive((p) => (p + 1) % videos.length)
      setNextActive((p) => (p + 1) % videos.length)
      setTransitioning(false)
    }, 1000)
    timerRef.current = setTimeout(advance, DURATION)
  }, [])

  useEffect(() => {
    timerRef.current = setTimeout(advance, DURATION)
    return () => clearTimeout(timerRef.current)
  }, [advance])

  const goTo = (i: number) => {
    clearTimeout(timerRef.current)
    setTransitioning(true)
    setTimeout(() => {
      setActive(i)
      setNextActive((i + 1) % videos.length)
      setTransitioning(false)
    }, 600)
    timerRef.current = setTimeout(advance, DURATION)
  }

  return (
    <section
      ref={ref}
      className="relative flex items-center justify-center overflow-hidden mt-16 md:mt-20 min-h-[calc(100vh-64px)] md:min-h-[calc(100vh-80px)]"
    >
      {/* Background video carousel */}
      {videos.map((v, i) => (
        <video
          key={v.label}
          autoPlay
          muted
          loop
          playsInline
          className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-1000 ${
            i === active && !transitioning
              ? "opacity-100"
              : i === nextActive && transitioning
                ? "opacity-100"
                : "opacity-0"
          }`}
        >
          <source src={v.src} type="video/mp4" />
        </video>
      ))}

      {/* Gradient overlays */}
      <motion.div
        style={{ opacity }}
        className="absolute inset-0 bg-gradient-to-t from-[#0a0a0a] via-[#0a0a0a]/60 to-[#0a0a0a]/40"
      />
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-[#0a0a0a]" />

      {/* Content */}
      <motion.div
        style={{ opacity, y: useTransform(scrollYProgress, [0, 1], [0, 50]) }}
        className="relative z-10 text-center text-white px-4 max-w-5xl"
      >
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm border border-white/20 px-4 py-1.5 rounded-full text-sm mb-6"
        >
          <Sparkles size={14} className="text-amber-300" />
          Now open for dine-in, takeaway & delivery
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.1 }}
          className="text-5xl sm:text-6xl md:text-8xl font-bold mb-4 leading-tight"
        >
          <span className="text-amber-200/60 text-3xl sm:text-4xl md:text-5xl font-normal block mb-2">Welcome to</span>
          <span className="text-white">Eat</span> <span className="text-gradient">O&apos;Clock</span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.3 }}
          className="text-lg md:text-xl text-amber-200/60 mb-10 max-w-2xl mx-auto leading-relaxed"
        >
          Fast food, beverages, burgers, pizza, shakes, pasta & juices —
          <br className="hidden sm:block" />
          all freshly made with love in Borivali West
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.5 }}
          className="flex flex-col sm:flex-row gap-4 justify-center"
        >
          <Link
            href="/menu"
            className="group flex items-center justify-center gap-2 bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white px-8 py-3.5 rounded-full text-lg font-semibold shadow-xl shadow-amber-700/30 transition-all hover:shadow-2xl hover:scale-105 w-full sm:w-auto"
          >
            Explore Our Menu
            <ArrowRight size={20} className="group-hover:translate-x-1 transition" />
          </Link>
          <Link
            href="/reserve"
            className="flex items-center justify-center gap-2 bg-white/10 hover:bg-white/20 backdrop-blur-sm text-white px-8 py-3.5 rounded-full text-lg font-semibold transition border border-white/20 hover:border-white/40 w-full sm:w-auto"
          >
            Reserve a Table
          </Link>
        </motion.div>
      </motion.div>

      {/* Progress dots + scroll */}
      <div className="absolute bottom-10 left-1/2 -translate-x-1/2 z-10 flex items-center gap-3">
        {videos.map((_, i) => (
          <button
            key={i}
            onClick={() => goTo(i)}
            className={`h-1.5 rounded-full transition-all duration-500 ${
              i === active ? "w-8 bg-amber-400" : "w-1.5 bg-white/40 hover:bg-white/60"
            }`}
          />
        ))}
      </div>
    </section>
  )
}
