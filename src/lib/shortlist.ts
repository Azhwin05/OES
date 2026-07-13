// Pure, read-only shortlisting logic. Never mutates data — it only classifies
// rows already fetched from the database into buckets for the admin to review.
// The only place a write happens is the explicit "mark shortlisted" action.

import type { AppStatus } from "@/lib/constants"

export type ShortlistRow = {
  id: string
  reference_number: string
  status: AppStatus
  submitted_at: string
  applicant_name: string
  primary_phone: string
  shortlisted: boolean
  // personal
  full_name: string | null
  contact_number: string | null
  email: string | null
  gender: string | null
  dob: string | null
  district: string | null
  state: string | null
  pincode: string | null
  // education
  school_name: string | null
  school_type: string | null
  institution_name: string | null
  institution_type: string | null
  course_name: string | null
  has_scholarship: boolean
  // family
  parent_status: string | null
  single_parent_reason: string | null
  // impairment
  has_impairment: boolean
  // residence
  residence_type: string | null
  ownership_source: string | null
  door_street: string | null
  res_district: string | null
  res_state: string | null
  res_pincode: string | null
}

export type ExclusionReason = { type: "other" | "blank"; field: string }

export type PriorityTier = 1 | 2 | 3 | 4

export const PRIORITY_LABELS: Record<PriorityTier, string> = {
  1: "shortlist.priority1.title",
  2: "shortlist.priority2.title",
  3: "shortlist.priority3.title",
  4: "shortlist.priority4.title",
}

export type PriorityEntry = {
  row: ShortlistRow
  reasons: string[]
  isDuplicate: boolean
}

export type DuplicateGroup = {
  id: string
  matchTypes: ("phone" | "email" | "name")[]
  rows: ShortlistRow[]
}

export type ShortlistReport = {
  total: number
  excludedOther: { row: ShortlistRow; reasons: ExclusionReason[] }[]
  excludedBlank: { row: ShortlistRow; reasons: ExclusionReason[] }[]
  excludedIds: Set<string>
  duplicateGroups: DuplicateGroup[]
  duplicateIds: Set<string>
  cleanCount: number
  priorityGroups: Record<PriorityTier, PriorityEntry[]>
  notEligible: PriorityRowLite[]
}

type PriorityRowLite = { row: ShortlistRow; isDuplicate: boolean }

function norm(s?: string | null): string {
  return (s ?? "").trim().toLowerCase().replace(/\s+/g, " ")
}

function isBlank(s?: string | null): boolean {
  return !s || !s.trim()
}

// --- "Other" detection ------------------------------------------------------
// Gender is deliberately never checked here — "other" is a legitimate,
// protected answer for gender and must never cause exclusion.
function findOtherReasons(r: ShortlistRow): ExclusionReason[] {
  const reasons: ExclusionReason[] = []
  if (norm(r.district) === "other") reasons.push({ type: "other", field: "District" })
  if (norm(r.state) === "other") reasons.push({ type: "other", field: "State" })
  if (norm(r.res_district) === "other") reasons.push({ type: "other", field: "Residence District" })
  if (norm(r.res_state) === "other") reasons.push({ type: "other", field: "Residence State" })
  if (r.parent_status === "single" && norm(r.single_parent_reason) === "other") {
    reasons.push({ type: "other", field: "Single Parent Reason" })
  }
  if (r.residence_type === "own" && norm(r.ownership_source) === "other") {
    reasons.push({ type: "other", field: "Ownership Source" })
  }
  return reasons
}

// --- Blank / missing required field detection -------------------------------
// Mirrors the fields the apply form actually requires (see lib/validation/schemas.ts).
function findBlankReasons(r: ShortlistRow): ExclusionReason[] {
  const checks: [boolean, string][] = [
    [isBlank(r.applicant_name), "Applicant Name"],
    [isBlank(r.primary_phone), "Primary Phone"],
    [isBlank(r.full_name), "Full Name"],
    [isBlank(r.contact_number), "Contact Number"],
    [isBlank(r.email), "Email"],
    [isBlank(r.district), "District"],
    [isBlank(r.state), "State"],
    [isBlank(r.pincode), "Pincode"],
    [isBlank(r.school_name), "School Name"],
    [isBlank(r.institution_name), "Institution Name"],
    [isBlank(r.course_name), "Course Name"],
    [isBlank(r.parent_status), "Parent Status"],
    [isBlank(r.door_street), "Door/Street"],
    [isBlank(r.res_district), "Residence District"],
    [isBlank(r.res_state), "Residence State"],
    [isBlank(r.res_pincode), "Residence Pincode"],
  ]
  return checks.filter(([bad]) => bad).map(([, field]) => ({ type: "blank" as const, field }))
}

// --- Duplicate detection (union-find over phone/email/name matches) --------
function pushMap<K, V>(map: Map<K, V[]>, key: K, value: V) {
  const arr = map.get(key)
  if (arr) arr.push(value)
  else map.set(key, [value])
}

