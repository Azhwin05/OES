"use server"

import { revalidatePath } from "next/cache"
import { createAdminClient } from "@/lib/supabase/admin"
import { getSessionUser, canManage, canReviewSecondary } from "@/lib/auth"
import { writeAudit } from "@/lib/audit"
import { getDownloadUrl as getR2DownloadUrl, getDownloadUrls as getR2DownloadUrls } from "@/lib/r2"
import {
  APP_STATUSES,
  USER_ROLES,
  SECONDARY_REVIEW_STATUSES,
  type AppStatus,
  type UserRole,
  type SecondaryReviewStatus,
} from "@/lib/constants"

type ActionResult = { ok: boolean; error?: string }

export async function updateStatus(
  applicationId: string,
  toStatus: AppStatus,
  note?: string
): Promise<ActionResult> {
  const user = await getSessionUser()
  if (!canManage(user)) return { ok: false, error: "unauthorized" }
  if (!APP_STATUSES.includes(toStatus)) return { ok: false, error: "invalid" }

  const admin = createAdminClient()
  const { data: current } = await admin
    .from("oes_applications")
    .select("status")
    .eq("id", applicationId)
    .maybeSingle()

  const { error } = await admin
    .from("oes_applications")
    .update({ status: toStatus, updated_by: user!.id })
    .eq("id", applicationId)
  if (error) return { ok: false, error: "server" }

  await admin.from("oes_application_status_history").insert({
    application_id: applicationId,
    from_status: (current?.status as AppStatus) ?? null,
    to_status: toStatus,
    note: note ?? null,
    changed_by: user!.id,
  })

  await writeAudit({
    action: "application.status_changed",
    entity: "application",
    entityId: applicationId,
    details: { to: toStatus, note },
    actorId: user!.id,
    actorEmail: user!.email,
  })

  revalidatePath(`/admin/applications/${applicationId}`)
  revalidatePath("/oes/admin/applications")
  revalidatePath("/oes/admin")
  return { ok: true }
}

export async function addRemark(
  applicationId: string,
  remark: string
): Promise<ActionResult> {
  const user = await getSessionUser()
  if (!canManage(user)) return { ok: false, error: "unauthorized" }
  if (!remark.trim()) return { ok: false, error: "empty" }

  const admin = createAdminClient()
  const { error } = await admin.from("oes_admin_remarks").insert({
    application_id: applicationId,
    remark: remark.trim(),
    created_by: user!.id,
  })
  if (error) return { ok: false, error: "server" }

  await writeAudit({
    action: "application.remark_added",
    entity: "application",
    entityId: applicationId,
    actorId: user!.id,
    actorEmail: user!.email,
  })
  revalidatePath(`/admin/applications/${applicationId}`)
  return { ok: true }
}

export async function softDeleteApplications(
  ids: string[]
): Promise<ActionResult> {
  const user = await getSessionUser()
  if (!canManage(user)) return { ok: false, error: "unauthorized" }
  if (ids.length === 0) return { ok: false, error: "empty" }

  const admin = createAdminClient()
  const { error } = await admin
    .from("oes_applications")
    .update({ deleted_at: new Date().toISOString(), updated_by: user!.id })
    .in("id", ids)
  if (error) return { ok: false, error: "server" }

  await writeAudit({
    action: "application.deleted",
    entity: "application",
    details: { ids, count: ids.length },
    actorId: user!.id,
    actorEmail: user!.email,
  })
  revalidatePath("/oes/admin/applications")
  revalidatePath("/oes/admin")
  return { ok: true }
}

/**
 * Toggles the `shortlisted` flag only — never touches any other application
 * field. This is the single write action on the Shortlisting page.
 */
