import type { Metadata } from "next"
import { Geist, Geist_Mono, Playfair_Display } from "next/font/google"
import Script from "next/script"
import "./globals.css"
import Providers from "@/components/Providers"
import Navbar from "@/components/layout/Navbar"

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
})

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
})

const playfair = Playfair_Display({
  variable: "--font-playfair",
  subsets: ["latin"],
})

export const metadata: Metadata = {
  title: {
    default: "Eat O'Clock - Premium Cafe & Fast Food",
    template: "%s | Eat O'Clock",
  },
  description:
    "Best fast food, beverages, sandwiches, burgers, pizza, shakes, pasta & juices in Borivali West, Mumbai",
  icons: { icon: "/favicon.png" },

  openGraph: {
    title: "Eat O'Clock - Premium Cafe & Fast Food",
    description:
      "Best fast food, beverages, sandwiches, burgers, pizza, shakes, pasta & juices in Borivali West, Mumbai",
    url: "https://fullstack-cafe-website.vercel.app",
    siteName: "Eat O'Clock",
    locale: "en_US",
    type: "website",
  },
  robots: {
    index: true,
    follow: true,
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} ${playfair.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col" suppressHydrationWarning>
        <Script
          src="https://www.googletagmanager.com/gtag/js?id=G-BBVKPF3519"
          strategy="afterInteractive"
        />
        <Script id="google-analytics" strategy="afterInteractive">
          {`window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
          gtag('config', 'G-BBVKPF3519');`}
        </Script>
        <Providers>
          <Navbar />
          <main className="flex-1">{children}</main>
        </Providers>
      </body>
    </html>
  )
}