function buildDuplicateGroups(rows: ShortlistRow[]): DuplicateGroup[] {
  const parent = new Map<string, string>()
  rows.forEach((r) => parent.set(r.id, r.id))

  function find(x: string): string {
    let root = x
    while (parent.get(root) !== root) root = parent.get(root)!
    let cur = x
    while (parent.get(cur) !== root) {
      const next = parent.get(cur)!
      parent.set(cur, root)
      cur = next
    }
    return root
  }
  function union(a: string, b: string) {
    const ra = find(a)
    const rb = find(b)
    if (ra !== rb) parent.set(ra, rb)
  }

  const byPhone = new Map<string, string[]>()
  const byEmail = new Map<string, string[]>()
  const byName = new Map<string, string[]>()

  for (const r of rows) {
    const phone = norm(r.primary_phone || r.contact_number)
    if (phone) pushMap(byPhone, phone, r.id)
    const email = norm(r.email)
    if (email) pushMap(byEmail, email, r.id)
    const name = norm(r.full_name || r.applicant_name)
    if (name) pushMap(byName, name, r.id)
  }

  const buckets: { map: Map<string, string[]>; label: "phone" | "email" | "name" }[] = [
    { map: byPhone, label: "phone" },
    { map: byEmail, label: "email" },
    { map: byName, label: "name" },
  ]

  for (const { map } of buckets) {
    for (const ids of map.values()) {
      if (ids.length > 1) {
        for (let i = 1; i < ids.length; i++) union(ids[0], ids[i])
      }
    }
  }

  const groups = new Map<string, { ids: Set<string>; matchTypes: Set<"phone" | "email" | "name"> }>()
  function ensure(root: string) {
    let g = groups.get(root)
    if (!g) {
      g = { ids: new Set(), matchTypes: new Set() }
      groups.set(root, g)
    }
    return g
  }

  for (const { map, label } of buckets) {
    for (const ids of map.values()) {
      if (ids.length > 1) {
        const g = ensure(find(ids[0]))
        ids.forEach((id) => g.ids.add(id))
        g.matchTypes.add(label)
      }
    }
  }

  const rowsById = new Map(rows.map((r) => [r.id, r]))
  const result: DuplicateGroup[] = []
  for (const g of groups.values()) {
    if (g.ids.size > 1) {
      result.push({
        id: [...g.ids].sort().join("-"),
        matchTypes: [...g.matchTypes],
        rows: [...g.ids].map((id) => rowsById.get(id)!).filter(Boolean),
      })
    }
  }
  result.sort((a, b) => b.rows.length - a.rows.length)
  return result
}

// --- Priority classification -------------------------------------------------
function classifyPriority(r: ShortlistRow): { tier: PriorityTier; reasons: string[] } | null {
  if (r.has_impairment) {
    return { tier: 1, reasons: ["Has an impairment (self or family)"] }
  }
  if (r.parent_status === "parentless") {
    return { tier: 2, reasons: ["Applicant is parentless"] }
  }
  if (r.parent_status === "single") {
    const reasons: string[] = []
    if (r.school_type === "government") reasons.push("Government schooling")
    if (r.has_scholarship === false) reasons.push("No scholarship")
    if (r.institution_type === "government") reasons.push("Government institution")
    if (r.residence_type === "rental") reasons.push("Rental house")
    if (reasons.length > 0) return { tier: 3, reasons }
  }
  if (r.parent_status === "both") {
    const reasons: string[] = []
    if (r.has_scholarship === false) reasons.push("No scholarship")
    if (r.school_type === "government") reasons.push("Government schooling")
    if (r.institution_type === "government") reasons.push("Government institution")
    if (r.residence_type === "rental") reasons.push("Rental house")
    if (reasons.length > 0) return { tier: 4, reasons }
  }
  return null
}

export function buildShortlistReport(rows: ShortlistRow[]): ShortlistReport {
  const excludedOther: { row: ShortlistRow; reasons: ExclusionReason[] }[] = []
  const excludedBlank: { row: ShortlistRow; reasons: ExclusionReason[] }[] = []
  const excludedIds = new Set<string>()

  for (const r of rows) {
    const other = findOtherReasons(r)
    const blank = findBlankReasons(r)
    if (other.length > 0) {
      excludedOther.push({ row: r, reasons: other })
      excludedIds.add(r.id)
    }
    if (blank.length > 0) {
      excludedBlank.push({ row: r, reasons: blank })
      excludedIds.add(r.id)
    }
  }

  // Duplicates are detected across ALL rows (even excluded ones) so the admin
  // sees the full picture, but they only gate the clean/priority pool as a flag.
  const duplicateGroups = buildDuplicateGroups(rows)
  const duplicateIds = new Set<string>()
  duplicateGroups.forEach((g) => g.rows.forEach((r) => duplicateIds.add(r.id)))

  const clean = rows.filter((r) => !excludedIds.has(r.id))

  const priorityGroups: Record<PriorityTier, PriorityEntry[]> = { 1: [], 2: [], 3: [], 4: [] }
  const notEligible: PriorityRowLite[] = []

  for (const r of clean) {
    const result = classifyPriority(r)
    const isDuplicate = duplicateIds.has(r.id)
    if (result) {
      priorityGroups[result.tier].push({ row: r, reasons: result.reasons, isDuplicate })
    } else {
      notEligible.push({ row: r, isDuplicate })
    }
  }

  return {
    total: rows.length,
    excludedOther,
    excludedBlank,
    excludedIds,
    duplicateGroups,
    duplicateIds,
    cleanCount: clean.length,
    priorityGroups,
    notEligible,
  }
}
