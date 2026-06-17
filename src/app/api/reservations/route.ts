import { NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/supabase-admin"
import { sendReservationConfirmation } from "@/lib/email"

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get("user_id")
    const status = searchParams.get("status")
    const limit = parseInt(searchParams.get("limit") || "50")

    let query = supabaseAdmin.from("reservations").select("*").order("created_at", { ascending: false })

    if (userId) {
      query = query.eq("user_id", userId)
    }
    if (status && status !== "all") {
      const statuses = status.split(",")
      if (statuses.length > 1) {
        query = query.in("status", statuses)
      } else {
        query = query.eq("status", status)
      }
    }

    const { data, error } = await query.limit(limit)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(data || [])
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()

    if (!body.name || !body.phone || !body.date || !body.time) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    const { data, error } = await supabaseAdmin
      .from("reservations")
      .insert({
        user_id: body.user_id || null,
        name: body.name,
        phone: body.phone,
        email: body.email || null,
        date: body.date,
        time: body.time,
        guests: body.guests || 2,
        notes: body.notes || null,
        status: "pending",
      })
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(data)
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function PUT(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get("id")

    if (!id) {
      return NextResponse.json({ error: "Reservation ID is required" }, { status: 400 })
    }

    const body = await request.json()

    const { data: existing } = await supabaseAdmin
      .from("reservations")
      .select("status, email, name, date, time, guests")
      .eq("id", id)
      .single()

    if (!existing) {
      return NextResponse.json({ error: "Reservation not found" }, { status: 404 })
    }

    const { data, error } = await supabaseAdmin
      .from("reservations")
      .update(body)
      .eq("id", id)
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    if (body.status === "confirmed" && existing.status !== "confirmed" && existing.email) {
      sendReservationConfirmation(existing.email, existing.name, existing.date, existing.time, existing.guests)
    }

    return NextResponse.json(data)
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get("id")

    if (!id) {
      return NextResponse.json({ error: "Reservation ID is required" }, { status: 400 })
    }

    const { error } = await supabaseAdmin.from("reservations").delete().eq("id", id)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}