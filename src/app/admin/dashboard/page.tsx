"use client"

import { useEffect, useState, useCallback } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { TrendingUp, Clock, Pizza, IndianRupee } from "lucide-react"
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Legend,
  Cell,
} from "recharts"

const RANGES = ["today", "week", "month"] as const
type Range = (typeof RANGES)[number]

interface DashboardStats {
  totalOrders: number
  revenue: number
  averageOrderValue: number
  activeUsers: number
  ordersByDay: { label: string; count: number; revenue: number }[]
  topItems: { name: string; quantity: number }[]
  peakHours: { hour: string; count: number }[]
  revenueTarget: number
  paymentMethodBreakdown: { upi: { revenue: number; count: number }; card: { revenue: number; count: number }; cash: { revenue: number; count: number } }
  orderTypeBreakdown: { dinein: number; delivery: number; takeaway: number }
  selectedRange: string
}

const ChartTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-[#2A2B30] border border-[#3F3F46] rounded-lg px-3 py-2 text-sm">
      <p className="text-[#F59E0B] font-semibold mb-1">{label}</p>
      {payload.map((entry: any) => (
        <p key={entry.name} style={{ color: entry.color }}>
          {entry.name === "revenue"
            ? `Revenue: ₹${Number(entry.value || 0).toLocaleString("en-IN")}`
            : `Orders: ${entry.value}`}
        </p>
      ))}
    </div>
  )
}

const COLORS = ["#F59E0B", "#10B981", "#3B82F6", "#EF4444", "#8B5CF6", "#06B6D4"]
const PM_COLORS = { upi: "#8B5CF6", card: "#3B82F6", cash: "#10B981" }
const PM_LABELS: Record<string, string> = { upi: "UPI", card: "Card", cash: "Cash" }
const OT_COLORS: Record<string, string> = { dinein: "#F59E0B", delivery: "#3B82F6", takeaway: "#10B981" }
const OT_LABELS: Record<string, string> = { dinein: "Dine-in", delivery: "Delivery", takeaway: "Takeaway" }

function DonutCenter({ value, label }: { value: string; label: string }) {
  return (
    <text x="50%" y="50%" textAnchor="middle" dominantBaseline="middle">
      <tspan x="50%" dy="-6" fill="#E5E7EB" fontSize="20" fontWeight="bold">{value}</tspan>
      <tspan x="50%" dy="18" fill="#9CA3AF" fontSize="11">{label}</tspan>
    </text>
  )
}

const CustomPieLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }: any) => {
  const RADIAN = Math.PI / 180
  const radius = outerRadius + 20
  const x = cx + radius * Math.cos(-midAngle * RADIAN)
  const y = cy + radius * Math.sin(-midAngle * RADIAN)
  if (percent < 0.05) return null
  return (
    <text x={x} y={y} textAnchor={x > cx ? "start" : "end"} dominantBaseline="central" fill="#9CA3AF" fontSize="11">
      {`${(percent * 100).toFixed(0)}%`}
    </text>
  )
}

