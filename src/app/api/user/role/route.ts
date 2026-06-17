import { NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/supabase-admin"

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const userId = searchParams.get("userId")

  if (!userId) {
    return NextResponse.json({ role: null })
  }

  const { data: profile } = await supabaseAdmin
    .from("users")
    .select("role")
    .eq("id", userId)
    .single()

  return NextResponse.json({ role: profile?.role || "user" })
}
