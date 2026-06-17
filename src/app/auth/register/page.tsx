"use client"

import { useState, useEffect } from "react"
import { supabase } from "@/lib/supabase"
import { useCartStore } from "@/store/cart"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Mail, User, Phone, MapPin, Home, Building2, Hash, Coffee, KeyRound, Lock, Eye, EyeOff, ArrowRight, ArrowLeft } from "lucide-react"
import Link from "next/link"
import toast from "react-hot-toast"
import { useRouter } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"
import DriftLines from "@/components/DriftLines"

type Step = "personal" | "address" | "otp"

const labelClass = "text-xs font-medium text-amber-200/60"
const inputClass = "pl-9 h-10 rounded-xl bg-amber-950/30 border-amber-900/40 text-amber-100 placeholder:text-amber-400/40 focus:bg-amber-950/40 focus:border-amber-700/50 text-sm"

function FormContent({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-center px-4 relative overflow-hidden bg-[#1A1410] min-h-[calc(100vh-64px)] md:min-h-[calc(100vh-80px)] mt-16 md:mt-20">
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-amber-700/15 rounded-full blur-3xl" />
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-orange-700/15 rounded-full blur-3xl" />
      <DriftLines />
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-sm relative"
      >
        <div className="bg-[#2A1F18] backdrop-blur-xl rounded-2xl shadow-2xl shadow-black/40 border border-amber-700/30 p-5 sm:p-6">
          {children}
        </div>
      </motion.div>
    </div>
  )
}

export default function RegisterPage() {
  const [step, setStep] = useState<Step>("personal")
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [phone, setPhone] = useState("")
  const [addressLine1, setAddressLine1] = useState("")
  const [addressLine2, setAddressLine2] = useState("")
  const [landmark, setLandmark] = useState("")
  const [city, setCity] = useState("Mumbai")
  const [district, setDistrict] = useState("Borivali West")
  const [state, setState] = useState("Maharashtra")
  const [pincode, setPincode] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [otp, setOtp] = useState("")
  const [loading, setLoading] = useState(false)
  const [cooldown, setCooldown] = useState(0)
  const router = useRouter()

  // Countdown for OTP resend cooldown
  useEffect(() => {
    if (cooldown <= 0) return
    const timer = setTimeout(() => setCooldown((c) => c - 1), 1000)
    return () => clearTimeout(timer)
  }, [cooldown])

  const canGoToAddress = () => {
    if (!name.trim()) { toast.error("Please enter your name"); return false }
    if (!email.trim()) { toast.error("Please enter your email"); return false }
    if (!phone.trim()) { toast.error("Please enter your phone number"); return false }
    if (password.length < 6) { toast.error("Password must be at least 6 characters"); return false }
    if (password !== confirmPassword) { toast.error("Passwords do not match"); return false }
    return true
  }

  const handleSendOtp = async () => {
    if (cooldown > 0) return
    if (!pincode || pincode.length < 6) {
      toast.error("Please enter a valid 6-digit pincode")
      return
    }
    if (password.length < 6) {
      toast.error("Password must be at least 6 characters")
      return
    }
    if (password !== confirmPassword) {
      toast.error("Passwords do not match")
      return
    }
    setLoading(true)

    try {
      const res = await fetch("/api/auth/send-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          name,
          phone,
          address_line1: addressLine1,
          address_line2: addressLine2,
          landmark,
          city,
          district,
          state,
          pincode,
        }),
      })
      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || "Failed to send OTP")
      }

      toast.success("OTP sent to your email!")
      setStep("otp")
      setCooldown(60)
    } catch (err: any) {
      setCooldown(60)
      toast.error(err.message || "Something went wrong")
    } finally {
      setLoading(false)
    }
  }

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const res = await fetch("/api/auth/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, code: otp }),
      })
      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || "Invalid OTP")
      }

      // Sign in with the chosen password
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (signInError) {
        throw new Error(signInError.message)
      }

      toast.success("Account created! Welcome!")
      useCartStore.getState().clearCart()
      setLoading(false)
      router.push("/")
    } catch (err: any) {
      console.error("verify error:", err)
      toast.error(err.message || "Something went wrong")
      setLoading(false)
    }
  }

  if (step === "otp") {
    return (
      <FormContent>
        <div className="text-center mb-4">
          <div className="w-10 h-10 bg-gradient-to-br from-amber-600 to-orange-700 rounded-xl flex items-center justify-center mx-auto mb-2 shadow-lg shadow-amber-600/20">
            <KeyRound className="w-5 h-5 text-amber-200" />
          </div>
          <h1 className="text-xl font-bold text-white">Verify OTP</h1>
          <p className="text-amber-200/40 text-xs mt-0.5">
            Code sent to <span className="text-amber-300">{email}</span>
          </p>
        </div>
        <form onSubmit={handleVerifyOtp} className="space-y-2.5">
          <div className="space-y-1">
            <Label className={labelClass}>OTP Code</Label>
            <Input
              type="text"
              placeholder="123456"
              maxLength={6}
              className="text-center text-lg tracking-[0.5em] h-11 rounded-xl bg-amber-950/30 border-amber-900/40 text-amber-100 placeholder:text-amber-400/40"
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
              required
            />
          </div>
          <Button
            type="submit"
            className="w-full h-10 rounded-xl bg-gradient-to-r from-amber-600 to-orange-700 hover:from-amber-500 hover:to-orange-600 text-white shadow-lg shadow-amber-700/20 text-sm"
            disabled={loading || otp.length < 6}
          >
            {loading ? "Verifying..." : "Verify & Create Account"}
          </Button>
          <Button
            type="button"
            variant="link"
            className="w-full text-[11px] text-amber-500/50 hover:text-amber-400 h-auto py-1"
            onClick={() => setStep("address")}
          >
            ← Back
          </Button>
        </form>
      </FormContent>
    )
  }

  return (
    <FormContent>
      {/* Step indicator */}
      <div className="flex items-center justify-center gap-1.5 mb-4">
        <div className={`h-1 rounded-full transition-all duration-300 ${step === "personal" ? "w-6 bg-amber-500" : "w-2 bg-amber-700/30"}`} />
        <div className={`h-1 rounded-full transition-all duration-300 ${step === "address" ? "w-6 bg-amber-500" : "w-2 bg-amber-700/30"}`} />
      </div>

      <AnimatePresence mode="wait">
        {step === "personal" && (
          <motion.div key="personal" initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 10 }} transition={{ duration: 0.2 }}>
            <div className="text-center mb-4">
              <div className="w-10 h-10 bg-gradient-to-br from-amber-600 to-orange-700 rounded-xl flex items-center justify-center mx-auto mb-2 shadow-lg shadow-amber-600/20">
                <Coffee className="w-5 h-5 text-amber-200" />
              </div>
              <h1 className="text-xl font-bold text-white">Create Account</h1>
              <p className="text-amber-200/40 text-xs mt-0.5">Step 1 — Personal Details</p>
            </div>
            <div className="space-y-2.5">
              <div className="space-y-1">
                <Label className={labelClass}>Full Name</Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-amber-600/50" />
                  <Input placeholder="John Doe" className={inputClass} value={name} onChange={(e) => setName(e.target.value)} required />
                </div>
              </div>
              <div className="space-y-1">
                <Label className={labelClass}>Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-amber-600/50" />
                  <Input type="email" placeholder="you@example.com" className={inputClass} value={email} onChange={(e) => setEmail(e.target.value)} required />
                </div>
                <p className="text-red-400 text-[13px] mt-0.5">Note : Enter a valid Email-ID for email Verification</p>
              </div>
              <div className="space-y-1">
                <Label className={labelClass}>Phone Number</Label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-amber-600/50" />
                  <Input type="tel" placeholder="+91 98765 43210" className={inputClass} value={phone} onChange={(e) => setPhone(e.target.value)} />
                </div>
              </div>
              <div className="space-y-1">
                <Label className={labelClass}>Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-amber-600/50" />
                  <Input type={showPassword ? "text" : "password"} placeholder="Min 6 characters" className={inputClass} value={password} onChange={(e) => setPassword(e.target.value)} required />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-white/60 hover:text-white/90 transition">
                    {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>
              <div className="space-y-1">
                <Label className={labelClass}>Confirm Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-amber-600/50" />
                  <Input type={showPassword ? "text" : "password"} placeholder="Re-enter password" className={inputClass} value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-white/60 hover:text-white/90 transition">
                    {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>
              <Button type="button" onClick={() => { if (canGoToAddress()) setStep("address") }} className="w-full h-10 rounded-xl bg-gradient-to-r from-amber-600 to-orange-700 hover:from-amber-500 hover:to-orange-600 text-white shadow-lg shadow-amber-700/20 text-sm font-medium mt-1">
                Next <ArrowRight size={15} className="ml-1" />
              </Button>
            </div>
          </motion.div>
        )}

        {step === "address" && (
          <motion.div key="address" initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }} transition={{ duration: 0.2 }}>
            <div className="text-center mb-4">
              <div className="w-10 h-10 bg-gradient-to-br from-amber-600 to-orange-700 rounded-xl flex items-center justify-center mx-auto mb-2 shadow-lg shadow-amber-600/20">
                <MapPin className="w-5 h-5 text-amber-200" />
              </div>
              <h1 className="text-xl font-bold text-white">Delivery Address</h1>
              <p className="text-amber-200/40 text-xs mt-0.5">Step 2 — Where to deliver</p>
            </div>
            <div className="space-y-2.5">
              <div className="space-y-1">
                <Label className={labelClass}>Address Line 1</Label>
                <div className="relative">
                  <Home className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-amber-600/50" />
                  <Input placeholder="Flat / House No., Building" className={inputClass} value={addressLine1} onChange={(e) => setAddressLine1(e.target.value)} required />
                </div>
              </div>
              <div className="space-y-1">
                <Label className={labelClass}>Address Line 2</Label>
                <div className="relative">
                  <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-amber-600/50" />
                  <Input placeholder="Street, Area (optional)" className={inputClass} value={addressLine2} onChange={(e) => setAddressLine2(e.target.value)} />
                </div>
              </div>
              <div className="space-y-1">
                <Label className={labelClass}>Landmark</Label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-amber-600/50" />
                  <Input placeholder="Nearby landmark (optional)" className={inputClass} value={landmark} onChange={(e) => setLandmark(e.target.value)} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2.5">
                <div className="space-y-1">
                  <Label className={labelClass}>City</Label>
                  <Input value={city} onChange={(e) => setCity(e.target.value)} className="h-10 rounded-xl bg-amber-950/30 border-amber-900/40 text-amber-100 text-sm" required />
                </div>
                <div className="space-y-1">
                  <Label className={labelClass}>District</Label>
                  <Input value={district} onChange={(e) => setDistrict(e.target.value)} className="h-10 rounded-xl bg-amber-950/30 border-amber-900/40 text-amber-100 text-sm" required />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2.5">
                <div className="space-y-1">
                  <Label className={labelClass}>State</Label>
                  <Input value={state} onChange={(e) => setState(e.target.value)} className="h-10 rounded-xl bg-amber-950/30 border-amber-900/40 text-amber-100 text-sm" required />
                </div>
                <div className="space-y-1">
                  <Label className={labelClass}>Pincode</Label>
                  <div className="relative">
                    <Hash className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-amber-600/50" />
                    <Input type="text" maxLength={6} placeholder="400067" className="pl-9 h-10 rounded-xl bg-amber-950/30 border-amber-900/40 text-amber-100 placeholder:text-amber-400/40 focus:bg-amber-950/40 focus:border-amber-700/50 text-sm" value={pincode} onChange={(e) => setPincode(e.target.value.replace(/\D/g, "").slice(0, 6))} required />
                  </div>
                </div>
              </div>
              <div className="flex gap-2 mt-1">
                <Button type="button" variant="outline" onClick={() => setStep("personal")} className="h-10 rounded-xl border-amber-900/40 text-amber-200/60 hover:text-amber-200 text-sm px-3">
                  <ArrowLeft size={15} />
                </Button>
                <Button type="button" onClick={handleSendOtp} className="flex-1 h-10 rounded-xl bg-gradient-to-r from-amber-600 to-orange-700 hover:from-amber-500 hover:to-orange-600 text-white shadow-lg shadow-amber-700/20 text-sm font-medium" disabled={loading || cooldown > 0}>
                  {loading ? "Sending..." : cooldown > 0 ? `Resend in ${cooldown}s` : "Send OTP"}
                </Button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <p className="text-center text-[11px] text-amber-200/40 mt-4">
        Already have an account?{" "}
        <Link href="/auth/login" className="text-amber-500 hover:text-amber-400 font-semibold hover:underline">Login</Link>
      </p>
    </FormContent>
  )
}
