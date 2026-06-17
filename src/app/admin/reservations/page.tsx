"use client"

import { useEffect, useState, useCallback } from "react"
import { supabase } from "@/lib/supabase"
import type { Reservation } from "@/types"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import {
  Card,
  CardContent,
} from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Search, CalendarDays, Phone, MessageSquare, CheckCircle, XCircle, User, Clock, Plus, Trash2, Save, Pencil } from "lucide-react"
import toast from "react-hot-toast"
import { motion, AnimatePresence } from "framer-motion"

const statusColors: Record<string, string> = {
  pending: "bg-red-500",
  confirmed: "bg-green-500",
  seated: "bg-blue-500",
  completed: "bg-gray-500",
  cancelled: "bg-red-800",
}

const borderColors: Record<string, string> = {
  pending: "border-l-[#EF4444]",
  confirmed: "border-l-[#22C55E]",
  seated: "border-l-[#3B82F6]",
  completed: "border-l-[#6B7280]",
  cancelled: "border-l-[#DC2626]",
}

interface TimeSlotGroup {
  label: string
  times: string[]
}

function TimeSlotsEditor() {
  const [groups, setGroups] = useState<TimeSlotGroup[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [editingLabel, setEditingLabel] = useState<string | null>(null)
  const [editValue, setEditValue] = useState("")
  const [newGroupLabel, setNewGroupLabel] = useState("")
  const [newTimes, setNewTimes] = useState<Record<number, string>>({})

  const defaultGroups: TimeSlotGroup[] = [
    { label: "Lunch", times: ["12:00", "12:30", "13:00", "13:30", "14:00", "14:30"] },
    { label: "Dinner", times: ["19:00", "19:30", "20:00", "20:30", "21:00", "21:30"] },
  ]

  useEffect(() => {
    loadTimeSlots()
  }, [])

  const loadTimeSlots = async () => {
    try {
      const res = await fetch("/api/admin/settings")
      if (res.ok) {
        const data = await res.json()
        if (data.reservation_time_slots) {
          setGroups(JSON.parse(data.reservation_time_slots))
        } else {
          setGroups(defaultGroups)
        }
      }
    } catch {} finally {
      setLoading(false)
    }
  }

  const saveTimeSlots = async (updated: TimeSlotGroup[]) => {
    setSaving(true)
    try {
      const res = await fetch("/api/admin/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reservation_time_slots: JSON.stringify(updated) }),
      })
      if (!res.ok) { toast.error("Failed to save"); return }
      toast.success("Time slots saved!")
    } catch {
      toast.error("Failed to save")
    } finally {
      setSaving(false)
    }
  }

  const handleSave = () => saveTimeSlots(groups)

  const addGroup = () => {
    if (!newGroupLabel.trim()) return
    const updated = [...groups, { label: newGroupLabel.trim(), times: ["12:00"] }]
    setGroups(updated)
    setNewGroupLabel("")
    saveTimeSlots(updated)
  }

  const removeGroup = (index: number) => {
    const updated = groups.filter((_, i) => i !== index)
    setGroups(updated)
    saveTimeSlots(updated)
  }

  const startEditLabel = (label: string) => {
    setEditingLabel(label)
    setEditValue(label)
  }

  const saveLabel = (oldLabel: string) => {
    if (!editValue.trim()) return
    const updated = groups.map((g) => g.label === oldLabel ? { ...g, label: editValue.trim() } : g)
    setGroups(updated)
    setEditingLabel(null)
    saveTimeSlots(updated)
  }

  const addTime = (groupIndex: number) => {
    const val = newTimes[groupIndex]
    if (!val || !val.trim()) return
    const updated = [...groups]
    if (!updated[groupIndex].times.includes(val.trim())) {
      updated[groupIndex] = { ...updated[groupIndex], times: [...updated[groupIndex].times, val.trim()].sort() }
    }
    setGroups(updated)
    setNewTimes((prev) => ({ ...prev, [groupIndex]: "" }))
    saveTimeSlots(updated)
  }

  const removeTime = (groupIndex: number, timeIndex: number) => {
    const updated = [...groups]
    updated[groupIndex] = { ...updated[groupIndex], times: updated[groupIndex].times.filter((_, i) => i !== timeIndex) }
    setGroups(updated)
    saveTimeSlots(updated)
  }

  if (loading) {
    return <div className="flex justify-center py-8"><div className="w-6 h-6 border-2 border-[#F59E0B] border-t-transparent rounded-full animate-spin" /></div>
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-[#9CA3AF]">Manage reservation time slots shown on the booking form.</p>
        <Button size="sm" className="bg-[#F59E0B] hover:bg-[#D97706] text-black gap-1.5" onClick={handleSave} disabled={saving}>
          <Save size={14} /> {saving ? "Saving..." : "Save"}
        </Button>
      </div>

      <div className="space-y-3">
        {groups.map((group, gi) => (
          <Card key={group.label} className="bg-[#2A2B30] border-[#3F3F46]">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  <Clock size={16} className="text-[#F59E0B] shrink-0" />
                  {editingLabel === group.label ? (
                    <div className="flex items-center gap-1">
                      <Input value={editValue} onChange={(e) => setEditValue(e.target.value)} className="h-8 w-40 bg-[#1F2024] border-[#3F3F46] text-[#E5E7EB] text-sm" autoFocus onKeyDown={(e) => { if (e.key === "Enter") saveLabel(group.label); if (e.key === "Escape") setEditingLabel(null) }} />
                      <Button size="icon" variant="ghost" className="h-7 w-7 text-green-400" onClick={() => saveLabel(group.label)}><Save size={14} /></Button>
                      <Button size="icon" variant="ghost" className="h-7 w-7 text-gray-400" onClick={() => setEditingLabel(null)}><XCircle size={14} /></Button>
                    </div>
                  ) : (
                    <span className="text-white font-semibold text-base">{group.label}</span>
                  )}
                  {editingLabel !== group.label && (
                    <button onClick={() => startEditLabel(group.label)} className="text-[#6B7280] hover:text-[#F59E0B] transition-colors"><Pencil size={14} /></button>
                  )}
                </div>
                <button onClick={() => removeGroup(gi)} className="text-[#6B7280] hover:text-red-400 transition-colors shrink-0"><Trash2 size={16} /></button>
              </div>

              <div className="flex flex-wrap gap-2 mb-3">
                {group.times.map((t, ti) => (
                  <div key={t} className="flex items-center gap-1 bg-[#1F2024] rounded-lg px-3 py-1.5 group/time">
                    <span className="text-sm text-[#E5E7EB] font-medium">{new Date(`2000-01-01T${t}`).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true })}</span>
                    <button onClick={() => removeTime(gi, ti)} className="text-[#6B7280] hover:text-red-400 transition-colors opacity-0 group-hover/time:opacity-100"><XCircle size={14} /></button>
                  </div>
                ))}
              </div>

              <div className="flex items-center gap-2">
                <Input
                  placeholder="Add time (e.g. 18:00)"
                  value={newTimes[gi] || ""}
                  onChange={(e) => setNewTimes((prev) => ({ ...prev, [gi]: e.target.value }))}
                  className="h-8 w-40 bg-[#1F2024] border-[#3F3F46] text-[#E5E7EB] text-sm"
                  onKeyDown={(e) => { if (e.key === "Enter") addTime(gi) }}
                />
                <Button size="icon" variant="ghost" className="h-8 w-8 text-[#F59E0B]" onClick={() => addTime(gi)}><Plus size={16} /></Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="flex items-center gap-2">
        <Input
          placeholder="New group name (e.g. Breakfast)"
          value={newGroupLabel}
          onChange={(e) => setNewGroupLabel(e.target.value)}
          className="h-9 w-64 bg-[#2A2B30] border-[#3F3F46] text-[#E5E7EB] text-sm"
          onKeyDown={(e) => { if (e.key === "Enter") addGroup() }}
        />
        <Button size="sm" variant="outline" className="border-[#3F3F46] text-[#E5E7EB] gap-1.5" onClick={addGroup}>
          <Plus size={14} /> Add Group
        </Button>
      </div>
    </div>
  )
}

export default function AdminReservationsPage() {
  const [reservations, setReservations] = useState<Reservation[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")

  const fetchReservations = useCallback(async () => {
    try {
      const res = await fetch("/api/reservations?limit=100")
      if (res.ok) {
        const data = await res.json() as Reservation[]
        setReservations((prev) => {
          if (prev.length === data.length && prev.every((o, i) => o.id === data[i].id && o.status === data[i].status)) {
            return prev
          }
          return data
        })
      }
    } catch { /* ignore */ }
    setLoading(false)
  }, [])

  useEffect(() => {
    fetchReservations()
    const channel = supabase
      .channel("admin-reservations")
      .on("postgres_changes", { event: "*", schema: "public", table: "reservations" }, (payload: any) => {
        if (payload.eventType === "INSERT") {
          playNotificationSound()
          toast("New reservation received!", { icon: "🔔" })
        }
        fetchReservations()
      })
      .subscribe()
    const interval = setInterval(fetchReservations, 10000)
    return () => { clearInterval(interval); supabase.removeChannel(channel) }
  }, [fetchReservations])

  const playNotificationSound = () => {
    try {
      const ctx = new AudioContext()
      const oscillator = ctx.createOscillator()
      const gain = ctx.createGain()
      oscillator.connect(gain)
      gain.connect(ctx.destination)
      oscillator.frequency.value = 880
      oscillator.type = "sine"
      gain.gain.setValueAtTime(0.3, ctx.currentTime)
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.4)
      oscillator.start(ctx.currentTime)
      oscillator.stop(ctx.currentTime + 0.4)
      setTimeout(() => {
        const osc2 = ctx.createOscillator()
        const gain2 = ctx.createGain()
        osc2.connect(gain2)
        gain2.connect(ctx.destination)
        osc2.frequency.value = 1100
        osc2.type = "sine"
        gain2.gain.setValueAtTime(0.3, ctx.currentTime)
        gain2.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3)
        osc2.start(ctx.currentTime)
        osc2.stop(ctx.currentTime + 0.3)
      }, 150)
    } catch { /* ignore */ }
  }

  const updateStatus = async (id: string, status: string) => {
    const res = await fetch(`/api/reservations?id=${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    })
    if (!res.ok) {
      toast.error("Failed to update reservation")
      return
    }
    toast.success(`Reservation ${status === "cancelled" ? "cancelled" : status === "confirmed" ? "confirmed" : "marked as " + status}!`)
    setReservations((prev) =>
      prev.map((r) => (r.id === id ? { ...r, status: status as Reservation["status"] } : r))
    )
  }

  const today = new Date().toISOString().split("T")[0]
  const todayRes = reservations.filter((r) => r.date === today && r.status !== "cancelled")

  const filtered = reservations.filter((r) => {
    if (!search) return true
    const q = search.toLowerCase()
    return (
      r.name.toLowerCase().includes(q) ||
      r.phone.includes(q) ||
      (r.email || "").toLowerCase().includes(q) ||
      r.id.slice(0, 8).includes(q)
    )
  })

  const pending = filtered.filter((r) => r.status === "pending")
  const confirmed = filtered.filter((r) => r.status === "confirmed")
  const upcoming = filtered.filter((r) => r.status === "confirmed" && r.date > today)

  const ReservationCard = ({ r }: { r: Reservation }) => (
    <motion.div layout initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
      <Card className={`${borderColors[r.status] || "border-l-[#3F3F46]"} border-l-4 bg-[#2A2B30]`}>
        <CardContent className="p-5">
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-[#25262B] flex items-center justify-center">
                <User size={16} className="text-[#F59E0B]" />
              </div>
              <div>
                <span className="font-bold text-white text-lg">{r.name}</span>
                <div className="flex items-center gap-2 mt-0.5">
                  <Badge className={`${statusColors[r.status]} text-white text-[11px] px-2 py-0.5 font-semibold`}>
                    {r.status === "pending" ? "PENDING" : r.status.toUpperCase()}
                  </Badge>
                  <span className="text-[#9CA3AF] text-xs">{r.guests} {r.guests === 1 ? "guest" : "guests"}</span>
                </div>
              </div>
            </div>
            <div className="text-right shrink-0">
              <p className="text-[10px] text-[#9CA3AF] uppercase tracking-wider">Booked on</p>
              <p className="text-sm text-white font-medium whitespace-nowrap">
                {new Date(r.created_at).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "2-digit" })}
                {" "}
                {new Date(r.created_at).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true })}
              </p>
            </div>
          </div>

          <div className="bg-[#25262B] rounded-lg p-3 mb-4 space-y-1.5">
            <div className="flex items-center gap-2.5 text-sm text-white">
              <Phone size={14} className="shrink-0 text-[#F59E0B]" />
              <span>{r.phone}</span>
              {r.email && <span className="text-[#9CA3AF] ml-2">| {r.email}</span>}
            </div>
            <div className="flex items-center gap-2.5 text-sm text-white pt-1.5 border-t border-[#3F3F46]">
              <CalendarDays size={14} className="shrink-0 text-[#F59E0B]" />
              <span>{new Date(r.date).toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short", year: "numeric" })}</span>
              <span className="text-[#9CA3AF] ml-1">
                {new Date(`2000-01-01T${r.time}`).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true })}
              </span>
            </div>
            {r.notes && (
              <div className="flex items-start gap-2.5 text-sm text-white/80 pt-1.5 border-t border-[#3F3F46]">
                <MessageSquare size={14} className="shrink-0 text-[#F59E0B] mt-0.5" />
                <span className="italic">{r.notes}</span>
              </div>
            )}
          </div>

          <div className="flex gap-2 pt-1">
            {r.status === "pending" && (
              <>
                <Button size="sm" className="bg-green-600 hover:bg-green-700 text-xs h-8" onClick={() => updateStatus(r.id, "confirmed")}>
                  <CheckCircle size={14} className="mr-1" /> Confirm
                </Button>
                <Button size="sm" variant="destructive" className="text-xs h-8" onClick={() => updateStatus(r.id, "cancelled")}>
                  <XCircle size={14} className="mr-1" /> Cancel
                </Button>
              </>
            )}
            {r.status === "confirmed" && (
              <>
                <Button size="sm" className="bg-blue-600 hover:bg-blue-700 text-xs h-8" onClick={() => updateStatus(r.id, "seated")}>
                  <User size={14} className="mr-1" /> Mark Seated
                </Button>
                <Button size="sm" variant="destructive" className="text-xs h-8" onClick={() => updateStatus(r.id, "cancelled")}>
                  <XCircle size={14} className="mr-1" /> Cancel
                </Button>
              </>
            )}
            {r.status === "seated" && (
              <Button size="sm" variant="outline" className="text-xs h-8 border-[#3F3F46] text-white" onClick={() => updateStatus(r.id, "completed")}>
                Mark Completed
              </Button>
            )}
            {(r.status === "completed" || r.status === "cancelled") && (
              <span className="text-xs text-[#9CA3AF] italic py-1">No actions needed</span>
            )}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-[#F59E0B] border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-[#E5E7EB]">Reservations</h1>
        <p className="text-sm text-[#9CA3AF]">{filtered.length} total</p>
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#9CA3AF]" />
        <Input
          placeholder="Search by name, phone or email..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9 bg-[#2A2B30] border-[#3F3F46] text-[#E5E7EB] placeholder:text-[#6B7280]"
        />
      </div>

      <Tabs defaultValue="all">
        <TabsList className="bg-[#593A1E] border border-[#8B5E2E] gap-1.5">
          <TabsTrigger value="today" className="data-active:bg-[#F59E0B] data-active:text-white hover:bg-[#8B5E2E] px-4">
            Today ({todayRes.length})
          </TabsTrigger>
          <TabsTrigger value="upcoming" className="data-active:bg-[#F59E0B] data-active:text-white hover:bg-[#8B5E2E] px-4">
            Upcoming ({upcoming.length})
          </TabsTrigger>
          <TabsTrigger value="pending" className="data-active:bg-[#F59E0B] data-active:text-white hover:bg-[#8B5E2E] px-4">
            Pending ({pending.length})
          </TabsTrigger>
          <TabsTrigger value="confirmed" className="data-active:bg-[#F59E0B] data-active:text-white hover:bg-[#8B5E2E] px-4">
            Confirmed ({confirmed.length})
          </TabsTrigger>
          <TabsTrigger value="all" className="data-active:bg-[#F59E0B] data-active:text-white hover:bg-[#8B5E2E] px-4">
            All ({filtered.length})
          </TabsTrigger>
          <TabsTrigger value="timeslots" className="data-active:bg-[#F59E0B] data-active:text-white hover:bg-[#8B5E2E] px-4">
            <Clock size={14} className="mr-1" /> Time Slots
          </TabsTrigger>
        </TabsList>

        <TabsContent value="today" className="space-y-3 mt-4">
          <AnimatePresence mode="popLayout">
            {todayRes.length === 0 ? (
              <p className="text-[#6B7280] text-center py-8">No reservations today</p>
            ) : (
              todayRes.map((r) => <ReservationCard key={r.id} r={r} />)
            )}
          </AnimatePresence>
        </TabsContent>

        <TabsContent value="upcoming" className="space-y-3 mt-4">
          <AnimatePresence mode="popLayout">
            {upcoming.length === 0 ? (
              <p className="text-[#6B7280] text-center py-8">No upcoming reservations</p>
            ) : (
              upcoming.map((r) => <ReservationCard key={r.id} r={r} />)
            )}
          </AnimatePresence>
        </TabsContent>

        <TabsContent value="pending" className="space-y-3 mt-4">
          <AnimatePresence mode="popLayout">
            {pending.length === 0 ? (
              <p className="text-[#6B7280] text-center py-8">No pending reservations</p>
            ) : (
              pending.map((r) => <ReservationCard key={r.id} r={r} />)
            )}
          </AnimatePresence>
        </TabsContent>

        <TabsContent value="confirmed" className="space-y-3 mt-4">
          <AnimatePresence mode="popLayout">
            {confirmed.length === 0 ? (
              <p className="text-[#6B7280] text-center py-8">No confirmed reservations</p>
            ) : (
              confirmed.map((r) => <ReservationCard key={r.id} r={r} />)
            )}
          </AnimatePresence>
        </TabsContent>

        <TabsContent value="all" className="space-y-3 mt-4">
          <AnimatePresence mode="popLayout">
            {filtered.map((r) => (
              <ReservationCard key={r.id} r={r} />
            ))}
          </AnimatePresence>
        </TabsContent>

        <TabsContent value="timeslots" className="mt-4">
          <TimeSlotsEditor />
        </TabsContent>
      </Tabs>
    </div>
  )
}
