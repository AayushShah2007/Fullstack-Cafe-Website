import { NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/supabase-admin"
import { transporter } from "@/lib/email"

export async function POST(req: Request) {
  try {
    const { email, name, phone, address_line1, address_line2, landmark, city, district, state, pincode } = await req.json()

    if (!email || !name) {
      return NextResponse.json({ error: "Email and name are required" }, { status: 400 })
    }

    const code = Math.floor(100000 + Math.random() * 900000).toString()
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString()

    const otpPayload: Record<string, unknown> = {
      email,
      name,
      phone,
      address_line1,
      address_line2,
      landmark,
      city: city || "Mumbai",
      district: district || "Borivali West",
      state: state || "Maharashtra",
      pincode,
      code,
      expires_at: expiresAt,
    }

    const { error: dbError } = await supabaseAdmin.from("otp_codes").insert(otpPayload)

    if (dbError) {
      return NextResponse.json({ error: "Failed to store OTP: " + dbError.message }, { status: 500 })
    }

    transporter.sendMail({
      from: `"Eat O'Clock" <${process.env.SMTP_USER}>`,
      to: email,
      subject: "Your OTP Code - Eat O'Clock",
      html: `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#1A1410;font-family:Georgia,serif;">
  <table width="100%" cellpadding="0" cellspacing="0">
    <tr><td align="center" style="padding:40px 20px;">
      <table width="480" cellpadding="0" cellspacing="0" style="max-width:480px;background:#2A1F18;border-radius:16px;border:1px solid #5C4033;overflow:hidden;">
        <tr><td align="center" style="padding:30px 30px 0;">
          <h1 style="margin:0;font-size:28px;color:#fff;">Eat <span style="color:#D4A06A;">O'Clock</span></h1>
          <p style="margin:8px 0 0;color:#A08462;font-size:13px;letter-spacing:2px;text-transform:uppercase;">Verification Code</p>
        </td></tr>
        <tr><td align="center" style="padding:30px;">
          <table cellpadding="0" cellspacing="0" style="background:#1A1410;border-radius:12px;border:1px solid #3D2B24;width:100%;">
            <tr><td align="center" style="padding:30px 20px;">
              <p style="margin:0 0 18px;color:#A08462;font-size:11px;letter-spacing:1px;">YOUR ONE-TIME CODE</p>
              <div style="font-family:'Courier New',Courier,monospace;font-size:44px;color:#D4A06A;font-weight:bold;letter-spacing:12px;background:#1A1410;padding:16px 20px;border-radius:8px;display:inline-block;">${code}</div>
              <p style="margin:18px 0 0;color:#8A7B6B;font-size:12px;line-height:1.5;">Code expires in 10 minutes. Do not share it.</p>
            </td></tr>
          </table>
        </td></tr>
        <tr><td align="center" style="padding:0 30px 30px;">
          <p style="margin:0;color:#5C4F3E;font-size:11px;line-height:1.6;">
            You're receiving this because you signed up for Eat O'Clock.<br>
            If you didn't request this, ignore this email.
          </p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`,
    }).catch((mailErr: any) => {
      console.error("[send-otp] Background email failed:", mailErr?.message)
    })

    return NextResponse.json({ success: true })
  } catch (err) {
    return NextResponse.json({ error: "Something went wrong: " + (err instanceof Error ? err.message : String(err)) }, { status: 500 })
  }
}
