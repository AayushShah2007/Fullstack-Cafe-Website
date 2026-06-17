"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  LineChart, Line, PieChart, Pie, Cell, Legend,
} from "recharts"
import { formatPrice } from "@/utils/helpers"
import {
  TrendingUp, IndianRupee, ShoppingBag, Users,
  ArrowUpRight, ArrowDownRight, Ticket,
  BarChart3, CalendarDays, Clock, Pizza, Sun,
} from "lucide-react"

const PIE_COLORS = ["#F59E0B", "#3B82F6", "#D97706", "#60A5FA", "#FBBF24", "#10B981"]
const PEAK_COLORS = ["#F59E0B", "#3B82F6", "#10B981", "#EF4444", "#8B5CF6", "#D97706", "#EC4899"]

function DeltaBadge({ value, suffix = "%" }: { value: number; suffix?: string }) {
  const isUp = value >= 0
  return (
    <span className={`inline-flex items-center gap-0.5 text-xs font-bold px-1.5 py-0.5 rounded-full ${isUp ? "bg-green-500/20 text-green-400" : "bg-red-500/20 text-red-400"}`}>
      {isUp ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
      {Math.abs(value).toFixed(1)}{suffix}
    </span>
  )
}

export default function FinancialAnalysisPage() {
  const [dateRange, setDateRange] = useState("week")
  const [loading, setLoading] = useState(true)
  const [data, setData] = useState<any>(null)

  useEffect(() => { fetchData() }, [dateRange])

  const fetchData = async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/admin/financial-analysis?range=${dateRange}`)
      if (res.ok) setData(await res.json())
    } catch {}
    setLoading(false)
  }

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <div className="w-8 h-8 border-4 border-[#F59E0B] border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (!data) return <p className="text-[#9CA3AF] text-center py-20">Failed to load data</p>

  const { metrics, comparison, profitMargin, discountImpact, valueDistribution, weekOverWeek, topItems, hourlyHeatmap, paymentRevenue, peakDays, revenueData, paymentData } = data

  const kpis = [
    { title: "Total Revenue", value: formatPrice(metrics.revenue), icon: IndianRupee, color: "#F59E0B", comp: comparison.revenue },
    { title: "Total Orders", value: metrics.orders, icon: ShoppingBag, color: "#3B82F6", comp: comparison.orders },
    { title: "Avg Order Value", value: formatPrice(metrics.avgOrder), icon: TrendingUp, color: "#D97706", comp: comparison.avgOrder },
    { title: "Unique Customers", value: metrics.customers, icon: Users, color: "#60A5FA", comp: comparison.customers },
  ]

  const valueDistTotal = valueDistribution.reduce((s: number, d: any) => s + d.count, 0)
  const heatMax = Math.max(...hourlyHeatmap.map((c: any) => c.orders), 1)
  const dayOrder = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-[#E5E7EB]">Financial Analysis</h1>
        <select
          value={dateRange}
          onChange={(e) => setDateRange(e.target.value)}
          className="px-3 py-2 rounded-lg bg-[#2A2B30] border border-[#3F3F46] text-[#E5E7EB] text-sm"
        >
          <option value="today">Today</option>
          <option value="week">Last 7 Days</option>
          <option value="month">Last 30 Days</option>
          <option value="quarter">Last 90 Days</option>
          <option value="year">Last Year</option>
        </select>
      </div>

      {/* KPI Cards with comparison */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map((kpi) => {
          const Icon = kpi.icon
          return (
            <Card key={kpi.title}>
              <CardContent className="p-5">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ backgroundColor: `${kpi.color}20` }}>
                    <Icon size={20} style={{ color: kpi.color }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-[#9CA3AF]">{kpi.title}</p>
                    <p className="text-xl font-bold text-[#E5E7EB] truncate">{kpi.value}</p>
                    <DeltaBadge value={kpi.comp} />
                  </div>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Discount Impact */}
      <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2 text-[#E5E7EB]">
              <Ticket size={18} className="text-[#F59E0B]" /> Discount Impact
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-center">
              <div>
                <p className="text-2xl font-bold text-[#EF4444]">{formatPrice(discountImpact.totalDiscount)}</p>
                <p className="text-xs text-[#9CA3AF]">Total Discount</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-[#E5E7EB]">{formatPrice(discountImpact.avgDiscount)}</p>
                <p className="text-xs text-[#9CA3AF]">Avg Discount</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-[#F59E0B]">{discountImpact.ordersWithDiscount}</p>
                <p className="text-xs text-[#9CA3AF]">Orders with Discount</p>
              </div>
            </div>
          </CardContent>
        </Card>

      {/* Revenue Trend + Payment Revenue Split */}
      <div className="grid md:grid-cols-2 gap-6">
        <Card className={dateRange === "quarter" || dateRange === "year" ? "md:col-span-2" : ""}>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2 text-[#E5E7EB]">
              <TrendingUp size={18} className="text-[#10B981]" /> Revenue Trend
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className={dateRange === "quarter" || dateRange === "year" ? "h-80" : "h-64"}>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={revenueData} margin={{ left: 0, right: 0, top: 8, bottom: 8 }}>
                  <XAxis
                    dataKey="label"
                    tick={{ fill: "#9CA3AF", fontSize: dateRange === "quarter" || dateRange === "year" ? 10 : 11 }}
                    axisLine={{ stroke: "#3F3F46" }}
                    tickLine={false}
                    interval={dateRange === "quarter" || dateRange === "year" ? Math.max(0, Math.floor(revenueData.length / 15) - 1) : 0}
                    angle={dateRange === "quarter" || dateRange === "year" ? -30 : 0}
                    textAnchor={dateRange === "quarter" || dateRange === "year" ? "end" : "middle"}
                    height={dateRange === "quarter" || dateRange === "year" ? 40 : 20}
                  />
                  <YAxis tick={{ fill: "#9CA3AF", fontSize: 11 }} axisLine={{ stroke: "#3F3F46" }} tickLine={false} />
                  <Tooltip contentStyle={{ backgroundColor: "#2A2B30", border: "1px solid #3F3F46", borderRadius: "8px", color: "#E5E7EB" }} labelStyle={{ color: "#F59E0B", fontWeight: 600 }} />
                  <Line type="monotone" dataKey="revenue" stroke="#10B981" strokeWidth={2} dot={dateRange === "year" ? false : dateRange === "quarter" ? { fill: "#10B981", r: 2 } : { fill: "#10B981", r: 3 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card className={dateRange === "quarter" || dateRange === "year" ? "md:col-span-2" : ""}>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2 text-[#E5E7EB]">
              <IndianRupee size={18} className="text-[#F59E0B]" /> Payment Revenue Split
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={paymentRevenue} dataKey="revenue" nameKey="name" cx="50%" cy="50%" outerRadius={80}
                    label={({ name, revenue, percent }: any) => `${name.toUpperCase()}: ${formatPrice(revenue)} (${percent.toFixed(1)}%)`}>
                    {paymentRevenue.map((_: any, i: number) => (<Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />))}
                  </Pie>
                  <Tooltip contentStyle={{ backgroundColor: "#2A2B30", border: "1px solid #3F3F46", borderRadius: "8px", color: "#E5E7EB" }}
                    formatter={(value: any, name: any) => [formatPrice(value), name]} />
                  <Legend formatter={(value) => <span style={{ color: "#E5E7EB" }}>{value.toUpperCase()}</span>} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Week-over-Week + Order Value Distribution */}
      <div className="grid md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2 text-[#E5E7EB]">
              <CalendarDays size={18} className="text-[#3B82F6]" /> Week-over-Week Trend
            </CardTitle>
          </CardHeader>
          <CardContent>
            {weekOverWeek ? (
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={weekOverWeek.current.map((d: any, i: number) => ({ label: d.label, current: d.revenue, previous: weekOverWeek.previous[i]?.revenue || 0 }))}>
                    <XAxis dataKey="label" tick={{ fill: "#9CA3AF", fontSize: 11 }} axisLine={{ stroke: "#3F3F46" }} tickLine={false} />
                    <YAxis tick={{ fill: "#9CA3AF", fontSize: 11 }} axisLine={{ stroke: "#3F3F46" }} tickLine={false} />
                    <Tooltip contentStyle={{ backgroundColor: "#2A2B30", border: "1px solid #3F3F46", borderRadius: "8px", color: "#E5E7EB" }} labelStyle={{ color: "#F59E0B", fontWeight: 600 }} />
                    <Legend wrapperStyle={{ color: "#E5E7EB", fontSize: 11 }} />
                    <Line type="monotone" dataKey="current" stroke="#10B981" strokeWidth={2} dot={{ fill: "#10B981", r: 3 }} name="This Week" />
                    <Line type="monotone" dataKey="previous" stroke="#F59E0B" strokeWidth={2} strokeDasharray="4 4" dot={{ fill: "#F59E0B", r: 3 }} name="Last Week" />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <p className="text-center text-[#6B7280] py-16">Week-over-week comparison is available for Today and 7 Days ranges.</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2 text-[#E5E7EB]">
              <BarChart3 size={18} className="text-[#D97706]" /> Order Value Distribution
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={valueDistribution}>
                  <XAxis dataKey="range" tick={{ fill: "#9CA3AF", fontSize: 9 }} axisLine={{ stroke: "#3F3F46" }} tickLine={false} />
                  <YAxis tick={{ fill: "#9CA3AF", fontSize: 11 }} axisLine={{ stroke: "#3F3F46" }} tickLine={false} allowDecimals={false} />
                  <Tooltip contentStyle={{ backgroundColor: "#2A2B30", border: "1px solid #3F3F46", borderRadius: "8px", color: "#E5E7EB" }}
                    formatter={(value: any) => [`${value} orders`, "Orders"]} />
                  <Bar dataKey="count" radius={[4, 4, 0, 0]} barSize={30}>
                    {valueDistribution.map((_: any, i: number) => (<Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
            <p className="text-xs text-[#9CA3AF] text-center mt-2">Total orders: {valueDistTotal}</p>
          </CardContent>
        </Card>
      </div>

      {/* Top 10 Items + Peak Days */}
      <div className="grid md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2 text-[#E5E7EB]">
              <Pizza size={18} className="text-[#F59E0B]" /> Top 10 Items by Revenue
            </CardTitle>
          </CardHeader>
          <CardContent>
            {topItems.length === 0 ? (
              <p className="text-center text-[#6B7280] py-8">No data</p>
            ) : (
              <div className="space-y-2">
                {topItems.map((item: any, i: number) => (
                  <div key={item.name} className="flex items-center gap-3 text-sm">
                    <span className="w-5 text-[#9CA3AF] font-mono text-xs">{i + 1}</span>
                    <span className="flex-1 text-[#E5E7EB] truncate">{item.name}</span>
                    <span className="text-[#9CA3AF] text-xs w-12 text-right">x{item.quantity}</span>
                    <span className="text-[#10B981] font-semibold w-24 text-right">{formatPrice(item.revenue)}</span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2 text-[#E5E7EB]">
              <Sun size={18} className="text-[#F59E0B]" /> Peak Days
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={peakDays}>
                  <XAxis dataKey="day" tick={{ fill: "#9CA3AF", fontSize: 11 }} axisLine={{ stroke: "#3F3F46" }} tickLine={false} />
                  <YAxis tick={{ fill: "#9CA3AF", fontSize: 11 }} axisLine={{ stroke: "#3F3F46" }} tickLine={false} allowDecimals={false} />
                  <Tooltip contentStyle={{ backgroundColor: "#2A2B30", border: "1px solid #3F3F46", borderRadius: "8px", color: "#E5E7EB" }}
                    formatter={(value: any, name: any) => [name === "orders" ? `${value} orders` : formatPrice(value), name === "orders" ? "Orders" : "Revenue"]} />
                  <Legend wrapperStyle={{ color: "#E5E7EB", fontSize: 11 }} />
                  <Bar dataKey="orders" fill="#F59E0B" radius={[4, 4, 0, 0]} barSize={20} name="orders" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Hourly Heatmap */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2 text-[#E5E7EB]">
            <Clock size={18} className="text-[#8B5CF6]" /> Hourly Order Volume (Last 7 Days)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <div className="grid grid-cols-25 gap-[2px] min-w-[600px]" style={{ gridTemplateColumns: "60px repeat(24, 1fr)" }}>
              <div className="text-[10px] text-[#9CA3AF] font-semibold px-1" />
              {Array.from({ length: 24 }, (_, h) => (
                <div key={h} className="text-[9px] text-[#9CA3AF] text-center font-mono">{h === 0 ? "12AM" : h < 12 ? `${h}AM` : h === 12 ? "12PM" : `${h - 12}PM`}</div>
              ))}
              {dayOrder.map((day) => (
                <div key={day} className="contents">
                  <div className="text-[10px] text-[#9CA3AF] font-semibold px-1 py-[3px]">{day}</div>
                  {Array.from({ length: 24 }, (_, h) => {
                    const cell = hourlyHeatmap.find((c: any) => c.day === day && c.hour === h)
                    const count = cell?.orders || 0
                    const intensity = count > 0 ? Math.min(count / heatMax, 1) : 0
                    const bg = count > 0 ? `rgba(245, 158, 11, ${0.15 + intensity * 0.85})` : "#1F2024"
                    return (
                      <div
                        key={`${day}-${h}`}
                        className="rounded-sm flex items-center justify-center text-[10px] font-mono"
                        style={{ backgroundColor: bg, color: intensity > 0.5 ? "#FFF" : "#9CA3AF", aspectRatio: "1" }}
                        title={`${day} ${h}:00 - ${count} orders`}
                      >
                        {count > 0 ? count : ""}
                      </div>
                    )
                  })}
                </div>
              ))}
            </div>
          </div>
          <div className="flex items-center gap-2 mt-3 text-xs text-[#9CA3AF]">
            <span>Low</span>
            <div className="flex gap-[2px]">
              {[0, 1, 2, 3, 4].map((v) => (
                <div key={v} className="w-4 h-4 rounded-sm" style={{ backgroundColor: `rgba(245, 158, 11, ${0.15 + (v / 4) * 0.85})` }} />
              ))}
            </div>
            <span>High</span>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
