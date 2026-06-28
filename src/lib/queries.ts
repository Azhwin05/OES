import "server-only"
import { createAdminClient } from "@/lib/supabase/admin"
import type { AppStatus } from "@/lib/constants"

// Reads use the service-role client; the dashboard layout already authorizes
// the caller (requireStaff). Mutations separately enforce canManage.

export type ApplicationListRow = {
  id: string
  reference_number: string
  status: AppStatus
  submitted_at: string
  applicant_name: string
  primary_phone: string
  name_tamil: string | null
  email: string | null
  gender: string | null
  district: string | null
  course_name: string | null
  institution_name: string | null
  school_type: string | null
  institution_type: string | null
  has_scholarship: boolean
  has_impairment: boolean
  residence_type: string | null
  parent_status: string | null
}

const LIST_SELECT = `
  id, reference_number, status, submitted_at, applicant_name, primary_phone,
  oes_personal_details(name_tamil, email, gender, district),
  oes_education_details(course_name, institution_name, school_type, institution_type, has_scholarship),
  oes_family_details(parent_status),
  oes_impairment_details(has_impairment),
  oes_residence_details(residence_type)
`

type Embedded = {
  id: string
  reference_number: string
  status: AppStatus
  submitted_at: string
  applicant_name: string
  primary_phone: string
  oes_personal_details: { name_tamil: string | null; email: string | null; gender: string | null; district: string | null }[]
  oes_education_details: { course_name: string | null; institution_name: string | null; school_type: string | null; institution_type: string | null; has_scholarship: boolean }[]
  oes_family_details: { parent_status: string | null }[]
  oes_impairment_details: { has_impairment: boolean }[]
  oes_residence_details: { residence_type: string | null }[]
}

function flatten(r: Embedded): ApplicationListRow {
  const p = r.oes_personal_details?.[0]
  const e = r.oes_education_details?.[0]
  const fam = r.oes_family_details?.[0]
  const im = r.oes_impairment_details?.[0]
  const re = r.oes_residence_details?.[0]
  return {
    id: r.id,
    reference_number: r.reference_number,
    status: r.status,
    submitted_at: r.submitted_at,
    applicant_name: r.applicant_name,
    primary_phone: r.primary_phone,
    name_tamil: p?.name_tamil ?? null,
    email: p?.email ?? null,
    gender: p?.gender ?? null,
    district: p?.district ?? null,
    course_name: e?.course_name ?? null,
    institution_name: e?.institution_name ?? null,
    school_type: e?.school_type ?? null,
    institution_type: e?.institution_type ?? null,
    has_scholarship: e?.has_scholarship ?? false,
    has_impairment: im?.has_impairment ?? false,
    residence_type: re?.residence_type ?? null,
    parent_status: fam?.parent_status ?? null,
  }
}

export async function getApplicationsList(): Promise<ApplicationListRow[]> {
  const admin = createAdminClient()
  const { data, error } = await admin
    .from("oes_applications")
    .select(LIST_SELECT)
    .is("deleted_at", null)
    .order("submitted_at", { ascending: false })
  if (error) {
    console.error("getApplicationsList", error)
    return []
  }
  return (data as unknown as Embedded[]).map(flatten)
}

export type DashboardStats = {
  total: number
  today: number
  approved: number
  rejected: number
  under_review: number
  needs_correction: number
  govSchool: number
  privateSchool: number
  scholarship: number
  impairment: number
  byDistrict: { name: string; value: number }[]
  byGender: { name: string; value: number }[]
  bySchoolType: { name: string; value: number }[]
  byInstitutionType: { name: string; value: number }[]
  byResidenceType: { name: string; value: number }[]
  monthly: { name: string; value: number }[]
}

function tally(rows: { [k: string]: unknown }[], key: string): { name: string; value: number }[] {
  const map = new Map<string, number>()
  for (const r of rows) {
    const v = (r[key] as string) || "—"
    map.set(v, (map.get(v) ?? 0) + 1)
  }
  return [...map.entries()]
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value)
}

export async function getDashboardStats(): Promise<DashboardStats> {
  const rows = await getApplicationsList()
  const startOfToday = new Date()
  startOfToday.setHours(0, 0, 0, 0)

  const count = (s: AppStatus) => rows.filter((r) => r.status === s).length

  const monthMap = new Map<string, number>()
  for (const r of rows) {
    const d = new Date(r.submitted_at)
    const key = d.toLocaleString("en", { month: "short", year: "2-digit" })
    monthMap.set(key, (monthMap.get(key) ?? 0) + 1)
  }

  return {
    total: rows.length,
    today: rows.filter((r) => new Date(r.submitted_at) >= startOfToday).length,
    approved: count("approved"),
    rejected: count("rejected"),
    under_review: count("under_review"),
    needs_correction: count("needs_correction"),
    govSchool: rows.filter((r) => r.school_type === "government").length,
    privateSchool: rows.filter((r) => r.school_type === "private").length,
    scholarship: rows.filter((r) => r.has_scholarship).length,
    impairment: rows.filter((r) => r.has_impairment).length,
    byDistrict: tally(rows, "district").slice(0, 10),
    byGender: tally(rows, "gender"),
    bySchoolType: tally(rows, "school_type"),
    byInstitutionType: tally(rows, "institution_type"),
    byResidenceType: tally(rows, "residence_type"),
    monthly: [...monthMap.entries()].map(([name, value]) => ({ name, value })),
  }
}

export async function getApplicationDetail(id: string) {
  const admin = createAdminClient()
  const { data, error } = await admin
    .from("oes_applications")
    .select(`
      *,
      oes_personal_details(*),
      oes_education_details(*),
      oes_family_details(*),
      oes_siblings(*),
      oes_impairment_details(*),
      oes_residence_details(*),
      oes_documents(*),
      oes_application_status_history(*),
      oes_admin_remarks(*)
    `)
    .eq("id", id)
    .is("deleted_at", null)
    .maybeSingle()
  if (error) {
    console.error("getApplicationDetail", error)
    return null
  }
  return data
}

export async function getAuditLogs(limit = 200) {
  const admin = createAdminClient()
  const { data } = await admin
    .from("oes_audit_logs")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(limit)
  return data ?? []
}

export async function getUsers() {
  const admin = createAdminClient()
  const { data } = await admin
    .from("oes_profiles")
    .select("*")
    .order("created_at", { ascending: false })
  return data ?? []
}
