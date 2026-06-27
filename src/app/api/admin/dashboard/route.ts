import { NextRequest, NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/supabase-admin"

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const range = searchParams.get("range") || "today"

    const now = new Date()
    const offset = 5.5 * 60 * 60 * 1000
    const nowIST = new Date(now.getTime() + offset)
    let startDate: Date
    if (range === "month") {
      startDate = new Date(nowIST)
      startDate.setDate(startDate.getDate() - 30)
    } else if (range === "week") {
      startDate = new Date(nowIST)
      startDate.setDate(startDate.getDate() - 7)
    } else {
      startDate = new Date(nowIST)
      startDate.setHours(0, 0, 0, 0)
    }
    const startUTC = new Date(startDate.getTime() - offset)
    const startISO = startUTC.toISOString()

    const { count: totalOrders } = await supabaseAdmin
      .from("orders")
      .select("*", { count: "exact", head: true })
      .gte("created_at", startISO)

    const { data: rangeOrders } = await supabaseAdmin
      .from("orders")
      .select("total_amount, created_at, items, status, payment_method, order_type")
      .gte("created_at", startISO)

    const paidOrders = rangeOrders?.filter(
      (o) => !["rejected", "cancelled"].includes(o.status)
    ) || []
    const revenue = paidOrders.reduce((s, o) => s + Number(o.total_amount), 0)

    // Payment method breakdown
    const pmBreakdown: Record<string, { revenue: number; count: number }> = {
      upi: { revenue: 0, count: 0 },
      card: { revenue: 0, count: 0 },
      cash: { revenue: 0, count: 0 },
    }
    paidOrders.forEach((o) => {
      const pm = (o.payment_method || "cash") as string
      if (pmBreakdown[pm]) {
        pmBreakdown[pm].revenue += Number(o.total_amount)
        pmBreakdown[pm].count++
      }
    })

    // Order type breakdown
    const orderTypeBreakdown: Record<string, number> = { dinein: 0, delivery: 0, takeaway: 0 }
    paidOrders.forEach((o) => {
      const ot = ((o.order_type as string) || "").replace("-", "")
      if (orderTypeBreakdown[ot] !== undefined) orderTypeBreakdown[ot]++
      else orderTypeBreakdown[ot] = 1
    })

    // Average order value
    const averageOrderValue = paidOrders.length > 0
      ? revenue / paidOrders.length
      : 0

    const { count: activeUsers } = await supabaseAdmin
      .from("users")
      .select("*", { count: "exact", head: true })
      .not("id", "is", null)

    // Top 5 selling items
    const itemMap: Record<string, number> = {}
    paidOrders.forEach((o) => {
      const items = (o.items as any[]) || []
      items.forEach((item: any) => {
        itemMap[item.name] = (itemMap[item.name] || 0) + (item.quantity || 0)
      })
    })
    const topItems = Object.entries(itemMap)
      .map(([name, quantity]) => ({ name, quantity }))
      .sort((a, b) => b.quantity - a.quantity)
      .slice(0, 5)

    // Peak hours
    const hourMap: Record<string, number> = {}
    for (let h = 0; h < 24; h++) {
      const label = h === 0 ? "12 AM" : h < 12 ? `${h} AM` : h === 12 ? "12 PM" : `${h - 12} PM`
      hourMap[label] = 0
    }
    const toIST = (utcStr: string) => new Date(new Date(utcStr).getTime() + offset)

    paidOrders.forEach((o) => {
      const d = toIST(o.created_at)
      const h = d.getHours()
      const label = h === 0 ? "12 AM" : h < 12 ? `${h} AM` : h === 12 ? "12 PM" : `${h - 12} PM`
      if (hourMap[label] !== undefined) hourMap[label]++
    })
    const peakHours = Object.entries(hourMap).map(([hour, count]) => ({ hour, count }))

    // Orders by day/hour for chart
    const chartData: { label: string; count: number; revenue: number }[] = []
    if (range === "today") {
      for (let h = 0; h < 24; h++) {
        const label = h === 0 ? "12 AM" : h < 12 ? `${h} AM` : h === 12 ? "12 PM" : `${h - 12} PM`
        chartData.push({ label, count: 0, revenue: 0 })
      }
      paidOrders.forEach((o) => {
        const h = toIST(o.created_at).getHours()
        if (chartData[h]) {
          chartData[h].count++
          chartData[h].revenue += Number(o.total_amount)
        }
      })
    } else {
      const days = range === "month" ? 30 : 7
      const dayLabels: Record<string, { count: number; revenue: number }> = {}
      for (let i = days - 1; i >= 0; i--) {
        const d = new Date()
        d.setDate(d.getDate() - i)
        const key = d.toLocaleDateString("en-IN", { weekday: "short", day: "numeric" })
        dayLabels[key] = { count: 0, revenue: 0 }
      }
      paidOrders.forEach((o) => {
        const key = toIST(o.created_at).toLocaleDateString("en-IN", {
          weekday: "short", day: "numeric",
        })
        if (dayLabels[key]) {
          dayLabels[key].count++
          dayLabels[key].revenue += Number(o.total_amount)
        }
      })
      Object.entries(dayLabels).forEach(([label, data]) => {
        chartData.push({ label, ...data })
      })
    }

    // Revenue target (1.3x of current revenue, min 1000)
    const revenueTarget = Math.max(1000, Math.round(revenue * 1.3))

    return NextResponse.json({
      totalOrders: totalOrders || 0,
      revenue,
      averageOrderValue,
      activeUsers: activeUsers || 0,
      ordersByDay: chartData,
      topItems,
      peakHours,
      revenueTarget,
      paymentMethodBreakdown: pmBreakdown,
      orderTypeBreakdown,
      selectedRange: range,
    })
  } catch (error) {
    console.error("Dashboard API error:", error)
    return NextResponse.json(
      { error: "Failed to fetch dashboard stats" },
      { status: 500 }
    )
  }
}
