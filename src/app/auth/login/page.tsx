"use client"

import { useState, useEffect } from "react"
import { supabase } from "@/lib/supabase"
import { useCartStore } from "@/store/cart"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Mail, Lock, Coffee } from "lucide-react"
import Link from "next/link"
import toast from "react-hot-toast"
import { useRouter } from "next/navigation"
import { motion } from "framer-motion"
import DriftLines from "@/components/DriftLines"

export default function LoginPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    if (params.get("error")) {
      toast.error("Login failed. Please try again.")
    }
  }, [])

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) {
      toast.error(error.message)
      setLoading(false)
      return
    }
    toast.success("Welcome back!")
    useCartStore.getState().clearCart()
    setLoading(false)
    router.push("/")
  }

  const handleGoogleLogin = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
        queryParams: {
          prompt: "select_account",
        },
      },
    })
    if (error) {
      toast.error(error.message)
    }
  }

  const labelClass = "text-xs font-medium text-amber-200/60"
  const inputClass = "pl-9 h-10 rounded-xl bg-amber-950/30 border-amber-900/40 text-amber-100 placeholder:text-amber-400/40 focus:bg-amber-950/40 focus:border-amber-700/50 text-sm"

  return (
    <div className="flex items-center justify-center px-4 relative overflow-hidden bg-[#1A1410] min-h-[calc(100vh-64px)] md:min-h-[calc(100vh-80px)] mt-16 md:mt-20">
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-amber-700/15 rounded-full blur-3xl" />
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-orange-700/15 rounded-full blur-3xl" />

      <DriftLines />

      <div className="w-full max-w-sm relative">

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <div className="bg-[#2A1F18] backdrop-blur-xl rounded-2xl shadow-2xl shadow-black/40 border border-amber-700/30 p-5 sm:p-6">
          <div className="text-center mb-4">
            <div className="w-10 h-10 bg-gradient-to-br from-amber-600 to-orange-700 rounded-xl flex items-center justify-center mx-auto mb-2 shadow-lg shadow-amber-600/20">
              <Coffee className="w-5 h-5 text-amber-200" />
            </div>
            <h1 className="text-xl font-bold text-white">Welcome Back</h1>
            <p className="text-amber-200/40 text-xs mt-0.5">Login to order your favorites</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-2.5">
            <div className="space-y-1">
              <Label htmlFor="email" className={labelClass}>Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-amber-600/50" />
                <Input id="email" type="email" placeholder="you@example.com" className={inputClass} value={email} onChange={(e) => setEmail(e.target.value)} required />
              </div>
            </div>
            <div className="space-y-1">
              <Label htmlFor="password" className={labelClass}>Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-amber-600/50" />
                <Input id="password" type="password" placeholder="••••••••" className={inputClass} value={password} onChange={(e) => setPassword(e.target.value)} required />
              </div>
            </div>
            <Button type="submit" className="w-full h-10 rounded-xl bg-gradient-to-r from-amber-600 to-orange-700 hover:from-amber-500 hover:to-orange-600 text-white shadow-lg shadow-amber-700/20 text-sm font-medium" disabled={loading}>
              {loading ? "Logging in..." : "Login"}
            </Button>
          </form>

          <div className="relative my-3">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-amber-900/30" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-[#2A1F18] px-3 text-amber-600/50 font-medium text-[10px]">Or continue with</span>
            </div>
          </div>

          <motion.button
            whileHover={{ scale: 1.02, rotateX: 3, rotateY: -3, boxShadow: "0 8px 25px rgba(180, 120, 60, 0.3)" }}
            whileTap={{ scale: 0.97 }}
            transition={{ type: "spring", stiffness: 300, damping: 15 }}
            onClick={handleGoogleLogin}
            className="w-full h-10 rounded-xl border border-amber-300/20 bg-[#F5F0EB] hover:bg-gradient-to-r hover:from-[#3C281E] hover:to-[#2A1F18] hover:text-[#D4A06A] hover:border-amber-700/30 text-[#3C3C3C] active:scale-[0.98] flex items-center justify-center gap-2.5 text-sm font-medium shadow-sm hover:shadow-xl transition-all cursor-pointer"
            style={{ perspective: "500px" }}
          >
            <svg viewBox="0 0 24 24" className="w-4 h-4 shrink-0">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" />
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
            </svg>
            Continue with Google
          </motion.button>

          <p className="text-center text-[11px] text-amber-200/40 mt-4">
            Don&apos;t have an account?{" "}
            <Link href="/auth/register" className="text-amber-500 hover:text-amber-400 font-semibold hover:underline">Register</Link>
          </p>
          </div>
        </motion.div>
      </div>
    </div>
  )
}
