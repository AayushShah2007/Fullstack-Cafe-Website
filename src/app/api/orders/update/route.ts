import { NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/supabase-admin"

export async function PUT(req: Request) {
  try {
    const { id, ...updates } = await req.json()
    const { data, error } = await supabaseAdmin.from("orders").update(updates).eq("id", id).select().single()
    if (error) throw error
    return NextResponse.json(data)
  } catch {
    return NextResponse.json({ error: "Failed to update order" }, { status: 500 })
  }
}
