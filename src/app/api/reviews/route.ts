import { NextRequest, NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/supabase-admin"

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const approvedOnly = searchParams.get("approved") === "true"

  let query = supabaseAdmin
    .from("reviews")
    .select("*, menu_items(name, categories(name))")
    .order("created_at", { ascending: false })

  if (approvedOnly) {
    query = query.eq("is_approved", true)
  }

  const { data, error } = await query

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(data || [])
}

export async function PATCH(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const id = searchParams.get("id")

    if (!id) {
      return NextResponse.json({ error: "Missing review id" }, { status: 400 })
    }

    const body = await req.json()
    const { is_approved } = body

    const { data, error } = await supabaseAdmin
      .from("reviews")
      .update({ is_approved })
      .eq("id", id)
      .select("is_approved")

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(data?.[0] || { is_approved })
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get("id")

    if (!id) {
      return NextResponse.json({ error: "Missing review id" }, { status: 400 })
    }

    const { error } = await supabaseAdmin.from("reviews").delete().eq("id", id)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
