"use client"

import { useEffect, useRef, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { useAuthStore } from "@/store/auth"
import type { Order } from "@/types"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { ArrowLeft, CreditCard, ImageUp, IndianRupee } from "lucide-react"
import toast from "react-hot-toast"

export default function UpiPaymentPage() {
  const { orderId } = useParams<{ orderId: string }>()
  const router = useRouter()
  const { user } = useAuthStore()
  const [order, setOrder] = useState<Order | null>(null)
  const [loading, setLoading] = useState(true)
  const [screenshot, setScreenshot] = useState<File | null>(null)
  const [screenshotPreview, setScreenshotPreview] = useState<string>("")
  const [submitting, setSubmitting] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (!user) {
      router.push("/auth/login")
      return
    }

    const fetchOrder = async () => {
      try {
        const res = await fetch(`/api/orders/status?id=${orderId}`)
        if (res.ok) {
          const data = await res.json()
          if (data.payment_status === "paid") {
            router.push("/orders")
            return
          }
          setOrder(data as Order)
        } else {
          toast.error("Order not found")
          router.push("/orders")
        }
      } catch {
        toast.error("Failed to fetch order")
        router.push("/orders")
      }
      setLoading(false)
    }
    fetchOrder()
  }, [orderId, user, router])

  const compressImage = (file: File, maxW = 800): Promise<string> =>
    new Promise((resolve, reject) => {
      const img = new Image()
      img.onload = () => {
        const canvas = document.createElement("canvas")
        let { width, height } = img
        if (width > maxW) { height = (height / width) * maxW; width = maxW }
        canvas.width = width; canvas.height = height
        const ctx = canvas.getContext("2d")!
        ctx.drawImage(img, 0, 0, width, height)
        resolve(canvas.toDataURL("image/jpeg", 0.7))
      }
      img.onerror = reject
      img.src = URL.createObjectURL(file)
    })

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (!file.type.startsWith("image/")) {
      toast.error("Please select an image file")
      return
    }
    setScreenshot(file)
    try {
      const compressed = await compressImage(file)
      setScreenshotPreview(compressed)
    } catch {
      toast.error("Failed to process image")
    }
  }

  const handleSubmit = async () => {
    if (!screenshot) {
      toast.error("Please attach a payment screenshot")
      return
    }
    if (!orderId) return
    setSubmitting(true)

    try {
      const res = await fetch("/api/orders/pay-upi", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId, screenshot: screenshotPreview }),
      })

      if (!res.ok) {
        throw new Error("Server error")
      }

      toast.success("Payment submitted! Order is being prepared.")
      router.push("/orders")
    } catch {
      toast.error("Failed to submit payment. Please try again.")
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-[calc(100vh-64px)] flex items-center justify-center bg-gradient-to-b from-amber-50 to-white">
        <div className="w-8 h-8 border-4 border-amber-600 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (!order) return null

  const items = order.items as { name: string; price: number; quantity: number }[]
  const subtotal = items.reduce((s, i) => s + i.price * i.quantity, 0)

  return (
    <div className="min-h-[calc(100vh-64px)] bg-gradient-to-b from-amber-50 to-white py-6 px-4 mt-16">
      <div className="max-w-xl mx-auto space-y-4">
        {/* Back */}
        <button onClick={() => router.push("/orders")} className="flex items-center gap-2 bg-[#D4A06A]/10 hover:bg-[#D4A06A]/20 text-[#B8860B] font-semibold text-base px-5 py-2.5 rounded-xl border border-amber-200/40 transition-all w-fit">
          <ArrowLeft size={18} /> Back to Orders
        </button>

        {/* Order & Bill Summary (merged) */}
        <Card className="bg-white border-amber-200/60 shadow-lg shadow-amber-900/10">
          <CardContent className="p-5 space-y-3">
            <h2 className="text-lg font-bold text-[#B8860B] flex items-center gap-2">
              <IndianRupee size={20} className="text-[#D4A06A]" />
              Order &amp; Bill Summary
            </h2>
            <div className="divide-y divide-amber-100">
              {items.map((item, i) => (
                <div key={i} className="flex items-center justify-between py-2 text-sm text-gray-700">
                  <span className="font-medium truncate flex-1">{item.name}</span>
                  <span className="text-gray-400 mx-2 shrink-0">x{item.quantity}</span>
                  <span className="text-gray-500 shrink-0 w-16 text-right">₹{item.price}</span>
                  <span className="font-semibold text-gray-800 shrink-0 w-20 text-right">₹{item.price * item.quantity}</span>
                </div>
              ))}
            </div>
            <div className="border-t border-amber-200/40 pt-3 space-y-1.5">
              <div className="flex justify-between text-sm text-gray-600">
                <span>Subtotal</span>
                <span>₹{subtotal}</span>
              </div>
              {order.discount_amount > 0 && (
                <div className="flex justify-between text-sm text-green-600">
                  <span>Discount</span>
                  <span>-₹{order.discount_amount}</span>
                </div>
              )}
              <div className="flex justify-between text-base font-bold text-[#B8860B] pt-1.5 border-t border-amber-200/40">
                <span>Total</span>
                <span>₹{order.total_amount}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Customer Details */}
        <Card className="bg-white border-amber-200/60 shadow-lg shadow-amber-900/10">
          <CardContent className="p-5 space-y-2">
            <h2 className="text-lg font-bold text-[#B8860B] mb-1">Customer Details</h2>
            <p className="text-sm text-gray-600"><span className="font-semibold text-[#B8860B]">Name :</span> {order.customer_name}</p>
            <p className="text-sm text-gray-600"><span className="font-semibold text-[#B8860B]">Phone :</span> {order.customer_phone}</p>
            {order.customer_email && <p className="text-sm text-gray-600"><span className="font-semibold text-[#B8860B]">Email :</span> {order.customer_email}</p>}
            {order.address_line1 && <p className="text-sm text-gray-600"><span className="font-semibold text-[#B8860B]">Address :</span> {[
              order.address_line1, order.address_line2,
              order.city, order.district, order.state, order.pincode
            ].filter(Boolean).join(", ")}</p>}
          </CardContent>
        </Card>

        {/* QR Code */}
        <Card className="bg-white border-amber-200/60 shadow-lg shadow-amber-900/10">
          <CardContent className="p-4 text-center space-y-2">
            <h2 className="text-lg font-bold text-[#B8860B]">Scan & Pay via UPI</h2>
            <div className="flex justify-center">
              <img src="/qr-code.jpeg" alt="UPI QR Code" className="w-48 h-48 rounded-xl border-2 border-amber-300/60 object-cover" />
            </div>
            <p className="text-xs text-gray-400">Scan with any UPI app to pay</p>
          </CardContent>
        </Card>

        {/* Attach Screenshot */}
        <Card className="bg-white border-amber-200/60 shadow-lg shadow-amber-900/10">
          <CardContent className="p-4 space-y-3">
            <h2 className="text-lg font-bold text-[#B8860B] flex items-center gap-2">
              <ImageUp size={20} className="text-[#D4A06A]" />
              Attach Payment Screenshot
            </h2>
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              className="hidden"
            />
            {screenshotPreview ? (
              <div className="relative">
                <img src={screenshotPreview} alt="Payment screenshot" className="w-full h-48 object-cover rounded-xl border border-amber-300/60" />
                <button
                  onClick={() => { setScreenshot(null); setScreenshotPreview(""); if (fileRef.current) fileRef.current.value = "" }}
                  className="absolute top-2 right-2 bg-red-500/80 text-white text-xs px-2 py-1 rounded-lg hover:bg-red-500 transition"
                >
                  Remove
                </button>
              </div>
            ) : (
              <button
                onClick={() => fileRef.current?.click()}
                className="w-full h-32 border-2 border-dashed border-amber-300/60 rounded-xl flex flex-col items-center justify-center gap-2 text-[#D4A06A]/50 hover:text-[#D4A06A] hover:border-[#D4A06A]/60 transition"
              >
                <ImageUp size={28} />
                <span className="text-sm">Tap to upload screenshot</span>
              </button>
            )}
          </CardContent>
        </Card>

        {/* Submit */}
        <Button
          onClick={handleSubmit}
          disabled={submitting || !screenshot}
          className="w-full h-12 rounded-xl bg-gradient-to-r from-[#D4A06A] to-[#B8860B] hover:from-[#C4955A] hover:to-[#A0750A] text-white text-base font-semibold shadow-lg shadow-[#D4A06A]/20"
        >
          {submitting ? "Submitting..." : "Submit Payment"}
        </Button>
      </div>
    </div>
  )
}
