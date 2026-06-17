"use client"

import { Suspense, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { supabase } from "@/lib/supabase"

function CallbackHandler() {
  const router = useRouter()
  const searchParams = useSearchParams()

  useEffect(() => {
    const handleCallback = async () => {
      const code = searchParams.get("code")
      if (code) {
        await supabase.auth.exchangeCodeForSession(code)
      }
      router.replace("/")
    }
    handleCallback()
  }, [router, searchParams])

  return null
}

export default function AuthCallbackPage() {
  return (
    <div className="min-h-screen bg-[#1A1410] flex items-center justify-center">
      <div className="w-8 h-8 border-4 border-amber-600 border-t-transparent rounded-full animate-spin" />
      <Suspense fallback={null}>
        <CallbackHandler />
      </Suspense>
    </div>
  )
}
