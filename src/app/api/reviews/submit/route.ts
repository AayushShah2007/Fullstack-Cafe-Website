import { NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/supabase-admin"

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { user_id, user_name, rating, comment, menu_item_id } = body

    if (!user_id || !user_name || !rating || !comment || !menu_item_id) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    const { error } = await supabaseAdmin.from("reviews").insert({
      user_id,
      user_name,
      rating,
      comment,
      menu_item_id,
      is_approved: true,
    })

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
