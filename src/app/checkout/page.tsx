"use client"

import { useState, useEffect } from "react"
import { useCartStore } from "@/store/cart"
import { useAuthStore } from "@/store/auth"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { formatPrice } from "@/utils/helpers"
import {
  UtensilsCrossed,
  ShoppingBag,
  Bike,
  Clock,
  CreditCard,
  Smartphone,
  Sparkles,
  Home,
  Building2,
  Hash,
  IndianRupee,
} from "lucide-react"
import toast from "react-hot-toast"
import { useRouter } from "next/navigation"
import type { OrderType, PaymentMethod, OrderItem } from "@/types"
import { motion } from "framer-motion"

const orderTypeOptions: {
  value: OrderType
  label: string
  icon: React.ReactNode
  desc: string
}[] = [
  { value: "takeaway", label: "Takeaway", icon: <ShoppingBag size={24} />, desc: "Pick up from store" },
  { value: "dine-in", label: "Dine-in", icon: <UtensilsCrossed size={24} />, desc: "Eat at our cafe" },
  { value: "delivery", label: "Delivery", icon: <Bike size={24} />, desc: "Delivered to your door" },
]

const getPaymentOptions = (orderType: OrderType | null): { value: string; label: string; icon: React.ReactNode }[] => [
  { value: "upi", label: "UPI", icon: <Smartphone size={20} /> },
  { value: "card", label: "Card", icon: <CreditCard size={20} /> },
  { value: "cash", label: orderType === "delivery" ? "Cash on Delivery" : "Cash", icon: <IndianRupee size={20} /> },
]

