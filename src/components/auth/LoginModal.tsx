"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { supabase } from "@/lib/supabase"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Mail, Lock, Coffee, X } from "lucide-react"
import Link from "next/link"
import toast from "react-hot-toast"
import { useRouter } from "next/navigation"

export default function LoginModal({
  open,
  onClose,
}: {
  open: boolean
  onClose: () => void
}) {
  const router = useRouter()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [mode] = useState<"login">("login")

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
    onClose()
    router.refresh()
  }

  const handleGoogleLogin = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    })
    if (error) toast.error(error.message)
  }

  const labelClass = "text-[11px] font-medium text-amber-200/60"
  const inputClass = "pl-9 h-10 rounded-xl bg-amber-950/30 border-amber-900/40 text-amber-100 placeholder:text-amber-400/40 focus:bg-amber-950/40 focus:border-amber-700/50 text-sm"

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[90] flex items-center justify-center px-4 bg-black/60 backdrop-blur-sm"
          onClick={(e) => {
            if (e.target === e.currentTarget) onClose()
          }}
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 20 }}
            transition={{ duration: 0.3, ease: [0.25, 0.1, 0.25, 1] }}
            className="relative w-full max-w-sm"
          >
            <div className="bg-[#2A1F18] backdrop-blur-xl rounded-2xl shadow-2xl shadow-black/40 border border-amber-700/30 p-5 sm:p-6">
              <button
                onClick={onClose}
                className="absolute top-3 right-3 p-1 hover:bg-amber-950/40 rounded-full transition text-amber-500/50 hover:text-amber-300"
              >
                <X size={16} />
              </button>

              <div className="text-center mb-4">
                <div className="w-10 h-10 bg-gradient-to-br from-amber-600 to-orange-700 rounded-xl flex items-center justify-center mx-auto mb-2 shadow-lg shadow-amber-600/20">
                  <Coffee className="w-5 h-5 text-amber-200" />
                </div>
                <h2 className="text-lg font-bold text-white">
                  {mode === "login" ? "Welcome Back!" : "Join Us"}
                </h2>
                <p className="text-amber-200/40 text-[11px] mt-0.5">
                  {mode === "login"
                    ? "Login to order your favorites"
                    : "Create an account to start ordering"}
                </p>
              </div>

              {/* Google Button */}
              <button
                onClick={handleGoogleLogin}
                className="w-full flex items-center justify-center gap-2.5 h-10 rounded-xl border border-amber-300/20 bg-[#F5F0EB] hover:bg-white transition font-medium text-[#3C3C3C] text-sm shadow-sm mb-3"
              >
                <svg viewBox="0 0 24 24" className="w-4 h-4">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" />
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                </svg>
                Continue with Google
              </button>

              <div className="relative mb-3">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t border-amber-900/30" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-[#2A1F18] px-3 text-amber-600/50 font-medium text-[10px]">Or with email</span>
                </div>
              </div>

              <form onSubmit={handleLogin} className="space-y-2.5">
                <div className="space-y-1">
                  <label className={labelClass}>Email</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-amber-600/50" />
                    <Input type="email" placeholder="you@example.com" className={inputClass} value={email} onChange={(e) => setEmail(e.target.value)} required />
                  </div>
                </div>
                <div className="space-y-1">
                  <label className={labelClass}>Password</label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-amber-600/50" />
                    <Input type="password" placeholder="••••••••" className={inputClass} value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6} />
                  </div>
                </div>
                <Button type="submit" className="w-full h-10 rounded-xl bg-gradient-to-r from-amber-600 to-orange-700 hover:from-amber-500 hover:to-orange-600 text-white shadow-lg shadow-amber-700/20 text-sm font-medium" disabled={loading}>
                  {loading ? "Please wait..." : "Login"}
                </Button>
              </form>

              <p className="text-center text-[11px] text-amber-200/40 mt-4">
                Don&apos;t have an account?{" "}
                <Link href="/auth/register" onClick={onClose} className="text-amber-500 hover:text-amber-400 font-semibold hover:underline">
                  Register
                </Link>
              </p>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
