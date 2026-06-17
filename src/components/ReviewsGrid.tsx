"use client"

import { useEffect, useState } from "react"
import { Star } from "lucide-react"
import { motion } from "framer-motion"

interface Review {
  id: string
  user_name: string
  rating: number
  comment: string
  created_at: string
}

export default function ReviewsGrid() {
  const [reviews, setReviews] = useState<Review[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/reviews?approved=true")
        const data = await res.json()
        if (Array.isArray(data)) setReviews(data.slice(0, 6))
      } catch {} finally {
        setLoading(false)
      }
    })()
  }, [])

  if (loading || reviews.length === 0) return null

  return (
    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
      {reviews.map((review, i) => (
        <motion.div
          key={review.id}
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.4, delay: i * 0.08 }}
          className="bg-white rounded-2xl p-6 shadow-md border border-amber-100"
        >
          <div className="flex items-center gap-1 mb-3">
            {Array.from({ length: 5 }, (_, s) => (
              <Star
                key={s}
                size={16}
                className={s < review.rating ? "text-amber-500 fill-amber-500" : "text-gray-200"}
              />
            ))}
          </div>
          <p className="text-gray-600 text-sm leading-relaxed mb-4">
            &ldquo;{review.comment}&rdquo;
          </p>
          <p className="font-semibold text-gray-800 text-sm">{review.user_name}</p>
        </motion.div>
      ))}
    </div>
  )
}
