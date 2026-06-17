"use client"

import { useEffect, useRef } from "react"
import { supabase } from "@/lib/supabase"
import { useAuthStore } from "@/store/auth"
import type { User } from "@/types"

async function fetchRole(userId: string): Promise<string> {
  try {
    const res = await fetch(`/api/user/role?userId=${userId}`)
    if (res.ok) {
      const data = await res.json()
      return data.role || "user"
    }
  } catch {}
  return "user"
}

export default function AuthProvider({
  children,
}: {
  children: React.ReactNode
}) {
  const { setUser, setLoading } = useAuthStore()
  const restored = useRef(false)

  useEffect(() => {
    let cancelled = false
    const isNewTab = !sessionStorage.getItem("eatoclock-tab")

    if (isNewTab) {
      sessionStorage.setItem("eatoclock-tab", crypto.randomUUID())
      setUser(null)
      setLoading(false)
      supabase.auth.signOut({ scope: "local" }).catch(() => {})
      restored.current = true
    }

    // Immediately restore session for existing tabs
    const init = async () => {
      if (!isNewTab && !restored.current) {
        restored.current = true
        const { data } = await supabase.auth.getSession()
        if (cancelled) return
        if (data.session?.user) {
          const su = data.session.user
          const meta = su.user_metadata || {}
          const role = await fetchRole(su.id)
          setUser({
            id: su.id,
            email: su.email || "",
            name: meta.name || su.email?.split("@")[0] || "User",
            role,
            created_at: su.created_at || new Date().toISOString(),
          } as User)
        } else {
          setLoading(false)
        }
      }
    }
    init()

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event: any, session: any) => {
      if (cancelled) return
      if (isNewTab && event === "INITIAL_SESSION") return

      if (session?.user) {
        const su = session.user
        const meta = su.user_metadata || {}
        const role = await fetchRole(su.id)
        setUser({
          id: su.id,
          email: su.email || "",
          name: meta.name || su.email?.split("@")[0] || "User",
          role,
          created_at: su.created_at || new Date().toISOString(),
        } as User)
      } else {
        setUser(null)
      }
    })

    // When tab regains focus, re-check session
    const onFocus = () => {
      if (cancelled || !sessionStorage.getItem("eatoclock-tab")) return
      supabase.auth.getSession().then(({ data }) => {
        if (cancelled) return
        if (data.session?.user) {
          const su = data.session.user
          const meta = su.user_metadata || {}
          fetchRole(su.id).then((role) => {
            if (!cancelled) {
              setUser({
                id: su.id,
                email: su.email || "",
                name: meta.name || su.email?.split("@")[0] || "User",
                role,
                created_at: su.created_at || new Date().toISOString(),
              } as User)
            }
          })
        }
      })
    }
    window.addEventListener("focus", onFocus)

    return () => {
      cancelled = true
      subscription.unsubscribe()
      window.removeEventListener("focus", onFocus)
    }
  }, [setUser, setLoading])

  return <>{children}</>
}
