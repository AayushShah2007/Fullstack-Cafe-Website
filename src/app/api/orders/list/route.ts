import { NextRequest, NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/supabase-admin"

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const status = searchParams.get("status")
    const userId = searchParams.get("userId")
    const limit = parseInt(searchParams.get("limit") || "50")

    let query = supabaseAdmin.from("orders").select("*")

    if (userId) {
      query = query.eq("user_id", userId)
    }

    if (status) {
      const statuses = status.split(",")
      query = query.in("status", statuses)
    }

    const { data, error } = await query.order("created_at", { ascending: false }).limit(Math.min(limit, 200))

    if (error) throw error
    return NextResponse.json(data)
  } catch {
    return NextResponse.json({ error: "Failed to fetch orders" }, { status: 500 })
  }
}
