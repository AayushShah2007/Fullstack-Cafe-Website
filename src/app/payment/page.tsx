"use client"

import { Suspense, useEffect, useState } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { supabase } from "@/lib/supabase"
import { Card, CardContent } from "@/components/ui/card"
import { CreditCard } from "lucide-react"

declare global {
  interface Window {
    Razorpay: any
  }
}

function PaymentContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  const orderId = searchParams.get("orderId")
  const amount = searchParams.get("amount")

  useEffect(() => {
    if (!orderId || !amount) {
      setError("Invalid payment link")
      setLoading(false)
      return
    }

    const loadRazorpayAndPay = async () => {
      const script = document.createElement("script")
      script.src = "https://checkout.razorpay.com/v1/checkout.js"
      script.async = true
      script.onload = async () => {
        const res = await fetch("/api/payments/create-order", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            orderId,
            amount: Math.round(parseFloat(amount) * 100),
          }),
        })
        const data = await res.json()

        if (!data.success) {
          setError("Failed to create payment. Please try again.")
          setLoading(false)
          return
        }

        const options = {
          key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
          amount: data.amount,
          currency: "INR",
          name: "Eat O'Clock",
          description: `Order #${orderId.slice(0, 8)}`,
          order_id: data.razorpayOrderId,
          prefill: { contact: "" },
          theme: { color: "#C97B4A" },
          handler: async (response: any) => {
            await fetch("/api/payments/verify", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                orderId,
                razorpayOrderId: response.razorpay_order_id,
                razorpayPaymentId: response.razorpay_payment_id,
                razorpaySignature: response.razorpay_signature,
              }),
            })

            await supabase
              .from("orders")
              .update({
                payment_status: "paid",
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                status: "making",
                timeline_stage: 0,
              })
              .eq("id", orderId)

            router.push("/orders")
          },
          modal: {
            ondismiss: () => {
              router.push("/orders")
            },
          },
        }

        const razorpay = new window.Razorpay(options)
        razorpay.open()
        setLoading(false)
      }
      script.onerror = () => {
        setError("Failed to load payment gateway")
        setLoading(false)
      }
      document.body.appendChild(script)
    }

    loadRazorpayAndPay()
  }, [orderId, amount, router])

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-red-500 mb-4">{error}</p>
            <button
              onClick={() => router.push("/orders")}
              className="text-amber-600 underline"
            >
              Go to My Orders
            </button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-gradient-to-br from-amber-50 to-orange-50">
      <Card className="w-full max-w-md text-center">
        <CardContent className="py-12">
          <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse">
            <CreditCard className="w-8 h-8 text-amber-600" />
          </div>
          <h2 className="text-xl font-semibold mb-2">
            Redirecting to Payment
          </h2>
          <p className="text-gray-500">
            You&apos;ll be redirected to Razorpay to complete your payment.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}

export default function PaymentPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          <div className="w-8 h-8 border-4 border-amber-600 border-t-transparent rounded-full animate-spin" />
        </div>
      }
    >
      <PaymentContent />
    </Suspense>
  )
}
