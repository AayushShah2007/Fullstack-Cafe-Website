"use client"

import Link from "next/link"
import { useAuthStore } from "@/store/auth"
import { useCartStore } from "@/store/cart"
import { supabase } from "@/lib/supabase"
import { useState, useEffect } from "react"
import { usePathname } from "next/navigation"
import {
  ShoppingCart,
  Menu,
  X,
  LogOut,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { motion, AnimatePresence } from "framer-motion"
import Logo from "@/components/layout/Logo"

const navLinks = [
  { href: "/", label: "Home" },
  { href: "/menu", label: "Menu" },
  { href: "/#reviews", label: "Reviews" },
  { href: "/orders", label: "My Orders" },
  { href: "/reserve", label: "Reserve" },
]

export default function Navbar() {
  const pathname = usePathname()
  const isAuthPage = pathname.startsWith("/auth/")
  const { user, isLoading } = useAuthStore()
  const itemCount = useCartStore((s) => s.getItemCount())
  const [mobileOpen, setMobileOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20)
    window.addEventListener("scroll", handleScroll)
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  if (pathname.startsWith("/admin")) return null

  const handleLogout = async () => {
    useAuthStore.getState().setUser(null)
    useAuthStore.getState().setLoading(false)
    sessionStorage.removeItem("eatoclock-tab")
    useCartStore.getState().clearCart()
    try {
      await supabase.auth.signOut()
    } catch {
      // signOut API call may fail — state is already cleared
    }
    window.location.href = "/"
  }

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled ? "glass shadow-sm" : "glass"
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 md:h-20 flex items-center justify-between">
        {/* Logo */}
        <Logo />

        {/* Desktop Nav — centered */}
        <div className="hidden md:flex items-center justify-center flex-1 gap-1">
          {navLinks.map((link) => (
            <Link
              key={link.label}
              href={link.href}
              onClick={() => {
                if (link.href.startsWith("/#")) {
                  const id = link.href.slice(2)
                  const el = document.getElementById(id)
                  if (el) el.scrollIntoView({ behavior: "smooth" })
                }
                setMobileOpen(false)
              }}
              className="relative px-3 py-2 text-sm font-medium text-amber-100/80 hover:text-amber-300 transition group"
            >
              {link.label}
              <span className="absolute bottom-0 left-2 right-2 h-0.5 bg-amber-500 scale-x-0 group-hover:scale-x-100 transition-transform origin-left" />
            </Link>
          ))}
        </div>

        {/* Right section — always visible */}
        <div className="flex items-center gap-1 sm:gap-2">
          {/* Cart — visible on all screen sizes */}
          <Link href="/cart" className="relative p-2 hover:bg-white/5 rounded-full transition">
            <ShoppingCart className="w-5 h-5 text-amber-100/80" />
            {mounted && itemCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 bg-gradient-to-br from-amber-500 to-orange-600 text-white text-[10px] font-bold rounded-full w-5 h-5 flex items-center justify-center shadow">
                {itemCount}
              </span>
            )}
          </Link>

          {/* Desktop User Menu */}
          <div className="hidden md:flex items-center gap-2">
            {isLoading ? null : user ? (
              <div className="flex items-center gap-3 ml-2 pl-3 border-l border-white/10">
                <div className="flex items-center gap-3">
                  {user.role === "admin" && (
                    <button
                      onClick={() => {
                        const overlay = document.createElement("div")
                        overlay.className = "fixed inset-0 z-[100] flex items-center justify-center bg-[#1F2024]"
                        overlay.innerHTML = `<div class="relative w-16 h-16"><div class="absolute inset-0 border-4 border-transparent border-t-amber-500 rounded-full animate-spin"></div><div class="absolute inset-2 border-4 border-transparent border-t-orange-400 rounded-full animate-spin animation-delay-150"></div><div class="absolute inset-4 border-4 border-transparent border-t-amber-300 rounded-full animate-spin animation-delay-300"></div></div>`
                        document.body.appendChild(overlay)
                        setTimeout(() => { window.location.href = "/admin/dashboard" }, 600)
                      }}
                      className="text-gradient text-lg font-bold uppercase tracking-[0.2em] hover:opacity-80 transition cursor-pointer"
                    >
                      Admin
                    </button>
                  )}
                  <div className="relative group flex items-center cursor-pointer">
                    <span className="text-lg font-bold text-[#D4A06A] tracking-wide hidden lg:inline leading-none">{user.name}</span>
                  <div className="absolute left-1/2 -translate-x-1/2 top-full mt-2 w-44 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
                    <div className="bg-[#2A1F18] border border-amber-700/30 rounded-xl shadow-2xl shadow-black/50 overflow-hidden">
                      <div className="border-t border-amber-700/20" />
                      <button onClick={handleLogout} className="block w-full px-4 py-2.5 text-sm text-red-400/70 hover:text-red-400 hover:bg-white/5 transition text-center">
                        <LogOut className="w-3.5 h-3.5 inline mr-1.5" /> Logout
                      </button>
                    </div>
                  </div>
                </div>
              </div>
              </div>
            ) : (
              <div className="flex items-center gap-2 ml-2 pl-3 border-l border-white/10">
                <Link href="/auth/login" onClick={() => useAuthStore.getState().dismissAutoLogin()}>
                  <Button variant="ghost" size="sm" className="text-amber-100/70 hover:text-amber-300 hover:bg-white/5">Login</Button>
                </Link>
                <Link href="/auth/register" onClick={() => useAuthStore.getState().dismissAutoLogin()}>
                  <Button size="sm" className="bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white shadow-md shadow-amber-300/40 border-0">Sign Up</Button>
                </Link>
              </div>
            )}
          </div>

          {/* Mobile Hamburger */}
          <button
            className="md:hidden p-2 hover:bg-white/5 rounded-full transition text-amber-100/80"
            onClick={() => setMobileOpen(!mobileOpen)}
          >
            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden glass border-t overflow-hidden"
          >
            <div className="px-4 py-4 flex flex-col gap-1">
              {navLinks.map((link) => (
                <Link
                  key={link.label}
                  href={link.href}
                  onClick={() => {
                    setMobileOpen(false)
                    if (link.href.startsWith("/#")) {
                      const id = link.href.slice(2)
                      const el = document.getElementById(id)
                      if (el) el.scrollIntoView({ behavior: "smooth" })
                    }
                  }}
                  className="px-4 py-2.5 rounded-xl hover:bg-white/5 text-amber-100/80 hover:text-amber-300 font-medium transition"
                >
                  {link.label}
                </Link>
              ))}
              <hr className="my-2 border-white/10" />
              {user ? (
                <>
                  <div className="px-4 py-2 text-sm text-amber-100/50">
                    <p className="text-sm font-semibold text-amber-100">{user.name}</p>
                    <p className="text-sm text-[#F5E6D3]">{user.email}</p>
                  </div>
                  {user.role === "admin" && (
                    <Link href="/admin/dashboard" onClick={() => setMobileOpen(false)}>
                      <Button size="sm" className="w-full bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white font-semibold shadow-md shadow-amber-300/40 border-0">
                        Admin Panel
                      </Button>
                    </Link>
                  )}
                  <Button size="sm" className="w-full bg-red-600 hover:bg-red-700 text-white font-semibold shadow-md" onClick={handleLogout}>
                    Logout
                  </Button>
                </>
              ) : (
                <div className="flex gap-2">
    <Link href="/auth/login" className="flex-1" onClick={() => { setMobileOpen(false); useAuthStore().dismissAutoLogin() }}>
      <Button variant="outline" className="w-full">
        Login
      </Button>
    </Link>
    <Link href="/auth/register" className="flex-1" onClick={() => { setMobileOpen(false); useAuthStore().dismissAutoLogin() }}>
      <Button className="w-full bg-gradient-to-r from-amber-500 to-orange-600 text-white border-0 shadow-md shadow-amber-300/40">
        Sign Up
      </Button>
    </Link>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  )
}
