"use client"

import { useEffect, useState } from "react"
import { useAuthStore } from "@/store/auth"
import type { Order } from "@/types"
import { formatPrice, getTimelineStages } from "@/utils/helpers"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Package, Clock, UtensilsCrossed, Bike, Printer } from "lucide-react"
import { useRouter } from "next/navigation"

const statusLabels: Record<string, string> = {
  awaiting_approval: "Awaiting Approval",
  approved: "Approved",
  rejected: "Rejected",
  making: "Making Order",
  packing: "Packing",
  dispatched: "Dispatched",
  collect: "Ready to Collect",
  platting: "Platting your Food",
  serving: "Serving to your Table",
  delivered: "Delivered",
  completed: "Completed",
  cancelled: "Cancelled",
}

const statusColors: Record<string, string> = {
  awaiting_approval: "bg-yellow-500 text-white",
  approved: "bg-green-500 text-white",
  rejected: "bg-red-500 text-white",
  making: "bg-blue-500 text-white",
  packing: "bg-purple-500 text-white",
  dispatched: "bg-indigo-500 text-white",
  collect: "bg-teal-500 text-white",
  platting: "bg-orange-500 text-white",
  serving: "bg-amber-500 text-white",
  delivered: "bg-green-600 text-white",
  completed: "bg-green-700 text-white",
  cancelled: "bg-gray-500 text-white",
}

const orderTypeColors: Record<string, string> = {
  "dine-in": "bg-amber-100 text-amber-800 border-amber-300",
  takeaway: "bg-green-100 text-green-800 border-green-300",
  delivery: "bg-blue-100 text-blue-800 border-blue-300",
}

const orderTypeIcons: Record<string, React.ReactNode> = {
  "dine-in": <UtensilsCrossed size={14} />,
  takeaway: <Package size={14} />,
  delivery: <Bike size={14} />,
}

