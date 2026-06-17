import { createClient } from "@supabase/supabase-js"
import type { MenuItem, Category, Review } from "@/types"
import ProductDetailClient from "./product-client"
import { notFound } from "next/navigation"
import { supabaseAdmin } from "@/lib/supabase-admin"

export const dynamic = "force-dynamic"

export default async function ProductDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { auth: { persistSession: false } }
  )

  const { data: item } = await supabase
    .from("menu_items")
    .select("*, category:categories(*)")
    .eq("id", id)
    .single()

  if (!item) notFound()

  const { data: reviews } = await supabaseAdmin
    .from("reviews")
    .select("*")
    .eq("menu_item_id", id)
    .order("created_at", { ascending: false })
    .limit(10)

  const { data: suggested } = await supabase
    .from("menu_items")
    .select("*, category:categories(*)")
    .neq("category_id", item.category_id)
    .eq("is_available", true)
    .order("created_at", { ascending: false })

  // Pick one item per category
  const seenCategories = new Set<string>()
  const onePerCategory = (suggested || []).filter((s) => {
    if (seenCategories.has(s.category_id)) return false
    seenCategories.add(s.category_id)
    return true
  }).slice(0, 6)

  return (
    <ProductDetailClient
      item={item as MenuItem & { category: Category }}
      reviews={(reviews || []) as Review[]}
      suggested={(onePerCategory) as (MenuItem & { category: Category })[]}
    />
  )
}
