import type { MetadataRoute } from "next"

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = "https://fullstack-cafe-website.vercel.app"

  return [
    { url: baseUrl, lastModified: new Date(), changeFrequency: "weekly", priority: 1 },
    { url: `${baseUrl}/menu`, lastModified: new Date(), changeFrequency: "daily", priority: 0.9 },
    { url: `${baseUrl}/cart`, lastModified: new Date(), changeFrequency: "never", priority: 0.3 },
    { url: `${baseUrl}/orders`, lastModified: new Date(), changeFrequency: "never", priority: 0.3 },
    { url: `${baseUrl}/reserve`, lastModified: new Date(), changeFrequency: "weekly", priority: 0.7 },
    { url: `${baseUrl}/my-reservations`, lastModified: new Date(), changeFrequency: "never", priority: 0.3 },
    { url: `${baseUrl}/auth/login`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.5 },
    { url: `${baseUrl}/auth/register`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.5 },
  ]
}
