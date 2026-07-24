import { redirect } from "next/navigation"
import { getSecondaryApplicant } from "@/lib/secondary-auth"
import { createAdminClient } from "@/lib/supabase/admin"
import { SecondaryPortalClient } from "./portal-client"

export default async function SecondaryPortalPage() {
  const applicant = await getSecondaryApplicant()
  if (!applicant) redirect("/oes/secondary/login")

  const admin = createAdminClient()

  const [
    { data: application },
    { data: personal },
    { data: education },
    { data: family },
    { data: siblings },
    { data: impairment },
    { data: existingDocs },
    { data: existingAnswers },
  ] = await Promise.all([
    admin
      .from("oes_applications")
      .select("reference_number, applicant_name, status, secondary_submitted_at")
      .eq("id", applicant.applicationId)
      .single(),
    admin
      .from("oes_personal_details")
      .select("*")
      .eq("application_id", applicant.applicationId)
      .maybeSingle(),
    admin
      .from("oes_education_details")
      .select("*")
      .eq("application_id", applicant.applicationId)
      .maybeSingle(),
    admin
      .from("oes_family_details")
      .select("*")
      .eq("application_id", applicant.applicationId)
      .maybeSingle(),
    admin
      .from("oes_siblings")
      .select("*")
      .eq("application_id", applicant.applicationId),
    admin
      .from("oes_impairment_details")
      .select("*")
      .eq("application_id", applicant.applicationId)
      .maybeSingle(),
    admin
      .from("oes_documents")
      .select("document_type, file_name, created_at")
      .eq("application_id", applicant.applicationId)
      .is("deleted_at", null),
    admin
      .from("oes_secondary_answers")
      .select("*")
      .eq("application_id", applicant.applicationId)
      .maybeSingle(),
  ])

  if (!application) redirect("/oes/secondary/login")

  return (
    <SecondaryPortalClient
      application={application}
      personal={personal ?? null}
      education={education ?? null}
      family={family ?? null}
      siblings={siblings ?? []}
      impairment={impairment ?? null}
      existingDocs={existingDocs ?? []}
      existingAnswers={existingAnswers ?? null}
    />
  )
}
