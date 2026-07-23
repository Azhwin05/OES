import "server-only"
import { cookies } from "next/headers"
import { createAdminClient } from "@/lib/supabase/admin"

const COOKIE_NAME = "oes_secondary_session"

export async function createSecondarySession(applicationId: string) {
  const admin = createAdminClient()
  const { data, error } = await admin
    .from("oes_applicant_sessions")
    .insert({ application_id: applicationId })
    .select("token")
    .single()

  if (error || !data) {
    throw new Error("Failed to create secondary session")
  }

  const store = await cookies()
  store.set(COOKIE_NAME, data.token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  })
}

export type SecondaryApplicant = {
  applicationId: string
  referenceNumber: string
}

/** Reads the session cookie and validates it against the DB. Returns null if absent/expired. */
export async function getSecondaryApplicant(): Promise<SecondaryApplicant | null> {
  const store = await cookies()
  const token = store.get(COOKIE_NAME)?.value
  if (!token) return null

  const admin = createAdminClient()
  const { data, error } = await admin
    .from("oes_applicant_sessions")
    .select("application_id, expires_at, oes_applications(reference_number)")
    .eq("token", token)
    .single()

  if (error || !data) return null
  if (new Date(data.expires_at) < new Date()) return null

  const app = data.oes_applications as unknown as { reference_number: string } | null
  if (!app) return null

  return { applicationId: data.application_id, referenceNumber: app.reference_number }
}

export async function clearSecondarySession() {
  const store = await cookies()
  const token = store.get(COOKIE_NAME)?.value
  if (token) {
    const admin = createAdminClient()
    await admin.from("oes_applicant_sessions").delete().eq("token", token)
  }
  store.delete(COOKIE_NAME)
}

export function secondarySessionCookieName() {
  return COOKIE_NAME
}
