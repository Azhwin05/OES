import "server-only"
import { createAdminClient } from "@/lib/supabase/admin"
import {
  SECONDARY_DOCUMENT_BASE_MANDATORY,
  SECONDARY_DOCUMENT_LABELS,
  type AppStatus,
  type SecondaryDocumentType,
} from "@/lib/constants"

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

const SHORTLIST_SELECT = `
  id, reference_number, status, submitted_at, applicant_name, primary_phone, shortlisted,
  oes_personal_details(full_name, contact_number, email, gender, dob, district, state, pincode),
  oes_education_details(school_name, school_type, institution_name, institution_type, course_name, has_scholarship),
  oes_family_details(parent_status, single_parent_reason),
  oes_impairment_details(has_impairment),
  oes_residence_details(residence_type, ownership_source, door_street, district, state, pincode)
`

type ShortlistEmbedded = {
  id: string
  reference_number: string
  status: AppStatus
  submitted_at: string
  applicant_name: string
  primary_phone: string
  shortlisted: boolean
  oes_personal_details: {
    full_name: string | null
    contact_number: string | null
    email: string | null
    gender: string | null
    dob: string | null
    district: string | null
    state: string | null
    pincode: string | null
  }[]
  oes_education_details: {
    school_name: string | null
    school_type: string | null
    institution_name: string | null
    institution_type: string | null
    course_name: string | null
    has_scholarship: boolean
  }[]
  oes_family_details: { parent_status: string | null; single_parent_reason: string | null }[]
  oes_impairment_details: { has_impairment: boolean }[]
  oes_residence_details: {
    residence_type: string | null
    ownership_source: string | null
    door_street: string | null
    district: string | null
    state: string | null
    pincode: string | null
  }[]
}

/**
 * Read-only pool for the Shortlisting page. Pulls every field the shortlist
 * logic (lib/shortlist.ts) needs to classify applications, but never writes.
 */
export async function getShortlistPool(): Promise<import("@/lib/shortlist").ShortlistRow[]> {
  const admin = createAdminClient()
  const { data, error } = await admin
    .from("oes_applications")
    .select(SHORTLIST_SELECT)
    .is("deleted_at", null)
    .order("submitted_at", { ascending: false })
  if (error) {
    console.error("getShortlistPool", error)
    return []
  }
  return (data as unknown as ShortlistEmbedded[]).map((r) => {
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
      shortlisted: r.shortlisted,
      full_name: p?.full_name ?? null,
      contact_number: p?.contact_number ?? null,
      email: p?.email ?? null,
      gender: p?.gender ?? null,
      dob: p?.dob ?? null,
      district: p?.district ?? null,
      state: p?.state ?? null,
      pincode: p?.pincode ?? null,
      school_name: e?.school_name ?? null,
      school_type: e?.school_type ?? null,
      institution_name: e?.institution_name ?? null,
      institution_type: e?.institution_type ?? null,
      course_name: e?.course_name ?? null,
      has_scholarship: e?.has_scholarship ?? false,
      parent_status: fam?.parent_status ?? null,
      single_parent_reason: fam?.single_parent_reason ?? null,
      has_impairment: im?.has_impairment ?? false,
      residence_type: re?.residence_type ?? null,
      ownership_source: re?.ownership_source ?? null,
      door_street: re?.door_street ?? null,
      res_district: re?.district ?? null,
      res_state: re?.state ?? null,
      res_pincode: re?.pincode ?? null,
    }
  })
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

// --- Secondary submission overview (admin) ----------------------------------
// Two lean, targeted queries instead of one heavy nested join: the applicant
// list only needs a handful of scalar columns, and document coverage only
// needs (application_id, document_type) — never file paths/blobs — so the
// whole page costs two small reads regardless of how many documents exist.

export type SecondarySubmissionRow = {
  id: string
  reference_number: string
  applicant_name: string
  district: string | null
  secondary_submitted_at: string | null
  coreDocsUploaded: number
  coreDocsTotal: number
}

export type SecondaryOverview = {
  totalShortlisted: number
  submitted: number
  inProgress: number
  notStarted: number
  submissionRate: number
  daysLeft: number
  trend: { date: string; count: number }[]
  documentCoverage: { type: string; label: string; count: number }[]
  rows: SecondarySubmissionRow[]
}

const SECONDARY_SUBMISSION_DEADLINE = new Date("2026-07-31T23:59:59+05:30")

