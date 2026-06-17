export async function POST(request: Request) {
  try {
    const { orderId, amount } = await request.json()

    return Response.json({
      success: true,
      amount,
      razorpayOrderId: `order_${orderId.slice(0, 10)}_${Date.now()}`,
      orderId,
    })
  } catch {
    return Response.json(
      { success: false, error: "Failed to create order" },
      { status: 500 }
    )
  }
}
