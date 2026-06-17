"use client"

import { useEffect, useState } from "react"
import { useAuthStore } from "@/store/auth"
import type { Reservation } from "@/types"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { CalendarDays, Clock, UtensilsCrossed, MessageSquare } from "lucide-react"
import { useRouter } from "next/navigation"
import { motion } from "framer-motion"

const statusColors: Record<string, string> = {
  pending: "bg-red-500",
  confirmed: "bg-green-500",
  seated: "bg-blue-500",
  completed: "bg-gray-500",
  cancelled: "bg-red-800",
}

const statusLabels: Record<string, string> = {
  pending: "CONFIRMATION PENDING",
  confirmed: "CONFIRMED",
  seated: "SEATED",
  completed: "COMPLETED",
  cancelled: "CANCELLED",
}

export default function MyReservationsPage() {
  const { user, isLoading } = useAuthStore()
  const router = useRouter()
  const [reservations, setReservations] = useState<Reservation[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (isLoading) return
    if (!user) {
      router.push("/auth/login")
      return
    }

    fetch(`/api/reservations?user_id=${user.id}`)
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) setReservations(data)
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [user, isLoading, router])

  if (isLoading || loading) {
    return (
      <div className="min-h-screen bg-[#1A1410] flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-amber-600 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="min-h-[calc(100vh-64px)] md:min-h-[calc(100vh-80px)] mt-16 md:mt-20 bg-[#1A1410] px-4 py-12">
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold text-white">
              My <span className="text-[#D4A06A]">Reservations</span>
            </h1>
            <p className="text-amber-200/40 text-sm mt-1">
              {reservations.length} {reservations.length === 1 ? "reservation" : "reservations"}
            </p>
          </div>
          <Button
            onClick={() => router.push("/reserve")}
            className="bg-gradient-to-r from-amber-600 to-orange-700 hover:from-amber-500 hover:to-orange-600 text-white rounded-xl"
          >
            Book a Table
          </Button>
        </div>

        {reservations.length === 0 ? (
          <Card className="bg-[#2A1F18] border-amber-700/30">
            <CardContent className="py-16 text-center">
              <UtensilsCrossed className="w-12 h-12 mx-auto mb-4 text-amber-700/50" />
              <p className="text-amber-200/40 text-lg mb-2">No reservations yet</p>
              <p className="text-amber-200/30 text-sm mb-6">Book a table to get started!</p>
              <Button
                onClick={() => router.push("/reserve")}
                className="bg-gradient-to-r from-amber-600 to-orange-700 hover:from-amber-500 hover:to-orange-600 text-white"
              >
                Reserve Now
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {reservations.map((res, i) => (
              <motion.div
                key={res.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
              >
                <Card className="bg-[#2A1F18] border-amber-700/30 hover:border-amber-600/50 transition-colors">
                  <CardContent className="p-5">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-white font-bold text-base">{res.name}</span>
                          <Badge className={`${statusColors[res.status]} text-white text-xs px-2 py-0.5`}>
                            {statusLabels[res.status]}
                          </Badge>
                        </div>
                        <p className="text-amber-200/40 text-xs">{res.phone}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-amber-300 text-sm font-medium">{res.guests} {res.guests === 1 ? "Guest" : "Guests"}</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div className="flex items-center gap-2 text-amber-200/60">
                        <CalendarDays size={14} />
                        <span>{new Date(res.date).toLocaleDateString("en-IN", {
                          weekday: "short", day: "numeric", month: "short", year: "numeric",
                        })}</span>
                      </div>
                      <div className="flex items-center gap-2 text-amber-200/60">
                        <Clock size={14} />
                        <span>{new Date(`2000-01-01T${res.time}`).toLocaleTimeString("en-US", {
                          hour: "numeric", minute: "2-digit", hour12: true,
                        })}</span>
                      </div>
                    </div>

                    {res.notes && (
                      <div className="flex items-start gap-2 mt-3 pt-3 border-t border-amber-800/20 text-amber-200/50 text-xs">
                        <MessageSquare size={12} className="mt-0.5 shrink-0" />
                        <span>{res.notes}</span>
                      </div>
                    )}

                    <div className="mt-3 pt-3 border-t border-amber-800/20 flex items-center justify-between">
                      <span className="text-amber-200/30 text-xs">
                        Booked on {new Date(res.created_at).toLocaleDateString("en-IN", {
                          day: "numeric", month: "short", year: "numeric",
                        })}
                      </span>
                      {res.status === "pending" && (
                        <span className="text-red-400 text-xs font-medium">Awaiting confirmation</span>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