export default function AdminDashboard() {
  const [range, setRange] = useState<Range>("today")
  const [stats, setStats] = useState<DashboardStats>({
    totalOrders: 0,
    revenue: 0,
    averageOrderValue: 0,
    activeUsers: 0,
    ordersByDay: [],
    topItems: [],
    peakHours: [],
    revenueTarget: 1000,
    paymentMethodBreakdown: { upi: { revenue: 0, count: 0 }, card: { revenue: 0, count: 0 }, cash: { revenue: 0, count: 0 } },
    orderTypeBreakdown: { dinein: 0, delivery: 0, takeaway: 0 },
    selectedRange: "today",
  })

  const fetchStats = useCallback(async () => {
    try {
      const res = await fetch(`/api/admin/dashboard?range=${range}`)
      if (res.ok) {
        const data = await res.json()
        setStats(data)
      }
    } catch (e) {
      console.error("Dashboard fetch error:", e)
    }
  }, [range])

  useEffect(() => {
    fetchStats()
    const interval = setInterval(fetchStats, 30000)
    return () => clearInterval(interval)
  }, [fetchStats])

  const kpis = [
    { title: "Orders", value: stats.totalOrders, accent: "border-l-[#F59E0B]" },
    { title: "Revenue", value: `₹${stats.revenue.toFixed(0)}`, accent: "border-l-[#10B981]" },
    { title: "Avg Order Value", value: `₹${stats.averageOrderValue.toFixed(0)}`, accent: "border-l-[#8B5CF6]" },
    { title: "Total Users", value: stats.activeUsers, accent: "border-l-[#3B82F6]" },
  ]

  const chartTitle =
    range === "today" ? "Orders & Revenue - Today (Hourly)"
    : range === "week" ? "Orders & Revenue - Last 7 Days"
    : "Orders & Revenue - Last 30 Days"

  const pmData = Object.entries(stats.paymentMethodBreakdown)
    .filter(([_, v]) => v.revenue > 0)
    .map(([k, v]) => ({ name: PM_LABELS[k] || k, revenue: v.revenue, count: v.count }))
  const totalFromPM = pmData.reduce((s, d) => s + d.revenue, 0)

  const targetPct = stats.revenueTarget > 0 ? Math.min((stats.revenue / stats.revenueTarget) * 100, 100) : 0

  const otData = Object.entries(stats.orderTypeBreakdown)
    .filter(([_, v]) => v > 0)
    .map(([k, v]) => ({ name: OT_LABELS[k] || k, value: v }))
  const totalOT = otData.reduce((s, d) => s + d.value, 0)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="text-2xl font-bold text-[#E5E7EB]">Dashboard</h1>
        <div className="flex items-center gap-1 bg-[#2A2B30] rounded-lg p-1 border border-[#3F3F46]">
          {RANGES.map((r) => (
            <button
              key={r}
              onClick={() => setRange(r)}
              className={`px-4 py-1.5 text-sm font-medium rounded-md transition-all capitalize ${
                range === r
                  ? "bg-[#F59E0B] text-white"
                  : "text-[#9CA3AF] hover:text-[#E5E7EB]"
              }`}
            >
              {r}
            </button>
          ))}
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map((kpi) => (
          <Card key={kpi.title} className={`border-l-4 ${kpi.accent} bg-[#2A2B30]`}>
            <CardContent className="p-6">
              <p className="text-sm text-[#E5E7EB]">{kpi.title}</p>
              <p className="text-3xl font-bold text-white mt-1">{kpi.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Chart - combined on desktop, split on mobile */}
        <Card className="bg-[#2A2B30] border border-[#3F3F46] lg:col-span-2 hidden lg:block">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2 text-[#E5E7EB]">
              <TrendingUp size={18} className="text-[#F59E0B]" />
              {chartTitle}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={stats.ordersByDay}>
                  <XAxis dataKey="label" tick={{ fill: "#E5E7EB", fontSize: 11 }} axisLine={{ stroke: "#3F3F46" }} tickLine={{ stroke: "#3F3F46" }} interval={range === "today" ? 2 : 0} />
                  <YAxis yAxisId="left" tick={{ fill: "#E5E7EB", fontSize: 11 }} axisLine={{ stroke: "#3F3F46" }} tickLine={{ stroke: "#3F3F46" }} allowDecimals={false} label={{ value: "Orders", angle: -90, position: "insideLeft", fill: "#F59E0B", fontSize: 11 }} />
                  <YAxis yAxisId="right" orientation="right" tick={{ fill: "#E5E7EB", fontSize: 11 }} axisLine={{ stroke: "#3F3F46" }} tickLine={{ stroke: "#3F3F46" }} tickFormatter={(v: number) => `₹${v}`} label={{ value: "Revenue (₹)", angle: 90, position: "insideRight", fill: "#10B981", fontSize: 11 }} />
                  <Tooltip content={<ChartTooltip />} />
                  <Legend wrapperStyle={{ color: "#E5E7EB", fontSize: 12 }} />
                  <Line yAxisId="left" type="monotone" dataKey="count" stroke="#F59E0B" strokeWidth={2} dot={{ fill: "#F59E0B", r: 3 }} name="Orders" />
                  <Line yAxisId="right" type="monotone" dataKey="revenue" stroke="#10B981" strokeWidth={2} dot={{ fill: "#10B981", r: 3 }} name="revenue" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Mobile: Orders chart separate */}
        <Card className="bg-[#2A2B30] border border-[#3F3F46] lg:hidden">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2 text-[#E5E7EB]">
              <TrendingUp size={18} className="text-[#F59E0B]" />
              Orders
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={stats.ordersByDay} margin={{ top: 5, right: 5, left: 5, bottom: 0 }}>
                  <XAxis dataKey="label" tick={{ fill: "#9CA3AF", fontSize: 10 }} axisLine={false} tickLine={false} interval={range === "today" ? 3 : range === "week" ? 0 : 2} />
                  <YAxis tick={{ fill: "#9CA3AF", fontSize: 10 }} axisLine={false} tickLine={false} width={35} allowDecimals={false} />
                  <Tooltip content={<ChartTooltip />} />
                  <Line type="monotone" dataKey="count" stroke="#F59E0B" strokeWidth={2} dot={false} activeDot={{ r: 4, fill: "#F59E0B" }} name="Orders" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Mobile: Revenue chart separate */}
        <Card className="bg-[#2A2B30] border border-[#3F3F46] lg:hidden">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2 text-[#E5E7EB]">
              <TrendingUp size={18} className="text-[#10B981]" />
              Revenue
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={stats.ordersByDay} margin={{ top: 5, right: 5, left: 5, bottom: 0 }}>
                  <XAxis dataKey="label" tick={{ fill: "#9CA3AF", fontSize: 10 }} axisLine={false} tickLine={false} interval={range === "today" ? 3 : range === "week" ? 0 : 2} />
                  <YAxis tick={{ fill: "#9CA3AF", fontSize: 10 }} axisLine={false} tickLine={false} width={35} tickCount={4} tickFormatter={(v: number) => v >= 1000 ? `₹${(v / 1000).toFixed(1)}k` : `₹${v}`} />
                  <Tooltip content={<ChartTooltip />} />
                  <Line type="monotone" dataKey="revenue" stroke="#10B981" strokeWidth={2} dot={false} activeDot={{ r: 4, fill: "#10B981" }} name="revenue" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Revenue Breakdown by Payment Method */}
        <Card className="bg-[#2A2B30] border border-[#3F3F46] flex flex-col">
          <CardHeader className="pb-0">
            <CardTitle className="text-lg flex items-center gap-2 text-[#E5E7EB]">
              <IndianRupee size={18} className="text-[#F59E0B]" />
              Revenue by Payment
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col items-center justify-center flex-1 pt-0 gap-2">
            {pmData.length === 0 ? (
              <p className="text-[#6B7280] text-sm">No revenue data</p>
            ) : (
              <>
                <div className="h-40 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={pmData}
                        cx="50%"
                        cy="50%"
                        innerRadius={40}
                        outerRadius={65}
                        dataKey="revenue"
                        paddingAngle={3}
                      >
                        {pmData.map((entry) => (
                          <Cell key={entry.name} fill={PM_COLORS[entry.name.toLowerCase() as keyof typeof PM_COLORS] || "#6B7280"} />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{ backgroundColor: "#2A2B30", border: "1px solid #3F3F46", borderRadius: 8, fontSize: 12 }}
                        itemStyle={{ color: "#E5E7EB" }}
                        labelStyle={{ color: "#F59E0B", fontWeight: 600 }}
                        formatter={(value: any, name: any, props: any) => {
                          const entry = props.payload
                          return [`${entry.count} orders • ₹${Number(value).toLocaleString("en-IN")}`, ""]
                        }}
                      />
                      <text x="50%" y="47%" textAnchor="middle" fill="#E5E7EB" fontSize="18" fontWeight="bold">
                        ₹{(totalFromPM / 1000).toFixed(1)}k
                      </text>
                      <text x="50%" y="62%" textAnchor="middle" fill="#E5E7EB" fontSize="10" fontWeight="semibold">
                        Total
                      </text>
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                {/* Legend */}
                <div className="flex items-center gap-4 text-xs text-[#9CA3AF]">
                  {Object.entries(PM_COLORS).map(([key, color]) => (
                    <span key={key} className="flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: color }} />
                      {PM_LABELS[key]}
                    </span>
                  ))}
                </div>
                {/* Target progress */}
                <div className="w-full mt-1">
                  <div className="flex justify-between text-xs text-[#E5E7EB] mb-1">
                    <span>Revenue Target</span>
                    <span className="font-semibold">{targetPct.toFixed(0)}%</span>
                  </div>
                  <div className="h-2 bg-[#3F3F46] rounded-full overflow-hidden">
                    <div className="h-full bg-[#F59E0B] rounded-full transition-all duration-700" style={{ width: `${targetPct}%` }} />
                  </div>
                  <p className="text-xs text-[#E5E7EB] mt-1 text-center font-medium">
                    ₹{stats.revenue.toFixed(0)} of ₹{stats.revenueTarget.toFixed(0)}
                  </p>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Bottom row: Top Items + Order Type + Peak Hours */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Top 5 Selling Items */}
        <Card className="bg-[#2A2B30] border border-[#3F3F46]">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2 text-[#E5E7EB]">
              <Pizza size={18} className="text-[#F59E0B]" />
              Top 5 Selling Items
            </CardTitle>
          </CardHeader>
          <CardContent>
            {stats.topItems.length === 0 ? (
              <p className="text-center text-[#6B7280] py-8">No sales data</p>
            ) : (
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={stats.topItems} layout="vertical" margin={{ left: 10, right: 20 }}>
                    <XAxis type="number" tick={{ fill: "#9CA3AF", fontSize: 11 }} axisLine={{ stroke: "#3F3F46" }} tickLine={false} allowDecimals={false} />
                    <YAxis type="category" dataKey="name" tick={{ fill: "#E5E7EB", fontSize: 11 }} axisLine={false} tickLine={false} width={100} />
                    <Tooltip
                      contentStyle={{ backgroundColor: "#2A2B30", border: "1px solid #3F3F46", borderRadius: 8, fontSize: 12 }}
                      itemStyle={{ color: "#E5E7EB" }}
                      labelStyle={{ color: "#F59E0B", fontWeight: 600 }}
                      formatter={(value: any) => [`${value} sold`, "Quantity"]}
                    />
                    <Bar dataKey="quantity" radius={[0, 4, 4, 0]} barSize={20}>
                      {stats.topItems.map((_, i) => (
                        <Cell key={i} fill={COLORS[i % COLORS.length]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Order Type Distribution */}
        <Card className="bg-[#2A2B30] border border-[#3F3F46] flex flex-col">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2 text-[#E5E7EB]">
              <TrendingUp size={18} className="text-[#F59E0B]" />
              Orders by Type
            </CardTitle>
          </CardHeader>
          <CardContent className="flex-1">
            {otData.length === 0 ? (
              <p className="text-center text-[#6B7280] py-8">No data</p>
            ) : (
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={otData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} dataKey="value" paddingAngle={3}>
                      {otData.map((entry) => (
                        <Cell key={entry.name} fill={OT_COLORS[entry.name.toLowerCase().replace("-", "") as keyof typeof OT_COLORS] || "#6B7280"} />
                      ))}
                    </Pie>
                    <text x="50%" y="50%" textAnchor="middle" dominantBaseline="middle" fill="#E5E7EB" fontSize="22" fontWeight="bold">
                      {totalOT}
                    </text>
                    <text x="50%" y="65%" textAnchor="middle" dominantBaseline="middle" fill="#E5E7EB" fontSize="11" fontWeight="semibold">
                      Orders
                    </text>
                    <Tooltip
                      contentStyle={{ backgroundColor: "#2A2B30", border: "1px solid #3F3F46", borderRadius: 8, fontSize: 12 }}
                      itemStyle={{ color: "#E5E7EB" }}
                      labelStyle={{ color: "#F59E0B", fontWeight: 600 }}
                      formatter={(value: any) => [`${value} orders`, "Orders"]}
                    />
                    <Legend
                      verticalAlign="bottom"
                      wrapperStyle={{ color: "#9CA3AF", fontSize: 11, paddingTop: 10 }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Peak Hours */}
        <Card className="bg-[#2A2B30] border border-[#3F3F46]">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2 text-[#E5E7EB]">
              <Clock size={18} className="text-[#3B82F6]" />
              Peak Hours
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={stats.peakHours} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                  <XAxis dataKey="hour" tick={{ fill: "#9CA3AF", fontSize: 9 }} axisLine={{ stroke: "#3F3F46" }} tickLine={false} interval={2} />
                  <YAxis tick={{ fill: "#9CA3AF", fontSize: 11 }} axisLine={{ stroke: "#3F3F46" }} tickLine={false} allowDecimals={false} />
                  <Tooltip
                    contentStyle={{ backgroundColor: "#2A2B30", border: "1px solid #3F3F46", borderRadius: 8, fontSize: 12 }}
                    itemStyle={{ color: "#E5E7EB" }}
                    labelStyle={{ color: "#F59E0B", fontWeight: 600 }}
                    formatter={(value: any) => [`${value} orders`, "Orders"]}
                    labelFormatter={(label: any) => `${label}`}
                  />
                  <Bar dataKey="count" radius={[4, 4, 0, 0]} barSize={10}>
                    {stats.peakHours.map((_, i) => (
                      <Cell key={i} fill={COLORS[i % COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
