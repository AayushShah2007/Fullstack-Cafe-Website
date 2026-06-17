import { NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/supabase-admin"

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const available = searchParams.get("available")

  let query = supabaseAdmin.from("coupons").select("*")

  if (available === "true") {
    query = query
      .eq("is_active", true)
      .gte("expires_at", new Date().toISOString())
  }

  const { data: coupons, error } = await query.order("created_at", { ascending: false })
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Get real usage counts from orders table
  const { data: orders } = await supabaseAdmin
    .from("orders")
    .select("coupon_code")
    .not("coupon_code", "is", null)

  const usageMap: Record<string, number> = {}
  if (orders) {
    for (const order of orders) {
      if (order.coupon_code) {
        usageMap[order.coupon_code] = (usageMap[order.coupon_code] || 0) + 1
      }
    }
  }

  const enriched = (coupons || []).map((c) => ({
    ...c,
    used_count: usageMap[c.code] || 0,
  }))

  return NextResponse.json(enriched)
}

export async function POST(req: Request) {
  const body = await req.json()
  const { data, error } = await supabaseAdmin.from("coupons").insert(body).select().single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function PUT(req: Request) {
  const body = await req.json()
  const { id, ...fields } = body
  if (!id) return NextResponse.json({ error: "id is required" }, { status: 400 })
  const { data, error } = await supabaseAdmin.from("coupons").update(fields).eq("id", id).select().single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function DELETE(req: Request) {
  const { searchParams } = new URL(req.url)
  const id = searchParams.get("id")
  if (!id) return NextResponse.json({ error: "id is required" }, { status: 400 })
  const { error } = await supabaseAdmin.from("coupons").delete().eq("id", id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
