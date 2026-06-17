"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Save, Loader2, Globe, Image } from "lucide-react"
import toast from "react-hot-toast"

export default function AdminSettingsPage() {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [storeName, setStoreName] = useState("Eat O'Clock")
  const [address, setAddress] = useState("")
  const [phone, setPhone] = useState("")
  const [openTime, setOpenTime] = useState("")
  const [closeTime, setCloseTime] = useState("")
  const [email, setEmail] = useState("")
  const [logoUrl, setLogoUrl] = useState("")
  const [instagram, setInstagram] = useState("")
  const [facebook, setFacebook] = useState("")
  const [whatsapp, setWhatsapp] = useState("")

  useEffect(() => {
    loadSettings()
  }, [])

  const loadSettings = async () => {
    try {
      const res = await fetch("/api/admin/settings")
      if (!res.ok) return
      const data = await res.json()
      setStoreName(data.store_name || "Eat O'Clock")
      setAddress(data.address || "")
      setPhone(data.phone || "")
      setOpenTime(data.open_time || "")
      setCloseTime(data.close_time || "")
      setEmail(data.email || "")
      setLogoUrl(data.logo_url || "")
      setInstagram(data.instagram || "")
      setFacebook(data.facebook || "")
      setWhatsapp(data.whatsapp || "")
    } catch {
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      const res = await fetch("/api/admin/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          store_name: storeName,
          address,
          phone,
          open_time: openTime,
          close_time: closeTime,
          email,
          logo_url: logoUrl,
          instagram,
          facebook,
          whatsapp,
        }),
      })
      if (!res.ok) { toast.error("Failed to save"); return }
      toast.success("Settings saved!")
    } catch {
      toast.error("Failed to save")
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="w-8 h-8 border-4 border-[#F59E0B] border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <h1 className="text-2xl font-bold text-[#E5E7EB]">Settings</h1>

      <Card>
        <CardHeader>
          <CardTitle className="text-[#E5E7EB]">Store Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label className="text-[#E5E7EB]">Store Name</Label>
            <Input value={storeName} onChange={(e) => setStoreName(e.target.value)} className="bg-[#1F2024] border-[#3F3F46] text-[#E5E7EB]" />
          </div>
          <div className="space-y-2">
            <Label className="text-[#E5E7EB]">Address</Label>
            <Textarea value={address} onChange={(e) => setAddress(e.target.value)} className="bg-[#1F2024] border-[#3F3F46] text-[#E5E7EB]" />
          </div>
          <div className="space-y-2">
            <Label className="text-[#E5E7EB]">Phone</Label>
            <Input value={phone} onChange={(e) => setPhone(e.target.value)} className="bg-[#1F2024] border-[#3F3F46] text-[#E5E7EB]" />
          </div>
          <div className="space-y-2">
            <Label className="text-[#E5E7EB] flex items-center gap-2"><Globe size={16} /> Email</Label>
            <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="bg-[#1F2024] border-[#3F3F46] text-[#E5E7EB]" />
          </div>
          <div className="space-y-2">
            <Label className="text-[#E5E7EB] flex items-center gap-2"><Image size={16} /> Logo URL</Label>
            <Input value={logoUrl} onChange={(e) => setLogoUrl(e.target.value)} placeholder="https://example.com/logo.png" className="bg-[#1F2024] border-[#3F3F46] text-[#E5E7EB]" />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-[#E5E7EB]">Operating Hours</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label className="text-[#E5E7EB]">Opening Time</Label>
            <Input value={openTime} onChange={(e) => setOpenTime(e.target.value)} className="bg-[#1F2024] border-[#3F3F46] text-[#E5E7EB]" />
          </div>
          <div className="space-y-2">
            <Label className="text-[#E5E7EB]">Closing Time</Label>
            <Input value={closeTime} onChange={(e) => setCloseTime(e.target.value)} className="bg-[#1F2024] border-[#3F3F46] text-[#E5E7EB]" />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-[#E5E7EB]">Social Links</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label className="text-[#E5E7EB] flex items-center gap-2">
              <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/></svg>
              Instagram URL
            </Label>
            <Input value={instagram} onChange={(e) => setInstagram(e.target.value)} placeholder="https://instagram.com/..." className="bg-[#1F2024] border-[#3F3F46] text-[#E5E7EB]" />
          </div>
          <div className="space-y-2">
            <Label className="text-[#E5E7EB] flex items-center gap-2">
              <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
              Facebook URL
            </Label>
            <Input value={facebook} onChange={(e) => setFacebook(e.target.value)} placeholder="https://facebook.com/..." className="bg-[#1F2024] border-[#3F3F46] text-[#E5E7EB]" />
          </div>
          <div className="space-y-2">
            <Label className="text-[#E5E7EB] flex items-center gap-2">
              <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
              WhatsApp Number
            </Label>
            <Input value={whatsapp} onChange={(e) => setWhatsapp(e.target.value)} placeholder="+91 98765 43210" className="bg-[#1F2024] border-[#3F3F46] text-[#E5E7EB]" />
          </div>
        </CardContent>
      </Card>

      <Button onClick={handleSave} disabled={saving} className="gap-2 bg-[#F59E0B] hover:bg-[#D97706] text-white">
        {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
        Save Settings
      </Button>
    </div>
  )
}
