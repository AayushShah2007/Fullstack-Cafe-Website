import { create } from "zustand"
import type { User } from "@/types"

interface AuthStore {
  user: User | null
  isLoading: boolean
  autoLoginDismissed: boolean
  setUser: (user: User | null) => void
  setLoading: (loading: boolean) => void
  dismissAutoLogin: () => void
  isAdmin: () => boolean
}

export const useAuthStore = create<AuthStore>((set, get) => ({
  user: null,
  isLoading: true,
  autoLoginDismissed: false,
  setUser: (user) => set({ user, isLoading: false }),
  setLoading: (isLoading) => set({ isLoading }),
  dismissAutoLogin: () => set({ autoLoginDismissed: true }),
  isAdmin: () => get().user?.role === "admin",
}))
