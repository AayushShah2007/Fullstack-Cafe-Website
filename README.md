<picture>
  <source media="(prefers-color-scheme: dark)" srcset="/eat-o-clock-logo.png">
  <img alt="Eat O'Clock Logo" src="/Eat-o Clock.png" width="400">
</picture>

# 🍽️ Eat O'Clock — Full-Stack Cafe Management System

A complete restaurant management solution built with **Next.js 16**, **Supabase**, and **TypeScript**. Customers can browse a categorized menu with **3D interactive elements**, place orders (Takeaway / Dine-in / Delivery), pay via **UPI / Card / Cash**, track orders in real-time, reserve tables, and leave reviews.

The **admin panel** provides live order management with **WebSocket notifications**, financial analytics, User Management, Order History, Reservation Management,and full CRUD operations,.

---

## ✨ Features

### 👤 Customer Side

| Feature | Details |
|---|---|
| **Splash Screen** | Full-screen video intro with auto-skip after 12s |
| **3D Interactive Hero** | Floating 3D food objects (donut, cup, pizza) with MeshTransmissionMaterial |
| **Video Carousel** | Rotating food preparation clips with scroll-based parallax |
| **Menu Browsing** | Category filter pills, animated search with rotating placeholders, responsive grid |
| **Product Details** | Images, price, veg/non-veg badge, spice level, calories, prep time, ingredients, bestseller tag, reviews |
| **Shopping Cart** | Quantity controls, coupon codes with discount tracking, "You Might Also Like" suggestions |
| **Multiple Order Types** | Takeaway, Dine-in, Delivery |
| **Payment Methods** | UPI (QR code + screenshot upload), Card (Razorpay), Cash on Delivery |
| **Live Order Tracking** | 3-stage timeline — different stages per order type (Making → Packing → Collect / Dispatched / Serving) |
| **Printable Invoices** | Store-branded invoice with itemized bill |
| **Table Reservations** | Date picker, time slot selection (Lunch / Dinner), guest count, email confirmation via SMTP |
| **User Authentication** | Email OTP verification + Google OAuth, 3-step registration (Personal → Address → OTP) |
| **Customer Reviews** | Star ratings with admin approval before public display |
| **Auto-Login Prompt** | Non-intrusive modal that auto-appears after 15s |
| **Responsive Design** | Full mobile / tablet / desktop adaptation with hamburger menu |

### 🔧 Admin Panel

| Feature | Details |
|---|---|
| **Dashboard** | KPI cards (Orders, Revenue, Avg Order Value, Total Users), time range filters, revenue chart, payment method donut chart, top 5 items, order type distribution, peak hours chart (polls every 30s) |
| **Order Management** | Real-time new orders via **Supabase WebSocket**, accept / reject actions, timeline stage advancement, **audio bell notifications** on new orders |
| **Order History** | Search by name / phone / order ID, filter by date & status, pagination |
| **Menu CRUD** | Full category & item management with image upload, search, availability / veg / bestseller toggles, nutrition fields |
| **User Management** | User list with addresses, order count, total spent, hover-to-reveal order history popover |
| **Reservations** | Today / Upcoming / Pending / Confirmed / All tabs, status actions, time slot editor (Lunch / Dinner groups), WebSocket notifications |
| **Discount Coupons** | CRUD, copy-to-clipboard, usage tracking, per-user limits, expiry dates, active / disabled toggle |
| **Review Moderation** | Approve / disable / delete reviews, category filtering |
| **Financial Analysis** | KPIs with week-over-week comparison, revenue trends, discount impact, payment split, order value distribution, top 10 items, peak days, hourly heatmap |
| **Store Settings** | Store info, operating hours, social links (Instagram / Facebook / WhatsApp) |

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| **Framework** | Next.js 16 (App Router) |
| **Language** | TypeScript 5 |
| **UI Library** | React 19, Tailwind CSS 4, shadcn/ui |
| **3D Graphics** | Three.js, @react-three/fiber, @react-three/drei |
| **Animations** | Framer Motion 12, tw-animate-css |
| **Database** | Supabase (PostgreSQL with Row Level Security) |
| **Authentication** | Supabase Auth (Email / Password + Google OAuth) |
| **State Management** | Zustand 5 (sessionStorage persistence) |
| **Data Fetching** | TanStack React Query 5 |
| **Payments** | Razorpay (Card / UPI) + Manual UPI with screenshot upload |
| **Email** | Nodemailer (SMTP) + Resend |
| **Charts** | Recharts |
| **Notifications** | react-hot-toast |
| **Icons** | Lucide React |
| **Fonts** | Geist, Geist Mono, Playfair Display |

---

## 📋 Prerequisites

- **Node.js** ≥ 18
- **npm** or **yarn**
- **Supabase account** (free tier works)
- **Razorpay account** (for card payments, optional for UPI-only)
- **Google OAuth credentials** (for Google login, optional)
- **SMTP email credentials** (for OTP & reservation emails, optional)

---

## 🚀 Local Setup

### 1. Clone & Install

```bash
git clone https://github.com/AayushShah2007/Fullstack-Cafe-Website.git
cd Fullstack-Cafe-Website
npm install
```

### 2. Set Up Supabase

