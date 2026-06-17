"use client"

import { useEffect, useState } from "react"

export default function FooterBrand() {
  const [settings, setSettings] = useState<{ store_name?: string; logo_url?: string }>({})

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/admin/settings")
        if (res.ok) setSettings(await res.json())
      } catch {}
    })()
  }, [])

  const name = settings.store_name || "Eat O'Clock"

  if (settings.logo_url) {
    return (
      <div>
        <img src={settings.logo_url} alt={name} className="h-10 object-contain mb-3" />
        <p className="text-sm leading-relaxed text-gray-400">
          Your favorite neighborhood cafe serving fresh fast food, beverages, and more since 2024.
        </p>
      </div>
    )
  }

  return (
    <div>
      <div className="flex items-center gap-2 mb-3">
        <div className="w-8 h-8 bg-gradient-to-br from-amber-600 to-orange-700 rounded-lg flex items-center justify-center">
          <span className="text-white font-bold text-sm">{name.charAt(0)}</span>
        </div>
        <span className="font-bold text-white text-lg">
          {name.split(" ")[0]} <span className="text-amber-400">{name.split(" ").slice(1).join(" ") || "O'Clock"}</span>
        </span>
      </div>
      <p className="text-sm leading-relaxed text-gray-400">
        Your favorite neighborhood cafe serving fresh fast food, beverages, and more since 2024.
      </p>
    </div>
  )
}