function OrderTimeline({
  orderType,
  currentStage,
}: {
  orderType: string
  currentStage: number
}) {
  const stages = getTimelineStages(orderType)
  const progress = stages.length > 1 ? (currentStage / (stages.length - 1)) * 100 : 100

  return (
    <div className="mt-10 mb-4">
      <div className="flex justify-between gap-0 mx-2 sm:mx-0 relative">
        <div className="absolute top-4 left-0 right-0 h-0.5 bg-gray-200 rounded-full" />
        <div className="absolute top-4 left-0 h-0.5 bg-amber-500 rounded-full transition-all duration-700" style={{ width: `${Math.min(progress, 100)}%` }} />
        {stages.map((stage, i) => {
          const isCompleted = i < currentStage
          const isCurrent = i === currentStage
          const isUpcoming = i > currentStage
          return (
            <div key={i} className="flex flex-col items-center flex-1 z-10">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-500 ${
                  isCompleted
                    ? "bg-amber-600 text-white"
                    : isCurrent
                    ? "bg-amber-600 text-white ring-4 ring-amber-200 scale-110"
                    : "bg-gray-200 text-gray-400"
                }`}
              >
                {isCompleted ? "✓" : i + 1}
              </div>
              <span
                className={`inline-block text-center text-[10px] mt-2 leading-tight px-2 py-0.5 rounded-full transition-all duration-500 ${
                  isCompleted
                    ? "bg-amber-100 text-amber-800 font-semibold"
                    : isCurrent
                    ? "bg-amber-500 text-white font-bold"
                    : "bg-gray-100 text-gray-500"
                }`}
              >
                {stage}
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}

function InvoiceContent({ order, settings }: { order: Order; settings: any }) {
  const subtotal = (order.items as any[]).reduce((s: number, i: any) => s + i.price * i.quantity, 0)

  return (
    <div className="bg-white p-8 max-w-2xl mx-auto" style={{ fontFamily: "Arial, sans-serif" }}>
      <div className="text-center mb-6">
        {settings.logo_url ? (
          <img src={settings.logo_url} alt={settings.store_name || "Eat O'Clock"} className="h-12 mx-auto mb-2 object-contain" />
        ) : (
          <h1 className="text-3xl font-bold" style={{ color: "#B8860B" }}>{settings.store_name || "Eat O'Clock"}</h1>
        )}
        <p className="text-gray-600 text-sm mt-1">{settings.address || "123, Food Street, Ambience Mall, Gurgaon - 122002"}</p>
        <p className="text-gray-600 text-sm">Phone: {settings.phone || "+91-9876543210"} | Email: {settings.email || "hello@eatoclock.in"}</p>
      </div>
      <hr className="border-gray-300 mb-4" />
      <div className="text-left mb-4">
        <p className="text-gray-800"><strong>Customer:</strong> {order.customer_name}</p>
        <p className="text-gray-800"><strong>Order ID:</strong> #{order.id.slice(0, 8)}</p>
        <p className="text-gray-800"><strong>Phone:</strong> {order.customer_phone}</p>
        <p className="text-gray-800"><strong>Email:</strong> {order.customer_email || "—"}</p>
        <p className="text-gray-800"><strong>Address:</strong> {[order.address_line1, order.address_line2].filter(Boolean).join(", ")}</p>
      </div>
      <div className="flex justify-between text-sm text-gray-700 mb-4">
        <span><strong>District:</strong> {order.district || "—"}</span>
        <span><strong>City:</strong> {order.city || "—"}</span>
        <span><strong>State:</strong> {order.state || "—"}</span>
        <span><strong>Pincode:</strong> {order.pincode || "—"}</span>
      </div>
      <hr className="border-gray-300 mb-4" />
      <table className="w-full text-sm mb-4">
        <thead>
          <tr className="border-b border-gray-300 text-left">
            <th className="pb-2 text-gray-700">Item</th>
            <th className="pb-2 text-gray-700 text-center">Qty</th>
            <th className="pb-2 text-gray-700 text-right">Price</th>
            <th className="pb-2 text-gray-700 text-right">Total</th>
          </tr>
        </thead>
        <tbody>
          {(order.items as any[]).map((item, i) => (
            <tr key={i} className="border-b border-gray-100">
              <td className="py-2 text-gray-800">{item.name}</td>
              <td className="py-2 text-center text-gray-600">{item.quantity}</td>
              <td className="py-2 text-right text-gray-600">{formatPrice(item.price)}</td>
              <td className="py-2 text-right text-gray-800 font-semibold">{formatPrice(item.price * item.quantity)}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <hr className="border-gray-300 mb-2" />
      <div className="text-right space-y-1">
        <p className="text-gray-600 text-sm">Subtotal: {formatPrice(subtotal)}</p>
        {order.discount_amount > 0 && (
          <p className="text-green-600 text-sm">Discount: -{formatPrice(order.discount_amount)}</p>
        )}
        <p className="text-gray-900 font-bold text-lg">Total: {formatPrice(order.total_amount)}</p>
      </div>
      <hr className="border-gray-300 my-4" />
      <p className="text-center text-gray-500 text-lg mt-6">Thank you!!!</p>
    </div>
  )
}

export default function OrdersPage() {
  const { user, isLoading } = useAuthStore()
  const [orders, setOrders] = useState<Order[]>([])
  const [loadingOrders, setLoadingOrders] = useState(true)
  const [initialFetchDone, setInitialFetchDone] = useState(false)
  const [printingOrderId, setPrintingOrderId] = useState<string | null>(null)
  const [storeSettings, setStoreSettings] = useState<any>({})
  const router = useRouter()

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/admin/settings")
        if (res.ok) setStoreSettings(await res.json())
      } catch {}
    })()
  }, [])

  useEffect(() => {
    if (isLoading) return
    if (!user?.id) {
      router.push("/auth/login")
      return
    }

    let cancelled = false
    const uid = user.id

    const fetchOrders = async () => {
      try {
        const res = await fetch(`/api/orders/list?userId=${uid}`)
        if (!cancelled) {
          if (res.ok) {
            const data = (await res.json()) as Order[]
            setOrders(data.filter((o) => o.user_id === uid))
          }
          setLoadingOrders(false)
          setInitialFetchDone(true)
        }
      } catch {
        if (!cancelled) {
          setLoadingOrders(false)
          setInitialFetchDone(true)
        }
      }
    }

    fetchOrders()

    const pollInterval = setInterval(async () => {
      try {
        const res = await fetch(`/api/orders/list?userId=${uid}`)
        if (res.ok && !cancelled) {
          const data = (await res.json()) as Order[]
          setOrders(data.filter((o) => o.user_id === uid))
        }
      } catch {}
    }, 5000)

    return () => {
      cancelled = true
      clearInterval(pollInterval)
    }
  }, [user?.id, isLoading, router])

  const handlePrintInvoice = (order: Order) => {
    setPrintingOrderId(order.id)
    setTimeout(() => {
      window.print()
    }, 100)
    setTimeout(() => {
      setPrintingOrderId(null)
    }, 1000)
  }

  if (isLoading || loadingOrders || !initialFetchDone) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-amber-600 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-amber-50 to-white py-8 px-4">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">
          My Orders
        </h1>

        {orders.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center text-gray-500">
              <Package className="w-12 h-12 mx-auto mb-4 text-gray-300" />
              No orders yet. Go ahead and order something delicious!
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {orders.map((order) => (
              <Card key={order.id} className="bg-white border-gray-200 shadow-md">
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between gap-2">
                    <CardTitle className="text-sm sm:text-base font-bold text-gray-800 truncate min-w-0">
                      Order #{order.id.slice(0, 8)}
                    </CardTitle>
                    <div className="flex flex-col items-end gap-0.5 shrink-0">
                      <p className="text-xs sm:text-sm text-gray-800 font-medium whitespace-nowrap">
                        {new Date(order.created_at).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}
                      </p>
                      <p className="text-xs sm:text-sm text-gray-800 font-medium whitespace-nowrap">
                        {new Date(order.created_at).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", hour12: true })}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start justify-between gap-2 mt-1">
                    <div className="flex flex-col items-start gap-1">
                      <Badge className={`${statusColors[order.status]} text-white text-xs px-2.5 py-0.5`}>
                        {statusLabels[order.status]}
                      </Badge>
                      <span className={`inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-0.5 rounded-full border ${orderTypeColors[order.order_type] || "bg-gray-100 text-gray-700"}`}>
                        {orderTypeIcons[order.order_type]}
                        <span className="capitalize">{order.order_type === "dine-in" ? "Dine-in" : order.order_type}</span>
                      </span>
                    </div>
                    <button
                      onClick={() => handlePrintInvoice(order)}
                      className="no-print flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold text-white bg-red-600 hover:bg-red-700 transition-colors shrink-0"
                    >
                      <Printer size={14} />
                      Invoice
                    </button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="mb-3">
                    {(order.items as any[]).map((item, i) => {
                      const itemTotal = item.price * item.quantity
                      return (
                        <div key={i} className="flex items-center gap-3 py-2 text-sm">
                          <span className="flex-1 text-gray-700 font-medium truncate">{item.name}</span>
                          <span className="w-10 text-center text-gray-600">x{item.quantity}</span>
                          <span className="w-20 text-right text-gray-500">{formatPrice(item.price)}</span>
                          <span className="w-20 text-right font-semibold text-gray-800">{formatPrice(itemTotal)}</span>
                        </div>
                      )
                    })}
                  </div>

                  <div className="space-y-1.5 pt-2">
                    <div className="flex justify-between">
                      <span className="text-gray-600 text-sm">Subtotal</span>
                      <span className="text-gray-800 font-semibold text-sm">
                        {formatPrice((order.items as any[]).reduce((s: number, i: any) => s + i.price * i.quantity, 0))}
                      </span>
                    </div>
                    {order.discount_amount > 0 && (
                      <div className="flex justify-between">
                        <span className="text-green-600 text-sm">Discount</span>
                        <span className="text-green-600 font-semibold text-sm">-{formatPrice(order.discount_amount)}</span>
                      </div>
                    )}
                    <div className="flex justify-between border-t border-gray-100 pt-2">
                      <span className="text-gray-900 font-bold text-lg">Total</span>
                      <span className="text-[#B8860B] font-bold text-lg">{formatPrice(order.total_amount)}</span>
                    </div>
                  </div>

                  {(order.status === "making" ||
                    order.status === "packing" ||
                    order.status === "dispatched" ||
                    order.status === "collect" ||
                    order.status === "platting" ||
                    order.status === "serving") && (
                    <div className="border-t border-gray-100 pt-3 mt-3">
                      {order.timeline_stage < getTimelineStages(order.order_type).length - 1 && (
                        <p className="text-sm font-bold text-gray-700 mb-1 flex items-center gap-1.5 no-print">
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-bold text-white bg-red-600 animate-pulse">
                            <span className="w-2 h-2 bg-white rounded-full inline-block animate-ping" />
                            Live Status
                          </span>
                        </p>
                      )}
                      <p className="text-sm font-bold text-gray-700 mb-1 print-only hidden">
                        Live Status
                      </p>
                      <OrderTimeline
                        orderType={order.order_type}
                        currentStage={order.timeline_stage}
                      />
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Printable invoice - rendered hidden, visible only during print */}
      {printingOrderId && (
        <div className="print-only fixed inset-0 z-[9999] bg-white overflow-auto">
          {orders.filter(o => o.id === printingOrderId).map(order => (
            <InvoiceContent key={order.id} order={order} settings={storeSettings} />
          ))}
        </div>
      )}
    </div>
  )
}
