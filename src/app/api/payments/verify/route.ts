import { createSupabaseServerClient } from "@/lib/supabase-server"

export async function POST(request: Request) {
  try {
    const { orderId, razorpayOrderId, razorpayPaymentId, razorpaySignature } =
      await request.json()

    const supabase = await createSupabaseServerClient()

    await supabase
      .from("payments")
      .insert({
        order_id: orderId,
        amount: 0, // will be updated
        method: "upi",
        razorpay_order_id: razorpayOrderId,
        razorpay_payment_id: razorpayPaymentId,
        status: "paid",
      })

    return Response.json({ success: true })
  } catch {
    return Response.json({ success: false }, { status: 500 })
  }
}
