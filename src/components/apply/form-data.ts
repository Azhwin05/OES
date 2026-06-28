import type {
  PersonalValues,
  EducationValues,
  FamilyValues,
  SiblingsValues,
  ImpairmentValues,
  ResidenceValues,
  UploadedDoc,
} from "@/lib/validation/schemas"

export type AppFormData = {
  personal: Partial<PersonalValues>
  education: Partial<EducationValues>
  family: Partial<FamilyValues>
  siblings: SiblingsValues
  impairment: Partial<ImpairmentValues>
  residence: Partial<ResidenceValues>
  documents: UploadedDoc[]
}

export const emptyFormData: AppFormData = {
  personal: { state: "Tamil Nadu" },
  education: { has_scholarship: false },
  family: {},
  siblings: { number_of_siblings: 0, siblings: [] },
  impairment: { has_impairment: false },
  residence: { state: "Tamil Nadu" },
  documents: [],
}

export const DRAFT_KEY = "oes-application-draft"
export const DRAFT_TOKEN_KEY = "oes-application-token"

export function loadDraft(): AppFormData | null {
  if (typeof window === "undefined") return null
  try {
    const raw = window.localStorage.getItem(DRAFT_KEY)
    if (!raw) return null
    return { ...emptyFormData, ...(JSON.parse(raw) as AppFormData) }
  } catch {
    return null
  }
}

export function saveDraft(data: unknown) {
  if (typeof window === "undefined") return
  try {
    window.localStorage.setItem(DRAFT_KEY, JSON.stringify(data))
  } catch {
    /* storage full / disabled — ignore */
  }
}

export function clearDraft() {
  if (typeof window === "undefined") return
  window.localStorage.removeItem(DRAFT_KEY)
  window.localStorage.removeItem(DRAFT_TOKEN_KEY)
}

/** Stable per-application upload token so draft uploads share a folder. */
export function getUploadToken(): string {
  if (typeof window === "undefined") return "server"
  let token = window.localStorage.getItem(DRAFT_TOKEN_KEY)
  if (!token) {
    token = crypto.randomUUID()
    window.localStorage.setItem(DRAFT_TOKEN_KEY, token)
  }
  return token
}
