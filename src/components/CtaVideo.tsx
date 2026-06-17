"use client"

import { useRef, useEffect, useState } from "react"

const clips = [
  "https://assets.mixkit.co/videos/42482/42482-720.mp4",
  "https://assets.mixkit.co/videos/47110/47110-720.mp4",
  "https://assets.mixkit.co/videos/41106/41106-720.mp4",
]

export default function CtaVideo() {
  const [activeIndex, setActiveIndex] = useState(0)
  const refs = useRef<(HTMLVideoElement | null)[]>([])

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % clips.length)
    }, 6000)
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    refs.current.forEach((video, i) => {
      if (!video) return
      if (i === activeIndex) {
        video.currentTime = 0
        video.play().catch(() => {})
      } else {
        video.pause()
      }
    })
  }, [activeIndex])

  return (
    <div className="absolute inset-0">
      {clips.map((src, i) => (
        <div
          key={src}
          className={`absolute inset-0 transition-opacity duration-1000 ${
            i === activeIndex ? "opacity-40" : "opacity-0"
          }`}
        >
          <video
            ref={(el) => { refs.current[i] = el }}
            src={src}
            playsInline
            muted
            loop
            className="w-full h-full object-cover"
          />
        </div>
      ))}
      <div className="absolute inset-0 bg-gradient-to-b from-white/50 via-white/10 to-white/50" />
    </div>
  )
}
