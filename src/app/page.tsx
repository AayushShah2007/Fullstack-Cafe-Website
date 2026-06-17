"use client"

import { useState, useEffect } from "react"
import SplashScreen from "@/components/SplashScreen"
import HeroVideo from "@/components/HeroVideo"
import LoginModal from "@/components/auth/LoginModal"
import { useAuthStore } from "@/store/auth"
import Link from "next/link"
import FooterContact from "@/components/layout/FooterContact"
import FooterBrand from "@/components/layout/FooterBrand"
import {
  ArrowRight,
  Star,
  Clock,
  MapPin,
  Sparkles,
  Utensils,
  Heart,
} from "lucide-react"
import { motion } from "framer-motion"
import CtaVideo from "@/components/CtaVideo"
import ReviewsGrid from "@/components/ReviewsGrid"

const fadeUp = {
  hidden: { opacity: 0, y: 40 },
  visible: (i = 0) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, delay: i * 0.12, ease: [0.25, 0.1, 0.25, 1] as const },
  }),
}

const stagger = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.1 },
  },
}

export default function Home() {
  const { user, isLoading } = useAuthStore()
  const [splashSeen, setSplashSeen] = useState<string | null>(null)
  const [showLoginModal, setShowLoginModal] = useState(false)

  useEffect(() => {
    try {
      const seen = sessionStorage.getItem("splashShown")
      if (seen) setSplashSeen("true")
    } catch {}
  }, [])

  const handleSplashFinish = () => {
    try { sessionStorage.setItem("splashShown", "true") } catch {}
    setSplashSeen("true")
  }

  useEffect(() => {
    if (splashSeen === "true" && !isLoading && !user && !useAuthStore.getState().autoLoginDismissed) {
      const timer = setTimeout(() => setShowLoginModal(true), 15000)
      return () => clearTimeout(timer)
    }
  }, [splashSeen, isLoading, user])

  return (
    <>
      {splashSeen === null && <SplashScreen onFinish={handleSplashFinish} />}

      <LoginModal
        open={showLoginModal}
        onClose={() => { setShowLoginModal(false); useAuthStore.getState().dismissAutoLogin() }}
      />

      {/* ===== HERO SECTION ===== */}
      <HeroVideo />

      {/* ===== FEATURES SECTION ===== */}
      <section className="py-24 px-4 relative overflow-hidden bg-white">
        <div className="absolute inset-0 bg-mesh opacity-30" />
        <div className="max-w-6xl mx-auto relative">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            className="text-center mb-16"
          >
            <span className="text-amber-700 font-semibold text-sm tracking-[0.2em] uppercase">
              Why Choose Us
            </span>
            <h2 className="text-3xl md:text-5xl font-bold mt-3 text-gray-900">
              Crafted with{" "}
              <span className="text-amber-700">Passion</span>
            </h2>
            <p className="text-gray-600 mt-3 max-w-xl mx-auto text-base">
              Every dish is made fresh to order with the finest ingredients
            </p>
          </motion.div>

          <motion.div
            variants={stagger}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-50px" }}
            className="grid md:grid-cols-3 gap-6"
          >
            {[
              {
                icon: Utensils,
                title: "Freshly Made",
                desc: "Every order is prepared fresh — never pre-cooked or frozen",
                bg: "bg-amber-50",
                border: "border-amber-200",
                iconBg: "bg-amber-100",
                iconColor: "text-amber-700",
              },
              {
                icon: Star,
                title: "Great Taste",
                desc: "4.2 rating on Zomato with rave reviews from our customers",
                bg: "bg-orange-50",
                border: "border-orange-200",
                iconBg: "bg-orange-100",
                iconColor: "text-orange-700",
              },
              {
                icon: Heart,
                title: "Made with Love",
                desc: "Family recipes passed down, crafted with care and quality ingredients",
                bg: "bg-rose-50",
                border: "border-rose-200",
                iconBg: "bg-rose-100",
                iconColor: "text-rose-700",
              },
            ].map((feature, i) => (
              <motion.div
                key={feature.title}
                variants={fadeUp}
                custom={i}
                className={`group relative ${feature.bg} rounded-3xl p-8 border ${feature.border} hover:shadow-xl hover:shadow-amber-900/10 transition-all duration-500`}
              >
                <div
                  className={`w-14 h-14 ${feature.iconBg} rounded-2xl flex items-center justify-center mb-5 group-hover:scale-110 group-hover:rotate-3 transition-all duration-300`}
                >
                  <feature.icon className={`w-7 h-7 ${feature.iconColor}`} />
                </div>
                <h3 className="relative text-xl font-bold text-gray-800 mb-2 group-hover:text-amber-800 transition-colors">
                  {feature.title}
                </h3>
                <p className="relative text-gray-500 leading-relaxed group-hover:text-gray-600 transition-colors">
                  {feature.desc}
                </p>
                <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-0 h-0.5 bg-gradient-to-r from-amber-400 to-orange-500 group-hover:w-3/4 transition-all duration-500 rounded-full" />
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ===== LOCATION / INFO STRIP ===== */}
      <section className="py-20 px-4 relative overflow-hidden bg-gradient-to-r from-amber-700 via-amber-600 to-orange-700">
        <div className="max-w-5xl mx-auto">
          <div className="grid md:grid-cols-3 gap-8 text-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
              className="flex flex-col items-center gap-3 p-6"
            >
              <div className="w-14 h-14 bg-white/15 backdrop-blur-sm rounded-2xl flex items-center justify-center">
                <Clock className="w-7 h-7 text-white" />
              </div>
              <h4 className="font-semibold text-white text-lg">Open Daily</h4>
              <p className="text-amber-100">4:30 PM - 11:00 PM</p>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="flex flex-col items-center gap-3 p-6"
            >
              <div className="w-14 h-14 bg-white/15 backdrop-blur-sm rounded-2xl flex items-center justify-center">
                <MapPin className="w-7 h-7 text-white" />
              </div>
              <h4 className="font-semibold text-white text-lg">Visit Us</h4>
              <p className="text-amber-100 text-sm max-w-[200px]">
                Shop 2A, Mani Bhavan, Opp. Ganjaawala Garden
              </p>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="flex flex-col items-center gap-3 p-6"
            >
              <div className="w-14 h-14 bg-white/15 backdrop-blur-sm rounded-2xl flex items-center justify-center">
                <Star className="w-7 h-7 text-white" />
              </div>
              <h4 className="font-semibold text-white text-lg">Cost for Two</h4>
              <p className="text-amber-100">₹350 — Great value!</p>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ===== REVIEWS SECTION ===== */}
      <section id="reviews" className="py-20 px-4 relative bg-[#FDF8F3]">
        <div className="max-w-5xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <span className="inline-flex items-center gap-2 bg-amber-100 text-amber-800 px-4 py-1.5 rounded-full text-sm font-medium mb-4">
              <Star size={14} />
              What Our Customers Say
            </span>
            <h2 className="text-3xl md:text-4xl font-bold text-gray-800">
              Loved by{" "}
              <span className="text-amber-700">Borivali</span>
            </h2>
          </motion.div>

          <ReviewsGrid />
        </div>
      </section>

      {/* ===== CTA SECTION ===== */}
      <section className="py-28 px-4 relative overflow-hidden">
        <CtaVideo />
        <div className="max-w-3xl mx-auto text-center relative">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
          >
            <span className="inline-flex items-center gap-2 bg-white/90 text-amber-700 px-4 py-1.5 rounded-full text-sm font-medium border border-amber-200 shadow-sm mb-6">
              <Sparkles size={14} />
              From our kitchen to your door
            </span>
            <h2 className="text-3xl md:text-5xl font-bold mb-4 text-black drop-shadow-sm">
              Ready to{" "}
              <span className="text-amber-700">Order?</span>
            </h2>
            <p className="text-gray-900 text-lg mb-8 max-w-xl mx-auto font-semibold drop-shadow-sm">
              Browse our full menu, customize your order, and pay online —
              your food will be ready in no time
            </p>
            <Link
              href="/menu"
              className="group inline-flex items-center gap-2 bg-gradient-to-r from-amber-600 to-orange-700 hover:from-amber-500 hover:to-orange-600 text-white px-10 py-4 rounded-full text-lg font-semibold shadow-xl shadow-amber-700/30 transition-all hover:shadow-2xl hover:scale-105"
            >
              Order Now
              <ArrowRight
                size={20}
                className="group-hover:translate-x-1 transition"
              />
            </Link>
          </motion.div>
        </div>
      </section>

      {/* ===== FOOTER ===== */}
      <footer className="bg-gray-900 text-gray-400 py-12 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="grid md:grid-cols-3 gap-8 mb-8">
            <FooterBrand />
            <div>
              <h4 className="font-semibold text-gray-200 mb-3">Quick Links</h4>
              <div className="flex flex-col gap-2 text-sm">
                <Link href="/menu" className="hover:text-amber-400 transition text-gray-400">
                  Menu
                </Link>
                <Link href="/reserve" className="hover:text-amber-400 transition text-gray-400">
                  Reserve a Table
                </Link>
                <Link href="/orders" className="hover:text-amber-400 transition text-gray-400">
                  My Orders
                </Link>
              </div>
            </div>
            <FooterContact />
          </div>
          <hr className="border-gray-800 mb-6" />
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4 text-sm text-gray-500">
            <p>© 2026 Eat O&apos;Clock. All rights reserved.</p>
            <span>Built with ❤️ for Borivali</span>
          </div>
        </div>
      </footer>
    </>
  )
}
