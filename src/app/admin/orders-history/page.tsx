"use client"

import { useEffect, useState, useMemo, useRef } from "react"
import { supabase } from "@/lib/supabase"
import type { Order } from "@/types"
import { formatPrice } from "@/utils/helpers"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Search, Package, Ticket, Phone, Mail, User as UserIcon } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"

const statusBadge: Record<string, string> = {
  approved: "bg-[#3B82F6]",
  making: "bg-[#8B5CF6]",
  packing: "bg-[#06B6D4]",
  dispatched: "bg-[#0EA5E9]",
  collect: "bg-[#14B8A6]",
  serving: "bg-[#F97316]",
  completed: "bg-[#22C55E]",
  delivered: "bg-[#16A34A]",
  cancelled: "bg-[#6B7280]",
  rejected: "bg-[#EF4444]",
}

export default function OrderHistoryPage() {
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const monthInputRef = useRef<HTMLInputElement>(null)
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [dateFilter, setDateFilter] = useState("all")
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const now = new Date()
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`
  })
  const [page, setPage] = useState(1)
  const pageSize = 10

  useEffect(() => {
    fetchOrders()
    const channel = supabase
      .channel("order-history")
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "orders" }, (payload: any) => {
        setOrders((prev) =>
          prev.map((o) => (o.id === payload.new.id ? (payload.new as Order) : o))
        )
      })
      .subscribe()
    const interval = setInterval(fetchOrders, 10000)
    return () => { clearInterval(interval); supabase.removeChannel(channel) }
  }, [])

  const fetchOrders = async () => {
    try {
      const res = await fetch("/api/orders/list?status=approved,making,packing,dispatched,collect,serving,completed,delivered,cancelled,rejected&limit=200")
      if (res.ok) {
        const data = await res.json() as Order[]
        setOrders((prev) => {
          if (prev.length === data.length && prev.every((o, i) => o.id === data[i].id && o.status === data[i].status)) {
            return prev
          }
          return data
        })
      }
    } catch { /* ignore */ }
    setLoading(false)
  }

  const filtered = useMemo(() => {
    return orders.filter((o) => {
      const orderDate = new Date(o.created_at)
      const now = new Date()
      const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate())
      const matchDate = dateFilter === "all" || (() => {
        switch (dateFilter) {
          case "today":
            return orderDate >= todayStart
          case "week": {
            const weekStart = new Date(todayStart)
            weekStart.setDate(weekStart.getDate() - weekStart.getDay())
            return orderDate >= weekStart
          }
          case "15days": {
            const fifteenAgo = new Date(todayStart)
            fifteenAgo.setDate(fifteenAgo.getDate() - 15)
            return orderDate >= fifteenAgo
          }
          case "month": {
            const [year, month] = selectedMonth.split("-").map(Number)
            return orderDate.getFullYear() === year && orderDate.getMonth() === month - 1
          }
          default:
            return true
        }
      })()
      const matchSearch =
        o.customer_name.toLowerCase().includes(search.toLowerCase()) ||
        o.customer_phone.includes(search) ||
        (o.customer_email || "").toLowerCase().includes(search.toLowerCase()) ||
        o.id.slice(0, 8).includes(search)
      const matchStatus = statusFilter === "all" || o.status === statusFilter
      return matchDate && matchSearch && matchStatus
    })
  }, [orders, search, statusFilter, dateFilter, selectedMonth])

  const totalPages = Math.ceil(filtered.length / pageSize)
  const paginated = filtered.slice((page - 1) * pageSize, page * pageSize)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-[#E5E7EB]">Order History</h1>
        <p className="text-sm text-[#9CA3AF]">{filtered.length} orders</p>
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#9CA3AF]" />
        <Input
          placeholder="Search by name, phone or order ID..."
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1) }}
          className="pl-9 bg-[#2A2B30] border-[#3F3F46] text-[#E5E7EB] placeholder:text-[#6B7280]"
        />
      </div>
      <div className="flex flex-col sm:flex-row sm:flex-wrap items-start sm:items-center gap-2">
        <div className="flex items-center gap-2">
          {(["all", "today", "week", "15days"] as const).map((opt) => (
            <button
              key={opt}
              onClick={() => { setDateFilter(opt); setPage(1) }}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all whitespace-nowrap ${
                dateFilter === opt
                  ? "bg-[#F59E0B] text-white shadow-md shadow-[#F59E0B]/30"
                  : "bg-[#2A2B30] text-[#9CA3AF] hover:text-[#F59E0B] border border-[#3F3F46]"
              }`}
            >
              {opt === "all" ? "All" : opt === "today" ? "Today" : opt === "week" ? "Last Week" : "Last 15 Days"}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => { setDateFilter("month"); setPage(1); setTimeout(() => monthInputRef.current?.showPicker(), 0) }}
            className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all whitespace-nowrap ${
              dateFilter === "month"
                ? "bg-[#F59E0B] text-white shadow-md shadow-[#F59E0B]/30"
                : "bg-[#2A2B30] text-[#9CA3AF] hover:text-[#F59E0B] border border-[#3F3F46]"
            }`}
          >
            {dateFilter === "month"
              ? new Date(selectedMonth + "-01").toLocaleDateString("en-US", { month: "short", year: "numeric" })
              : "Monthly"}
          </button>
          <input
            ref={monthInputRef}
            type="month"
            value={selectedMonth}
            onChange={(e) => { setSelectedMonth(e.target.value); setPage(1) }}
            className="absolute opacity-0 w-0 h-0 pointer-events-none"
          />
          <div className="w-px h-6 bg-[#3F3F46] mx-1 hidden sm:block" />
          <span className="text-xs text-[#9CA3AF] font-medium hidden sm:inline">Status:</span>
          <select
            value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value); setPage(1) }}
            className="px-3 py-1.5 rounded-full bg-[#2A2B30] border border-[#3F3F46] text-[#E5E7EB] text-xs font-semibold"
          >
            <option value="all">All</option>
            <option value="approved">Approved</option>
            <option value="making">Making</option>
            <option value="packing">Packing</option>
            <option value="dispatched">Dispatched</option>
            <option value="collect">Collect</option>
            <option value="serving">Serving</option>
            <option value="completed">Completed</option>
            <option value="delivered">Delivered</option>
            <option value="cancelled">Cancelled</option>
            <option value="rejected">Rejected</option>
          </select>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="w-8 h-8 border-4 border-[#F59E0B] border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <>
          <AnimatePresence mode="popLayout">
            <div className="space-y-3">
              {paginated.map((order) => (
                <motion.div
                  key={order.id}
                  layout
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                >
                  <Card className="border-l-4 border-l-[#F59E0B]">
                    <CardContent className="p-3 sm:p-5">
                      <div className="flex items-start justify-between gap-2 mb-3 sm:mb-4">
                        <div className="flex items-center flex-wrap gap-1.5 sm:gap-3">
                          <span className="font-bold text-[#E5E7EB] text-sm sm:text-xl">#{order.id.slice(0, 8)}</span>
                          <Badge className={`${statusBadge[order.status] || "bg-gray-500"} text-xs sm:text-base px-2 sm:px-3 py-0.5 sm:py-1`}>
                            {order.status.replace("_", " ")}
                          </Badge>
                          <Badge className={`text-xs sm:text-base px-2 sm:px-3 py-0.5 sm:py-1 capitalize ${
                            order.order_type === "dine-in" ? "bg-purple-600 text-white" :
                            order.order_type === "takeaway" ? "bg-emerald-600 text-white" :
                            "bg-blue-600 text-white"
                          }`}>
                            {order.order_type === "dine-in" ? "Dine-in" : order.order_type}
                          </Badge>
                        </div>
                        <div className="text-right shrink-0">
                          <p className="text-lg sm:text-2xl font-bold text-[#F59E0B]">{formatPrice(order.total_amount)}</p>
                          <p className="text-xs sm:text-base text-white whitespace-nowrap">
                            {new Date(order.created_at).toLocaleDateString("en-IN", {
                              day: "numeric", month: "short", year: "numeric",
                            })}
                            {" "}
                            {new Date(order.created_at).toLocaleTimeString("en-IN", {
                              hour: "2-digit", minute: "2-digit",
                            })}
                          </p>
                        </div>
                      </div>

                      <div className="bg-[#25262B] rounded-lg p-3 sm:p-4 mb-3 sm:mb-4 space-y-2">
                        <div className="flex items-center gap-2 text-[#E5E7EB] font-bold text-sm sm:text-xl">
                          <UserIcon size={16} className="sm:w-5 sm:h-5 text-[#F59E0B]" />
                          {order.customer_name}
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-1.5 text-xs sm:text-base">
                          <div className="flex items-center gap-1.5 text-gray-300">
                            <Phone size={13} className="sm:w-[15px] shrink-0 text-gray-500" />
                            <span className="text-gray-500 font-medium">Phone:</span>
                            <span>{order.customer_phone}</span>
                          </div>
                          <div className="flex items-center gap-1.5 text-gray-300">
                            <Mail size={13} className="sm:w-[15px] shrink-0 text-gray-500" />
                            <span className="text-gray-500 font-medium">Email:</span>
                            <span>{order.customer_email || "—"}</span>
                          </div>
                        </div>
                        {(order.address_line1 || order.address_line2 || order.pincode) && (
                          <div className="pt-2 border-t border-[#3F3F46] space-y-1 text-xs sm:text-base">
                            <div className="flex flex-col sm:grid sm:grid-cols-3 gap-y-1 sm:gap-x-4">
                              {order.address_line1 && <span className="text-gray-300 sm:text-left"><span className="text-gray-500 font-medium">Addr 1:</span> {order.address_line1}</span>}
                              {order.address_line2 && <span className="text-gray-300 sm:text-center"><span className="text-gray-500 font-medium">Addr 2:</span> {order.address_line2}</span>}
                              {order.pincode && <span className="text-gray-300 sm:text-right"><span className="text-gray-500 font-medium">Pin:</span> {order.pincode}</span>}
                            </div>
                            {(order.district || order.city || order.state) && (
                              <div className="flex flex-col sm:grid sm:grid-cols-3 gap-y-1 sm:gap-x-4">
                                {order.district && <span className="text-gray-300 sm:text-left"><span className="text-gray-500 font-medium">District:</span> {order.district}</span>}
                                {order.city && <span className="text-gray-300 sm:text-center"><span className="text-gray-500 font-medium">City:</span> {order.city}</span>}
                                {order.state && <span className="text-gray-300 sm:text-right"><span className="text-gray-500 font-medium">State:</span> {order.state}</span>}
                              </div>
                            )}
                          </div>
                        )}
                        {order.payment_method === "upi" && order.payment_screenshot && (
                          <div className="pt-2 border-t border-[#3F3F46]">
                            <p className="text-sm text-gray-500 font-medium mb-2">Payment Screenshot</p>
                            <img
                              src={order.payment_screenshot}
                              alt="Payment screenshot"
                              className="w-full max-w-xs rounded-lg border border-[#3F3F46]"
                            />
                          </div>
                        )}
                      </div>

                      <div className="space-y-1.5 mb-3 sm:mb-4">
                        <p className="text-xs sm:text-base text-[#F59E0B] font-semibold uppercase tracking-wider">Items</p>
                        <div className="divide-y divide-[#3F3F46]">
                          {(order.items as any[]).map((item: any, i: number) => (
                            <div key={i} className="flex items-center justify-between py-1.5 sm:py-2 text-xs sm:text-base">
                              <span className="flex items-center gap-2 text-gray-300 min-w-0">
                                <Package size={13} className="sm:w-[15px] shrink-0 text-gray-500" />
                                <span className="font-medium truncate">{item.name}</span>
                                <span className="text-gray-500 shrink-0">x{item.quantity}</span>
                              </span>
                              <span className="text-gray-200 font-medium">{formatPrice(item.price * item.quantity)}</span>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="pt-3 border-t border-[#3F3F46] space-y-1.5">
                        {order.coupon_code && (
                          <div className="flex items-center justify-between text-xs sm:text-base">
                            <div className="flex items-center gap-1.5 text-gray-300">
                              <Ticket size={14} className="sm:w-4 shrink-0 text-amber-400" />
                              <span>Coupon (<span className="text-amber-400 font-semibold">{order.coupon_code}</span>)</span>
                            </div>
                            {Number(order.discount_amount) > 0 && (
                              <span className="text-green-400 font-semibold shrink-0">-{formatPrice(Number(order.discount_amount))}</span>
                            )}
                          </div>
                        )}
                        <div className="flex items-center justify-between">
                          <span className="text-gray-300 font-bold text-sm sm:text-xl">Final Total</span>
                          <span className="text-white font-bold text-base sm:text-2xl">{formatPrice(order.total_amount)}</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          </AnimatePresence>

          {filtered.length === 0 && (
            <p className="text-center text-[#6B7280] py-12">No orders found</p>
          )}

          {totalPages > 1 && (
            <div className="flex justify-center gap-2 pt-4">
              {Array.from({ length: totalPages }, (_, i) => (
                <button
                  key={i}
                  onClick={() => setPage(i + 1)}
                  className={`w-8 h-8 rounded-lg text-sm transition ${
                    page === i + 1
                      ? "bg-[#F59E0B] text-white"
                      : "bg-[#2A2B30] text-[#9CA3AF] hover:bg-[#3F3F46]"
                  }`}
                >
                  {i + 1}
                </button>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  )
}