1. Create a new project at [supabase.com](https://supabase.com)
2. Go to **SQL Editor** → run `supabase/schema.sql`
3. Run each migration file in `supabase/migrations/` in order
4. Enable **Google OAuth** under Authentication → Providers (optional)
5. Go to **Project Settings → API** — copy your **Project URL** and **anon public key**
6. Also copy your **service_role key** (keep it secret)

### 3. Configure Environment

Create a `.env.local` file in the project root:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
NEXT_PUBLIC_RAZORPAY_KEY_ID=your_razorpay_key_id
RAZORPAY_KEY_SECRET=your_razorpay_key_secret
SMTP_HOST=your_smtp_host
SMTP_PORT=587
SMTP_USER=your_smtp_user
SMTP_PASS=your_smtp_password
```

### 4. Create an Admin User

1. Start the app: `npm run dev`
2. Register a user at `/auth/register`
3. In Supabase **SQL Editor**, run:
   ```sql
   UPDATE users SET role = 'admin' WHERE email = 'your-email@example.com';
   ```
4. Visit `/admin/dashboard` to access the admin panel

### 5. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

---

## 🧭 User Flow

```
Homepage (Splash → Hero → Features → Reviews)
   │
   ├── Menu → Browse categories → Product detail → Add to cart
   │
   ├── Cart → Apply coupon → Proceed to checkout
   │
   ├── Checkout → Select order type → Choose payment → Place order
   │
   ├── Orders → Live status tracking → Print invoice
   │
   ├── Reserve → Pick date & time slot → Confirm reservation
   │
   └── Auth (Register with OTP / Google OAuth / Login)
```

---

## 🗄️ Database Schema

| Table | Purpose |
|---|---|
| `users` | Extends Supabase auth — name, phone, address, role (user / admin) |
| `orders` | Items (JSONB), status timeline, payment info, customer details |
| `payments` | Razorpay transaction records |
| `menu_items` | Food items linked to categories with nutrition fields |
| `categories` | Menu categories with sort order |
| `reservations` | Table bookings with date, time slot, guest count, status |
| `coupons` | Discount codes with usage limits & expiry |
| `reviews` | Customer reviews with approval-based visibility |
| `otp_codes` | Email OTP verification for registration |
| `store_settings` | Store info, operating hours, social links, time slot config |

All tables use **Row Level Security (RLS)** with policies for public read, user self-access, and admin full access.

---

## 📁 Project Structure

```
src/
├── app/
│   ├── admin/              # Dashboard, Orders, Menu, Users, Reservations,
│   │                       # Coupons, Reviews, Analytics, Financials, Settings
│   ├── api/                # 24 REST API endpoints
│   ├── auth/               # Login, Register, OAuth callback
│   ├── cart/               # Shopping cart
│   ├── checkout/           # Checkout flow
│   ├── menu/               # Menu listing & product detail
│   ├── orders/             # Order history & live tracking
│   ├── payment/            # UPI & Razorpay card payment
│   ├── profile/            # User profile
│   ├── reserve/            # Table reservations
│   ├── my-reservations/    # Reservation history
│   ├── layout.tsx          # Root layout
│   ├── page.tsx            # Homepage
│   ├── sitemap.ts          # Auto-generated sitemap
│   └── robots.ts           # Robots.txt rules
├── components/
│   ├── 3d/                 # Three.js (Hero3D with glass morphism)
│   ├── auth/               # AuthProvider, LoginModal
│   ├── layout/             # Navbar, Logo, Footer
│   ├── ui/                 # shadcn/ui components (Button, Card, Dialog, etc.)
│   └── *.tsx               # SplashScreen, HeroVideo, ReviewsGrid, etc.
├── lib/                    # Supabase clients, email, utilities
├── store/                  # Zustand stores (cart, auth)
├── types/                  # TypeScript interfaces & enums
├── utils/                  # Helper functions
└── proxy.ts                # Next.js proxy (formerly middleware)
```

---

## 🌐 API Endpoints

| Method | Endpoint | Purpose |
|---|---|---|
| POST | `/api/auth/send-otp` | Send email OTP |
| POST | `/api/auth/verify-otp` | Verify OTP & create user |
| POST | `/api/orders/create` | Place new order |
| GET | `/api/orders/list` | Get user's orders |
| GET | `/api/orders/status` | Get single order status |
| PUT | `/api/orders/update` | Update order status (admin) |
| POST | `/api/orders/pay-upi` | Upload UPI payment screenshot |
| GET | `/api/menu` | List menu items (with filters) |
| POST/PUT/DELETE | `/api/menu` | Menu CRUD (admin) |
| GET | `/api/categories` | List categories |
| GET | `/api/coupons` | Validate coupon |
| POST | `/api/payments/create-order` | Create Razorpay order |
| POST | `/api/payments/verify` | Verify Razorpay payment |
| GET/POST/PUT | `/api/reservations` | Reservation CRUD |
| GET/PATCH/DELETE | `/api/reviews` | Review moderation (admin) |
| POST | `/api/reviews/submit` | Submit review (user) |
| GET | `/api/users` | List users (admin) |
| GET | `/api/user/role` | Get current user role |
| PUT | `/api/user/update` | Update user profile |
| GET | `/api/admin/dashboard` | Dashboard KPIs & charts |
| GET | `/api/admin/financial-analysis` | Financial analytics |
| GET/PUT | `/api/admin/settings` | Store settings |

---

## 🚢 Deployment

The easiest way to deploy is [Vercel](https://vercel.com):

1. Push your code to GitHub
2. Import the repository on Vercel
3. Add all environment variables from `.env.local`
4. Deploy — Vercel auto-detects Next.js and builds automatically

Auto-deploy is enabled — every push to `master` triggers a new deployment.

---

## 🔒 Security

- **Row Level Security (RLS)** on all Supabase tables
- **Service role client** for admin operations (bypasses RLS)
- Environment variables keep secrets out of version control
- `.env.local` is gitignored — never commit secrets
- Admin routes protected by role-based access control


