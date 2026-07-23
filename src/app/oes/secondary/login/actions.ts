"use server"

import bcrypt from "bcryptjs"
import { createAdminClient } from "@/lib/supabase/admin"
import { createSecondarySession } from "@/lib/secondary-auth"
import { writeAudit } from "@/lib/audit"

export type SecondaryLoginResult =
  | { ok: true }
  | { ok: false; error: "invalid" | "not_shortlisted" | "server" }

/**
 * Secondary portal login with per-user password validation
 *
 * Password format: FirstName(3) + OES_ID(last 4 digits)
 * Example: Lokeshwaran + OES20260205 → LOK0205
 */
export async function secondaryLogin(
  referenceRaw: string,
  password: string
): Promise<SecondaryLoginResult> {
  const reference = referenceRaw.trim().toUpperCase()
  if (!reference || !password) return { ok: false, error: "invalid" }

  const admin = createAdminClient()

  // Fetch application with shortlist status and hashed password
  const { data: app, error } = await admin
    .from("oes_applications")
    .select("id, reference_number, applicant_name, shortlisted, deleted_at, secondary_password_hash")
    .eq("reference_number", reference)
    .is("deleted_at", null)
    .single()

  if (error || !app) return { ok: false, error: "invalid" }
  if (!app.shortlisted) return { ok: false, error: "not_shortlisted" }
  if (!app.secondary_password_hash) return { ok: false, error: "server" }

  // Validate password against per-user hash
  const passwordOk = await bcrypt.compare(password, app.secondary_password_hash)
  if (!passwordOk) return { ok: false, error: "invalid" }

  // Password is correct, create session
  await createSecondarySession(app.id)
  await writeAudit({
    action: "secondary.login",
    entity: "application",
    entityId: app.id,
    details: { reference, applicantName: app.applicant_name },
  })

  return { ok: true }
}
