"use client"

import { useEffect, useState, useMemo, useRef } from "react"
import type { Category, MenuItem } from "@/types"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Switch } from "@/components/ui/switch"
import { formatPrice } from "@/utils/helpers"
import { Plus, Pencil, Trash2, Leaf, Flame, Upload, Search } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import toast from "react-hot-toast"

export default function AdminMenuPage() {
  const [categories, setCategories] = useState<Category[]>([])
  const [items, setItems] = useState<MenuItem[]>([])
  const [loading, setLoading] = useState(true)
  const [activeCategory, setActiveCategory] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [placeholderIndex, setPlaceholderIndex] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)

  const categoriesList = categories

  const placeholders = useMemo(
    () => [
      "Search all products...",
      ...categories.map((c) => `Search ${c.name.toLowerCase()}...`),
    ],
    [categories]
  )

  useEffect(() => {
    const timer = setInterval(() => {
      setPlaceholderIndex((prev) => (prev + 1) % placeholders.length)
    }, 2500)
    return () => clearInterval(timer)
  }, [placeholders.length])

  const filteredItems = useMemo(() => {
    let result = items
    if (activeCategory) {
      result = result.filter((i) => i.category_id === activeCategory)
    }
    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase()
      result = result.filter(
        (i) =>
          i.name.toLowerCase().includes(q) ||
          i.description?.toLowerCase().includes(q) ||
          i.category?.name.toLowerCase().includes(q) ||
          i.ingredients?.toLowerCase().includes(q)
      )
    }
    return result
  }, [items, activeCategory, searchTerm])

  // Item form state
  const [itemDialogOpen, setItemDialogOpen] = useState(false)
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null)
  const [itemForm, setItemForm] = useState({
    name: "",
    description: "",
    price: "",
    category_id: "",
    image_url: "",
    is_available: true,
    is_vegetarian: true,
    ingredients: "",
    calories: "",
    prep_time: "",
    spice_level: "mild",
    is_bestseller: false,
  })

  // Category form state
  const [catDialogOpen, setCatDialogOpen] = useState(false)
  const [catForm, setCatForm] = useState({ name: "", description: "" })

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      const [catsRes, itemsRes] = await Promise.all([
        fetch("/api/categories"),
        fetch("/api/menu"),
      ])
      const cats = await catsRes.json()
      const menuItems = await itemsRes.json()
      if (Array.isArray(cats)) setCategories(cats)
      if (Array.isArray(menuItems)) setItems(menuItems)
    } catch {
      // silent
    }
    setLoading(false)
  }

  // ===== ITEM CRUD =====
  const openNewItem = () => {
    setEditingItem(null)
    setItemForm({
      name: "",
      description: "",
      price: "",
      category_id: categories[0]?.id || "",
      image_url: "",
      is_available: true,
      is_vegetarian: true,
      ingredients: "",
      calories: "",
      prep_time: "",
      spice_level: "mild",
      is_bestseller: false,
    })
    setItemDialogOpen(true)
  }

  const openEditItem = (item: MenuItem) => {
    setEditingItem(item)
    setItemForm({
      name: item.name,
      description: item.description || "",
      price: item.price.toString(),
      category_id: item.category_id,
      image_url: item.image_url || "",
      is_available: item.is_available,
      is_vegetarian: item.is_vegetarian,
      ingredients: item.ingredients || "",
      calories: item.calories?.toString() || "",
      prep_time: item.prep_time?.toString() || "",
      spice_level: item.spice_level || "mild",
      is_bestseller: item.is_bestseller || false,
    })
    setItemDialogOpen(true)
  }

  const saveItem = async () => {
    if (!itemForm.name || !itemForm.price || !itemForm.category_id) {
      toast.error("Please fill all required fields")
      return
    }

    const payload: Record<string, unknown> = {
      name: itemForm.name,
      description: itemForm.description,
      price: parseFloat(itemForm.price),
      category_id: itemForm.category_id,
      image_url: itemForm.image_url || null,
      is_available: itemForm.is_available,
      is_vegetarian: itemForm.is_vegetarian,
      ingredients: itemForm.ingredients || null,
      calories: itemForm.calories ? parseInt(itemForm.calories) : null,
      prep_time: itemForm.prep_time ? parseInt(itemForm.prep_time) : null,
      spice_level: itemForm.spice_level,
      is_bestseller: itemForm.is_bestseller,
    }

    if (editingItem) {
      const res = await fetch("/api/menu", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: editingItem.id, ...payload }),
      })
      if (!res.ok) {
        toast.error("Failed to update item")
        return
      }
      toast.success("Item updated!")
    } else {
      const res = await fetch("/api/menu", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })
      if (!res.ok) {
        toast.error("Failed to create item")
        return
      }
      toast.success("Item created!")
    }

    setItemDialogOpen(false)
    fetchData()
  }

  const deleteItem = async (id: string) => {
    if (!confirm("Are you sure you want to delete this item?")) return
    const res = await fetch(`/api/menu?id=${id}`, { method: "DELETE" })
    if (!res.ok) {
      toast.error("Failed to delete item")
      return
    }
    toast.success("Item deleted!")
    fetchData()
  }

  // ===== CATEGORY CRUD =====
  const saveCategory = async () => {
    if (!catForm.name) {
      toast.error("Category name is required")
      return
    }
    const res = await fetch("/api/categories", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: catForm.name, description: catForm.description }),
    })
    if (!res.ok) {
      toast.error("Failed to create category")
      return
    }
    toast.success("Category created!")
    setCatDialogOpen(false)
    setCatForm({ name: "", description: "" })
    fetchData()
  }

  const deleteCategory = async (id: string, name: string) => {
    if (!confirm(`Delete category "${name}"? Items in this category will become uncategorized.`)) return
    const res = await fetch(`/api/categories?id=${id}`, { method: "DELETE" })
    if (!res.ok) {
      toast.error("Failed to delete category")
      return
    }
    toast.success(`Category "${name}" deleted!`)
    if (activeCategory === id) setActiveCategory(null)
    fetchData()
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-amber-600 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <h1 className="text-2xl font-bold">Menu Management</h1>
        <div className="relative flex-1 max-w-md w-full sm:w-auto">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            ref={inputRef}
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full h-10 pl-9 pr-3 rounded-md bg-[#2A2B30] border border-[#3F3F46] text-white text-sm placeholder-transparent focus:outline-none focus:border-amber-500 transition"
          />
          {!searchTerm && (
            <div className="absolute left-9 top-1/2 -translate-y-1/2 text-sm text-gray-500 pointer-events-none overflow-hidden h-5">
              <AnimatePresence mode="wait">
                <motion.span
                  key={placeholders[placeholderIndex]}
                  initial={{ y: 10, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  exit={{ y: -10, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="block"
                >
                  {placeholders[placeholderIndex]}
                </motion.span>
              </AnimatePresence>
            </div>
          )}
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => setCatDialogOpen(true)} className="text-xs sm:text-sm">
            <Plus size={14} /> Category
          </Button>
          <Button size="sm" onClick={openNewItem} className="text-xs sm:text-sm">
            <Plus size={14} /> Add Item
          </Button>
        </div>
      </div>

      {/* Categories */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Categories</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setActiveCategory(null)}
              className={`px-4 py-1.5 rounded-full text-sm font-medium transition ${
                activeCategory === null
                  ? "bg-amber-500 text-white"
                  : "bg-amber-50 text-amber-800 hover:bg-amber-100"
              }`}
            >
              All ({items.length})
            </button>
            {categories.map((cat) => {
              const count = items.filter((i) => i.category_id === cat.id).length
              return (
                <div key={cat.id} className="relative group">
                  <button
                    onClick={() => setActiveCategory(cat.id)}
                    className={`px-4 py-1.5 rounded-full text-sm font-medium transition ${
                      activeCategory === cat.id
                        ? "bg-amber-500 text-white"
                        : "bg-amber-50 text-amber-800 hover:bg-amber-100"
                    }`}
                  >
                    {cat.name} ({count})
                  </button>
                  <button
                    onClick={() => deleteCategory(cat.id, cat.name)}
                    className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600"
                    title={`Delete ${cat.name}`}
                  >
                    <Trash2 size={10} className="text-white" />
                  </button>
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>

      {/* Items Table - Desktop */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">
            Menu Items ({filteredItems.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {/* Mobile card layout */}
          <div className="grid grid-cols-1 gap-3 sm:hidden">
            {filteredItems.map((item) => (
              <div key={item.id} className="bg-[#2A2B30] rounded-lg p-3 border border-[#3F3F46] space-y-2">
                <div className="grid grid-cols-[1fr_auto] gap-2 items-center">
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="font-bold text-white text-base truncate">{item.name}</span>
                      {item.is_bestseller && <Flame size={12} className="text-amber-500 shrink-0" />}
                    </div>
                    <p className="text-xs text-gray-400 truncate">{item.category?.name}</p>
                  </div>
                  <span className="text-amber-400 font-bold text-base shrink-0">{formatPrice(item.price)}</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-white">
                  {item.prep_time && <span>{item.prep_time}m</span>}
                  {item.calories && <span>{item.calories} cal</span>}
                  {item.spice_level && (
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                      item.spice_level === 'mild' ? 'text-green-400 bg-green-900/30' :
                      item.spice_level === 'medium' ? 'text-orange-400 bg-orange-900/30' :
                      'text-red-400 bg-red-900/30'
                    }`}>
                      {item.spice_level}
                    </span>
                  )}
                  <div className="flex items-center gap-1 ml-auto">
                    {item.is_vegetarian && <Leaf size={12} className="text-green-600" />}
                    {item.is_available ? (
                      <span className="text-green-400 font-semibold">Active</span>
                    ) : (
                      <span className="text-red-400 font-semibold">Inactive</span>
                    )}
                  </div>
                </div>
                <div className="flex gap-2 pt-1 border-t border-[#3F3F46]">
                  <Button size="sm" onClick={() => openEditItem(item)} className="flex-1 h-8 text-xs justify-center bg-[#F59E0B] hover:bg-[#D97706] text-white font-semibold border-0">
                    <Pencil size={14} className="mr-1" /> Edit
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => deleteItem(item.id)} className="flex-1 h-8 text-xs justify-center text-red-500 border-red-500/30 hover:bg-red-500/10">
                    <Trash2 size={14} className="mr-1" /> Delete
                  </Button>
                </div>
              </div>
            ))}
          </div>
          {/* Desktop table */}
          <div className="hidden sm:block overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[#3F3F46] text-amber-400 font-semibold">
                  <th className="pb-3 font-bold text-lg text-amber-400 w-[30%] text-left">Name</th>
                  <th className="pb-3 font-bold text-lg text-amber-400 w-[12%] text-center">Category</th>
                  <th className="pb-3 font-bold text-lg text-amber-400 w-[10%] text-center">Price</th>
                  <th className="pb-3 font-bold text-lg text-amber-400 w-[8%] text-center">Prep</th>
                  <th className="pb-3 font-bold text-lg text-amber-400 w-[8%] text-center">Cal</th>
                  <th className="pb-3 font-bold text-lg text-amber-400 w-[8%] text-center">Spice</th>
                  <th className="pb-3 font-bold text-lg text-amber-400 w-[10%] text-center">Available</th>
                  <th className="pb-3 font-bold text-lg text-amber-400 w-[6%] text-center">Veg</th>
                  <th className="pb-3 font-bold text-lg text-amber-400 w-[8%] text-center">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredItems.map((item) => (
                  <tr key={item.id} className="border-b border-[#3F3F46] last:border-0">
                    <td className="py-3 font-bold text-base text-white">
                      <div className="flex items-center gap-2">
                        {item.name}
                        {item.is_bestseller && <Flame size={14} className="text-amber-500" />}
                      </div>
                    </td>
                    <td className="py-3 text-gray-300 font-bold text-base text-center">
                      {item.category?.name}
                    </td>
                    <td className="py-3 text-amber-400 font-bold text-base text-center">
                      {formatPrice(item.price)}
                    </td>
                    <td className="py-3 text-gray-300 font-bold text-base text-center">
                      {item.prep_time ? `${item.prep_time}m` : "—"}
                    </td>
                    <td className="py-3 text-gray-300 font-bold text-base text-center">
                      {item.calories ? `${item.calories}` : "—"}
                    </td>
                    <td className="py-3 text-center">
                      {item.spice_level && (
                        <span className={`text-xs font-semibold px-3 py-1 rounded-full ${
                          item.spice_level === 'mild' ? 'text-green-400 bg-green-900/30' :
                          item.spice_level === 'medium' ? 'text-orange-400 bg-orange-900/30' :
                          'text-red-400 bg-red-900/30'
                        }`}>
                          {item.spice_level}
                        </span>
                      )}
                    </td>
                    <td className="py-3 text-center">
                      {item.is_available ? (
                        <span className="text-green-400 font-bold text-base">Yes</span>
                      ) : (
                        <span className="text-red-400 font-bold text-base">No</span>
                      )}
                    </td>
                    <td className="py-3 text-center">
                      {item.is_vegetarian && (
                        <Leaf size={16} className="text-green-600 inline" />
                      )}
                    </td>
                    <td className="py-3 text-center">
                      <div className="flex gap-1 justify-center">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => openEditItem(item)}
                        >
                          <Pencil size={16} />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => deleteItem(item.id)}
                          className="text-red-500"
                        >
                          <Trash2 size={16} />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Item Dialog */}
      <Dialog open={itemDialogOpen} onOpenChange={setItemDialogOpen}>
        <DialogContent className="bg-[#2A2B30] border-[#3F3F46] text-gray-100 sm:max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-amber-400">
              {editingItem ? "Edit Item" : "Add New Item"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 px-1">
            <div className="space-y-2">
              <Label className="text-gray-300">Name *</Label>
              <Input
                className="bg-[#3F3F46] border-[#52525B] text-white placeholder:text-gray-400 h-10"
                value={itemForm.name}
                onChange={(e) =>
                  setItemForm({ ...itemForm, name: e.target.value })
                }
              />
            </div>
            <div className="space-y-2">
              <Label className="text-gray-300">Description</Label>
              <Textarea
                className="bg-[#3F3F46] border-[#52525B] text-white placeholder:text-gray-400"
                value={itemForm.description}
                onChange={(e) =>
                  setItemForm({ ...itemForm, description: e.target.value })
                }
              />
            </div>
            <div className="space-y-2">
              <Label className="text-gray-300">Image</Label>
              <div className="flex gap-2">
                <Input
                  className="bg-[#3F3F46] border-[#52525B] text-white placeholder:text-gray-400 h-10 flex-1"
                  value={itemForm.image_url}
                  onChange={(e) =>
                    setItemForm({ ...itemForm, image_url: e.target.value })
                  }
                  placeholder="Paste image URL..."
                />
                <label className="cursor-pointer bg-[#3F3F46] hover:bg-[#52525B] border border-[#52525B] rounded-md px-3 flex items-center gap-2 text-gray-300 text-sm transition shrink-0 h-10">
                  <Upload size={16} />
                  Browse
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0]
                      if (file) {
                        const reader = new FileReader()
                        reader.onload = (ev) => {
                          setItemForm({ ...itemForm, image_url: ev.target?.result as string })
                        }
                        reader.readAsDataURL(file)
                      }
                    }}
                  />
                </label>
              </div>
              {itemForm.image_url && (
                <div className="relative w-full h-24 sm:h-32 rounded-md overflow-hidden border border-[#52525B] mt-2">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={itemForm.image_url}
                    alt="Preview"
                    className="w-full h-full object-cover"
                  />
                </div>
              )}
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-gray-300">Price (₹) *</Label>
                <Input
                  className="bg-[#3F3F46] border-[#52525B] text-white placeholder:text-gray-400 h-10"
                  type="number"
                  step="0.01"
                  value={itemForm.price}
                  onChange={(e) =>
                    setItemForm({ ...itemForm, price: e.target.value })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label className="text-gray-300">Category *</Label>
                <select
                  className="w-full h-10 rounded-md bg-[#3F3F46] border border-[#52525B] text-white px-3"
                  value={itemForm.category_id}
                  onChange={(e) =>
                    setItemForm({ ...itemForm, category_id: e.target.value })
                  }
                >
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            {/* Ingredients */}
            <div className="space-y-2">
              <Label className="text-gray-300">Ingredients</Label>
              <Textarea
                className="bg-[#3F3F46] border-[#52525B] text-white placeholder:text-gray-400"
                value={itemForm.ingredients}
                onChange={(e) =>
                  setItemForm({ ...itemForm, ingredients: e.target.value })
                }
                placeholder="Comma-separated list of ingredients"
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label className="text-gray-300">Calories</Label>
                <Input
                  className="bg-[#3F3F46] border-[#52525B] text-white placeholder:text-gray-400 h-10"
                  type="number"
                  placeholder="e.g. 350"
                  value={itemForm.calories}
                  onChange={(e) =>
                    setItemForm({ ...itemForm, calories: e.target.value })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label className="text-gray-300">Prep Time (min)</Label>
                <Input
                  className="bg-[#3F3F46] border-[#52525B] text-white placeholder:text-gray-400 h-10"
                  type="number"
                  placeholder="e.g. 12"
                  value={itemForm.prep_time}
                  onChange={(e) =>
                    setItemForm({ ...itemForm, prep_time: e.target.value })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label className="text-gray-300">Spice Level</Label>
                <select
                  className="w-full h-10 rounded-md bg-[#3F3F46] border border-[#52525B] text-white px-3 text-sm"
                  value={itemForm.spice_level}
                  onChange={(e) =>
                    setItemForm({ ...itemForm, spice_level: e.target.value })
                  }
                >
                  <option value="mild">Mild</option>
                  <option value="medium">Medium</option>
                  <option value="spicy">Spicy</option>
                </select>
              </div>
            </div>
            <div className="flex items-center gap-3 sm:gap-6">
              <label className="flex items-center gap-1.5 text-gray-300 text-xs sm:text-sm whitespace-nowrap">
                <Switch
                  checked={itemForm.is_available}
                  onCheckedChange={(v) =>
                    setItemForm({ ...itemForm, is_available: v })
                  }
                />
                Available
              </label>
              <label className="flex items-center gap-1.5 text-gray-300 text-xs sm:text-sm whitespace-nowrap">
                <Switch
                  checked={itemForm.is_vegetarian}
                  onCheckedChange={(v) =>
                    setItemForm({ ...itemForm, is_vegetarian: v })
                  }
                />
                Vegetarian
              </label>
              <label className="flex items-center gap-1.5 text-gray-300 text-xs sm:text-sm whitespace-nowrap">
                <Switch
                  checked={itemForm.is_bestseller}
                  onCheckedChange={(v) =>
                    setItemForm({ ...itemForm, is_bestseller: v })
                  }
                />
                <Flame size={12} className="sm:w-[14px] text-amber-500" /> Bestseller
              </label>
            </div>
            <Button onClick={saveItem} className="w-full">
              {editingItem ? "Update Item" : "Create Item"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Category Dialog */}
      <Dialog open={catDialogOpen} onOpenChange={setCatDialogOpen}>
        <DialogContent className="bg-[#2A2B30] border-[#3F3F46] text-gray-100">
          <DialogHeader>
            <DialogTitle className="text-amber-400">Add Category</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label className="text-gray-300">Name *</Label>
              <Input
                className="bg-[#3F3F46] border-[#52525B] text-white placeholder:text-gray-400 h-10"
                value={catForm.name}
                onChange={(e) =>
                  setCatForm({ ...catForm, name: e.target.value })
                }
              />
            </div>
            <div className="space-y-2">
              <Label className="text-gray-300">Description</Label>
              <Textarea
                className="bg-[#3F3F46] border-[#52525B] text-white placeholder:text-gray-400"
                value={catForm.description}
                onChange={(e) =>
                  setCatForm({ ...catForm, description: e.target.value })
                }
              />
            </div>
            <Button onClick={saveCategory} className="w-full">
              Create Category
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <style>{`
        input[type="number"]::-webkit-outer-spin-button,
        input[type="number"]::-webkit-inner-spin-button {
          -webkit-appearance: none;
          margin: 0;
        }
        input[type="number"] {
          -moz-appearance: textfield;
        }
      `}</style>
    </div>
  )
}
