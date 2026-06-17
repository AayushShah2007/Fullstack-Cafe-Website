"use client"

import { useState, useMemo, useEffect, useRef } from "react"
import type { Category, MenuItem } from "@/types"
import { motion, AnimatePresence } from "framer-motion"
import { useCartStore } from "@/store/cart"
import { formatPrice } from "@/utils/helpers"
import { Button } from "@/components/ui/button"
import { Plus, Leaf, Search, Sparkles, Minus, Beef, Pizza, CupSoda, Wheat, Sandwich, Coffee, UtensilsCrossed } from "lucide-react"
import toast from "react-hot-toast"
import Link from "next/link"

const categoryIcons: Record<string, React.ReactNode> = {
  Burgers: <img src="https://img.icons8.com/?size=24&id=99341&format=png&color=000000" alt="Burgers" className="w-4 h-4" />,
  Pizza: <Pizza className="w-4 h-4" />,
  Shakes: <CupSoda className="w-4 h-4" />,
  Pasta: <Wheat className="w-4 h-4" />,
  Sandwiches: <Sandwich className="w-4 h-4" />,
  Beverages: <Coffee className="w-4 h-4" />,
  "Fast Food": <UtensilsCrossed className="w-4 h-4" />,
}
const categoryFallbacks: Record<string, React.ReactNode> = {
  Burgers: <img src="https://img.icons8.com/?size=100&id=99341&format=png&color=000000" alt="Burgers" className="w-16 h-16" />,
  Pizza: <Pizza className="w-16 h-16 text-white/80" />,
  Shakes: <CupSoda className="w-16 h-16 text-white/80" />,
  Pasta: <Wheat className="w-16 h-16 text-white/80" />,
  Sandwiches: <Sandwich className="w-16 h-16 text-white/80" />,
  Beverages: <Coffee className="w-16 h-16 text-white/80" />,
  "Fast Food": <UtensilsCrossed className="w-16 h-16 text-white/80" />,
}

