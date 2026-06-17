import { NextRequest, NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/supabase-admin"

export async function POST(req: NextRequest) {
  try {
    const { orderId, screenshot } = await req.json()

    if (!orderId) {
      return NextResponse.json({ error: "Missing orderId" }, { status: 400 })
    }

    const updates: Record<string, any> = {
      payment_status: "paid",
      status: "making",
      timeline_stage: 0,
    }
    if (screenshot) updates.payment_screenshot = screenshot

    const { error } = await supabaseAdmin
      .from("orders")
      .update(updates)
      .eq("id", orderId)

    if (error) throw error

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("UPI pay error:", error)
    return NextResponse.json({ error: "Failed to process payment" }, { status: 500 })
  }
}
