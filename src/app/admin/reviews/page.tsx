"use client"

import { useEffect, useState, useMemo } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Star, Trash2 } from "lucide-react"
import toast from "react-hot-toast"

interface ReviewItem {
  id: string
  user_name: string
  rating: number
  comment: string
  created_at: string
  is_approved: boolean
  menu_items: { name: string; categories: { name: string } } | null
}

interface Category {
  id: string
  name: string
}

export default function AdminReviewsPage() {
  const [reviews, setReviews] = useState<ReviewItem[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [activeCategory, setActiveCategory] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchReviews()
    fetchCategories()
  }, [])

  const fetchReviews = async () => {
    try {
      const res = await fetch("/api/reviews")
      if (!res.ok) { setLoading(false); return }
      const data = await res.json()
      setReviews(data || [])
    } catch {} finally {
      setLoading(false)
    }
  }

  const fetchCategories = async () => {
    try {
      const res = await fetch("/api/categories")
      if (!res.ok) return
      const data = await res.json()
      setCategories(data || [])
    } catch {}
  }

  const toggleApproval = async (review: ReviewItem) => {
    const newVal = !review.is_approved
    const res = await fetch(`/api/reviews?id=${review.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ is_approved: newVal }),
    })
    if (!res.ok) { toast.error("Failed to update"); return }
    toast.success(newVal ? "Review enabled" : "Review disabled")
    fetchReviews()
  }

  const deleteReview = async (id: string) => {
    try {
      const res = await fetch(`/api/reviews?id=${id}`, { method: "DELETE" })
      if (!res.ok) { toast.error("Failed to delete"); return }
      toast.success("Review removed")
    } catch {} finally {
      fetchReviews()
    }
  }

  const filteredReviews = useMemo(() =>
    activeCategory
      ? reviews.filter((r) => r.menu_items?.categories?.name === activeCategory)
      : reviews,
    [reviews, activeCategory]
  )

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-[#E5E7EB]">Reviews</h1>

      {/* Category filter */}
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => setActiveCategory(null)}
          className={`px-5 py-2 rounded-full text-base font-medium transition ${
            activeCategory === null
              ? "bg-[#F59E0B] text-black"
              : "bg-[#2A2B30] text-[#9CA3AF] hover:bg-[#3F3F46]"
          }`}
        >
          All ({reviews.length})
        </button>
        {categories.map((cat) => {
          const count = reviews.filter((r) => r.menu_items?.categories?.name === cat.name).length
          return (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.name)}
              className={`px-5 py-2 rounded-full text-base font-medium transition ${
                activeCategory === cat.name
                  ? "bg-[#F59E0B] text-black"
                  : "bg-[#2A2B30] text-[#9CA3AF] hover:bg-[#3F3F46]"
              }`}
            >
              {cat.name} ({count})
            </button>
          )
        })}
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="w-8 h-8 border-4 border-[#F59E0B] border-t-transparent rounded-full animate-spin" />
        </div>
      ) : filteredReviews.length === 0 ? (
        <p className="text-center text-[#6B7280] py-12">No reviews yet</p>
      ) : (
        <div className="space-y-3">
          {filteredReviews.map((review) => (
            <Card key={review.id}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between gap-4">
                  <div className="flex-1 min-w-0 space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-lg font-semibold text-[#E5E7EB]">{review.user_name}</span>
                      <div className="flex">
                        {Array.from({ length: 5 }, (_, i) => (
                          <Star key={i} size={18} className={i < review.rating ? "text-[#F59E0B] fill-[#F59E0B]" : "text-[#3F3F46]"} />
                        ))}
                      </div>
                      {!review.is_approved && (
                        <span className="text-xs bg-red-500/20 text-red-400 px-2 py-0.5 rounded-full font-semibold">Disabled</span>
                      )}
                    </div>
                    <div className="text-base text-[#6B7280]">
                      {new Date(review.created_at).toLocaleDateString("en-IN")}
                      {review.menu_items && (
                        <span className="ml-2">
                          on <span className="text-[#F59E0B] font-medium">{review.menu_items.name}</span>
                          <span className="text-[#6B7280]"> · </span>
                          <span className="text-[#9CA3AF]">{review.menu_items.categories?.name}</span>
                        </span>
                      )}
                    </div>
                    <p className="text-lg text-[#9CA3AF] leading-relaxed">{review.comment}</p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {/* Toggle switch */}
                    <button
                      type="button"
                      role="switch"
                      aria-checked={review.is_approved}
                      onClick={() => toggleApproval(review)}
                      className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
                        review.is_approved ? "bg-purple-500" : "bg-[#3F3F46]"
                      }`}
                    >
                      <span
                        className={`inline-block h-3.5 w-3.5 rounded-full bg-white transition-transform ${
                          review.is_approved ? "translate-x-[18px]" : "translate-x-[3px]"
                        }`}
                      />
                    </button>
                    <Button variant="destructive" size="sm" className="gap-1.5" onClick={() => deleteReview(review.id)}>
                      <Trash2 size={15} /> Remove
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