export default function MenuClient({
  initialCategories,
  initialItems,
}: {
  initialCategories: Category[]
  initialItems: MenuItem[]
}) {
  const [activeCategory, setActiveCategory] = useState<string | null>(null)
  const [search, setSearch] = useState("")
  const [isFocused, setIsFocused] = useState(false)
  const [placeholderIndex, setPlaceholderIndex] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)

  const placeholders = useMemo(
    () => [
      "Search menu...",
      ...initialCategories.map((c) => `Search ${c.name.toLowerCase()}...`),
    ],
    [initialCategories]
  )

  useEffect(() => {
    const timer = setInterval(() => {
      setPlaceholderIndex((prev) => (prev + 1) % placeholders.length)
    }, 2500)
    return () => clearInterval(timer)
  }, [placeholders.length])
  const addItem = useCartStore((s) => s.addItem)
  const cartItems = useCartStore((s) => s.items)
  const updateQuantity = useCartStore((s) => s.updateQuantity)
  const removeItem = useCartStore((s) => s.removeItem)

  const filteredItems = useMemo(
    () =>
      initialItems.filter((item) => {
        const matchCategory = activeCategory
          ? item.category_id === activeCategory
          : true
        return (
          matchCategory &&
          item.name.toLowerCase().includes(search.toLowerCase())
        )
      }),
    [initialItems, activeCategory, search]
  )

  const handleAdd = (e: React.MouseEvent, item: MenuItem) => {
    e.preventDefault()
    e.stopPropagation()
    addItem(item)
    toast.success(`${item.name} added!`, { position: "bottom-center" })
  }

  return (
    <div className="min-h-[calc(100vh-64px)] mt-16 md:mt-20 bg-gradient-to-b from-orange-50 via-amber-50 to-rose-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-gray-800">
            Our <span className="text-amber-700">Menu</span>
          </h1>
          <p className="text-gray-500 mt-1">Freshly made, just for you</p>
          <div className="relative max-w-md mx-auto mt-4">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 z-10" />
            <div className="relative">
              <input
                ref={inputRef}
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onFocus={() => setIsFocused(true)}
                onBlur={() => setIsFocused(false)}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 bg-white/80 backdrop-blur-sm text-gray-700 placeholder:text-transparent focus:outline-none focus:ring-2 focus:ring-amber-400/50 focus:border-amber-300 transition relative"
              />
              <AnimatePresence mode="wait">
                {!isFocused && !search && (
                  <motion.span
                    key={placeholders[placeholderIndex]}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -6 }}
                    transition={{ duration: 0.25 }}
                    onClick={() => inputRef.current?.focus()}
                    className="absolute left-10 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none text-sm truncate max-w-[calc(100%-3rem)]"
                  >
                    {placeholders[placeholderIndex]}
                  </motion.span>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>

        {/* Category filter — glass-morphism pills */}
        <div className="flex gap-2 mb-8 overflow-x-auto pb-2 snap-x snap-mandatory scrollbar-hide px-1" style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}>
          <button
            onClick={() => setActiveCategory(null)}
            className={`group relative px-5 py-2.5 rounded-full text-sm font-medium transition-all duration-300 snap-start shrink-0 ${
              activeCategory === null
                ? "bg-gradient-to-r from-amber-500 to-orange-600 text-white shadow-lg shadow-amber-300/30 scale-105"
                : "bg-white/70 backdrop-blur-sm text-gray-600 hover:bg-white hover:shadow-md border border-white/50"
            }`}
          >
            <span className="flex items-center gap-1.5">
              <Sparkles size={14} />
              All
            </span>
          </button>
          {initialCategories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              className={`group relative px-5 py-2.5 rounded-full text-sm font-medium transition-all duration-300 snap-start shrink-0 ${
                activeCategory === cat.id
                  ? "bg-gradient-to-r from-amber-500 to-orange-600 text-white shadow-lg shadow-amber-300/30 scale-105"
                  : "bg-white/70 backdrop-blur-sm text-gray-600 hover:bg-white hover:shadow-md border border-white/50"
              }`}
            >
              <span className="flex items-center gap-1.5">
                {categoryIcons[cat.name] || <UtensilsCrossed className="w-4 h-4" />}
                {cat.name}
              </span>
            </button>
          ))}
        </div>

        {/* Menu grid */}
        <AnimatePresence mode="wait">
          {filteredItems.length === 0 ? (
            <motion.div
              key="empty"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="text-center py-20"
            >
              <p className="text-gray-400 text-lg">No items found</p>
            </motion.div>
          ) : (
            <motion.div
              key={activeCategory || "all"}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6"
            >
              {filteredItems.map((item, i) => (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: i * 0.03 }}
                >
                  <Link href={`/menu/${item.id}`} className="group block h-full">
                    <div className="bg-white rounded-2xl overflow-hidden shadow-md hover:shadow-xl transition-all duration-300 hover:-translate-y-1 h-full flex flex-col">
                      {/* Image header */}
                      <div className="relative h-40 bg-gradient-to-br from-amber-400 via-orange-400 to-amber-500 overflow-hidden">
                        {item.image_url ? (
                          <img
                            src={item.image_url}
                            alt={item.name}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                            loading="lazy"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            {categoryFallbacks[item.category?.name || ""] || <UtensilsCrossed className="w-16 h-16 text-white/80" />}
                          </div>
                        )}
                        {/* Category label */}
                        <div className="absolute top-2 left-2 bg-black/40 backdrop-blur-sm text-white text-[10px] font-medium px-2 py-0.5 rounded-full">
                          {item.category?.name}
                        </div>
                        {item.is_vegetarian && (
                          <div className="absolute top-2 right-2 bg-green-500/80 backdrop-blur-sm rounded-full p-1">
                            <Leaf size={12} className="text-white" />
                          </div>
                        )}
                      </div>

                      {/* Content */}
                      <div className="p-4 flex flex-col flex-1">
                        <div className="flex gap-3 flex-1">
                          <div className="flex flex-col flex-1 min-w-0">
                            <h3 className="font-bold text-gray-800 group-hover:text-amber-700 transition-colors">
                              {item.name}
                            </h3>
                            <p className="text-sm text-gray-500 mt-0.5 line-clamp-2">
                              {item.description}
                            </p>
                          </div>
                          <span className="text-lg font-bold text-amber-700 shrink-0 self-center">
                            {formatPrice(item.price)}
                          </span>
                        </div>
                        <div className="mt-3 pt-3 border-t border-gray-100">
                          {(() => {
                            const cartItem = cartItems.find((ci) => ci.menuItem.id === item.id)
                            if (cartItem) {
                              return (
                                <div className="flex items-center justify-center gap-2">
                                  <Button
                                    size="sm"
                                    className="w-9 h-9 rounded-lg bg-gradient-to-r from-amber-500 to-orange-600 text-white shadow-md"
                                    onClick={(e) => {
                                      e.preventDefault(); e.stopPropagation()
                                      if (cartItem.quantity <= 1) {
                                        removeItem(cartItem.id)
                                        toast.success(`${item.name} removed!`, { position: "bottom-center" })
                                      } else {
                                        updateQuantity(cartItem.id, cartItem.quantity - 1)
                                      }
                                    }}
                                  >
                                    <Minus size={14} />
                                  </Button>
                                  <span className="w-8 text-center font-bold text-gray-800 text-sm">
                                    {cartItem.quantity}
                                  </span>
                                  <Button
                                    size="sm"
                                    className="w-9 h-9 rounded-lg bg-gradient-to-r from-amber-500 to-orange-600 text-white"
                                    onClick={(e) => {
                                      e.preventDefault(); e.stopPropagation()
                                      addItem(item)
                                    }}
                                  >
                                    <Plus size={14} />
                                  </Button>
                                </div>
                              )
                            }
                            return (
                              <Button
                                size="default"
                                className="w-full bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white shadow-md gap-2 rounded-lg"
                                onClick={(e) => handleAdd(e, item)}
                              >
                                <Plus size={16} /> Add to Cart
                              </Button>
                            )
                          })()}
                        </div>
                      </div>
                    </div>
                  </Link>
                </motion.div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}
