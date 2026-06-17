import { NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/supabase-admin"

export async function POST(req: Request) {
  try {
    const { email, code, password } = await req.json()

    if (!email || !code) {
      return NextResponse.json({ error: "Email and code are required" }, { status: 400 })
    }

    // Find valid OTP
    const { data: otpRecords, error: findError } = await supabaseAdmin
      .from("otp_codes")
      .select("*")
      .eq("email", email)
      .eq("code", code)
      .eq("used", false)
      .gte("expires_at", new Date().toISOString())
      .order("created_at", { ascending: false })
      .limit(1)

    if (findError || !otpRecords || otpRecords.length === 0) {
      return NextResponse.json({ error: "Invalid or expired OTP" }, { status: 400 })
    }

    const otp = otpRecords[0]

    // Mark OTP as used
    await supabaseAdmin.from("otp_codes").update({ used: true }).eq("id", otp.id)

    let userId: string | undefined

    // Create user in Supabase Auth via Admin API
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email: otp.email,
      password,
      email_confirm: true,
      user_metadata: {
        name: otp.name,
        phone: otp.phone || "",
        address_line1: otp.address_line1 || "",
        address_line2: otp.address_line2 || "",
        landmark: otp.landmark || "",
        city: otp.city || "Mumbai",
        district: otp.district || "Borivali West",
        state: otp.state || "Maharashtra",
        pincode: otp.pincode || "",
      },
    })

    if (authError) {
      // If already registered, find the existing user and update their password
      if (authError.message?.toLowerCase().includes("already registered")) {
        // Try signing in with the provided password
        const { data: signInData, error: signInError } = await supabaseAdmin.auth.signInWithPassword({
          email: otp.email,
          password,
        })
        if (!signInError && signInData.user) {
          userId = signInData.user.id
        } else {
          // Wrong password — find user in auth.users and update password
          const { data: authUser } = await supabaseAdmin
            .from("auth.users")
            .select("id")
            .eq("email", otp.email)
            .single()
          if (!authUser) {
            return NextResponse.json({ error: "Could not locate your account. Try logging in instead." }, { status: 400 })
          }
          const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
            authUser.id,
            { password, email_confirm: true }
          )
          if (updateError) {
            return NextResponse.json({ error: updateError.message }, { status: 500 })
          }
          userId = authUser.id
        }
      } else {
        return NextResponse.json({ error: authError.message }, { status: 500 })
      }
    } else {
      userId = authData.user?.id
    }

    if (userId) {
      // Insert or update public.users
      const { data: existing } = await supabaseAdmin
        .from("users")
        .select("id")
        .eq("id", userId)
        .maybeSingle()

      if (!existing) {
        const { error: insertError } = await supabaseAdmin.from("users").insert({
          id: userId,
          email: otp.email,
          name: otp.name,
          phone: otp.phone || null,
          address_line1: otp.address_line1 || null,
          address_line2: otp.address_line2 || null,
          landmark: otp.landmark || null,
          city: otp.city || "Mumbai",
          district: otp.district || "Borivali West",
          state: otp.state || "Maharashtra",
          pincode: otp.pincode || null,
        })

        if (insertError) {
          console.error("Failed to insert into users table:", insertError)
        }
      } else {
        // Update existing record with latest data
        await supabaseAdmin.from("users").update({
          name: otp.name,
          phone: otp.phone || null,
          address_line1: otp.address_line1 || null,
          address_line2: otp.address_line2 || null,
          landmark: otp.landmark || null,
          city: otp.city || "Mumbai",
          district: otp.district || "Borivali West",
          state: otp.state || "Maharashtra",
          pincode: otp.pincode || null,
        }).eq("id", userId)
      }
    }

    return NextResponse.json({
      success: true,
      email: otp.email,
    })
  } catch (err) {
    console.error("verify-otp error:", err)
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 })
  }
}
