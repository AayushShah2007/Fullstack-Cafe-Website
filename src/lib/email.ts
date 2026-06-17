import nodemailer from "nodemailer"

export const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT),
  secure: false,
  pool: true,
  maxConnections: 1,
  rateDelta: 1000,
  rateLimit: 5,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
})

const senderName = '"Eat O\'Clock"'
const senderEmail = process.env.SMTP_USER

export function sendReservationConfirmation(email: string, name: string, date: string, time: string, guests: number) {
  const formattedDate = new Date(date).toLocaleDateString("en-IN", {
    weekday: "long", day: "numeric", month: "long", year: "numeric",
  })
  const formattedTime = new Date(`2000-01-01T${time}`).toLocaleTimeString("en-US", {
    hour: "numeric", minute: "2-digit", hour12: true,
  })

  transporter.sendMail({
    from: `${senderName} <${senderEmail}>`,
    to: email,
    subject: "Reservation Confirmed - Eat O'Clock",
    html: `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"/><meta name="viewport" content="width=device-width,initial-scale=1"/></head>
<body style="margin:0;padding:0;background:#1A1410;font-family:Georgia,serif;">
  <table width="100%" cellpadding="0" cellspacing="0">
    <tr><td align="center" style="padding:40px 20px;">
      <table width="480" cellpadding="0" cellspacing="0" style="max-width:480px;background:#2A1F18;border-radius:16px;border:1px solid #5C4033;overflow:hidden;">
        <tr><td align="center" style="padding:30px 30px 0;">
          <h1 style="margin:0;font-size:28px;color:#fff;">Eat <span style="color:#D4A06A;">O'Clock</span></h1>
          <p style="margin:8px 0 0;color:#A08462;font-size:13px;letter-spacing:2px;text-transform:uppercase;">Reservation Confirmed</p>
        </td></tr>
        <tr><td align="center" style="padding:30px;">
          <table cellpadding="0" cellspacing="0" style="background:#1A1410;border-radius:12px;border:1px solid #3D2B24;width:100%;">
            <tr><td align="center" style="padding:30px 20px;">
              <p style="margin:0 0 10px;color:#A08462;font-size:11px;letter-spacing:1px;">HELLO ${name.toUpperCase()}</p>
              <p style="margin:0 0 20px;color:#D4A06A;font-size:18px;font-weight:bold;">Your table has been confirmed!</p>
              <div style="text-align:left;color:#C4B5A5;font-size:13px;line-height:1.8;">
                <p><strong style="color:#D4A06A;">Date:</strong> ${formattedDate}</p>
                <p><strong style="color:#D4A06A;">Time:</strong> ${formattedTime}</p>
                <p><strong style="color:#D4A06A;">Guests:</strong> ${guests}</p>
              </div>
              <p style="margin:20px 0 0;color:#8A7B6B;font-size:11px;line-height:1.5;">We look forward to serving you!</p>
            </td></tr>
          </table>
        </td></tr>
        <tr><td align="center" style="padding:0 30px 30px;">
          <p style="margin:0;color:#5C4F3E;font-size:11px;">Eat O'Clock &mdash; Where every meal is a celebration.</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`,
  }).catch((err: any) => {
    console.error("[reservation-email] Failed to send:", err?.message)
  })
}