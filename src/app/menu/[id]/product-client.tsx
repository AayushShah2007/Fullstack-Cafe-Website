"use client"

import { useState, useRef, useEffect } from "react"
import type { MenuItem, Category, Review } from "@/types"
import { useCartStore } from "@/store/cart"
import { useAuthStore } from "@/store/auth"
import { supabase } from "@/lib/supabase"
import { formatPrice } from "@/utils/helpers"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import {
  ArrowLeft, Plus, Leaf, Check, ShoppingBag, Flame, Clock, Star, ChefHat, ChevronRight, ChevronLeft, MessageSquare, Send, Minus,
  Beef, Pizza, CupSoda, Wheat, Sandwich, Coffee, UtensilsCrossed
} from "lucide-react"
import toast from "react-hot-toast"
import Link from "next/link"
import { useRouter } from "next/navigation"

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

const spiceLabels: Record<string, { label: string; color: string }> = {
  mild: { label: "Mild", color: "text-green-600 bg-green-50" },
  medium: { label: "Medium", color: "text-orange-600 bg-orange-50" },
  spicy: { label: "Spicy", color: "text-red-600 bg-red-50" },
}

function Stars({ rating = 0, size = 16 }: { rating?: number; size?: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          size={size}
          className={star <= rating ? "fill-amber-400 text-amber-400" : "text-gray-300"}
        />
      ))}
    </div>
  )
}