// Docs that are mandatory for every applicant regardless of their conditional
// answers (first-graduate cert, single-parent proof, etc. depend on answers
// only known per-applicant, which would need a third query/join to evaluate
// exactly — core-doc coverage is a cheap, still-meaningful proxy for it).
const CORE_SECONDARY_DOCS = (
  Object.entries(SECONDARY_DOCUMENT_BASE_MANDATORY) as [SecondaryDocumentType, boolean][]
)
  .filter(([, mandatory]) => mandatory)
  .map(([type]) => type)

type SecondaryAppEmbedded = {
  id: string
  reference_number: string
  applicant_name: string
  secondary_submitted_at: string | null
  oes_personal_details: { district: string | null }[]
}

export async function getSecondaryOverview(): Promise<SecondaryOverview> {
  const admin = createAdminClient()

  const [{ data: apps, error: appsError }, { data: docs, error: docsError }] = await Promise.all([
    admin
      .from("oes_applications")
      .select(
        "id, reference_number, applicant_name, secondary_submitted_at, oes_personal_details(district)"
      )
      .eq("shortlisted", true)
      .is("deleted_at", null)
      .order("secondary_submitted_at", { ascending: false, nullsFirst: false }),
    // Path prefix scopes this to secondary-portal uploads specifically —
    // 'aadhaar' and 'scholarship' document_type values are shared with the
    // primary application flow, so document_type alone can't distinguish them.
    admin
      .from("oes_documents")
      .select("application_id, document_type")
      .is("deleted_at", null)
      .like("path", "applications/%/secondary/%"),
  ])

  if (appsError) console.error("getSecondaryOverview apps", appsError)
  if (docsError) console.error("getSecondaryOverview docs", docsError)

  const appRows = (apps ?? []) as unknown as SecondaryAppEmbedded[]
  const docRows = (docs ?? []) as { application_id: string; document_type: string }[]

  const uploadedTypesByApp = new Map<string, Set<string>>()
  const typeTally = new Map<string, number>()
  for (const d of docRows) {
    if (!uploadedTypesByApp.has(d.application_id)) {
      uploadedTypesByApp.set(d.application_id, new Set())
    }
    uploadedTypesByApp.get(d.application_id)!.add(d.document_type)
    typeTally.set(d.document_type, (typeTally.get(d.document_type) ?? 0) + 1)
  }

  const rows: SecondarySubmissionRow[] = appRows.map((a) => {
    const uploadedTypes = uploadedTypesByApp.get(a.id) ?? new Set<string>()
    return {
      id: a.id,
      reference_number: a.reference_number,
      applicant_name: a.applicant_name,
      district: a.oes_personal_details?.[0]?.district ?? null,
      secondary_submitted_at: a.secondary_submitted_at,
      coreDocsUploaded: CORE_SECONDARY_DOCS.filter((t) => uploadedTypes.has(t)).length,
      coreDocsTotal: CORE_SECONDARY_DOCS.length,
    }
  })

  const submitted = rows.filter((r) => r.secondary_submitted_at).length
  const inProgress = rows.filter((r) => !r.secondary_submitted_at && r.coreDocsUploaded > 0).length
  const notStarted = rows.length - submitted - inProgress
  const submissionRate = rows.length ? Math.round((submitted / rows.length) * 1000) / 10 : 0

  const trendMap = new Map<string, number>()
  for (const r of rows) {
    if (!r.secondary_submitted_at) continue
    const day = new Date(r.secondary_submitted_at).toLocaleDateString("en-CA", {
      timeZone: "Asia/Kolkata",
    })
    trendMap.set(day, (trendMap.get(day) ?? 0) + 1)
  }
  const trend = [...trendMap.entries()]
    .sort(([a], [b]) => (a < b ? -1 : 1))
    .map(([date, count]) => ({ date, count }))

  const documentCoverage = [...typeTally.entries()]
    .map(([type, count]) => ({
      type,
      label: SECONDARY_DOCUMENT_LABELS[type as SecondaryDocumentType] ?? type,
      count,
    }))
    .sort((a, b) => b.count - a.count)

  const daysLeft = Math.max(
    0,
    Math.ceil((SECONDARY_SUBMISSION_DEADLINE.getTime() - Date.now()) / (1000 * 60 * 60 * 24))
  )

  return {
    totalShortlisted: rows.length,
    submitted,
    inProgress,
    notStarted,
    submissionRate,
    daysLeft,
    trend,
    documentCoverage,
    rows,
  }
}