export default function CheckoutPage() {
  const router = useRouter()
  const { items, customerName, customerPhone, notes, orderType, couponCode, discountAmount, setCustomerName, setCustomerPhone, setNotes, setOrderType, clearCart } = useCartStore()
  const { user } = useAuthStore()
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod | null>(null)
  const [placing, setPlacing] = useState(false)
  const [orderPlaced, setOrderPlaced] = useState(false)
  const [orderId, setOrderId] = useState<string | null>(null)
  const [timeLeft, setTimeLeft] = useState(120)
  const [orderStatus, setOrderStatus] = useState<string>("awaiting_approval")
  const [email, setEmail] = useState("")
  const [addrLine1, setAddrLine1] = useState("")
  const [addrLine2, setAddrLine2] = useState("")
  const [landmark, setLandmark] = useState("")
  const [addrCity, setAddrCity] = useState("Mumbai")
  const [addrDistrict, setAddrDistrict] = useState("Borivali West")
  const [addrState, setAddrState] = useState("Maharashtra")
  const [addrPincode, setAddrPincode] = useState("")

  useEffect(() => {
    if (user?.id) {
      fetch("/api/users")
        .then((r) => r.json())
        .then((data: any[]) => {
          const u = data.find((x: any) => x.id === user.id)
          if (u) {
            if (u.city) setAddrCity(u.city)
            if (u.district) setAddrDistrict(u.district)
            if (u.state) setAddrState(u.state)
          }
        })
        .catch(() => {})
    }
  }, [user?.id])

  const subtotal = items.reduce((sum, item) => sum + item.menuItem.price * item.quantity, 0)
  const total = Math.max(0, subtotal - discountAmount)

  const handlePlaceOrder = async () => {
    if (!orderType) { toast.error("Please select order type"); return }
    if (!paymentMethod) { toast.error("Please select payment method"); return }
    if (!customerName.trim() || !customerPhone.trim()) { toast.error("Please fill your name and phone"); return }
    if (orderType === "delivery" && !addrLine1.trim()) { toast.error("Please enter delivery address"); return }

    setPlacing(true)

    if (user?.id && orderType === "delivery") {
      fetch("/api/user/update", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: user.id,
          address_line1: addrLine1,
          address_line2: addrLine2,
          landmark,
          city: addrCity,
          district: addrDistrict,
          state: addrState,
          pincode: addrPincode,
        }),
      }).catch(() => {})
    }

    const orderItems: OrderItem[] = items.map((item) => ({
      menu_item_id: item.menuItem.id,
      name: item.menuItem.name,
      price: item.menuItem.price,
      quantity: item.quantity,
      notes: item.notes,
    }))

    const res = await fetch("/api/orders/create", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        user_id: user?.id,
        items: orderItems,
        total_amount: total,
        discount_amount: discountAmount,
        order_type: orderType,
        status: "awaiting_approval",
        payment_method: paymentMethod,
        payment_status: "pending",
        customer_name: customerName,
        customer_phone: customerPhone,
        customer_email: email || null,
        customer_address: [addrLine1, addrLine2, addrDistrict, addrCity, addrState, addrPincode].filter(Boolean).join(", ") || null,
        address_line1: addrLine1 || null,
        address_line2: addrLine2 || null,
        district: addrDistrict || null,
        city: addrCity || null,
        state: addrState || null,
        pincode: addrPincode || null,
        notes: notes || null,
        coupon_code: couponCode || null,
        timeline_stage: 0,
      }),
    })
    const order = await res.json()

    setPlacing(false)
    if (!res.ok) { toast.error("Failed to place order. Please try again."); return }

    setOrderId(order.id)
    setOrderPlaced(true)
    clearCart()
    startTimer(order.id)
  }

  const startTimer = (oid: string) => {
    setTimeLeft(120)
    const interval = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(interval)
          router.push("/menu")
          toast.error("Order timed out")
          return 0
        }
        return prev - 1
      })
    }, 1000)
  }

  const formatTime = (s: number) => `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, "0")}`

  // Poll order status every 2 seconds
  useEffect(() => {
    if (!orderId || !orderPlaced) return
    const interval = setInterval(async () => {
      const res = await fetch(`/api/orders/status?id=${orderId}`)
      if (!res.ok) return
      const data = await res.json()
      if (data.status === "approved") {
        clearInterval(interval)
        if (data.payment_method === "upi") {
          router.push(`/payment/upi/${orderId}`)
        } else {
          router.push("/orders")
        }
      } else if (data.status === "rejected") {
        clearInterval(interval)
        toast.error("Order was rejected")
        setTimeout(() => router.push("/menu"), 2000)
      }
    }, 2000)
    return () => clearInterval(interval)
  }, [orderId, orderPlaced, router])

  if (orderPlaced) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4 bg-gradient-to-br from-[#1A1410] to-[#2A1F18]">
        <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="w-full max-w-md">
          <Card className="bg-[#2A1F18] border-[#3D2B24] shadow-xl shadow-black/30">
            <CardContent className="py-12 text-center">
              <div className="w-20 h-20 bg-gradient-to-br from-[#D4A06A]/20 to-[#B8860B]/20 rounded-full flex items-center justify-center mx-auto mb-6 border border-[#5C4033]">
                <Clock className="w-10 h-10 text-[#D4A06A]" />
              </div>
              <h2 className="text-2xl font-bold text-[#F5E6D3]" style={{ fontFamily: "'Playfair Display', serif" }}>Waiting for Restaurant</h2>
              <p className="text-[#A08462] mb-2 text-base">Please wait while we process your order.</p>
              <p className="text-sm text-[#D4A06A] font-medium mb-6">
                Don&apos;t go back or refresh this page
              </p>
              <div className="text-6xl font-bold text-[#D4A06A] mb-6 font-mono">{formatTime(timeLeft)}</div>
              <div className="w-full bg-[#1A1410] rounded-full h-2 mb-8 max-w-xs mx-auto border border-[#3D2B24]">
                <div className="bg-gradient-to-r from-[#D4A06A] to-[#B8860B] h-2 rounded-full transition-all duration-1000" style={{ width: `${(timeLeft / 120) * 100}%` }} />
              </div>
              <p className="text-sm text-[#5C4033]">Order #{orderId?.slice(0, 8)}...</p>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-amber-50 via-white to-white pt-28 pb-12 px-4">
      <div className="max-w-5xl mx-auto">
        <motion.h1 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-3xl md:text-4xl font-bold mb-8 text-[#B8860B]" style={{ fontFamily: "'Playfair Display', serif" }}>Checkout</motion.h1>

        <div className="grid lg:grid-cols-5 gap-8">
          <div className="lg:col-span-3 space-y-6">
            <Card className="border-amber-200/40 bg-white shadow-xl shadow-amber-900/10">
              <CardContent className="p-6 space-y-5">
                <h2 className="font-bold text-xl text-[#B8860B] flex items-center gap-2" style={{ fontFamily: "'Playfair Display', serif" }}><Sparkles size={20} className="text-[#B8860B]" /> Your Details</h2>
                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-sm font-bold text-gray-700">Name *</Label>
                    <Input value={customerName} onChange={(e) => setCustomerName(e.target.value)} placeholder="Your name" className="h-12 rounded-xl border-amber-200/60 text-base text-black placeholder:text-gray-400" />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm font-bold text-gray-700">Phone *</Label>
                    <Input value={customerPhone} onChange={(e) => setCustomerPhone(e.target.value)} placeholder="+91 98765 43210" className="h-12 rounded-xl border-amber-200/60 text-base text-black placeholder:text-gray-400" />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-bold text-gray-700">Email</Label>
                  <Input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="your@email.com" className="h-12 rounded-xl border-amber-200/60 text-base text-black placeholder:text-gray-400" />
                </div>
                <motion.div key={orderType} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25 }} className="space-y-3">
                  <Label className="text-lg font-bold text-[#B8860B]">
                    Address
                  </Label>
                  {(orderType === "delivery") ? (
                    <>
                      <div className="grid sm:grid-cols-2 gap-3">
                        <div className="space-y-1.5">
                          <Label className="text-xs font-bold text-gray-600">Address Line 1</Label>
                          <div className="relative">
                            <Home size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-amber-500" />
                            <Input value={addrLine1} onChange={(e) => setAddrLine1(e.target.value)} placeholder="Flat / House No." className="h-11 pl-9 rounded-xl border-amber-200/60 text-base text-black placeholder:text-gray-400" />
                          </div>
                        </div>
                        <div className="space-y-1.5">
                          <Label className="text-xs font-bold text-gray-600">Address Line 2</Label>
                          <div className="relative">
                            <Building2 size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-amber-500" />
                            <Input value={addrLine2} onChange={(e) => setAddrLine2(e.target.value)} placeholder="Street, Area" className="h-11 pl-9 rounded-xl border-amber-200/60 text-base text-black placeholder:text-gray-400" />
                          </div>
                        </div>
                      </div>
                      <div className="grid sm:grid-cols-2 gap-3">
                        <div className="space-y-1.5">
                          <Label className="text-xs font-bold text-gray-600">Pincode</Label>
                          <div className="relative">
                            <Hash size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-amber-500" />
                            <Input value={addrPincode} onChange={(e) => setAddrPincode(e.target.value.replace(/\D/g, "").slice(0, 6))} placeholder="400067" maxLength={6} className="h-11 pl-9 rounded-xl border-amber-200/60 text-base text-black placeholder:text-gray-400" />
                          </div>
                        </div>
                        <div className="space-y-1.5">
                          <Label className="text-xs font-bold text-gray-600">City</Label>
                          <Input value={addrCity} onChange={(e) => setAddrCity(e.target.value)} className="h-11 rounded-xl border-amber-200/60 text-base text-black placeholder:text-gray-400" />
                        </div>
                        <div className="space-y-1.5">
                          <Label className="text-xs font-bold text-gray-600">District</Label>
                          <Input value={addrDistrict} onChange={(e) => setAddrDistrict(e.target.value)} className="h-11 rounded-xl border-amber-200/60 text-base text-black placeholder:text-gray-400" />
                        </div>
                        <div className="space-y-1.5">
                          <Label className="text-xs font-bold text-gray-600">State</Label>
                          <Input value={addrState} onChange={(e) => setAddrState(e.target.value)} className="h-11 rounded-xl border-amber-200/60 text-base text-black placeholder:text-gray-400" />
                        </div>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="grid sm:grid-cols-2 gap-3">
                        <div className="space-y-1.5">
                          <Label className="text-xs font-bold text-gray-600">Address Line 1</Label>
                          <div className="relative">
                            <Home size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-amber-500" />
                            <Input value={addrLine1} onChange={(e) => setAddrLine1(e.target.value)} placeholder="Flat / House No." className="h-11 pl-9 rounded-xl border-amber-200/60 text-base text-black placeholder:text-gray-400" />
                          </div>
                        </div>
                        <div className="space-y-1.5">
                          <Label className="text-xs font-bold text-gray-600">Address Line 2</Label>
                          <div className="relative">
                            <Building2 size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-amber-500" />
                            <Input value={addrLine2} onChange={(e) => setAddrLine2(e.target.value)} placeholder="Street, Area" className="h-11 pl-9 rounded-xl border-amber-200/60 text-base text-black placeholder:text-gray-400" />
                          </div>
                        </div>
                      </div>
                      <div className="grid sm:grid-cols-2 gap-3">
                        <div className="space-y-1.5">
                          <Label className="text-xs font-bold text-gray-600">Pincode</Label>
                          <div className="relative">
                            <Hash size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-amber-500" />
                            <Input value={addrPincode} onChange={(e) => setAddrPincode(e.target.value.replace(/\D/g, "").slice(0, 6))} placeholder="400067" maxLength={6} className="h-11 pl-9 rounded-xl border-amber-200/60 text-base text-black placeholder:text-gray-400" />
                          </div>
                        </div>
                        <div className="space-y-1.5">
                          <Label className="text-xs font-bold text-gray-600">City</Label>
                          <Input value={addrCity} onChange={(e) => setAddrCity(e.target.value)} className="h-11 rounded-xl border-amber-200/60 text-base text-black placeholder:text-gray-400" />
                        </div>
                        <div className="space-y-1.5">
                          <Label className="text-xs font-bold text-gray-600">District</Label>
                          <Input value={addrDistrict} onChange={(e) => setAddrDistrict(e.target.value)} className="h-11 rounded-xl border-amber-200/60 text-base text-black placeholder:text-gray-400" />
                        </div>
                        <div className="space-y-1.5">
                          <Label className="text-xs font-bold text-gray-600">State</Label>
                          <Input value={addrState} onChange={(e) => setAddrState(e.target.value)} className="h-11 rounded-xl border-amber-200/60 text-base text-black placeholder:text-gray-400" />
                        </div>
                      </div>
                    </>
                  )}
                </motion.div>
                <div className="space-y-2">
                  <Label className="text-sm font-bold text-gray-700">Notes (optional)</Label>
                  <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Any special instructions?" className="rounded-xl border-amber-200/60 text-base text-black placeholder:text-gray-400 resize-none" />
                </div>
              </CardContent>
            </Card>

            <Card className="border-amber-200/40 bg-white shadow-xl shadow-amber-900/10">
              <CardContent className="p-6 space-y-4">
                <h2 className="font-bold text-xl text-[#B8860B]" style={{ fontFamily: "'Playfair Display', serif" }}>How would you like your order?</h2>
                <div className="grid sm:grid-cols-3 gap-3">
                  {orderTypeOptions.map((opt) => (
                    <button key={opt.value}
                      onClick={() => setOrderType(opt.value)}
                      className={`p-5 rounded-2xl border-2 text-center transition-all ${
                        orderType === opt.value
                          ? "border-[#D4A06A] bg-[#D4A06A]/10 shadow-lg shadow-[#D4A06A]/10"
                          : "border-amber-200/40 bg-white hover:border-[#D4A06A]/50 hover:shadow-md"
                      }`}
                    >
                      <div className="flex justify-center mb-2 text-[#D4A06A]">{opt.icon}</div>
                      <div className="font-bold text-base text-gray-800">{opt.label}</div>
                      <div className="text-sm text-gray-500">{opt.desc}</div>
                    </button>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card className="border-amber-200/40 bg-white shadow-xl shadow-amber-900/10">
              <CardContent className="p-6 space-y-4">
                <h2 className="font-bold text-xl text-[#B8860B]" style={{ fontFamily: "'Playfair Display', serif" }}>Choose Payment Method</h2>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {getPaymentOptions(orderType).map((opt) => (
                    <button key={opt.value}
                      onClick={() => setPaymentMethod(opt.value as any)}
                      className={`p-4 rounded-2xl border-2 text-center transition-all flex items-center gap-3 justify-center ${
                        paymentMethod === opt.value
                          ? "border-[#D4A06A] bg-[#D4A06A]/10 shadow-lg shadow-[#D4A06A]/10"
                          : "border-amber-200/40 bg-white hover:border-[#D4A06A]/50 hover:shadow-md"
                      }`}
                    >
                      <span className="text-[#D4A06A]">{opt.icon}</span>
                      <span className="font-bold text-base text-gray-800">{opt.label}</span>
                    </button>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="lg:col-span-2">
            <Card className="sticky top-28 border-amber-200/40 bg-white shadow-xl shadow-amber-900/10">
              <CardContent className="p-6 space-y-4">
                <h2 className="font-bold text-xl text-[#B8860B]" style={{ fontFamily: "'Playfair Display', serif" }}>Order Summary</h2>
                <div className="space-y-3">
                  {items.map((item) => (
                    <div key={item.id} className="flex items-center text-base">
                      <span className="text-gray-700 font-medium flex-1 truncate">{item.menuItem.name}</span>
                      <span className="text-gray-500 mx-4 shrink-0">x{item.quantity}</span>
                      <span className="font-semibold text-gray-800 shrink-0 w-24 text-right">{formatPrice(item.menuItem.price * item.quantity)}</span>
                    </div>
                  ))}
                </div>
                <Separator className="bg-amber-200/40" />
                <div className="flex justify-between text-base"><span className="text-gray-600 font-medium">Subtotal</span><span className="font-semibold text-gray-800">{formatPrice(subtotal)}</span></div>
                {discountAmount > 0 && <div className="flex justify-between text-base text-green-600"><span className="font-medium">Discount</span><span className="font-semibold">-{formatPrice(discountAmount)}</span></div>}
                {orderType && <div className="flex justify-between text-base text-gray-600"><span className="font-medium">Type</span><span className="font-semibold text-gray-800 capitalize">{orderType}</span></div>}
                {paymentMethod && <div className="flex justify-between text-base text-gray-600"><span className="font-medium">Payment</span><span className="font-semibold text-gray-800 capitalize">{paymentMethod}</span></div>}
                <Separator className="bg-amber-200/40" />
                <div className="flex justify-between font-bold text-2xl"><span className="text-gray-800">Total</span><span className="text-[#D4A06A]" suppressHydrationWarning>{formatPrice(total)}</span></div>
                <Button onClick={handlePlaceOrder} disabled={placing || items.length === 0}
                  className="w-full h-14 rounded-xl bg-gradient-to-r from-[#D4A06A] to-[#B8860B] hover:from-[#C4955A] hover:to-[#A0750A] text-white shadow-lg shadow-[#D4A06A]/20 text-lg font-semibold mt-2">
                  {placing ? "Placing Order..." : "Place Order"}
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
