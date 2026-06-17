import { createClient } from "@supabase/supabase-js"
import type { Category, MenuItem } from "@/types"
import MenuClient from "./menu-client"

export const dynamic = "force-dynamic"

export default async function MenuPage() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { auth: { persistSession: false } }
  )

  const [{ data: categories }, { data: items }] = await Promise.all([
    supabase.from("categories").select("*").order("sort_order"),
    supabase.from("menu_items").select("*, category:categories(*)").order("name"),
  ])

  return (
    <MenuClient
      initialCategories={(categories as Category[]) || []}
      initialItems={(items as MenuItem[]) || []}
    />
  )
}
