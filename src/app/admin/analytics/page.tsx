"use client"

import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts"
import { formatPrice } from "@/utils/helpers"

const COLORS = ["#F59E0B", "#60A5FA", "#D97706", "#3B82F6", "#FBBF24"]

export default function AdminAnalyticsPage() {
  const [orderTypeData, setOrderTypeData] = useState<
    { name: string; value: number }[]
  >([])
  const [topItems, setTopItems] = useState<
    { name: string; quantity: number }[]
  >([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchAnalytics = async () => {
      const { data: orders } = await supabase
        .from("orders")
        .select("order_type")
        .eq("payment_status", "paid")

      if (orders) {
        const counts: Record<string, number> = {}
        orders.forEach((o: { order_type: string }) => {
          counts[o.order_type] = (counts[o.order_type] || 0) + 1
        })
        setOrderTypeData(
          Object.entries(counts).map(([name, value]) => ({
            name,
            value,
          }))
        )
      }

      // Top items
      const { data: allOrders } = await supabase
        .from("orders")
        .select("items")
        .eq("payment_status", "paid")

      if (allOrders) {
        const itemCounts: Record<string, number> = {}
        allOrders.forEach((o: { items: any }) => {
          ;(o.items as any[]).forEach((item: any) => {
            itemCounts[item.name] =
              (itemCounts[item.name] || 0) + item.quantity
          })
        })

        const sorted = Object.entries(itemCounts)
          .map(([name, quantity]) => ({ name, quantity }))
          .sort((a, b) => b.quantity - a.quantity)
          .slice(0, 5)

        setTopItems(sorted)
      }

      setLoading(false)
    }

    fetchAnalytics()
  }, [])

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-[#E5E7EB]">Analytics</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Order Type Distribution */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg text-[#E5E7EB]">Orders by Type</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={orderTypeData}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    label={({ name, percent }: any) => `${name} ${(percent * 100).toFixed(0)}%`}
                    labelLine={false}
                  >
                    {orderTypeData.map((_, i) => (
                      <Cell
                        key={i}
                        fill={COLORS[i % COLORS.length]}
                      />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#2A2B30",
                      border: "1px solid #3F3F46",
                      borderRadius: "8px",
                      color: "#E5E7EB",
                    }}
                    labelStyle={{ color: "#F59E0B", fontWeight: 600 }}
                  />
                  <Legend formatter={(value) => <span style={{ color: "#E5E7EB" }}>{value}</span>} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Top Items */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg text-[#E5E7EB]">Top Selling Items</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={topItems}
                  layout="vertical"
                >
                  <XAxis type="number" tick={{ fill: "#E5E7EB", fontSize: 12 }} axisLine={{ stroke: "#3F3F46" }} tickLine={{ stroke: "#3F3F46" }} />
                  <YAxis
                    type="category"
                    dataKey="name"
                    width={100}
                    tick={{ fill: "#E5E7EB", fontSize: 12 }}
                    axisLine={{ stroke: "#3F3F46" }}
                    tickLine={{ stroke: "#3F3F46" }}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#2A2B30",
                      border: "1px solid #3F3F46",
                      borderRadius: "8px",
                      color: "#E5E7EB",
                    }}
                    labelStyle={{ color: "#F59E0B", fontWeight: 600 }}
                  />
                  <Bar dataKey="quantity" fill="#F59E0B" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
