import { NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/supabase-admin"

export async function GET() {
  const { data, error } = await supabaseAdmin.from("settings").select("*")

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  const map = Object.fromEntries((data || []).map((s: any) => [s.key, s.value]))
  return NextResponse.json(map)
}

export async function PUT(request: Request) {
  try {
    const body = await request.json()

    const entries = Object.entries(body).map(([key, value]) => ({ key, value }))

    for (const entry of entries) {
      const { error } = await supabaseAdmin.from("settings").upsert(entry, { onConflict: "key" })
      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 })
      }
    }

    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
