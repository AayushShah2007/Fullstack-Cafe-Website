# 🍽️ Eat O'Clock — Full-Stack Cafe Management System

A complete restaurant management system built with **Next.js 16**, **Supabase**, and **TypeScript**. Customers can browse a categorized menu, place orders, make reservations, and pay online. The admin panel provides real-time order management, financial analytics, and full CRUD operations.

📍 **Location:** Shop 2A, Mani Bhavan, Opp. Ganjaawala Garden, Borivali West, Mumbai  
🕐 **Hours:** 4:30 PM – 11:00 PM (Daily)  
💰 **Cost for Two:** ~₹350

---

## ✨ Features

### 👤 User Side
- **Animated Splash Screen** — Full-screen video intro with 12s auto-skip
- **3D Interactive Hero** — Floating 3D food objects (donut, cup, pizza) with glass morphism effect
- **Video Carousel** — Rotating food prep videos with scroll-based parallax
- **Menu Browsing** — Category filter pills, animated search, responsive grid
- **Product Details** — Images, price, veg/non-veg badge, spice level, calories, prep time, ingredients, bestseller tag, reviews
- **Shopping Cart** — Quantity controls, coupon codes, "You Might Also Like" suggestions
- **Order Types** — Takeaway, Dine-in, Delivery
- **Payments** — UPI (QR code + screenshot upload), Card (Razorpay), Cash on Delivery
- **Live Order Tracking** — 3-stage timeline (Making → Packing → Collect/Dispatched/Serving), polls every 5s
- **Printable Invoices** — Store-branded invoice from order page
- **Table Reservations** — Date picker, time slots (Lunch/Dinner), guest count, email confirmation via SMTP
- **User Auth** — Email OTP verification + Google OAuth, 3-step registration
- **Reviews** — Star ratings with admin approval before public display
- **Auto-Login Prompt** — Non-intrusive modal that appears after 15s
- **Dark Theme** — Warm amber/orange/brown color palette

### 🔧 Admin Panel
- **Dashboard** — KPI cards (Orders, Revenue, Avg Order Value, Total Users), time range filters, revenue chart, payment method donut chart, top 5 items, order type distribution, peak hours chart (polls every 30s)
- **Order Management** — Real-time new orders via WebSocket, accept/reject, timeline stage advancement, audio bell notifications, pending/active tabs with badge counts
- **Order History** — Search by name/phone/order ID, filter by date & status, pagination
- **Menu CRUD** — Full category & item management, image upload, search, availability/veg/bestseller toggles, nutrition fields
- **User Management** — User list with addresses, order count, total spent, hover-to-reveal order history
- **Reservations** — Today/Upcoming/Pending/Confirmed/All tabs, status actions, time slot editor (Lunch/Dinner groups), WebSocket notifications
- **Discount Coupons** — CRUD, copy-to-clipboard, usage tracking, per-user limits, expiry, active toggle
- **Review Moderation** — Approve/disable/delete reviews, category filtering
- **Financial Analysis** — KPIs with WoW comparison, revenue trends, discount impact, payment split, order value distribution, top 10 items, peak days, hourly heatmap
- **Settings** — Store info, operating hours, social links (Instagram/Facebook/WhatsApp)

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| **Framework** | Next.js 16 (App Router) |
| **Language** | TypeScript 5 |
| **UI** | React 19, Tailwind CSS 4, shadcn/ui, Framer Motion 12 |
| **3D** | Three.js, @react-three/fiber, @react-three/drei |
| **Database** | Supabase (PostgreSQL) with Row Level Security |
| **Auth** | Supabase Auth (Email/Password + Google OAuth) |
| **State** | Zustand 5 (with sessionStorage persist) |
| **Data Fetching** | TanStack React Query 5 |
| **Payments** | Razorpay (Card/UPI) + Manual UPI with screenshot |
| **Email** | Nodemailer (SMTP) + Resend |
| **Charts** | Recharts |
| **Notifications** | react-hot-toast |
| **Icons** | Lucide React |

---

## 📋 Prerequisites

- **Node.js** ≥ 18
- **npm** or **yarn**
- **Supabase account** (free tier works)
- **Razorpay account** (for card payments, optional for UPI-only)
- **Google OAuth credentials** (for Google login, optional)
- **SMTP email credentials** (for OTP & reservation emails, optional)

---

## UserSide Flow 

Homepage (splash → hero → features → reviews)
  │
  ├── Menu → Browse categories → Product detail → Add to cart
  │
  ├── Cart → Apply coupon → Proceed to checkout
  │
  ├── Checkout → Select order type → Payment method → Place order
  │
  ├── Orders → Live status tracking → Invoice print
  │
  ├── Reserve → Pick date & time slot → Confirm reservation
  │
  └── Auth (Login / Register with OTP or Google)


## 🚀 Setup Instructions

### 1. Clone & Install
```bash
git clone https://github.com/AayushShah2007/Fullstack-Cafe-Website.git
cd Fullstack-Cafe-Website
npm install
