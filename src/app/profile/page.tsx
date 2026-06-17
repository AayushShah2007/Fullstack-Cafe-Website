"use client"

import { useAuthStore } from "@/store/auth"
import { useRouter } from "next/navigation"
import { useEffect } from "react"
import { User, Mail, Phone, MapPin, Home, Building2, Hash, Calendar } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"

export default function ProfilePage() {
  const { user, isLoading } = useAuthStore()
  const router = useRouter()

  useEffect(() => {
    if (!isLoading && !user) router.push("/auth/login")
  }, [isLoading, user, router])

  if (isLoading || !user) return null

  const fields = [
    { icon: User, label: "Name", value: user.name },
    { icon: Mail, label: "Email", value: user.email },
    { icon: Phone, label: "Phone", value: user.phone || "—" },
    { icon: Home, label: "Address Line 1", value: user.address_line1 || "—" },
    { icon: Building2, label: "Address Line 2", value: user.address_line2 || "—" },
    { icon: MapPin, label: "City", value: user.city || "—" },
    { icon: MapPin, label: "District", value: user.district || "—" },
    { icon: MapPin, label: "State", value: user.state || "—" },
    { icon: Hash, label: "Pincode", value: user.pincode || "—" },
    { icon: Calendar, label: "Member Since", value: new Date(user.created_at).toLocaleDateString("en-IN", { year: "numeric", month: "long", day: "numeric" }) },
  ]

  return (
    <div className="min-h-[calc(100vh-64px)] md:min-h-[calc(100vh-80px)] mt-16 md:mt-20 bg-[#1A1410] px-4 py-8">
      <div className="max-w-lg mx-auto">
        {/* Header */}
        <div className="text-center mb-6">
          <img
            src={`https://api.dicebear.com/9.x/notionists-neutral/svg?seed=${encodeURIComponent(user.email)}&backgroundColor=transparent`}
            alt={user.name}
            className="w-20 h-20 rounded-full mx-auto ring-4 ring-amber-600/20 bg-gradient-to-br from-amber-800/40 to-orange-800/40"
          />
          <h1 className="text-2xl font-bold text-white mt-4">My Profile</h1>
        </div>

        {/* Info Card */}
        <div className="bg-[#2A1F18] rounded-2xl border border-amber-700/30 overflow-hidden">
          {fields.map((field, i) => (
            <div
              key={field.label}
              className={`flex items-center gap-3 px-5 py-3.5 ${
                i < fields.length - 1 ? "border-b border-amber-700/10" : ""
              }`}
            >
              <field.icon className="w-4 h-4 text-amber-600/50 shrink-0" />
              <div className="min-w-0">
                <p className="text-[11px] text-amber-400/40 font-medium">{field.label}</p>
                <p className="text-sm text-amber-100/90 truncate">{field.value}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Back to home */}
        <div className="text-center mt-6">
          <Link href="/">
            <Button variant="outline" className="border-amber-700/40 text-amber-300 hover:bg-white/10">
              ← Back to Home
            </Button>
          </Link>
        </div>
      </div>
    </div>
  )
}
