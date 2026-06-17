"use client"

import { useEffect, useState, useRef, useCallback } from "react"
import { motion, AnimatePresence } from "framer-motion"

export default function SplashScreen({ onFinish }: { onFinish: () => void }) {
  const [show, setShow] = useState(true)
  const [loaded, setLoaded] = useState(false)
  const [blocked, setBlocked] = useState(false)
  const [fadeOut, setFadeOut] = useState(false)
  const videoRef = useRef<HTMLVideoElement>(null)
  const startedRef = useRef(false)

  const finish = useCallback(() => {
    setFadeOut(true)
    setTimeout(() => {
      setShow(false)
      document.body.style.overflow = ""
      setTimeout(onFinish, 400)
    }, 800)
  }, [onFinish])

  useEffect(() => {
    document.body.style.overflow = "hidden"
    const fallback = setTimeout(() => finish(), 12000)
    return () => { clearTimeout(fallback); document.body.style.overflow = "" }
  }, [finish])

  const startVideo = useCallback(() => {
    const video = videoRef.current
    if (!video || startedRef.current) return
    startedRef.current = true
    video.playbackRate = 2
    video.play().catch(() => setBlocked(true))
  }, [])

  useEffect(() => {
    const video = videoRef.current
    if (!video) return
    if (video.readyState >= 2) { setLoaded(true); startVideo() }
    else { const h = () => { setLoaded(true); startVideo() }; video.addEventListener("loadeddata", h); return () => video.removeEventListener("loadeddata", h) }
  }, [startVideo])

  const handleUserPlay = () => {
    const video = videoRef.current
    if (!video) return
    setBlocked(false)
    video.playbackRate = 2
    video.play().catch(() => setBlocked(true))
  }

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.8 }}
          className="fixed inset-0 z-[100] bg-black overflow-hidden"
        >
          <video
            ref={videoRef}
            className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-700 ${loaded ? "opacity-100" : "opacity-0"}`}
            src="https://assets.mixkit.co/videos/4989/4989-720.mp4"
            poster="https://assets.mixkit.co/videos/4989/4989-thumb-720-0.jpg"
            muted
            playsInline
            onEnded={finish}
          />

          {/* Dark overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-black/10" />

          {/* Loading spinner */}
          {!loaded && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-8 h-8 border border-amber-700/30 rounded-full animate-spin border-t-amber-600/60" />
            </div>
          )}

          {/* Autoplay blocked — tap to watch */}
          {blocked && (
            <button
              onClick={handleUserPlay}
              className="absolute inset-0 flex flex-col items-center justify-center z-20 cursor-pointer bg-black/60"
            >
              <div className="w-16 h-16 rounded-full border-2 border-amber-600/50 flex items-center justify-center backdrop-blur-sm mb-4">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="#D4A06A"><polygon points="6,4 20,12 6,20" /></svg>
              </div>
              <p className="text-amber-500/70 text-sm tracking-wider uppercase">Tap to watch</p>
            </button>
          )}

          {/* Brand overlay */}
          <motion.div
            className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none"
            initial={{ opacity: 0 }}
            animate={{ opacity: loaded && !blocked ? 1 : 0 }}
            transition={{ duration: 1.5, delay: 0.5 }}
          >
            <h1 className="text-4xl md:text-6xl font-bold text-white tracking-tight drop-shadow-[0_0_30px_rgba(0,0,0,0.5)]">
              Eat <span className="text-[#D4A06A]">O&apos;Clock</span>
            </h1>
            <p className="text-[#D4A06A] text-sm mt-3 tracking-[0.2em] uppercase drop-shadow-[0_0_10px_rgba(0,0,0,0.5)]">
              Freshly Made • Always Delicious
            </p>
          </motion.div>

          {/* Bottom info */}
          <motion.p
            className="absolute bottom-8 left-0 right-0 text-center text-amber-300/70 text-xs tracking-widest uppercase pointer-events-none"
            initial={{ opacity: 0 }}
            animate={{ opacity: loaded && !blocked ? 1 : 0 }}
            transition={{ duration: 1, delay: 1 }}
          >
            Borivali West • Mumbai
          </motion.p>

          {/* Skip button */}
          <motion.button
            onClick={finish}
            className="absolute top-6 right-6 text-amber-600/40 hover:text-amber-400/70 text-xs tracking-wider uppercase transition-colors z-10 bg-black/20 px-4 py-2 rounded-full backdrop-blur-sm border border-amber-800/20"
            initial={{ opacity: 0 }}
            animate={{ opacity: loaded && !blocked ? 1 : 0 }}
            transition={{ duration: 1, delay: 2 }}
          >
            Skip →
          </motion.button>

          {/* Fade-out overlay */}
          <AnimatePresence>
            {fadeOut && (
              <motion.div
                className="absolute inset-0 bg-black"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.8 }}
              />
            )}
          </AnimatePresence>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
