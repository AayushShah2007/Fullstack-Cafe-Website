"use client"

import { useEffect, useState } from "react"
import Link from "next/link"

export default function Logo({ className = "" }: { className?: string }) {
  const [logoSrc, setLogoSrc] = useState<string | null>(null)

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/admin/settings")
        if (res.ok) {
          const data = await res.json()
          if (data.logo_url) setLogoSrc(data.logo_url)
        }
      } catch {}
    })()
  }, [])

  if (logoSrc) {
    return (
      <Link href="/" className={`flex items-center group ${className}`}>
        <img src={logoSrc} alt="Eat O'Clock" className="h-8 w-auto object-contain" />
      </Link>
    )
  }

  return (
    <Link href="/" className={`flex items-center group ${className}`}>
      <span style={{ fontFamily: "Playfair Display, serif", fontSize: 28, lineHeight: "28px" }} className="font-bold tracking-tight text-white">
        <span className="tracking-[0.12em]"><span className="text-white">EAT</span> <span className="text-gradient">O&apos;CLOCK</span></span>
      </span>
    </Link>
  )
}