export default function ProductDetailClient({
  item,
  reviews: initialReviews,
  suggested,
}: {
  item: MenuItem & { category: Category }
  reviews: Review[]
  suggested: (MenuItem & { category: Category })[]
}) {
  const router = useRouter()
  const [added, setAdded] = useState(false)
  const addItem = useCartStore((s) => s.addItem)
  const cartItems = useCartStore((s) => s.items)
  const updateQuantity = useCartStore((s) => s.updateQuantity)
  const removeItem = useCartStore((s) => s.removeItem)
  const { user } = useAuthStore()
  const scrollRef = useRef<HTMLDivElement>(null)
  const [reviews, setReviews] = useState(initialReviews)
  const [showAllReviews, setShowAllReviews] = useState(false)
  const [showReviewForm, setShowReviewForm] = useState(false)
  const [reviewForm, setReviewForm] = useState({ rating: 5, comment: "" })
  const [submitting, setSubmitting] = useState(false)

  const handleAdd = () => {
    addItem(item)
    setAdded(true)
    toast.success(`${item.name} added to cart!`, { icon: "🛒" })
    setTimeout(() => setAdded(false), 2000)
  }

  const handleSubmitReview = async () => {
    if (!reviewForm.comment.trim()) {
      toast.error("Please write a comment")
      return
    }
    if (!user) {
      toast.error("Please login to review")
      return
    }
    setSubmitting(true)
    try {
      const res = await fetch("/api/reviews/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_id: user.id,
          user_name: user.name,
          rating: reviewForm.rating,
          comment: reviewForm.comment,
          menu_item_id: item.id,
        }),
      })
      const data = await res.json()
      if (!res.ok) {
        toast.error(data.error || "Failed to submit review")
        setSubmitting(false)
        return
      }
    } catch (err) {
      toast.error("Network error — check your connection")
      setSubmitting(false)
      return
    }
    setSubmitting(false)
    toast.success("Review submitted!")
    setShowReviewForm(false)
    setReviewForm({ rating: 5, comment: "" })
    setReviews((prev) => [
      {
        id: "temp",
        user_name: user.name,
        rating: reviewForm.rating,
        comment: reviewForm.comment,
        is_approved: true,
        created_at: new Date().toISOString(),
        menu_item_id: item.id,
      },
      ...prev,
    ])
  }

  const displayReviews = showAllReviews ? reviews : reviews.slice(0, 4)
  const spice = item.spice_level ? spiceLabels[item.spice_level] : null
  const avgRating = reviews.length > 0
    ? Math.round((reviews.reduce((s, r) => s + r.rating, 0) / reviews.length) * 10) / 10
    : 0

  const scroll = (dir: "left" | "right") => {
    if (!scrollRef.current) return
    scrollRef.current.scrollBy({ left: dir === "left" ? -320 : 320, behavior: "smooth" })
  }

  const stepRef = useRef(0)

  useEffect(() => {
    if (suggested.length < 2) return
    const step = 196
    const interval = setInterval(() => {
      const container = scrollRef.current
      if (!container) return
      stepRef.current += 1
      const maxScroll = container.scrollWidth - container.clientWidth
      const next = stepRef.current * step
      if (next >= maxScroll) {
        stepRef.current = 0
        container.scrollTo({ left: 0, behavior: "smooth" })
      } else {
        container.scrollBy({ left: step, behavior: "smooth" })
      }
    }, 3000)
    return () => clearInterval(interval)
  }, [suggested.length])

  return (
    <div className="min-h-[calc(100vh-64px)] mt-16 md:mt-20 bg-gradient-to-b from-orange-50 via-amber-50 to-rose-50">
      <div className="max-w-5xl mx-auto px-4 py-6">
        {/* Back */}
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 text-gray-500 hover:text-amber-700 transition mb-4 text-sm"
        >
          <ArrowLeft size={16} />
          Back to Menu
        </button>

        {/* Main section - smaller image + compact info */}
        <div className="bg-white rounded-2xl overflow-hidden shadow-md">
           <div className="md:flex md:items-stretch">
             {/* Left: Image - smaller */}
             <div className="md:w-[280px] md:min-w-[280px] h-56 md:h-auto md:self-stretch bg-gradient-to-br from-amber-400 via-orange-400 to-amber-500 relative">
              {item.image_url ? (
                <img
                  src={item.image_url}
                  alt={item.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  {categoryFallbacks[item.category?.name || ""] || <UtensilsCrossed className="w-16 h-16 text-white/80" />}
                </div>
              )}
              <div className="absolute top-2 left-2 flex flex-wrap gap-1.5">
                <span className="bg-black/50 backdrop-blur-sm text-white text-[10px] font-medium px-2 py-0.5 rounded-full">
                  {item.category?.name}
                </span>
                {item.is_bestseller && (
                  <span className="bg-amber-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                    <Flame size={10} /> Bestseller
                  </span>
                )}
              </div>
              <div className="absolute top-2 right-2">
                {item.is_vegetarian && (
                  <div className="bg-green-500/80 backdrop-blur-sm rounded-full p-1 shadow">
                    <Leaf size={12} className="text-white" />
                  </div>
                )}
              </div>
            </div>

            {/* Right: Details - compact */}
            <div className="flex-1 p-5 md:p-6 flex flex-col gap-3">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h1 className="text-xl md:text-2xl font-bold text-gray-800">
                    <span className="mr-2">{categoryIcons[item.category?.name || ""] || <UtensilsCrossed className="w-4 h-4" />}</span>
                    {item.name}
                  </h1>
                </div>
                {spice && (
                  <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full shrink-0 ${spice.color}`}>
                    <Flame size={10} className="inline mr-0.5" />
                    {spice.label}
                  </span>
                )}
              </div>

              <div className="flex items-center gap-2">
                <Stars rating={avgRating || 4} size={14} />
                <span className="text-xs text-gray-400">
                  {reviews.length > 0 ? `(${avgRating})` : "(4.0)"}
                  {reviews.length > 0 && ` · ${reviews.length} reviews`}
                </span>
              </div>

              <p className="text-sm text-gray-500 leading-relaxed">{item.description}</p>

              <div className="flex items-center gap-4">
                <span className="text-2xl font-bold text-amber-700">{formatPrice(item.price)}</span>
                {!item.is_available && (
                  <span className="text-xs text-red-500 font-medium">Unavailable</span>
                )}
              </div>

              <div className="flex items-center gap-5 flex-wrap mt-1">
                <div className="flex items-center gap-1 text-xs text-gray-500">
                  {categoryIcons[item.category?.name || ""] || <UtensilsCrossed className="w-4 h-4" />}
                  <span className="font-medium text-gray-700">{item.category?.name}</span>
                </div>
                {item.calories && (
                  <div className="flex items-center gap-1 text-xs text-gray-500">
                    <Flame size={14} className="text-orange-500" />
                    <span className="font-medium text-gray-700">{item.calories} kcal</span>
                  </div>
                )}
                {item.prep_time && (
                  <div className="flex items-center gap-1 text-xs text-gray-500">
                    <Clock size={14} className="text-blue-500" />
                    <span className="font-medium text-gray-700">{item.prep_time} min</span>
                  </div>
                )}
              </div>

              {item.ingredients && (
                <div className="flex items-start gap-1.5 pt-1 border-t border-gray-100">
                  <ChefHat size={14} className="text-amber-600 mt-0.5 shrink-0" />
                  <div>
                    <p className="text-[10px] text-gray-400 uppercase tracking-wide mb-0.5">Ingredients</p>
                    <p className="text-xs text-gray-600 leading-relaxed">{item.ingredients}</p>
                  </div>
                </div>
              )}

              <div className="mt-auto pt-3">
                {(() => {
                  const cartItem = cartItems.find((ci) => ci.menuItem.id === item.id)
                  if (cartItem) {
                    return (
                      <div className="flex items-center gap-4 justify-center">
                        <Button
                          size="sm"
                          className="w-14 h-14 rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 text-white shadow-md text-xl"
                          onClick={() => {
                            if (cartItem.quantity <= 1) {
                              removeItem(cartItem.id)
                              toast.success(`${item.name} removed!`, { icon: "🗑️" })
                            } else {
                              updateQuantity(cartItem.id, cartItem.quantity - 1)
                            }
                          }}
                        >
                          <Minus size={22} />
                        </Button>
                        <span className="w-14 text-center font-bold text-3xl text-gray-800">
                          {cartItem.quantity}
                        </span>
                        <Button
                          size="sm"
                          className="w-14 h-14 rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 text-white shadow-md text-xl"
                          onClick={() => {
                            addItem(item)
                            toast.success(`${item.name} added!`, { icon: "🛒" })
                          }}
                        >
                          <Plus size={22} />
                        </Button>
                      </div>
                    )
                  }
                  return (
                    <>
                      <Button
                        disabled={!item.is_available}
                        className={`w-full rounded-full text-sm gap-1.5 h-9 ${
                          added
                            ? "bg-green-600 hover:bg-green-700"
                            : "bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700"
                        } text-white shadow-md shadow-amber-300/30`}
                        onClick={handleAdd}
                      >
                        {added ? (
                          <><Check size={14} /> Added to Cart</>
                        ) : (
                          <><Plus size={14} /> Add to Cart</>
                        )}
                      </Button>
                      {added && (
                        <Link href="/cart">
                          <Button
                            variant="outline"
                            size="sm"
                            className="w-full rounded-full mt-1.5 text-xs gap-1 border-amber-300 text-amber-700 hover:bg-amber-50 h-8"
                          >
                            <ShoppingBag size={12} /> View Cart
                          </Button>
                        </Link>
                      )}
                    </>
                  )
                })()}
              </div>
            </div>
          </div>
        </div>

        {/* ===== REVIEWS SECTION ===== */}
        <div className="mt-8 bg-gray-50/80 rounded-2xl p-5 md:p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <MessageSquare size={18} className="text-amber-700" />
              <h2 className="text-lg font-bold text-gray-800">Reviews</h2>
              <span className="text-xs text-gray-400 bg-white px-2 py-0.5 rounded-full">{reviews.length}</span>
            </div>
            {user && (
              <Button
                size="sm"
                variant="outline"
                className="text-xs gap-1 border-amber-300 text-white bg-amber-600 hover:bg-amber-700"
                onClick={() => setShowReviewForm(!showReviewForm)}
              >
                <Plus size={12} /> Add Review
              </Button>
            )}
          </div>

          {/* Add Review Form */}
          {showReviewForm && (
            <div className="bg-white rounded-xl p-4 shadow-sm border mb-4">
              <div className="flex items-center gap-2 mb-3">
                <span className="text-xs text-gray-500">Your Rating:</span>
                <div className="flex gap-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button key={star} type="button" onClick={() => setReviewForm({ ...reviewForm, rating: star })} className="cursor-pointer">
                      <Star
                        size={22}
                        className={star <= reviewForm.rating ? "fill-amber-400 text-amber-400" : "text-gray-300 hover:text-amber-300 transition"}
                      />
                    </button>
                  ))}
                </div>
              </div>
              <Textarea
                placeholder="Share your experience..."
                value={reviewForm.comment}
                onChange={(e) => setReviewForm({ ...reviewForm, comment: e.target.value })}
                className="min-h-[80px] text-sm mb-3 bg-gray-50 text-gray-800 placeholder:text-gray-400"
              />
              <div className="flex gap-2">
                <Button
                  size="sm"
                  className="bg-amber-600 hover:bg-amber-700 text-xs gap-1 text-white"
                  disabled={submitting}
                  onClick={handleSubmitReview}
                >
                  <Send size={12} /> {submitting ? "Submitting..." : "Submit"}
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  className="text-xs text-gray-600 hover:text-gray-800"
                  onClick={() => setShowReviewForm(false)}
                >
                  Cancel
                </Button>
              </div>
            </div>
          )}

          {/* Reviews List */}
          {displayReviews.length === 0 ? (
            <p className="text-center text-gray-400 py-8 text-sm">No reviews yet. Be the first to review!</p>
          ) : (
            <div className="space-y-3">
              {displayReviews.map((review) => (
                <div key={review.id} className="bg-white rounded-xl p-4 shadow-sm border">
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-medium text-gray-500">
                        {new Date(review.created_at).toLocaleDateString("en-IN", {
                          day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit"
                        })}
                      </span>
                      <span className="text-gray-300">|</span>
                      <span className="font-semibold text-sm text-gray-800">{review.user_name}</span>
                    </div>
                    <Stars rating={review.rating} size={14} />
                  </div>
                  <p className="text-sm text-gray-600 leading-relaxed">{review.comment}</p>
                </div>
              ))}
            </div>
          )}

          {/* See More / Show Less */}
          {reviews.length > 4 && (
            <button
              onClick={() => setShowAllReviews(!showAllReviews)}
              className="flex items-center gap-1 text-sm text-amber-700 hover:text-amber-800 font-medium mx-auto mt-3"
            >
              {showAllReviews ? "Show Less" : `See All ${reviews.length} Reviews`}
              <ChevronRight size={14} />
            </button>
          )}
        </div>

        {/* ===== SUGGESTED PRODUCTS ===== */}
        {suggested.length > 0 && (
          <div className="mt-8 bg-white rounded-2xl p-5 md:p-6 shadow-sm border">
            <h2 className="text-lg font-bold text-gray-800 mb-4">Suggested Products</h2>
            <div className="relative">
              <button
                onClick={() => scroll("left")}
                className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-2 z-10 bg-white/80 backdrop-blur-sm rounded-full p-1.5 shadow-md hover:bg-white transition hidden md:block"
              >
                <ChevronLeft size={18} className="text-gray-600" />
              </button>
              <div
                ref={scrollRef}
                className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide snap-x snap-mandatory"
                style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
              >
                {suggested.map((s) => (
                  <Link
                    key={s.id}
                    href={`/menu/${s.id}`}
                    className="snap-start shrink-0 w-[180px] bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-md transition group"
                  >
                    <div className="h-28 bg-gradient-to-br from-amber-400 via-orange-400 to-amber-500 relative">
                      {s.image_url ? (
                        <img src={s.image_url} alt={s.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          {categoryFallbacks[s.category?.name || ""] || <UtensilsCrossed className="w-16 h-16 text-white/80" />}
                        </div>
                      )}
                      {s.is_vegetarian && (
                        <div className="absolute top-1.5 right-1.5 bg-green-500/80 backdrop-blur-sm rounded-full p-0.5">
                          <Leaf size={10} className="text-white" />
                        </div>
                      )}
                    </div>
                    <div className="p-2.5">
                      <h3 className="font-bold text-gray-800 text-sm truncate">{s.name}</h3>
                      <div className="flex items-center justify-between mt-1">
                        <span className="text-amber-700 font-bold text-sm">{formatPrice(s.price)}</span>
                        <span className="text-[10px] text-gray-400">{s.category?.name}</span>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
              <button
                onClick={() => scroll("right")}
                className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-2 z-10 bg-white/80 backdrop-blur-sm rounded-full p-1.5 shadow-md hover:bg-white transition hidden md:block"
              >
                <ChevronRight size={18} className="text-gray-600" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
