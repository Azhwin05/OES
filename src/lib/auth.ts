import "server-only"
import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"
import type { ProfileRow } from "@/lib/supabase/types"

export type SessionUser = {
  id: string
  email: string
  profile: ProfileRow | null
}

/** Returns the current authenticated user + OES profile, or null. */
export async function getSessionUser(): Promise<SessionUser | null> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return null

  // Read profile via service role (the profile RLS depends on having a profile).
  const admin = createAdminClient()
  const { data: profile } = await admin
    .from("oes_profiles")
    .select("*")
    .eq("id", user.id)
    .maybeSingle()

  return { id: user.id, email: user.email ?? "", profile: profile ?? null }
}

/** Require a staff user (any role with an OES profile). Redirects otherwise. */
export async function requireStaff(): Promise<SessionUser> {
  const user = await getSessionUser()
  if (!user) redirect("/admin/login")
  if (!user.profile) redirect("/admin/login?error=unauthorized")
  return user
}

/** Require an admin/super_admin. Redirects viewers/unauthorized. */
export async function requireAdmin(): Promise<SessionUser> {
  const user = await requireStaff()
  if (user.profile!.role === "viewer") {
    redirect("/admin?error=forbidden")
  }
  return user
}

export function canManage(user: SessionUser | null): boolean {
  return (
    !!user?.profile &&
    (user.profile.role === "admin" || user.profile.role === "super_admin")
  )
}
