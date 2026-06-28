/**
 * Seeds the initial OES super admin using the Supabase Admin API.
 *
 * Usage:
 *   SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... node scripts/seed-admin.mjs
 *
 * Defaults: admin@oes.org / ChangeMe@123  (override with ADMIN_EMAIL / ADMIN_PASSWORD)
 */
import { createClient } from "@supabase/supabase-js"

const url =
  process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
const email = process.env.ADMIN_EMAIL || "admin@oes.org"
const password = process.env.ADMIN_PASSWORD || "ChangeMe@123"

if (!url || !serviceKey) {
  console.error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY")
  process.exit(1)
}

const admin = createClient(url, serviceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
})

async function main() {
  // Create (or find) the auth user.
  let userId
  const { data: created, error: createErr } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { full_name: "OES Super Admin" },
  })

  if (createErr && !/already.*registered/i.test(createErr.message)) {
    throw createErr
  }

  if (created?.user) {
    userId = created.user.id
  } else {
    const { data: list } = await admin.auth.admin.listUsers()
    userId = list.users.find((u) => u.email === email)?.id
  }
  if (!userId) throw new Error("Could not resolve admin user id")

  // Upsert the OES profile with super_admin role.
  const { error: profileErr } = await admin.from("oes_profiles").upsert(
    {
      id: userId,
      email,
      full_name: "OES Super Admin",
      role: "super_admin",
      must_change_password: true,
    },
    { onConflict: "id" }
  )
  if (profileErr) throw profileErr

  console.log(`✓ Admin ready: ${email} (super_admin)`)
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
