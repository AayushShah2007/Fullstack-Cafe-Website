import { NextRequest, NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/supabase-admin"

const OFFSET = 5.5 * 60 * 60 * 1000
const toIST = (utcStr: string) => new Date(new Date(utcStr).getTime() + OFFSET)

function getStartDate(range: string, offset = 0): Date {
  const nowIST = new Date(Date.now() + OFFSET)
  const d = new Date(nowIST)
  d.setDate(d.getDate() - offset)
  switch (range) {
    case "today": d.setHours(0, 0, 0, 0); break
    case "week": d.setDate(d.getDate() - 7 * (offset + 1) + (offset === 0 ? 0 : 7)); break
    case "month": d.setMonth(d.getMonth() - 1 * (offset + 1) + (offset === 0 ? 0 : 1)); break
    case "quarter": d.setMonth(d.getMonth() - 3 * (offset + 1) + (offset === 0 ? 0 : 3)); break
    case "year": d.setFullYear(d.getFullYear() - 1 * (offset + 1) + (offset === 0 ? 0 : 1)); break
    default: d.setDate(d.getDate() - 7)
  }
  return new Date(d.getTime() - OFFSET)
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const range = searchParams.get("range") || "week"

    // Current period orders
    const since = getStartDate(range)
    const { data: orders, error } = await supabaseAdmin
      .from("orders")
      .select("*")
      .not("status", "in", '("rejected","cancelled")')
      .gte("created_at", since.toISOString())
      .order("created_at")

    if (error) throw error
    const paidOrders = orders || []
    const totalRevenue = paidOrders.reduce((s: number, o: any) => s + Number(o.total_amount), 0)
    const totalDiscount = paidOrders.reduce((s: number, o: any) => s + Number(o.discount_amount), 0)
    const uniqueCustomers = new Set(paidOrders.map((o: any) => o.customer_phone)).size

    // Previous period for comparison
    const prevStart = getStartDate(range, 1)
    const prevEnd = getStartDate(range)
    const { data: prevOrders } = await supabaseAdmin
      .from("orders")
      .select("*")
      .not("status", "in", '("rejected","cancelled")')
      .gte("created_at", prevStart.toISOString())
      .lt("created_at", prevEnd.toISOString())

    const prevPaid = prevOrders || []
    const prevRevenue = prevPaid.reduce((s: number, o: any) => s + Number(o.total_amount), 0)
    const prevOrdersCount = prevPaid.length
    const prevAvg = prevOrdersCount ? prevRevenue / prevOrdersCount : 0
    const prevCustomers = new Set(prevPaid.map((o: any) => o.customer_phone)).size

    const calcChange = (curr: number, prev: number) => prev > 0 ? ((curr - prev) / prev) * 100 : curr > 0 ? 100 : 0

    // Revenue trend data (daily or hourly)
    let revenueData: { label: string; revenue: number; orders: number }[]

    if (range === "today") {
      const hourlySlots = ["12AM-3AM", "3AM-6AM", "6AM-9AM", "9AM-12PM", "12PM-3PM", "3PM-6PM", "6PM-9PM", "9PM-12AM"]
      const hourMap: Record<string, { revenue: number; orders: number }> = {}
      hourlySlots.forEach((slot) => { hourMap[slot] = { revenue: 0, orders: 0 } })
      paidOrders.forEach((o: any) => {
        const h = toIST(o.created_at).getHours()
        const slot = hourlySlots[Math.floor(h / 3)] || "9PM-12AM"
        hourMap[slot].revenue += Number(o.total_amount)
        hourMap[slot].orders++
      })
      revenueData = hourlySlots.map((label) => ({ label, ...hourMap[label] }))
    } else {
      const dayCount = range === "week" ? 7 : range === "month" ? 30 : range === "quarter" ? 90 : 365
      const dailyMap: Record<string, { revenue: number; orders: number }> = {}
      for (let i = dayCount - 1; i >= 0; i--) {
        const date = new Date(Date.now() + OFFSET)
        date.setDate(date.getDate() - i)
        dailyMap[date.toLocaleDateString("en-IN", { day: "2-digit", month: "short" })] = { revenue: 0, orders: 0 }
      }
      paidOrders.forEach((o: any) => {
        const key = toIST(o.created_at).toLocaleDateString("en-IN", { day: "2-digit", month: "short" })
        if (dailyMap[key]) { dailyMap[key].revenue += Number(o.total_amount); dailyMap[key].orders++ }
      })
      revenueData = Object.entries(dailyMap).map(([label, data]) => ({ label, ...data }))
    }

    // Payment method count & revenue split
    const pmtCounts: Record<string, { count: number; revenue: number }> = {}
    paidOrders.forEach((o: any) => {
      const pm = o.payment_method || "cash"
      if (!pmtCounts[pm]) pmtCounts[pm] = { count: 0, revenue: 0 }
      pmtCounts[pm].count++
      pmtCounts[pm].revenue += Number(o.total_amount)
    })
    const paymentRevenue = Object.entries(pmtCounts).map(([name, d]) => ({
      name,
      count: d.count,
      revenue: d.revenue,
      percent: totalRevenue > 0 ? (d.revenue / totalRevenue) * 100 : 0,
    }))
    const paymentData = Object.entries(pmtCounts).map(([name, d]) => ({ name, value: d.count }))

    // Order value distribution
    const buckets = [
      { label: "₹0 - ₹200", min: 0, max: 200 },
      { label: "₹200 - ₹500", min: 200, max: 500 },
      { label: "₹500 - ₹1,000", min: 500, max: 1000 },
      { label: "₹1,000 - ₹2,000", min: 1000, max: 2000 },
      { label: "₹2,000+", min: 2000, max: Infinity },
    ]
    const valueDistribution = buckets.map((b) => ({
      range: b.label,
      count: paidOrders.filter((o: any) => {
        const amt = Number(o.total_amount)
        return amt >= b.min && amt < b.max
      }).length,
    }))

    // Top 10 items by revenue
    const itemRevenue: Record<string, { revenue: number; quantity: number }> = {}
    paidOrders.forEach((o: any) => {
      const items = typeof o.items === "string" ? JSON.parse(o.items) : o.items || []
      items.forEach((item: any) => {
        if (!itemRevenue[item.name]) itemRevenue[item.name] = { revenue: 0, quantity: 0 }
        itemRevenue[item.name].revenue += (item.price || 0) * (item.quantity || 0)
        itemRevenue[item.name].quantity += item.quantity || 0
      })
    })
    const topItems = Object.entries(itemRevenue)
      .map(([name, d]) => ({ name, revenue: d.revenue, quantity: d.quantity }))
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 10)

    // Week-over-week (only for week/month range)
    let weekOverWeek: { current: { label: string; revenue: number }[]; previous: { label: string; revenue: number }[] } | null = null
    if (range === "week" || range === "today") {
      const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]
      const nowIST = new Date(Date.now() + OFFSET)
      const current: { label: string; revenue: number }[] = []
      const previous: { label: string; revenue: number }[] = []
      for (let i = 6; i >= 0; i--) {
        const d = new Date(nowIST); d.setDate(d.getDate() - i)
        const label = dayNames[d.getDay()]
        const cStart = new Date(d); cStart.setHours(0, 0, 0, 0)
        const cEnd = new Date(d); cEnd.setHours(23, 59, 59, 999)

        const cRev = paidOrders
          .filter((o: any) => { const t = toIST(o.created_at).getTime(); return t >= cStart.getTime() && t <= cEnd.getTime() })
          .reduce((s: number, o: any) => s + Number(o.total_amount), 0)
        const pRev = prevPaid
          .filter((o: any) => { const t = toIST(o.created_at).getTime(); return t >= cStart.getTime() - 7 * 86400000 && t <= cEnd.getTime() - 7 * 86400000 })
          .reduce((s: number, o: any) => s + Number(o.total_amount), 0)
        current.push({ label, revenue: cRev })
        previous.push({ label, revenue: pRev })
      }
      weekOverWeek = { current, previous }
    }

    // Hourly heatmap (last 7 days)
    const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]
    const nowIST = new Date(Date.now() + OFFSET)
    const hourlyHeatmap: { day: string; hour: number; orders: number }[] = []
    for (let d = 6; d >= 0; d--) {
      const dayDate = new Date(nowIST); dayDate.setDate(dayDate.getDate() - d)
      for (let h = 0; h < 24; h++) {
        hourlyHeatmap.push({ day: dayNames[dayDate.getDay()], hour: h, orders: 0 })
      }
    }
    paidOrders.forEach((o: any) => {
      const ot = toIST(o.created_at)
      const nowMs = Date.now() + OFFSET
      const dayDiff = Math.floor((nowMs - ot.getTime()) / 86400000)
      if (dayDiff >= 0 && dayDiff < 7) {
        const cell = hourlyHeatmap.find((c) => c.day === dayNames[ot.getDay()] && c.hour === ot.getHours())
        if (cell) cell.orders++
      }
    })

    // Peak days (by day of week)
    const peakDayMap: Record<string, { orders: number; revenue: number }> = {}
    dayNames.forEach((d) => { peakDayMap[d] = { orders: 0, revenue: 0 } })
    paidOrders.forEach((o: any) => {
      const day = dayNames[toIST(o.created_at).getDay()]
      peakDayMap[day].orders++
      peakDayMap[day].revenue += Number(o.total_amount)
    })
    const peakDays = dayNames.map((day) => ({ day, ...peakDayMap[day] }))

    // Profit margin (need menu items with cost_price)
    const { data: menuItems } = await supabaseAdmin.from("menu_items").select("id, name, price")
    const menuPriceMap: Record<string, number> = {}
    ;(menuItems || []).forEach((m: any) => { menuPriceMap[m.id] = Number(m.price) })

    let totalCost = 0
    paidOrders.forEach((o: any) => {
      const items = typeof o.items === "string" ? JSON.parse(o.items) : o.items || []
      items.forEach((item: any) => {
        const price = menuPriceMap[item.menu_item_id]
        if (price) {
          // Estimate cost as 40% of selling price (typical restaurant margin)
          totalCost += price * 0.4 * (item.quantity || 0)
        }
      })
    })
    const grossProfit = totalRevenue - totalCost
    const marginPercent = totalRevenue > 0 ? (grossProfit / totalRevenue) * 100 : 0

    return NextResponse.json({
      metrics: {
        revenue: totalRevenue,
        orders: paidOrders.length,
        avgOrder: paidOrders.length ? totalRevenue / paidOrders.length : 0,
        customers: uniqueCustomers,
      },
      revenueData,
      paymentData,
      comparison: {
        revenue: calcChange(totalRevenue, prevRevenue),
        orders: calcChange(paidOrders.length, prevOrdersCount),
        avgOrder: calcChange(paidOrders.length ? totalRevenue / paidOrders.length : 0, prevAvg),
        customers: calcChange(uniqueCustomers, prevCustomers),
      },
      profitMargin: {
        revenue: totalRevenue,
        cost: Math.round(totalCost),
        grossProfit: Math.round(grossProfit),
        marginPercent: Math.round(marginPercent * 10) / 10,
      },
      discountImpact: {
        totalDiscount,
        avgDiscount: paidOrders.length ? totalDiscount / paidOrders.length : 0,
        ordersWithDiscount: paidOrders.filter((o: any) => Number(o.discount_amount) > 0).length,
      },
      valueDistribution,
      weekOverWeek,
      topItems,
      hourlyHeatmap,
      paymentRevenue,
      peakDays,
    })
  } catch {
    return NextResponse.json({ error: "Failed to fetch financial data" }, { status: 500 })
  }
}
