"use client"

import { useEffect, useState, useRef } from "react"
import { supabase } from "@/lib/supabase"
import type { Order, OrderStatus } from "@/types"
import { formatPrice, getTimelineStages } from "@/utils/helpers"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { CheckCircle, XCircle, ArrowRight, Bell, Clock } from "lucide-react"
import toast from "react-hot-toast"
import { motion, AnimatePresence } from "framer-motion"

const statusBadge: Record<string, string> = {
  awaiting_approval: "bg-[#F59E0B]",
  approved: "bg-[#3B82F6]",
  making: "bg-[#8B5CF6]",
  packing: "bg-[#06B6D4]",
  completed: "bg-[#22C55E]",
  delivered: "bg-[#16A34A]",
  rejected: "bg-[#EF4444]",
  cancelled: "bg-[#6B7280]",
}

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [lastArrived, setLastArrived] = useState<string | null>(null)
  const audioCtxRef = useRef<AudioContext | null>(null)

  // Init AudioContext on first user click (browsers require gesture)
  useEffect(() => {
    const initAudio = () => {
      if (!audioCtxRef.current) {
        audioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)()
      }
      if (audioCtxRef.current.state === "suspended") {
        audioCtxRef.current.resume()
      }
    }
    window.addEventListener("click", initAudio, { once: true })
    return () => window.removeEventListener("click", initAudio)
  }, [])

  const playBell = () => {
    try {
      const ctx = audioCtxRef.current
      if (!ctx || ctx.state === "suspended") return // not yet initiated by user
      const now = ctx.currentTime

      // Bell-like chime using oscillators
      const notes = [523.25, 659.25, 783.99] // C5, E5, G5
      notes.forEach((freq, i) => {
        const osc = ctx.createOscillator()
        const gain = ctx.createGain()
        osc.type = "sine"
        osc.frequency.value = freq
        gain.gain.setValueAtTime(0.3, now + i * 0.12)
        gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.12 + 0.8)
        osc.connect(gain)
        gain.connect(ctx.destination)
        osc.start(now + i * 0.12)
        osc.stop(now + i * 0.12 + 0.8)
      })

      // Add a subtle "ding" overtone
      const osc2 = ctx.createOscillator()
      const gain2 = ctx.createGain()
      osc2.type = "sine"
      osc2.frequency.value = 1318.5 // E6
      gain2.gain.setValueAtTime(0.15, now + 0.05)
      gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.85)
      osc2.connect(gain2)
      gain2.connect(ctx.destination)
      osc2.start(now + 0.05)
      osc2.stop(now + 0.85)
    } catch { /* audio not supported */ }
  }

  const fetchOrders = async () => {
    try {
      const res = await fetch("/api/orders/list")
      if (res.ok) {
        const data = await res.json() as Order[]
        setOrders((prev) => {
          if (prev.length === data.length && prev.every((o, i) => o.id === data[i].id && o.status === data[i].status && o.timeline_stage === data[i].timeline_stage)) {
            return prev
          }
          return data
        })
      }
    } catch { /* ignore */ }
    setLoading(false)
  }

  useEffect(() => {
    fetchOrders()
    const channel = supabase
      .channel("admin-orders")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "orders" },
        (payload: any) => {
          if (payload.eventType === "INSERT") {
            setOrders((prev) => [payload.new as Order, ...prev])
            setLastArrived(payload.new.id)
            setTimeout(() => setLastArrived((prev) => prev === payload.new.id ? null : prev), 5000)
            playBell()
            toast("New order received!", { icon: "🛎️" })
          } else if (payload.eventType === "UPDATE") {
            setOrders((prev) =>
              prev.map((o) => (o.id === payload.new.id ? (payload.new as Order) : o))
            )
          }
        }
      )
      .subscribe()
    const interval = setInterval(fetchOrders, 5000)
    return () => { supabase.removeChannel(channel); clearInterval(interval) }
  }, [])

  const handleAccept = async (orderId: string) => {
    const res = await fetch("/api/orders/update", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: orderId, status: "approved" }),
    })
    if (res.ok) {
      setOrders((prev) => prev.map((o) => o.id === orderId ? { ...o, status: "approved" as OrderStatus } : o))
      toast.success("Order accepted!")
    } else toast.error("Failed to accept order")
  }

  const handleReject = async (orderId: string) => {
    const res = await fetch("/api/orders/update", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: orderId, status: "rejected" }),
    })
    if (res.ok) {
      setOrders((prev) => prev.map((o) => o.id === orderId ? { ...o, status: "rejected" as OrderStatus } : o))
      toast.success("Order rejected")
    } else toast.error("Failed to reject order")
  }

  const advanceTimeline = async (order: Order) => {
    const stages = getTimelineStages(order.order_type)
    const nextStage = order.timeline_stage + 1
    if (nextStage >= stages.length) {
      const res = await fetch("/api/orders/update", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: order.id, status: "completed", timeline_stage: nextStage }),
      })
      if (res.ok) {
        setOrders((prev) => prev.map((o) => o.id === order.id ? { ...o, status: "completed", timeline_stage: nextStage } : o))
        toast.success("Order completed!")
      } else toast.error("Failed to advance")
      return
    }
    const statusMap: Record<string, string> = { 0: "making", 1: "packing" }
    if (order.order_type === "delivery") statusMap[2] = "dispatched"
    else if (order.order_type === "takeaway") statusMap[2] = "collect"
    else if (order.order_type === "dine-in") statusMap[2] = "serving"
    const newStatus = statusMap[nextStage] || "making"
    const res = await fetch("/api/orders/update", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: order.id, status: newStatus, timeline_stage: nextStage }),
    })
    if (res.ok) {
      setOrders((prev) => prev.map((o) => o.id === order.id ? { ...o, status: newStatus as OrderStatus, timeline_stage: nextStage } : o))
      toast.success(`Order moved to: ${stages[nextStage]}`)
    } else toast.error("Failed to advance")
  }

  const pendingOrders = orders.filter((o) => o.status === "awaiting_approval")
  const activeOrders = orders.filter((o) => ["making", "packing", "approved"].includes(o.status))

  const OrderCard = ({ order }: { order: Order }) => (
    <motion.div layout initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
      <Card className={`border-l-4 ${
        order.status === "awaiting_approval" ? "border-l-[#F59E0B]"
        : order.status === "rejected" || order.status === "cancelled" ? "border-l-[#EF4444]"
        : ["completed", "delivered"].includes(order.status) ? "border-l-[#22C55E]"
        : "border-l-[#3B82F6]"
      }`}>
        <CardContent className="p-4">
          <div className="flex items-start justify-between mb-3">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-semibold text-[#E5E7EB]">#{order.id.slice(0, 8)}</h3>
                <Badge className={statusBadge[order.status] || "bg-gray-500"}>{order.status}</Badge>
              </div>
              <p className="text-sm text-[#9CA3AF] mt-1">{order.customer_name} • {order.customer_phone}</p>
              <p className="text-xs text-[#6B7280] capitalize">{order.order_type} • {order.payment_method}</p>
            </div>
            <span className="text-lg font-bold text-[#F59E0B]">{formatPrice(order.total_amount)}</span>
          </div>
          <div className="text-sm text-[#9CA3AF] mb-3">
            {(order.items as any[]).map((item, i) => (
              <div key={i} className="flex justify-between">
                <span>{item.quantity}x {item.name}</span>
                <span>{formatPrice(item.price * item.quantity)}</span>
              </div>
            ))}
          </div>
          {order.status === "awaiting_approval" && (
            <div className="flex gap-2">
              <Button size="sm" className="flex-1 gap-1 bg-[#22C55E] hover:bg-[#16A34A]" onClick={() => handleAccept(order.id)}>
                <CheckCircle size={16} /> Accept
              </Button>
              <Button size="sm" variant="destructive" className="flex-1 gap-1" onClick={() => handleReject(order.id)}>
                <XCircle size={16} /> Reject
              </Button>
            </div>
          )}
          {(order.status === "making" || order.status === "packing" || order.status === "approved") && (
            <div>
              <div className="flex items-center justify-between text-sm text-[#9CA3AF] mb-2">
                <span>Stage: {order.timeline_stage}/2</span>
                <Button size="sm" variant="outline" className="gap-1 border-[#3F3F46] text-[#9CA3AF]" onClick={() => advanceTimeline(order)}>
                  Next Stage <ArrowRight size={14} />
                </Button>
              </div>
              <div className="flex gap-1">
                {getTimelineStages(order.order_type).map((_, i) => (
                  <div key={i} className={`h-1 flex-1 rounded-full ${i <= order.timeline_stage ? "bg-[#F59E0B]" : "bg-[#3F3F46]"}`} />
                ))}
              </div>
              <p className="text-xs text-[#6B7280] mt-1">{getTimelineStages(order.order_type)[order.timeline_stage] || "Completed"}</p>
            </div>
          )}
          <p className="text-xs text-[#6B7280] mt-2">{new Date(order.created_at).toLocaleString("en-IN")}</p>
        </CardContent>
      </Card>
    </motion.div>
  )

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-[#F59E0B] border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold text-[#E5E7EB]">New Orders</h1>
          {lastArrived && (
            <span className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#F59E0B] opacity-75" />
              <span className="relative inline-flex rounded-full h-3 w-3 bg-[#F59E0B]" />
            </span>
          )}
        </div>
        <Badge className="bg-[#F59E0B] text-white text-lg px-3 py-1">
          {pendingOrders.length} Pending
        </Badge>
      </div>

      <Tabs defaultValue="active">
        <TabsList className="bg-[#593A1E] border border-[#8B5E2E] p-0 gap-0">
          <TabsTrigger value="pending" className="relative text-[#F5E6D3] data-active:bg-[#D97706] data-active:text-white px-5 text-sm h-full rounded-none first:rounded-l-md">
            Pending
            {pendingOrders.length > 0 && (
              <span className="ml-1.5 bg-[#EF4444] text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">{pendingOrders.length}</span>
            )}
          </TabsTrigger>
          <TabsTrigger value="active" className="text-[#F5E6D3] data-active:bg-[#D97706] data-active:text-white px-5 text-sm h-full rounded-none last:rounded-r-md">Active</TabsTrigger>
        </TabsList>

        <TabsContent value="pending" className="space-y-3 mt-4">
          <AnimatePresence>
            {pendingOrders.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <Bell className="w-12 h-12 text-[#3F3F46] mb-4" />
                <p className="text-[#9CA3AF] text-lg font-medium">No new orders arrived</p>
                <p className="text-[#6B7280] text-sm mt-1">Waiting for incoming orders...</p>
              </div>
            ) : pendingOrders.map((order) => <OrderCard key={order.id} order={order} />)}
          </AnimatePresence>
        </TabsContent>

        <TabsContent value="active" className="space-y-3 mt-4">
          <AnimatePresence>
            {activeOrders.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <Clock className="w-12 h-12 text-[#3F3F46] mb-4" />
                <p className="text-[#9CA3AF] text-lg font-medium">No active orders</p>
              </div>
            ) : activeOrders.map((order) => <OrderCard key={order.id} order={order} />)}
          </AnimatePresence>
        </TabsContent>
      </Tabs>
    </div>
  )
}
