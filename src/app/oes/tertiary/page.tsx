import { redirect } from "next/navigation"
import { getSecondaryApplicant } from "@/lib/secondary-auth"
import { createAdminClient } from "@/lib/supabase/admin"
import { TertiaryPortalClient } from "./tertiary-client"

export default async function TertiaryPortalPage() {
  const applicant = await getSecondaryApplicant()
  if (!applicant) redirect("/oes/secondary/login?next=/oes/tertiary")

  const admin = createAdminClient()

  const [{ data: application }, { data: existingDocs }, { data: existingAnswers }] =
    await Promise.all([
      admin
        .from("oes_applications")
        .select("reference_number, applicant_name, status, tertiary_submitted_at")
        .eq("id", applicant.applicationId)
        .single(),
      admin
        .from("oes_documents")
        .select("document_type, file_name, created_at")
        .eq("application_id", applicant.applicationId)
        .like("path", "applications/%/tertiary/%")
        .is("deleted_at", null),
      admin
        .from("oes_tertiary_answers")
        .select("*")
        .eq("application_id", applicant.applicationId)
        .maybeSingle(),
    ])

  if (!application) redirect("/oes/secondary/login?next=/oes/tertiary")

  return (
    <TertiaryPortalClient
      application={application}
      existingDocs={existingDocs ?? []}
      existingAnswers={existingAnswers ?? null}
    />
  )
}
