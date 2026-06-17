"use client"

import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { useState } from "react"
import { Toaster } from "react-hot-toast"
import AuthProvider from "@/components/auth/AuthProvider"

export default function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => new QueryClient())

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        {children}
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 3000,
            style: { background: "#1a1a2e", color: "#fff" },
          }}
        />
      </AuthProvider>
    </QueryClientProvider>
  )
}
