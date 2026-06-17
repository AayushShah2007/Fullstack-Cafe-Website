import { NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/supabase-admin"

export async function POST(req: Request) {
  try {
    const body = await req.json()

    const { data, error } = await supabaseAdmin.from("orders").insert(body).select().single()
    if (error) throw error

    if (body.coupon_code) {
      const { data: coupon } = await supabaseAdmin
        .from("coupons")
        .select("used_count")
        .eq("code", body.coupon_code)
        .single()
      if (coupon) {
        await supabaseAdmin
          .from("coupons")
          .update({ used_count: (coupon.used_count || 0) + 1 })
          .eq("code", body.coupon_code)
      }
    }

    return NextResponse.json(data)
  } catch {
    return NextResponse.json({ error: "Failed to create order" }, { status: 500 })
  }
}
