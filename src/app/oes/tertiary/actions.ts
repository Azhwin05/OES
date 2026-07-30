"use server"

import { createAdminClient } from "@/lib/supabase/admin"
import { getSecondaryApplicant, clearSecondarySession } from "@/lib/secondary-auth"
import { writeAudit } from "@/lib/audit"
import {
  TERTIARY_DOCUMENT_MANDATORY,
  type TertiaryAnswers,
  type TertiaryDocumentType,
} from "@/lib/constants"

export type TertiaryDocUpload = {
  document_type: TertiaryDocumentType
  bucket: string
  path: string
  file_name: string | null
  mime_type: string | null
  size_bytes: number | null
}

export type SubmitTertiaryResult =
  | { ok: true }
  | { ok: false; error: string; missing?: TertiaryDocumentType[] }

export async function submitTertiaryDocuments(
  answers: TertiaryAnswers,
  uploads: TertiaryDocUpload[]
): Promise<SubmitTertiaryResult> {
  const applicant = await getSecondaryApplicant()
  if (!applicant) return { ok: false, error: "unauthenticated" }

  if (!answers.modeOfPayment) return { ok: false, error: "missing_mode_of_payment" }
  if (!answers.lastPaymentDate) return { ok: false, error: "missing_payment_date" }

  const admin = createAdminClient()

  const { data: existing } = await admin
    .from("oes_documents")
    .select("document_type")
    .eq("application_id", applicant.applicationId)
    .like("path", "applications/%/tertiary/%")
    .is("deleted_at", null)

  const present = new Set<string>([
    ...(existing?.map((d) => d.document_type) ?? []),
    ...uploads.map((u) => u.document_type),
  ])

  const missing = (Object.entries(TERTIARY_DOCUMENT_MANDATORY) as [TertiaryDocumentType, boolean][])
    .filter(([type, isMandatory]) => isMandatory && !present.has(type))
    .map(([type]) => type)

  if (missing.length > 0) {
    return { ok: false, error: "missing_mandatory", missing }
  }

  const { error: answersError } = await admin.from("oes_tertiary_answers").upsert({
    application_id: applicant.applicationId,
    mode_of_payment: answers.modeOfPayment,
    last_payment_date: answers.lastPaymentDate,
    updated_at: new Date().toISOString(),
  })

  if (answersError) {
    console.error("tertiary answers upsert failed", answersError)
    return { ok: false, error: "server" }
  }

  if (uploads.length > 0) {
    const { error } = await admin.from("oes_documents").insert(
      uploads.map((u) => ({
        application_id: applicant.applicationId,
        document_type: u.document_type,
        bucket: u.bucket,
        path: u.path,
        file_name: u.file_name,
        mime_type: u.mime_type,
        size_bytes: u.size_bytes,
      }))
    )
    if (error) {
      console.error("tertiary document insert failed", error)
      return { ok: false, error: "server" }
    }
  }

  const { error: submitError } = await admin
    .from("oes_applications")
    .update({ tertiary_submitted_at: new Date().toISOString() })
    .eq("id", applicant.applicationId)

  if (submitError) {
    console.error("tertiary submission timestamp update failed", submitError)
    return { ok: false, error: "server" }
  }

  await writeAudit({
    action: "tertiary.submitted",
    entity: "application",
    entityId: applicant.applicationId,
    details: { reference: applicant.referenceNumber, count: uploads.length },
  })

  return { ok: true }
}

export async function tertiaryLogout() {
  await clearSecondarySession()
}
