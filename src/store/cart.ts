import { create } from "zustand"
import type { CartItem, MenuItem, OrderType } from "@/types"
import { persist, createJSONStorage } from "zustand/middleware"

interface CartStore {
  items: CartItem[]
  orderType: OrderType | null
  customerName: string
  customerPhone: string
  customerAddress: string
  notes: string
  couponCode: string
  discountAmount: number

  addItem: (menuItem: MenuItem, quantity?: number) => void
  removeItem: (itemId: string) => void
  updateQuantity: (itemId: string, quantity: number) => void
  clearCart: () => void

  setOrderType: (type: OrderType) => void
  setCustomerName: (name: string) => void
  setCustomerPhone: (phone: string) => void
  setCustomerAddress: (address: string) => void
  setNotes: (notes: string) => void
  setCouponCode: (code: string) => void
  setDiscountAmount: (amount: number) => void

  getTotal: () => number
  getItemCount: () => number
}

export const useCartStore = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [],
      orderType: null,
      customerName: "",
      customerPhone: "",
      customerAddress: "",
      notes: "",
      couponCode: "",
      discountAmount: 0,

      addItem: (menuItem, quantity = 1) => {
        set((state) => {
          const existing = state.items.find(
            (item) => item.menuItem.id === menuItem.id
          )
          if (existing) {
            return {
              items: state.items.map((item) =>
                item.menuItem.id === menuItem.id
                  ? { ...item, quantity: item.quantity + quantity }
                  : item
              ),
            }
          }
          return {
            items: [
              ...state.items,
              { id: crypto.randomUUID(), menuItem, quantity },
            ],
          }
        })
      },

      removeItem: (itemId) => {
        set((state) => ({
          items: state.items.filter((item) => item.id !== itemId),
        }))
      },

      updateQuantity: (itemId, quantity) => {
        set((state) => ({
          items: state.items.map((item) =>
            item.id === itemId ? { ...item, quantity } : item
          ),
        }))
      },

      clearCart: () => set({
        items: [],
        orderType: null,
        customerName: "",
        customerPhone: "",
        customerAddress: "",
        notes: "",
        couponCode: "",
        discountAmount: 0,
      }),

      setOrderType: (orderType) => set({ orderType }),
      setCustomerName: (customerName) => set({ customerName }),
      setCustomerPhone: (customerPhone) => set({ customerPhone }),
      setCustomerAddress: (customerAddress) => set({ customerAddress }),
      setNotes: (notes) => set({ notes }),
      setCouponCode: (couponCode) => set({ couponCode }),
      setDiscountAmount: (discountAmount) => set({ discountAmount }),

      getTotal: () => {
        const { items, discountAmount } = get()
        const subtotal = items.reduce(
          (sum, item) => sum + item.menuItem.price * item.quantity,
          0
        )
        return Math.max(0, subtotal - discountAmount)
      },

      getItemCount: () => {
        return get().items.reduce((sum, item) => sum + item.quantity, 0)
      },
    }),
    {
      name: "eat-oclock-cart",
      storage: createJSONStorage(() => sessionStorage),
    }
  )
)
