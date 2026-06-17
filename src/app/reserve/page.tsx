"use client"

import { useState, useEffect, useMemo } from "react"
import { useAuthStore } from "@/store/auth"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { CalendarDays, Clock, Users, UtensilsCrossed, Plus, MessageSquare } from "lucide-react"
import toast from "react-hot-toast"
import { motion, AnimatePresence } from "framer-motion"
import type { Reservation } from "@/types"
import { useRouter } from "next/navigation"

const defaultTimeSlots = [
  { label: "Lunch", times: ["12:00", "12:30", "13:00", "13:30", "14:00", "14:30"] },
  { label: "Dinner", times: ["19:00", "19:30", "20:00", "20:30", "21:00", "21:30"] },
]

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

export default function ReservePage() {
  const { user, isLoading } = useAuthStore()
  const router = useRouter()
  const [reservations, setReservations] = useState<Reservation[]>([])
  const [loadingRes, setLoadingRes] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({
    name: user?.name || "",
    phone: user?.phone || "",
    email: "",
    date: "",
    time: "",
    guests: "2",
    notes: "",
  })
  const [submitting, setSubmitting] = useState(false)

  const today = new Date().toISOString().split("T")[0]
  const nowMinutes = new Date().getHours() * 60 + new Date().getMinutes()

  const [timeSlots, setTimeSlots] = useState(defaultTimeSlots)

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/admin/settings")
        if (res.ok) {
          const data = await res.json()
          if (data.reservation_time_slots) {
            setTimeSlots(JSON.parse(data.reservation_time_slots))
          }
        }
      } catch {}
    })()
  }, [])

  useEffect(() => {
    if (isLoading) return
    if (!user) {
      router.push("/auth/login")
      return
    }

    setForm({ ...form, name: user.name || "", phone: user.phone || "" })

    fetch(`/api/reservations?user_id=${user.id}&limit=1`)
      .then((r) => {
        if (!r.ok) throw new Error("API error")
        return r.json()
      })
      .then((data) => {
        if (Array.isArray(data)) setReservations(data)
      })
      .catch((err) => console.error("[reserve] fetch error:", err))
      .finally(() => setLoadingRes(false))
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, isLoading, router])

  const isSlotDisabled = useMemo(() => {
    return (time: string): boolean => {
      if (form.date !== today) return false
      const [h, m] = time.split(":").map(Number)
      return h * 60 + m <= nowMinutes
    }
  }, [form.date, today, nowMinutes])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!form.name || !form.phone || !form.date || !form.time) {
      toast.error("Please fill all required fields")
      return
    }

    const guestCount = parseInt(form.guests)
    if (!guestCount || guestCount < 1) {
      toast.error("Number of guests must be at least 1")
      return
    }

    if (form.date < today) {
      toast.error("Cannot book for a past date")
      return
    }

    if (isSlotDisabled(form.time)) {
      toast.error("This time has already passed for today")
      return
    }

    setSubmitting(true)
    const res = await fetch("/api/reservations", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        user_id: user?.id,
        name: form.name,
        phone: form.phone,
        email: form.email || null,
        date: form.date,
        time: form.time,
        guests: guestCount,
        notes: form.notes || null,
      }),
    })
    setSubmitting(false)

    if (!res.ok) {
      toast.error("Failed to reserve. Please try again.")
      return
    }

    const data = await res.json()
    setReservations((prev) => [data as Reservation, ...prev])
    setShowForm(false)
    setForm({ ...form, date: "", time: "", notes: "" })
    toast.success("Reservation request sent!")
  }

  const openForm = () => {
    setForm({ ...form, date: "", time: "", notes: "" })
    setShowForm(true)
  }

  if (isLoading || loadingRes) {
    return (
      <div className="min-h-[calc(100vh-64px)] md:min-h-[calc(100vh-80px)] mt-16 md:mt-20 bg-[#1A1410] flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-amber-600 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="min-h-[calc(100vh-64px)] md:min-h-[calc(100vh-80px)] mt-16 md:mt-20 bg-[#1A1410] px-4 py-6">
      <div className="max-w-lg mx-auto">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-white">
              My <span className="text-[#D4A06A]">Reservations</span>
            </h1>
            <p className="text-amber-300/60 text-xs mt-0.5">
              {reservations.length} {reservations.length === 1 ? "reservation" : "reservations"}
            </p>
          </div>
          <Button
            onClick={openForm}
            className="bg-gradient-to-r from-amber-600 to-orange-700 hover:from-amber-500 hover:to-orange-600 text-white rounded-xl h-10 text-sm shadow-lg shadow-amber-700/20"
          >
            <Plus size={16} className="mr-1" /> Book a Table
          </Button>
        </div>

        <AnimatePresence mode="wait">
          {showForm ? (
            <motion.div
              key="form"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="bg-amber-50 rounded-2xl border border-amber-200/60 p-5 sm:p-6 shadow-xl mb-4"
            >
              <form onSubmit={handleSubmit} className="space-y-3">
                <div className="grid sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label className="text-base text-amber-800 font-medium">Name *</Label>
                    <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="h-10 rounded-xl bg-white border-amber-300 text-gray-900 placeholder:text-amber-400 text-lg" required />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-base text-amber-800 font-medium">Phone *</Label>
                    <Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className="h-10 rounded-xl bg-white border-amber-300 text-gray-900 placeholder:text-amber-400 text-lg" required />
                  </div>
                </div>

                <div className="space-y-1">
                  <Label className="text-base text-amber-800 font-medium">Email</Label>
                  <Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="h-10 rounded-xl bg-white border-amber-300 text-gray-900 placeholder:text-amber-400 text-lg" />
                  <p className="text-sm text-amber-600/70 font-bold italic px-1">* Enter a valid Email address for getting table reservation confirmation</p>
                </div>

                <div className="grid sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label className="text-base text-amber-800 font-medium"><CalendarDays size={16} className="inline mr-1 text-amber-600" /> Date *</Label>
                    <Input type="date" min={today} value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value, time: "" })} className="h-10 rounded-xl bg-white border-amber-300 text-gray-900 text-lg [color-scheme:light]" required />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-base text-amber-800 font-medium"><Users size={16} className="inline mr-1 text-amber-600" /> Guests</Label>
                    <Input type="number" min={1} max={20} value={form.guests} onChange={(e) => setForm({ ...form, guests: e.target.value })} className="h-10 rounded-xl bg-white border-amber-300 text-gray-900 text-lg" />
                  </div>
                </div>

                <div className="space-y-1">
                  <Label className="text-base text-amber-800 font-medium"><Clock size={16} className="inline mr-1 text-amber-600" /> Time *</Label>
                  <div className="grid grid-cols-3 sm:grid-cols-4 gap-1.5">
                    {timeSlots.flatMap((slot) =>
                      slot.times.map((t) => {
                        const disabled = isSlotDisabled(t)
                        const selected = form.time === t
                        return (
                          <button
                            key={t}
                            type="button"
                            disabled={disabled}
                            onClick={() => setForm({ ...form, time: t })}
                            className={`px-1.5 py-1.5 rounded-lg text-sm font-medium transition-all text-center ${
                              selected
                                ? "bg-gradient-to-r from-amber-600 to-orange-700 text-white shadow-lg shadow-amber-700/20"
                                : disabled
                                  ? "bg-amber-100/50 border border-amber-200/50 text-amber-300 cursor-not-allowed"
                                  : "bg-white border border-amber-300 text-amber-900 hover:bg-amber-100"
                            }`}
                          >
                            {new Date(`2000-01-01T${t}`).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true })}
                          </button>
                        )
                      })
                    )}
                  </div>
                </div>

                <div className="space-y-1">
                  <Label className="text-base text-amber-800 font-medium">Special Requests</Label>
                  <Textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} placeholder="Any special occasion or requests?" className="rounded-xl bg-white border-amber-300 text-gray-900 placeholder:text-amber-400 text-lg resize-none h-16" />
                </div>

                <div className="flex gap-3">
                  <Button type="button" onClick={() => setShowForm(false)} variant="outline" className="flex-1 h-11 rounded-xl bg-gradient-to-r from-amber-600 to-orange-700 hover:from-amber-500 hover:to-orange-600 text-white shadow-lg shadow-amber-700/20 text-base font-semibold">
                    Cancel
                  </Button>
                  <Button type="submit" className="flex-1 h-11 rounded-xl bg-gradient-to-r from-amber-600 to-orange-700 hover:from-amber-500 hover:to-orange-600 text-white shadow-lg shadow-amber-700/20 text-base font-semibold" disabled={submitting}>
                    {submitting ? "Submitting..." : "Request Reservation"}
                  </Button>
                </div>
              </form>
            </motion.div>
          ) : reservations.length === 0 ? (
            <motion.div key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-[#2A1F18] rounded-2xl border border-amber-700/30 p-8 text-center shadow-2xl shadow-black/40">
              <UtensilsCrossed className="w-12 h-12 mx-auto mb-4 text-amber-700/50" />
              <p className="text-amber-200/40 text-lg mb-1">No reservations yet</p>
              <p className="text-amber-200/30 text-sm mb-6">Book a table to get started!</p>
              <Button onClick={openForm} className="bg-gradient-to-r from-amber-600 to-orange-700 hover:from-amber-500 hover:to-orange-600 text-white rounded-xl h-11 px-6">
                <Plus size={16} className="mr-1" /> Book a Table
              </Button>
            </motion.div>
          ) : (
            <div key="list" className="space-y-3">
              {reservations.map((res, i) => (
                <motion.div key={res.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}>
                  <div className="bg-[#2A1F18] rounded-2xl border border-amber-700/30 p-5 shadow-2xl shadow-black/40">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-amber-600 to-orange-700 flex items-center justify-center">
                          <UtensilsCrossed size={18} className="text-amber-200" />
                        </div>
                        <div>
                          <p className="text-white font-bold text-base">{res.name}</p>
                          <Badge className={`${statusColors[res.status]} text-white text-xs px-2 py-0.5`}>
                            {statusLabels[res.status]}
                          </Badge>
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-white text-[10px] uppercase tracking-wider">Booked on</p>
                        <p className="text-white text-xs font-medium whitespace-nowrap">
                          {new Date(res.created_at).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "2-digit" })}
                          {" "}
                          {new Date(res.created_at).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true })}
                        </p>
                      </div>
                    </div>
                    <div className="space-y-1 text-sm text-white mb-2">
                      <span className="flex items-center gap-1"><Users size={14} /> {res.guests} {res.guests === 1 ? "guest" : "guests"}</span>
                      <span className="block">Phone No : {res.phone}</span>
                      {res.email && <span className="block">Email : {res.email}</span>}
                    </div>
                    <div className="flex items-center gap-4 text-sm text-amber-200/60 pt-2 border-t border-amber-800/20">
                      <span className="flex items-center gap-1"><CalendarDays size={14} /> {new Date(res.date).toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short", year: "numeric" })}</span>
                      <span className="flex items-center gap-1"><Clock size={14} /> {new Date(`2000-01-01T${res.time}`).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true })}</span>
                    </div>
                    {res.notes && (
                      <div className="flex items-start gap-1.5 mt-2 pt-2 border-t border-amber-800/20 text-amber-200/50 text-xs">
                        <MessageSquare size={11} className="mt-0.5 shrink-0" />
                        <span>{res.notes}</span>
                      </div>
                    )}
                    {res.email && (
                      <p className="text-center text-green-500 text-sm mt-3 pt-2 border-t border-amber-800/20">Confirmation of the reservation has been sent to the entered mail id</p>
                    )}
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}