export async function setShortlisted(
  ids: string[],
  value: boolean
): Promise<ActionResult> {
  const user = await getSessionUser()
  if (!canManage(user)) return { ok: false, error: "unauthorized" }
  if (ids.length === 0) return { ok: false, error: "empty" }

  const admin = createAdminClient()
  const { error } = await admin
    .from("oes_applications")
    .update({ shortlisted: value, updated_by: user!.id })
    .in("id", ids)
  if (error) return { ok: false, error: "server" }

  await writeAudit({
    action: value ? "application.shortlisted" : "application.unshortlisted",
    entity: "application",
    details: { ids, count: ids.length },
    actorId: user!.id,
    actorEmail: user!.email,
  })
  revalidatePath("/oes/admin/shortlist")
  revalidatePath("/oes/admin/applications")
  revalidatePath("/oes/admin")
  return { ok: true }
}

export async function setUserRole(
  userId: string,
  role: UserRole
): Promise<ActionResult> {
  const user = await getSessionUser()
  if (user?.profile?.role !== "super_admin")
    return { ok: false, error: "unauthorized" }
  if (!USER_ROLES.includes(role)) return { ok: false, error: "invalid" }

  const admin = createAdminClient()
  const { error } = await admin
    .from("oes_profiles")
    .update({ role })
    .eq("id", userId)
  if (error) return { ok: false, error: "server" }

  await writeAudit({
    action: "user.role_changed",
    entity: "profile",
    entityId: userId,
    details: { role },
    actorId: user!.id,
    actorEmail: user!.email,
  })
  revalidatePath("/oes/admin/users")
  return { ok: true }
}

export async function getDocumentSignedUrl(
  bucket: string,
  path: string
): Promise<{ url?: string; error?: string }> {
  const user = await getSessionUser()
  if (!user?.profile) return { error: "unauthorized" }
  try {
    const url = await getR2DownloadUrl(path)
    return { url }
  } catch {
    return { error: "server" }
  }
}

/** Batch signed URLs for a full-record ZIP export. Presigning is a local operation, so this is cheap regardless of count. */
export async function getDocumentSignedUrls(
  files: { bucket: string; path: string }[]
): Promise<{ url: string | null }[]> {
  const user = await getSessionUser()
  if (!user?.profile) return files.map(() => ({ url: null }))
  const urls = await getR2DownloadUrls(files.map((f) => f.path))
  return urls.map((url) => ({ url }))
}

/** Audit trail for bulk data exports — a ZIP contains every document + full PII, worth logging distinctly from single-document views. */
export async function logZipExport(applicationId: string, referenceNumber: string, fileCount: number) {
  const user = await getSessionUser()
  if (!user?.profile) return
  await writeAudit({
    action: "application.zip_export",
    entity: "application",
    entityId: applicationId,
    details: { reference: referenceNumber, fileCount },
    actorId: user.id,
    actorEmail: user.email,
  })
}

/**
 * Records a reviewer's decision on a candidate's secondary document
 * submission. Any staff role except viewer may call this (super_admin,
 * admin, reviewer). "needs_correction" requires a note — the candidate's
 * portal reopens for them, and they need to know what to fix.
 */
export async function setSecondaryReviewStatus(
  applicationId: string,
  decision: SecondaryReviewStatus,
  note?: string
): Promise<ActionResult> {
  const user = await getSessionUser()
  if (!canReviewSecondary(user)) return { ok: false, error: "unauthorized" }
  if (!SECONDARY_REVIEW_STATUSES.includes(decision) || decision === "pending") {
    return { ok: false, error: "invalid" }
  }
  const trimmedNote = note?.trim() || null
  if (decision === "needs_correction" && !trimmedNote) {
    return { ok: false, error: "note_required" }
  }

  const admin = createAdminClient()
  const { error } = await admin
    .from("oes_applications")
    .update({
      secondary_review_status: decision,
      secondary_review_note: trimmedNote,
      secondary_reviewed_at: new Date().toISOString(),
      secondary_reviewed_by: user!.id,
    })
    .eq("id", applicationId)

  if (error) return { ok: false, error: "server" }

  await writeAudit({
    action: `secondary_review.${decision}`,
    entity: "application",
    entityId: applicationId,
    details: { note: trimmedNote },
    actorId: user!.id,
    actorEmail: user!.email,
  })

  revalidatePath("/oes/admin/secondary")
  revalidatePath(`/oes/admin/applications/${applicationId}`)
  return { ok: true }
}
