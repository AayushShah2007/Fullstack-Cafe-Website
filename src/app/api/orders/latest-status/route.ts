import { NextRequest, NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/supabase-admin"

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const userId = searchParams.get("userId")
  if (!userId) return NextResponse.json({ error: "Missing userId" }, { status: 400 })

  const { data, error } = await supabaseAdmin
    .from("orders")
    .select("id, status, payment_method")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(1)
    .single()

  if (error) return NextResponse.json({ status: "none" })
  return NextResponse.json(data)
}
