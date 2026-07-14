// Pure, read-only shortlisting logic. Never mutates data — it only classifies
// rows already fetched from the database so the admin UI can toggle criteria
// on/off and see the matching set change live. The only place a write
// happens anywhere in this feature is the explicit "mark shortlisted" action.

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

export type CriterionKey = "impairment" | "parentless" | "singleParent" | "bothParents"

export const CRITERIA_ORDER: CriterionKey[] = [
  "impairment",
  "parentless",
  "singleParent",
  "bothParents",
]

export const CRITERION_LABEL_KEYS: Record<CriterionKey, string> = {
  impairment: "shortlist.priority1.title",
  parentless: "shortlist.priority2.title",
  singleParent: "shortlist.priority3.title",
  bothParents: "shortlist.priority4.title",
}

export const CRITERION_DESC_KEYS: Record<CriterionKey, string> = {
  impairment: "shortlist.priority1.desc",
  parentless: "shortlist.priority2.desc",
  singleParent: "shortlist.priority3.desc",
  bothParents: "shortlist.priority4.desc",
}

export type ClassifiedRow = {
  row: ShortlistRow
  otherReasons: ExclusionReason[]
  blankReasons: ExclusionReason[]
  isDuplicate: boolean
  duplicateGroupId: string | null
  matches: Record<CriterionKey, boolean>
  matchReasons: Record<CriterionKey, string[]>
}

export type DuplicateGroup = {
  id: string
  matchTypes: ("phone" | "email" | "name")[]
  rows: ShortlistRow[]
}

export type ShortlistIndex = {
  total: number
  classified: ClassifiedRow[]
  duplicateGroups: DuplicateGroup[]
}

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

// --- Per-criterion matching (independent, not mutually exclusive) ----------
function classifyMatches(r: ShortlistRow): {
  matches: Record<CriterionKey, boolean>
  matchReasons: Record<CriterionKey, string[]>
} {
  const matches = {
    impairment: false,
    parentless: false,
    singleParent: false,
    bothParents: false,
  } as Record<CriterionKey, boolean>
  const matchReasons = {
    impairment: [] as string[],
    parentless: [] as string[],
    singleParent: [] as string[],
    bothParents: [] as string[],
  }

  if (r.has_impairment) {
    matches.impairment = true
    matchReasons.impairment.push("Has an impairment (self or family)")
  }
  if (r.parent_status === "parentless") {
    matches.parentless = true
    matchReasons.parentless.push("Applicant is parentless")
  }
  if (r.parent_status === "single") {
    const reasons: string[] = []
    if (r.school_type === "government") reasons.push("Government schooling")
    if (r.has_scholarship === false) reasons.push("No scholarship")
    if (r.institution_type === "government") reasons.push("Government institution")
    if (r.residence_type === "rental") reasons.push("Rental house")
    if (reasons.length > 0) {
      matches.singleParent = true
      matchReasons.singleParent = reasons
    }
  }
  if (r.parent_status === "both") {
    const reasons: string[] = []
    if (r.has_scholarship === false) reasons.push("No scholarship")
    if (r.school_type === "government") reasons.push("Government schooling")
    if (r.institution_type === "government") reasons.push("Government institution")
    if (r.residence_type === "rental") reasons.push("Rental house")
    if (reasons.length > 0) {
      matches.bothParents = true
      matchReasons.bothParents = reasons
    }
  }

  return { matches, matchReasons }
}

export function buildShortlistIndex(rows: ShortlistRow[]): ShortlistIndex {
  const duplicateGroups = buildDuplicateGroups(rows)
  const duplicateGroupByRow = new Map<string, string>()
  duplicateGroups.forEach((g) => g.rows.forEach((r) => duplicateGroupByRow.set(r.id, g.id)))

  const classified: ClassifiedRow[] = rows.map((row) => {
    const { matches, matchReasons } = classifyMatches(row)
    return {
      row,
      otherReasons: findOtherReasons(row),
      blankReasons: findBlankReasons(row),
      isDuplicate: duplicateGroupByRow.has(row.id),
      duplicateGroupId: duplicateGroupByRow.get(row.id) ?? null,
      matches,
      matchReasons,
    }
  })

  return { total: rows.length, classified, duplicateGroups }
}
