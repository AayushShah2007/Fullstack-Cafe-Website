"use client"

import { useEffect, useState } from "react"
import type { Coupon } from "@/types"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Switch } from "@/components/ui/switch"
import { Plus, Pencil, Trash2, Copy, Check } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import toast from "react-hot-toast"

async function api(url: string, options?: RequestInit) {
  const res = await fetch(url, options)
  const data = await res.json()
  if (!res.ok) throw new Error(data.error || "Request failed")
  return data
}

export default function DiscountCouponPage() {
  const [coupons, setCoupons] = useState<Coupon[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing] = useState<Coupon | null>(null)
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({
    code: "",
    discount_percent: "",
    max_discount: "",
    min_order: "0",
    usage_limit: "100",
    per_user_limit: "1",
    is_active: true,
    expires_at: "",
  })

  useEffect(() => {
    fetchCoupons()
    const interval = setInterval(fetchCoupons, 5000)
    return () => clearInterval(interval)
  }, [])

  const fetchCoupons = async () => {
    try {
      const data = await api("/api/coupons")
      if (Array.isArray(data)) {
        setCoupons((prev) => {
          if (prev.length === data.length && prev.every((c, i) => c.id === data[i].id && c.used_count === data[i].used_count)) {
            return prev
          }
          return data
        })
      }
    } catch { /* silent */ }
    setLoading(false)
  }

  const openNew = () => {
    setEditing(null)
    setForm({
      code: "",
      discount_percent: "",
      max_discount: "",
      min_order: "0",
      usage_limit: "100",
      per_user_limit: "1",
      is_active: true,
      expires_at: "",
    })
    setDialogOpen(true)
  }

  const openEdit = (c: Coupon) => {
    setEditing(c)
    setForm({
      code: c.code,
      discount_percent: c.discount_percent.toString(),
      max_discount: c.max_discount >= 999999 ? "" : c.max_discount.toString(),
      min_order: c.min_order.toString(),
      usage_limit: c.usage_limit.toString(),
      per_user_limit: c.per_user_limit.toString(),
      is_active: c.is_active,
      expires_at: new Date(c.expires_at).toISOString().split("T")[0],
    })
    setDialogOpen(true)
  }

  const save = async () => {
    if (!form.code || !form.discount_percent || !form.expires_at) {
      toast.error("Please fill all required fields")
      return
    }

    setSaving(true)
    const payload = {
      code: form.code.toUpperCase(),
      discount_percent: parseFloat(form.discount_percent),
      max_discount: form.max_discount ? parseFloat(form.max_discount) : 999999,
      min_order: parseFloat(form.min_order),
      usage_limit: parseInt(form.usage_limit),
      per_user_limit: parseInt(form.per_user_limit),
      is_active: form.is_active,
      expires_at: new Date(form.expires_at).toISOString(),
    }

    try {
      if (editing) {
        await api("/api/coupons", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id: editing.id, ...payload }),
        })
        toast.success("Coupon updated!")
      } else {
        await api("/api/coupons", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        })
        toast.success("Coupon created!")
      }
      setDialogOpen(false)
      fetchCoupons()
    } catch (err: any) {
      toast.error(err.message || "Something went wrong")
    }
    setSaving(false)
  }

  const deleteCoupon = async (id: string) => {
    if (!confirm("Delete this coupon?")) return
    try {
      await api(`/api/coupons?id=${id}`, { method: "DELETE" })
      toast.success("Coupon deleted")
      fetchCoupons()
    } catch (err: any) {
      toast.error(err.message || "Something went wrong")
    }
  }

  const copyCode = async (code: string, id: string) => {
    await navigator.clipboard.writeText(code)
    setCopiedId(id)
    setTimeout(() => setCopiedId(null), 2000)
    toast.success("Code copied!")
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-[#E5E7EB]">Discount Coupons</h1>
        <Button onClick={openNew} className="bg-[#F59E0B] hover:bg-[#D97706] text-white">
          <Plus size={16} /> Add Coupon
        </Button>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="w-8 h-8 border-4 border-[#F59E0B] border-t-transparent rounded-full animate-spin" />
        </div>
      ) : coupons.length === 0 ? (
        <Card className="bg-[#2A2B30] border-[#3F3F46]">
          <CardContent className="p-12 text-center">
            <p className="text-[#9CA3AF]">No coupons yet. Create your first coupon!</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {coupons.map((c) => {
            const expired = new Date(c.expires_at) < new Date()
            return (
              <Card key={c.id} className="bg-[#2A2B30] border-[#3F3F46]">
                <CardContent className="p-5">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <code className="text-xl font-bold text-[#F59E0B] tracking-wider">{c.code}</code>
                        <button
                          onClick={() => copyCode(c.code, c.id)}
                          className="p-1 hover:bg-[#3F3F46] rounded transition"
                        >
                          {copiedId === c.id ? <Check size={14} className="text-green-500" /> : <Copy size={14} className="text-[#9CA3AF]" />}
                        </button>
                      </div>
                      <p className="text-base text-[#9CA3AF] mt-1">{c.discount_percent}% off{c.max_discount >= 999999 ? "" : ` (max ₹${c.max_discount})`}</p>
                    </div>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="sm" onClick={() => openEdit(c)}>
                        <Pencil size={15} className="text-[#9CA3AF]" />
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => deleteCoupon(c.id)}>
                        <Trash2 size={15} className="text-red-400" />
                      </Button>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2 text-sm text-[#6B7280]">
                    <Badge variant="outline" className="border-[#3F3F46] text-[#9CA3AF]">
                      Min: ₹{c.min_order}
                    </Badge>
                    <Badge variant="outline" className="border-[#3F3F46] text-[#9CA3AF]">
                      Used: {c.used_count}/{c.usage_limit}
                    </Badge>
                    <Badge variant="outline" className="border-[#3F3F46] text-[#9CA3AF]">
                      Per user: {c.per_user_limit}
                    </Badge>
                    <Badge className={expired ? "bg-red-500/20 text-red-400" : c.is_active ? "bg-green-500/20 text-green-400" : "bg-yellow-500/20 text-yellow-400"}>
                      {expired ? "Expired" : c.is_active ? "Active" : "Disabled"}
                    </Badge>
                    <Badge variant="outline" className="border-[#3F3F46] text-[#9CA3AF]">
                      Expires: {new Date(c.expires_at).toLocaleDateString("en-IN")}
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="bg-[#2A2B30] border-[#3F3F46] text-[#E5E7EB]">
          <DialogHeader>
            <DialogTitle className="text-[#E5E7EB]">{editing ? "Edit Coupon" : "Add Coupon"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label className="text-[#E5E7EB]">Coupon Code *</Label>
              <Input
                value={form.code}
                onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })}
                className="bg-[#1F2024] border-[#3F3F46] text-[#E5E7EB] placeholder:text-[#6B7280]"
                placeholder="e.g. SAVE20"
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-[#E5E7EB]">Discount % *</Label>
                <Input
                  type="number"
                  value={form.discount_percent}
                  onChange={(e) => setForm({ ...form, discount_percent: e.target.value })}
                  className="bg-[#1F2024] border-[#3F3F46] text-[#E5E7EB]"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-[#E5E7EB]">Max Discount (₹)</Label>
                <Input
                  type="number"
                  value={form.max_discount}
                  onChange={(e) => setForm({ ...form, max_discount: e.target.value })}
                  className="bg-[#1F2024] border-[#3F3F46] text-[#E5E7EB]"
                />
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-[#E5E7EB]">Min Order (₹)</Label>
                <Input
                  type="number"
                  value={form.min_order}
                  onChange={(e) => setForm({ ...form, min_order: e.target.value })}
                  className="bg-[#1F2024] border-[#3F3F46] text-[#E5E7EB]"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-[#E5E7EB]">Total Usage Limit</Label>
                <Input
                  type="number"
                  value={form.usage_limit}
                  onChange={(e) => setForm({ ...form, usage_limit: e.target.value })}
                  className="bg-[#1F2024] border-[#3F3F46] text-[#E5E7EB]"
                />
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-[#E5E7EB]">Per User Limit</Label>
                <Input
                  type="number"
                  value={form.per_user_limit}
                  onChange={(e) => setForm({ ...form, per_user_limit: e.target.value })}
                  className="bg-[#1F2024] border-[#3F3F46] text-[#E5E7EB]"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label className="text-[#E5E7EB]">Expiry Date *</Label>
              <Input
                type="date"
                value={form.expires_at}
                onChange={(e) => setForm({ ...form, expires_at: e.target.value })}
                className="bg-[#1F2024] border-[#3F3F46] text-[#E5E7EB] accent-[#F59E0B]"
              />
            </div>
            <label className="flex items-center gap-2 text-[#E5E7EB]">
              <Switch checked={form.is_active} onCheckedChange={(v) => setForm({ ...form, is_active: v })} />
              Active
            </label>
            <Button onClick={save} className="w-full bg-[#F59E0B] hover:bg-[#D97706] text-white">
              {editing ? "Update Coupon" : "Create Coupon"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
