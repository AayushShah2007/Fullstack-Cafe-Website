"use client"

import { useEffect, useState, useRef, useCallback } from "react"
import type { User, Order } from "@/types"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { formatPrice } from "@/utils/helpers"
import { Mail, Phone, ShoppingBag, CalendarDays, Package, Ticket, MapPin } from "lucide-react"

interface UserWithStats extends User {
  order_count?: number
  total_spent?: number
}

function OrderPopover({ userId }: { userId: string }) {
  const [orders, setOrders] = useState<Order[] | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    fetch(`/api/orders/list?userId=${userId}&limit=20`)
      .then((r) => r.json())
      .then((data) => {
        if (!cancelled && Array.isArray(data)) setOrders(data)
      })
      .catch(() => {})
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [userId])

  if (loading) {
    return (
      <div className="p-4 text-center">
        <div className="w-5 h-5 border-2 border-amber-500 border-t-transparent rounded-full animate-spin inline-block" />
      </div>
    )
  }

  if (!orders || orders.length === 0) {
    return (
      <div className="p-4 text-center">
        <p className="text-yellow-500 text-sm font-medium">No order history yet</p>
      </div>
    )
  }

  return (
    <div className="divide-y divide-[#3F3F46] max-h-80 overflow-y-auto">
      {orders.map((order) => (
        <div key={order.id} className="p-4 bg-[#2D2416]">
          <div className="flex items-start justify-between mb-3">
            <div>
              <div className="text-white text-lg font-bold">{order.customer_name}</div>
              <div className="flex items-center gap-3 mt-1">
                <span className="text-sm text-gray-400">{order.customer_phone}</span>
                <span className="text-sm text-gray-500">|</span>
                <span className="text-sm text-gray-400">{order.customer_email || "—"}</span>
              </div>
            </div>
            <div className="text-xs text-white shrink-0">
              {new Date(order.created_at).toLocaleDateString("en-IN", {
                day: "numeric", month: "short", year: "numeric",
              })}
              <br />
              {new Date(order.created_at).toLocaleTimeString("en-IN", {
                hour: "2-digit", minute: "2-digit",
              })}
            </div>
          </div>
          {order.customer_address && (
            <div className="flex items-start gap-1.5 mb-3 text-gray-400 text-sm">
              <MapPin size={10} className="mt-0.5 shrink-0" />
              <span>{order.customer_address}</span>
            </div>
          )}

          <div className="space-y-1.5 mb-3">
            {(order.items as any[]).map((item: any, i: number) => (
              <div key={i} className="flex items-center text-sm text-gray-400">
                <span className="flex-1 text-gray-300 truncate">{item.name}</span>
                <span className="w-10 text-center text-gray-500">x{item.quantity}</span>
                <span className="w-20 text-right text-gray-500">{formatPrice(item.price)}</span>
                <span className="w-24 text-right text-gray-300 font-medium">{formatPrice(item.price * item.quantity)}</span>
              </div>
            ))}
          </div>

          <div className="space-y-1.5 text-sm">
            {order.coupon_code && Number(order.discount_amount) > 0 && (
              <div className="flex items-center justify-between text-gray-400">
                <div className="flex items-center gap-2">
                  <Ticket size={12} className="shrink-0" />
                  <span className="text-amber-400 font-semibold">Discount Coupon:</span>
                  <span className="text-amber-400 font-medium">{order.coupon_code}</span>
                </div>
                <span className="text-green-400">-{formatPrice(Number(order.discount_amount))}</span>
              </div>
            )}
            {!order.coupon_code && Number(order.discount_amount) > 0 && (
              <div className="flex items-center justify-between text-gray-400">
                <span>Discount</span>
                <span className="text-green-400">-{formatPrice(Number(order.discount_amount))}</span>
              </div>
            )}
            <div className="flex items-center justify-between pt-2 border-t border-[#3F3F46]">
              <span className="text-gray-300 font-semibold text-base">Total</span>
              <span className="text-white font-bold text-lg">{formatPrice(Number(order.total_amount))}</span>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<UserWithStats[]>([])
  const [loading, setLoading] = useState(true)
  const [hoveredUserId, setHoveredUserId] = useState<string | null>(null)
  const hoverTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const res = await fetch("/api/users")
        const data = await res.json()
        if (Array.isArray(data)) {
          setUsers((prev) => {
            if (prev.length === data.length && prev.every((u, i) => u.id === data[i].id && u.total_spent === data[i].total_spent && u.order_count === data[i].order_count)) {
              return prev
            }
            return data
          })
        }
      } catch {
        // silent
      }
      setLoading(false)
    }

    fetchUsers()
    const interval = setInterval(fetchUsers, 5000)
    return () => clearInterval(interval)
  }, [])

  const handleMouseEnter = useCallback((userId: string) => {
    if (hoverTimer.current) clearTimeout(hoverTimer.current)
    setHoveredUserId(userId)
  }, [])

  const handleMouseLeave = useCallback(() => {
    if (hoverTimer.current) clearTimeout(hoverTimer.current)
    hoverTimer.current = setTimeout(() => setHoveredUserId(null), 200)
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-amber-500 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-white">Users</h1>

      <div className="grid grid-cols-1 gap-4">
        {users.map((user) => (
          <div
            key={user.id}
            className="relative"
            onMouseEnter={() => handleMouseEnter(user.id)}
            onMouseLeave={handleMouseLeave}
          >
            <Card className={`bg-[#2A2B30] border-[#3F3F46] hover:bg-[#25262B] transition-colors cursor-pointer ${hoveredUserId === user.id ? "pb-0" : ""}`}>
              <CardHeader className="pb-2 pt-4 px-4">
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-white text-base">{user.name}</CardTitle>
                    <div className="flex items-center gap-2 mt-0.5">
                      <Badge
                        className={
                          user.role === "admin"
                            ? "bg-[#F59E0B]/20 text-[#F59E0B] border border-[#F59E0B]/30 font-semibold text-xs"
                            : "bg-[#3F3F46] text-gray-300 border border-[#52525B] font-semibold text-xs"
                        }
                      >
                        {user.role}
                      </Badge>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-amber-400 font-bold text-base">{formatPrice(user.total_spent || 0)}</div>
                    <div className="text-gray-500 text-xs">Total Spent</div>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-2 px-4 pb-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <div className="flex items-center gap-2 text-sm text-gray-300">
                    <Mail size={14} className="text-gray-500 shrink-0" />
                    <span className="truncate">{user.email}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-300">
                    <Phone size={14} className="text-gray-500 shrink-0" />
                    <span>{user.phone || "—"}</span>
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <div className="flex items-center gap-2 text-sm text-gray-300">
                    <ShoppingBag size={14} className="text-gray-500 shrink-0" />
                    <span>{user.order_count} orders</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-300">
                    <CalendarDays size={14} className="text-gray-500 shrink-0" />
                    <span>Joined {new Date(user.created_at).toLocaleDateString()}</span>
                  </div>
                </div>

                <div className="pt-1.5 border-t border-[#3F3F46]">
                  <div className="text-xs text-gray-400 font-medium mb-1">Address</div>
                  <div className="text-sm text-gray-300 space-y-1">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div><span className="text-gray-500">Line 1:</span> {user.address_line1 || "—"}</div>
                      <div><span className="text-gray-500">Line 2:</span> {user.address_line2 || "—"}</div>
                    </div>
                    <div className="flex justify-between gap-4 flex-wrap">
                      <div className="flex-1"><span className="text-gray-500">Landmark:</span> {user.landmark || "—"}</div>
                      <div className="flex-1"><span className="text-gray-500">District:</span> {user.district || "—"}</div>
                      <div className="flex-1"><span className="text-gray-500">City:</span> {user.city || "—"}</div>
                      <div className="flex-1"><span className="text-gray-500">State:</span> {user.state || "—"}</div>
                      <div className="flex-1"><span className="text-gray-500">Pincode:</span> {user.pincode || "—"}</div>
                    </div>
                  </div>
                </div>
              </CardContent>
              {hoveredUserId === user.id && (
                <div className="border-t border-[#3F3F46]">
                  <div className="px-3 py-2 border-b border-[#3F3F46] flex items-center justify-between bg-[#25262B]">
                    <span className="text-white text-sm font-semibold flex items-center gap-1.5">
                      <Package size={14} className="text-amber-400" />
                      Order History
                    </span>
                    <span className="text-xs text-gray-500">{user.order_count} total</span>
                  </div>
                  <OrderPopover userId={user.id} />
                </div>
              )}
            </Card>
          </div>
        ))}
      </div>

      {users.length === 0 && (
        <div className="text-center text-gray-500 py-12">No users found.</div>
      )}
    </div>
  )
}
