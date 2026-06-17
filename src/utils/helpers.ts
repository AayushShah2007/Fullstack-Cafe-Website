export function formatPrice(price: number): string {
  return `₹${price.toFixed(2)}`
}

export function getStatusColor(status: string): string {
  const colors: Record<string, string> = {
    awaiting_approval: "bg-yellow-500",
    approved: "bg-green-500",
    rejected: "bg-red-500",
    making: "bg-blue-500",
    packing: "bg-purple-500",
    dispatched: "bg-indigo-500",
    delivered: "bg-green-600",
    completed: "bg-green-700",
    cancelled: "bg-gray-500",
  }
  return colors[status] || "bg-gray-400"
}

export function getTimelineStages(orderType: string): string[] {
  if (orderType === "delivery") {
    return ["Making Order", "Packing", "Dispatched 🚚"]
  }
  if (orderType === "takeaway") {
    return ["Making Order", "Packing", "Collect from Counter 🏪"]
  }
  if (orderType === "dine-in") {
    return ["Making Order", "Platting your Food", "Serving to your Table 🍽️"]
  }
  return []
}
