"use server"

import { createAdminClient } from "@/lib/supabase/admin"
import { getSecondaryApplicant, clearSecondarySession } from "@/lib/secondary-auth"
import { writeAudit } from "@/lib/audit"
import {
  computeSecondaryMandatory,
  type SecondaryAnswers,
  type SecondaryDocumentType,
} from "@/lib/constants"

export type SecondaryDocUpload = {
  document_type: SecondaryDocumentType
  bucket: string
  path: string
  file_name: string | null
  mime_type: string | null
  size_bytes: number | null
}

export type SubmitSecondaryResult =
  | { ok: true }
  | { ok: false; error: string; missing?: SecondaryDocumentType[] }

export async function submitSecondaryDocuments(
  answers: SecondaryAnswers,
  uploads: SecondaryDocUpload[]
): Promise<SubmitSecondaryResult> {
  const applicant = await getSecondaryApplicant()
  if (!applicant) return { ok: false, error: "unauthenticated" }

  const admin = createAdminClient()

  const [{ data: existing }, { data: impairment }] = await Promise.all([
    admin
      .from("oes_documents")
      .select("document_type")
      .eq("application_id", applicant.applicationId)
      .is("deleted_at", null),
    admin
      .from("oes_impairment_details")
      .select("has_impairment")
      .eq("application_id", applicant.applicationId)
      .maybeSingle(),
  ])

  const mandatory = computeSecondaryMandatory(answers, !!impairment?.has_impairment)

  const present = new Set<string>([
    ...(existing?.map((d) => d.document_type) ?? []),
    ...uploads.map((u) => u.document_type),
  ])

  const missing = (Object.entries(mandatory) as [SecondaryDocumentType, boolean][])
    .filter(([type, isMandatory]) => isMandatory && !present.has(type))
    .map(([type]) => type)

  if (answers.incomeProofFor.length === 0) {
    return { ok: false, error: "missing_income_proof_for" }
  }

  if (missing.length > 0) {
    return { ok: false, error: "missing_mandatory", missing }
  }

  const { error: answersError } = await admin.from("oes_secondary_answers").upsert({
    application_id: applicant.applicationId,
    first_graduate: answers.firstGraduate,
    has_other_scholarship: answers.hasOtherScholarship,
    income_proof_for: answers.incomeProofFor,
    single_parent_living_with: answers.singleParentLivingWith,
    single_parent_reason: answers.singleParentReason,
    updated_at: new Date().toISOString(),
  })

  if (answersError) {
    console.error("secondary answers upsert failed", answersError)
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
      console.error("secondary document insert failed", error)
      return { ok: false, error: "server" }
    }
  }

  const { error: submitError } = await admin
    .from("oes_applications")
    .update({ secondary_submitted_at: new Date().toISOString() })
    .eq("id", applicant.applicationId)

  if (submitError) {
    console.error("secondary submission timestamp update failed", submitError)
    return { ok: false, error: "server" }
  }

  await writeAudit({
    action: "secondary.submitted",
    entity: "application",
    entityId: applicant.applicationId,
    details: { reference: applicant.referenceNumber, count: uploads.length },
  })

  return { ok: true }
}

export async function secondaryLogout() {
  await clearSecondarySession()
}
