import { NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/supabase-admin"

export async function GET() {
  const { data: users, error } = await supabaseAdmin
    .from("users")
    .select("*")
    .order("created_at", { ascending: false })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  const usersWithStats = await Promise.all(
    (users || []).map(async (user) => {
      const { count } = await supabaseAdmin
        .from("orders")
        .select("*", { count: "exact", head: true })
        .eq("user_id", user.id)

      const { data: userOrders } = await supabaseAdmin
        .from("orders")
        .select("total_amount")
        .eq("user_id", user.id)

      const totalSpent =
        userOrders?.reduce((s, o) => s + Number(o.total_amount), 0) || 0

      return { ...user, order_count: count || 0, total_spent: totalSpent }
    })
  )

  return NextResponse.json(usersWithStats)
}
