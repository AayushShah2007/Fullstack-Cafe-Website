"use client"

import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { useEffect, useRef, useState, useCallback } from "react"
import { supabase } from "@/lib/supabase"
import { useAuthStore } from "@/store/auth"
import type { User } from "@/types"
import {
  LayoutDashboard,
  ShoppingBag,
  Users,
  CalendarDays,
  Menu,
  Settings,
  Coffee,
  ChevronLeft,
  History,
  TrendingUp,
  Ticket,
  Star,
} from "lucide-react"

const sidebarLinks = [
  { href: "/admin/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/orders", label: "New Orders", icon: ShoppingBag },
  { href: "/admin/orders-history", label: "Order History", icon: History },
  { href: "/admin/menu", label: "Menu", icon: Menu },
  { href: "/admin/users", label: "Users", icon: Users },
  { href: "/admin/discount-coupon", label: "Discount Coupon", icon: Ticket },
  { href: "/admin/reviews", label: "Reviews", icon: Star },
  { href: "/admin/reservations", label: "Reservations", icon: CalendarDays },
  { href: "/admin/financial-analysis", label: "Financial Analysis", icon: TrendingUp },
  { href: "/admin/settings", label: "Settings", icon: Settings },
]

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()
  const router = useRouter()
  const { user, isLoading } = useAuthStore()
  const [pendingCount, setPendingCount] = useState(0)
  const [pendingOrdersCount, setPendingOrdersCount] = useState(0)
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false)

  // Track session recovery: actively retry instead of just waiting
  const [recovering, setRecovering] = useState(false)
  const recoveryTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const retryCount = useRef(0)

  const recoverSession = useCallback(async () => {
    try {
      const { data } = await supabase.auth.getSession()
      if (data.session?.user) {
        const su = data.session.user
        const meta = su.user_metadata || {}
        const res = await fetch(`/api/user/role?userId=${su.id}`)
        const roleData = await res.json()
        useAuthStore.getState().setUser({
          id: su.id,
          email: su.email || "",
          name: meta.name || su.email?.split("@")[0] || "User",
          role: roleData?.role || "user",
          created_at: su.created_at || new Date().toISOString(),
        } as User)
        return true
      }
    } catch {}
    return false
  }, [])

  useEffect(() => {
    if (isLoading) return

    if (!user || user.role !== "admin") {
      if (!recovering) {
        setRecovering(true)
        retryCount.current = 0

        const attempt = () => {
          if (retryCount.current >= 5) {
            router.replace("/auth/login")
            return
          }
          retryCount.current++
          recoverSession().then((restored) => {
            if (!restored) {
              recoveryTimer.current = setTimeout(attempt, 2000)
            }
          })
        }
        recoveryTimer.current = setTimeout(attempt, 2000)
      }
    } else {
      setRecovering(false)
      retryCount.current = 0
      if (recoveryTimer.current) {
        clearTimeout(recoveryTimer.current)
        recoveryTimer.current = null
      }
    }

    return () => {
      if (recoveryTimer.current) {
        clearTimeout(recoveryTimer.current)
        recoveryTimer.current = null
      }
    }
  }, [user, isLoading, router, recoverSession])

  useEffect(() => {
    const fetchCount = async () => {
      try {
        const res = await fetch("/api/reservations?status=pending&limit=100")
        if (res.ok) {
          const data = await res.json()
          if (Array.isArray(data)) setPendingCount(data.length)
        }
      } catch { /* ignore */ }
    }

    fetchCount()
    const interval1 = setInterval(fetchCount, 15000)
    return () => { clearInterval(interval1) }
  }, [])

  useEffect(() => {
    const fetchPendingOrders = async () => {
      try {
        const res = await fetch("/api/orders/list?status=awaiting_approval&limit=100")
        if (res.ok) {
          const data = await res.json()
          if (Array.isArray(data)) setPendingOrdersCount(data.length)
        }
      } catch { /* ignore */ }
    }

    fetchPendingOrders()
    const interval2 = setInterval(fetchPendingOrders, 10000)
    return () => { clearInterval(interval2) }
  }, [])

  if (isLoading || !user || user.role !== "admin") {
    return (
      <div className="admin-theme min-h-screen bg-background flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-[#F59E0B] border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="admin-theme min-h-screen bg-background flex">
      {/* Sidebar */}
      <aside className="w-64 bg-[#18191D] text-white hidden md:flex flex-col">
        <div className="p-4 border-b border-[#2A2B30]">
          <Link href="/admin/dashboard" className="flex items-center gap-2">
            <Coffee className="w-6 h-6 text-[#F59E0B]" />
            <span className="font-bold text-lg">
              Eat <span className="text-[#F59E0B]">O&apos;Clock</span>
            </span>
          </Link>
          <p className="text-xs text-[#E5E7EB] mt-1">Admin Panel</p>
        </div>

        <nav className="flex-1 p-3 space-y-1">
          {sidebarLinks.map((link) => {
            const Icon = link.icon
            const isActive = pathname === link.href
            const showResBadge = link.href === "/admin/reservations" && pendingCount > 0
            const showOrderBadge = link.href === "/admin/orders" && pendingOrdersCount > 0
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition ${
                  isActive
                    ? "bg-[#F59E0B]/15 text-[#F59E0B] font-semibold"
                    : "text-[#E5E7EB] hover:bg-[#2A2B30] hover:text-white"
                }`}
              >
                <Icon size={18} />
                <span className="flex-1">{link.label}</span>
                {showOrderBadge && (
                  <span className="bg-[#EF4444] text-white text-[11px] font-bold px-2 py-0.5 rounded-full min-w-[20px] text-center animate-pulse">
                    {pendingOrdersCount > 99 ? "99+" : pendingOrdersCount}
                  </span>
                )}
                {showResBadge && (
                  <span className="bg-red-500 text-white text-[11px] font-bold px-2 py-0.5 rounded-full min-w-[20px] text-center">
                    {pendingCount > 99 ? "99+" : pendingCount}
                  </span>
                )}
              </Link>
            )
          })}
        </nav>

        <div className="p-4 border-t border-[#2A2B30]">
          <Link
            href="/"
            className="flex items-center justify-center gap-2 text-sm text-[#E5E7EB] bg-[#2A2B30] hover:bg-[#3F3F46] hover:text-[#F59E0B] px-4 py-2.5 rounded-lg transition w-full"
          >
            <ChevronLeft size={16} />
            Back to Site
          </Link>
        </div>
      </aside>

      {/* Mobile sidebar overlay */}
      {mobileSidebarOpen && (
        <div className="fixed inset-0 z-40 md:hidden" onClick={() => setMobileSidebarOpen(false)}>
          <div className="absolute inset-0 bg-black/50" />
        </div>
      )}

      {/* Mobile sidebar */}
      <aside className={`fixed top-0 left-0 z-50 h-full w-64 bg-[#18191D] text-white transform transition-transform duration-300 md:hidden ${mobileSidebarOpen ? "translate-x-0" : "-translate-x-full"}`}>
        <div className="p-4 border-b border-[#2A2B30] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Coffee className="w-6 h-6 text-[#F59E0B]" />
            <span className="font-bold text-lg">Admin</span>
          </div>
          <button onClick={() => setMobileSidebarOpen(false)} className="text-[#9CA3AF] hover:text-white p-1">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/></svg>
          </button>
        </div>
        <nav className="p-3 space-y-1 overflow-y-auto" style={{ maxHeight: "calc(100vh - 64px)" }}>
          {sidebarLinks.map((link) => {
            const Icon = link.icon
            const isActive = pathname === link.href
            const showResBadge = link.href === "/admin/reservations" && pendingCount > 0
            const showOrderBadge = link.href === "/admin/orders" && pendingOrdersCount > 0
            return (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMobileSidebarOpen(false)}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition ${
                  isActive
                    ? "bg-[#F59E0B]/15 text-[#F59E0B] font-semibold"
                    : "text-[#E5E7EB] hover:bg-[#2A2B30] hover:text-white"
                }`}
              >
                <Icon size={18} />
                <span className="flex-1">{link.label}</span>
                {showOrderBadge && (
                  <span className="bg-[#EF4444] text-white text-[11px] font-bold px-2 py-0.5 rounded-full min-w-[20px] text-center animate-pulse">
                    {pendingOrdersCount > 99 ? "99+" : pendingOrdersCount}
                  </span>
                )}
                {showResBadge && (
                  <span className="bg-red-500 text-white text-[11px] font-bold px-2 py-0.5 rounded-full min-w-[20px] text-center">
                    {pendingCount > 99 ? "99+" : pendingCount}
                  </span>
                )}
              </Link>
            )
          })}
          <hr className="border-[#2A2B30] my-2" />
          <Link
            href="/"
            onClick={() => setMobileSidebarOpen(false)}
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-[#E5E7EB] hover:bg-[#2A2B30] hover:text-white transition"
          >
            <ChevronLeft size={18} />
            <span>Back to Site</span>
          </Link>
        </nav>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Mobile header */}
        <div className="md:hidden bg-[#18191D] text-white p-4 flex items-center gap-3">
          <button onClick={() => setMobileSidebarOpen(true)} className="text-[#E5E7EB] hover:text-white p-1">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16"/></svg>
          </button>
          <Coffee className="w-5 h-5 text-[#F59E0B]" />
          <span className="font-bold">Eat O&apos;Clock Admin</span>
        </div>

        <div className="flex-1 p-4 md:p-8 overflow-auto">{children}</div>
      </div>
    </div>
  )
}