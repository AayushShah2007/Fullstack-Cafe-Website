import { createClient } from "@supabase/supabase-js"

function createTabStorage() {
  const isClient = typeof window !== "undefined"
  return {
    getItem(key: string) {
      if (!isClient) return null
      const val = sessionStorage.getItem(key)
      if (val) return val
      // Fallback to cookies (e.g. after OAuth callback sets cookies via createServerClient)
      // Consume once — migrate to sessionStorage and delete cookie
      try {
        const match = document.cookie.match(new RegExp(`(?:^|;\\s*)${key.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}=(.*?)(?:;|$)`))
        if (match) {
          const cookieVal = match[1]
          sessionStorage.setItem(key, cookieVal)
          document.cookie = `${key}=; path=/; max-age=0`
          return cookieVal
        }
      } catch {}
      return null
    },
    setItem(key: string, value: string) {
      if (!isClient) return
      sessionStorage.setItem(key, value)
    },
    removeItem(key: string) {
      if (!isClient) return
      sessionStorage.removeItem(key)
      try {
        document.cookie = `${key}=; path=/; max-age=0`
      } catch {}
    },
  }
}

export const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  {
    auth: {
      storage: createTabStorage(),
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: true,
    },
  }
)
