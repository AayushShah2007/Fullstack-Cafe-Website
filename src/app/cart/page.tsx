"use client"

import { useCartStore } from "@/store/cart"
import { useAuthStore } from "@/store/auth"
import { formatPrice } from "@/utils/helpers"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import {
  Trash2,
  Minus,
  Plus,
  ShoppingBag,
  ArrowRight,
  Tag,
  ChevronDown,
  ChevronUp,
  Percent,
  Ticket,
  Sparkles,
  RefreshCw,
} from "lucide-react"
import Link from "next/link"
import { useState, useEffect, useMemo } from "react"
import { supabase } from "@/lib/supabase"
import toast from "react-hot-toast"
import type { Coupon, MenuItem } from "@/types"
import { motion, AnimatePresence } from "framer-motion"
import Image from "next/image"

export default function CartPage() {
  const {
    items,
    removeItem,
    updateQuantity,
    getTotal,
    getItemCount,
    couponCode,
    setCouponCode,
    setDiscountAmount,
    discountAmount,
    addItem,
  } = useCartStore()
  const { user } = useAuthStore()
  const [couponInput, setCouponInput] = useState(couponCode)
  const [applying, setApplying] = useState(false)
  const [showCoupons, setShowCoupons] = useState(false)
  const [availableCoupons, setAvailableCoupons] = useState<Coupon[]>([])
  const [loadingCoupons, setLoadingCoupons] = useState(false)
  const [suggestedItems, setSuggestedItems] = useState<MenuItem[]>([])

  const subtotal = items.reduce(
    (sum, item) => sum + item.menuItem.price * item.quantity,
    0
  )
  const total = getTotal()

  useEffect(() => {
    fetch("/api/menu")
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) {
          const cartItemIds = new Set(items.map((i) => i.menuItem.id))
          const cartCategoryIds = new Set(items.map((i) => i.menuItem.category_id))
          const available = data.filter((m: MenuItem) => !cartItemIds.has(m.id))
          const grouped: Record<string, MenuItem[]> = {}
          for (const item of available) {
            if (!grouped[item.category_id]) grouped[item.category_id] = []
            grouped[item.category_id].push(item)
          }
          const picked: MenuItem[] = []
          const categoriesInCart = Object.keys(grouped).filter((id) => cartCategoryIds.has(id))
          const categoriesOther = Object.keys(grouped).filter((id) => !cartCategoryIds.has(id))
          for (const id of [...categoriesInCart, ...categoriesOther]) {
            if (picked.length >= 6) break
            picked.push(grouped[id][0])
          }
          setSuggestedItems(picked)
        }
      })
      .catch(() => {})
  }, [])

  const fetchCoupons = async () => {
    setLoadingCoupons(true)
    try {
      const res = await fetch("/api/coupons?available=true")
      const data = await res.json()
      if (Array.isArray(data)) setAvailableCoupons(data)
    } catch { /* silent */ }
    setLoadingCoupons(false)
  }

  const toggleShowCoupons = () => {
    if (!showCoupons && availableCoupons.length === 0) fetchCoupons()
    setShowCoupons(!showCoupons)
  }

  const applyCoupon = async (code?: string) => {
    const c = code || couponInput.trim()
    if (!c) return
    setApplying(true)
    try {
      const res = await fetch(`/api/coupons?available=true`)
      const all = await res.json()
      const coupon = (Array.isArray(all) ? all : []).find(
        (co: Coupon) => co.code === c.toUpperCase()
      )
      if (!coupon) { toast.error("Invalid or expired coupon"); setApplying(false); return }
      if (subtotal < coupon.min_order) {
        toast.error(`Minimum order of ${formatPrice(coupon.min_order)} required`)
        setApplying(false)
        return
      }
      if (coupon.used_count >= coupon.usage_limit) {
        toast.error("Coupon usage limit reached")
        setApplying(false)
        return
      }
      const discount = Math.min(
        (subtotal * coupon.discount_percent) / 100,
        coupon.max_discount
      )
      setCouponCode(coupon.code)
      setDiscountAmount(discount)
      setCouponInput(coupon.code)
      setShowCoupons(false)
      toast.success(`Coupon applied! You saved ${formatPrice(discount)}`)
    } catch { /* silent */ }
    setApplying(false)
  }

  const inCartIds = useMemo(() => new Set(items.map((i) => i.menuItem.id)), [items])

  if (items.length === 0) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-4 bg-[#1A1410]">
        <div className="w-24 h-24 bg-[#2A1F18] rounded-full flex items-center justify-center mb-6 border border-[#5C4033]">
          <ShoppingBag className="w-10 h-10 text-[#D4A06A]" />
        </div>
        <h2 className="text-2xl font-bold text-[#F5E6D3] mb-2" style={{ fontFamily: "'Playfair Display', serif" }}>Your cart is empty</h2>
        <p className="text-[#8A7B6B] mb-6 text-sm">Looks like you haven&apos;t added anything yet</p>
        <Link href="/menu">
          <Button className="rounded-full px-8 bg-gradient-to-r from-[#D4A06A] to-[#B8860B] hover:from-[#C4955A] hover:to-[#A0750A] text-white shadow-lg shadow-[#D4A06A]/20">
            Browse Menu
          </Button>
        </Link>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#1A1410] pt-28 pb-12 px-4">
      <div className="max-w-6xl mx-auto">
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-3xl md:text-4xl font-bold mb-8 flex items-center gap-3 text-[#F5E6D3]"
          style={{ fontFamily: "'Playfair Display', serif" }}
        >
          <ShoppingBag className="text-[#D4A06A]" />
          Your Cart
          <span className="text-base font-normal text-[#8A7B6B]">
            ({getItemCount()} items)
          </span>
        </motion.h1>

        <div className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-3">
            <AnimatePresence>
              {items.map((item) => (
                <motion.div
                  key={item.id}
                  layout
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                >
                  <Card className="bg-[#2A1F18] border-[#3D2B24] hover:border-[#D4A06A]/30 transition shadow-lg shadow-black/20 p-0 gap-0">
                    <CardContent className="flex gap-3 p-3 sm:p-4 items-center">
                      <div className="relative w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-[#1A1410] shrink-0 overflow-hidden border border-[#5C4033]">
                        {item.menuItem.image_url ? (
                          <Image
                            src={item.menuItem.image_url}
                            alt={item.menuItem.name}
                            fill
                            sizes="80px"
                            className="object-cover rounded-2xl"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-[#D4A06A]/20 to-[#B8860B]/20">
                            <span className="text-2xl">🍽️</span>
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0 flex flex-col gap-1">
                        <div className="flex items-center gap-2">
                          <div className="flex-1 flex justify-center min-w-0">
                            <h3 className="font-semibold text-[#F5E6D3] text-base sm:text-lg truncate">{item.menuItem.name}</h3>
                          </div>
                          <p className="text-[#D4A06A] font-bold text-base sm:text-lg shrink-0">{formatPrice(item.menuItem.price)}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="flex-1 flex justify-center">
                            <div className="flex items-center gap-1.5 sm:gap-2">
                              <button
                                onClick={() => {
                                  if (item.quantity <= 1) removeItem(item.id)
                                  else updateQuantity(item.id, item.quantity - 1)
                                }}
                                className="w-7 h-7 sm:w-9 sm:h-9 rounded-full border border-[#5C4033] flex items-center justify-center hover:bg-[#D4A06A]/10 hover:border-[#D4A06A] transition text-[#A08462] hover:text-[#D4A06A]"
                              >
                                <Minus size={14} />
                              </button>
                              <span className="w-7 sm:w-8 text-center font-semibold text-[#F5E6D3] text-sm sm:text-base">{item.quantity}</span>
                              <button
                                onClick={() => updateQuantity(item.id, item.quantity + 1)}
                                className="w-7 h-7 sm:w-9 sm:h-9 rounded-full border border-[#5C4033] flex items-center justify-center hover:bg-[#D4A06A]/10 hover:border-[#D4A06A] transition text-[#A08462] hover:text-[#D4A06A]"
                              >
                                <Plus size={14} />
                              </button>
                            </div>
                          </div>
                          <button
                            onClick={() => removeItem(item.id)}
                            className="p-1.5 hover:bg-[#5C1A1A]/50 rounded-full transition text-white hover:text-[#FF6B6B] shrink-0"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>

          <div>
            <Card className="sticky top-28 bg-[#2A1F18] border-[#3D2B24] shadow-lg shadow-black/20">
              <CardContent className="p-6 space-y-4">
                <h2 className="font-bold text-lg text-[#F5E6D3]" style={{ fontFamily: "'Playfair Display', serif" }}>Order Summary</h2>

                <div className="space-y-3">
                  {items.map((item) => (
                    <div key={item.id} className="flex items-center justify-between text-base">
                      <span className="text-[#F5E6D3] truncate flex-1 font-medium">
                        {item.menuItem.name}
                      </span>
                      <span className="text-[#D4A06A] mx-2 shrink-0 font-medium">x{item.quantity}</span>
                      <span className="text-[#F5E6D3] font-semibold shrink-0 w-20 text-right">
                        {formatPrice(item.menuItem.price * item.quantity)}
                      </span>
                    </div>
                  ))}
                </div>

                <div className="border-t border-[#3D2B24] pt-3 space-y-2">
                  <div className="flex justify-between text-base">
                    <span className="text-[#9CA3AF]">Subtotal</span>
                    <span className="text-[#F5E6D3] font-semibold">{formatPrice(subtotal)}</span>
                  </div>
                  {discountAmount > 0 && (
                    <>
                      <div className="flex justify-between text-sm text-green-400">
                        <span className="flex items-center gap-1">
                          <Tag size={12} />
                          Coupon ({couponCode})
                        </span>
                        <span>-{formatPrice(discountAmount)}</span>
                      </div>
                      <div className="flex justify-between text-base text-[#9CA3AF]">
                        <span>After Discount</span>
                        <span className="text-[#F5E6D3] font-semibold">{formatPrice(subtotal - discountAmount)}</span>
                      </div>
                    </>
                  )}
                </div>

                <div className="border-t border-[#3D2B24] pt-3">
                  <div className="flex justify-between font-bold text-xl">
                    <span className="text-[#F5E6D3]">Total</span>
                    <span className="text-[#D4A06A]" suppressHydrationWarning>{formatPrice(total)}</span>
                  </div>
                </div>

                <div>
                  {couponCode ? (
                    <div className="flex items-center justify-between bg-[#1A1410] p-3 rounded-xl text-base border border-[#3D2B24]">
                      <div className="flex items-center gap-2 text-[#D4A06A]">
                        <Tag size={16} />
                        <span className="font-semibold">{couponCode}</span>
                        <span className="text-green-400 text-sm">
                          ({formatPrice(discountAmount)} off)
                        </span>
                      </div>
                      <button
                        onClick={() => {
                          setCouponCode("")
                          setDiscountAmount(0)
                          setCouponInput("")
                        }}
                        className="text-[#FF6B6B] text-sm hover:underline font-medium"
                      >
                        Remove
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <div className="flex gap-2 items-center">
                        <Input
                          placeholder="Coupon code"
                          value={couponInput}
                          onChange={(e) => setCouponInput(e.target.value.toUpperCase())}
                          className="text-sm h-10 rounded-xl bg-[#1A1410] border-[#3D2B24] text-[#F5E6D3] placeholder:text-[#6B7280]"
                        />
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => applyCoupon()}
                          disabled={applying || !couponInput.trim()}
                          className="rounded-xl border-white/40 text-white hover:bg-white/10 hover:text-white"
                        >
                          {applying ? <RefreshCw size={14} className="animate-spin" /> : "Apply"}
                        </Button>
                      </div>
                      <button
                        type="button"
                        onClick={toggleShowCoupons}
                        className="flex items-center gap-1 text-sm text-[#D4A06A] hover:text-[#F5E6D3] transition"
                      >
                        <Ticket size={14} />
                        {showCoupons ? "Hide" : "Show"} available coupons
                        {showCoupons ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                      </button>

                      {showCoupons && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: "auto" }}
                          exit={{ opacity: 0, height: 0 }}
                          className="bg-[#1A1410] rounded-xl border border-[#3D2B24] overflow-hidden"
                        >
                          {loadingCoupons ? (
                            <div className="p-3 text-center">
                              <div className="w-5 h-5 border-2 border-[#D4A06A] border-t-transparent rounded-full animate-spin inline-block" />
                            </div>
                          ) : availableCoupons.length === 0 ? (
                            <p className="p-3 text-sm text-[#8A7B6B] text-center">No coupons available</p>
                          ) : (
                            <div className="divide-y divide-[#3D2B24]">
                              {availableCoupons.map((c) => {
                                const meetsMin = subtotal >= c.min_order
                                const reachedLimit = c.used_count >= c.usage_limit
                                const canApply = meetsMin && !reachedLimit
                                return (
                                  <div key={c.id} className="p-3 flex items-center justify-between gap-2">
                                    <div className="flex-1 min-w-0">
                                      <div className="flex items-center gap-1.5">
                                        <Percent size={13} className="text-[#D4A06A]" />
                                        <span className="text-[#D4A06A] font-semibold text-sm">{c.code}</span>
                                      </div>
                                      <p className="text-[#9CA3AF] text-xs mt-0.5">
                                        {c.discount_percent}% off{c.max_discount >= 999999 ? "" : ` (up to ${formatPrice(c.max_discount)})`}
                                        {c.min_order > 0 && ` • Min: ${formatPrice(c.min_order)}`}
                                      </p>
                                      {!meetsMin && (
                                        <p className="text-[#FF6B6B]/80 text-[10px]">Min order not met</p>
                                      )}
                                      {reachedLimit && (
                                        <p className="text-[#FF6B6B]/80 text-[10px]">Usage limit reached</p>
                                      )}
                                    </div>
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      disabled={!canApply}
                                      onClick={() => applyCoupon(c.code)}
                                      className="shrink-0 text-xs h-8 px-3 rounded-lg border-[#D4A06A]/50 text-[#D4A06A] hover:bg-[#D4A06A]/10 disabled:opacity-30"
                                    >
                                      Apply
                                    </Button>
                                  </div>
                                )
                              })}
                            </div>
                          )}
                        </motion.div>
                      )}
                    </div>
                  )}
                </div>

                <Link href={user ? "/checkout" : "/auth/login"}>
                  <Button className="w-full h-12 rounded-xl bg-gradient-to-r from-[#D4A06A] to-[#B8860B] hover:from-[#C4955A] hover:to-[#A0750A] text-white shadow-lg shadow-[#D4A06A]/20 gap-2 mt-2 text-sm font-semibold">
                    Proceed to Checkout <ArrowRight size={18} />
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </div>
        </div>

        {suggestedItems.length > 0 && (
          <div className="mt-12">
            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-2xl font-bold mb-6 text-[#F5E6D3] flex items-center gap-2"
              style={{ fontFamily: "'Playfair Display', serif" }}
            >
              <Sparkles className="text-[#D4A06A]" size={22} />
              You Might Also Like
            </motion.h2>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
              {suggestedItems.map((item) => (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  <Link href={`/menu/${item.id}`} className="block group">
                    <Card className="bg-[#2A1F18] border-[#3D2B24] hover:border-[#D4A06A]/40 transition shadow-lg shadow-black/20 overflow-hidden p-0 gap-0">
                    <div className="relative h-28 bg-[#1A1410] overflow-hidden">
                      {item.image_url ? (
                        <Image
                          src={item.image_url}
                          alt={item.name}
                          fill
                          sizes="(max-width: 768px) 50vw, 16vw"
                          className="object-cover group-hover:scale-110 transition-transform duration-300"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-[#D4A06A]/20 to-[#B8860B]/20">
                          <span className="text-3xl">🍽️</span>
                        </div>
                      )}
                    </div>
                    <CardContent className="p-3 space-y-1.5">
                      <h3 className="text-[#F5E6D3] text-xs font-semibold truncate leading-tight">{item.name}</h3>
                      <p className="text-[#D4A06A] text-xs font-bold">{formatPrice(item.price)}</p>
                      <Button
                        size="sm"
                        disabled={inCartIds.has(item.id)}
                        onClick={(e) => { e.preventDefault(); e.stopPropagation(); addItem(item, 1) }}
                        className="w-full h-7 text-[10px] rounded-lg bg-gradient-to-r from-[#D4A06A] to-[#B8860B] hover:from-[#C4955A] hover:to-[#A0750A] text-white font-semibold disabled:opacity-40 disabled:cursor-not-allowed"
                      >
                        {inCartIds.has(item.id) ? "Added ✓" : "+ Add"}
                      </Button>
                    </CardContent>
                  </Card>
                  </Link>
                </motion.div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
