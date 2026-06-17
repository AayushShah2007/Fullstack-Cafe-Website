import { createClient } from "@supabase/supabase-js"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

let supabaseAdminClient
if (!supabaseUrl || !serviceRoleKey) {
  supabaseAdminClient = createClient(
    "https://dummy.project.supabase.co",
    "dummy-service-role-key",
    { auth: { autoRefreshToken: false, persistSession: false } }
  )
} else {
  supabaseAdminClient = createClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  })
}

export const supabaseAdmin = supabaseAdminClient
