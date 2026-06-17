import type { MetadataRoute } from "next"

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/admin/", "/api/", "/payment/", "/checkout/", "/cart/", "/profile/"],
    },
    sitemap: "https://fullstack-cafe-website.vercel.app/sitemap.xml",
  }
}
