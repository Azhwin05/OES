// Shared domain constants & option lists for OES.

export const APP_STATUSES = [
  "submitted",
  "under_review",
  "approved",
  "rejected",
  "needs_correction",
] as const
export type AppStatus = (typeof APP_STATUSES)[number]

export const GENDERS = ["male", "female", "other"] as const
export type Gender = (typeof GENDERS)[number]

export const SCHOOL_TYPES = ["government", "private"] as const
export type SchoolType = (typeof SCHOOL_TYPES)[number]

export const PARENT_STATUSES = ["both", "single", "parentless"] as const
export type ParentStatus = (typeof PARENT_STATUSES)[number]

export const SINGLE_REASONS = ["divorced", "separated", "deceased", "other"] as const
export type SingleReason = (typeof SINGLE_REASONS)[number]

export const SIBLING_ORDERS = ["elder", "younger"] as const
export const SIBLING_STATUSES = ["studying", "working"] as const

export const IMPAIRMENT_OWNERS = ["self", "parent"] as const
export const RESIDENCE_TYPES = ["own", "rental"] as const
export const ROOF_TYPES = ["concrete", "thatched", "tiled"] as const
export const OWNERSHIP_SOURCES = ["inheritance", "built", "other"] as const

export const USER_ROLES = ["super_admin", "admin", "viewer"] as const
export type UserRole = (typeof USER_ROLES)[number]

export const DOCUMENT_TYPES = [
  "student_photo",
  "aadhaar",
  "income",
  "community",
  "scholarship",
  "impairment",
  "other",
] as const
export type DocumentType = (typeof DOCUMENT_TYPES)[number]

export const PHOTO_BUCKET = "oes-student-photos"
export const DOCS_BUCKET = "oes-application-documents"

export function bucketForDocType(t: DocumentType): string {
  return t === "student_photo" ? PHOTO_BUCKET : DOCS_BUCKET
}

// Visual config for statuses (Tailwind classes + i18n key).
export const STATUS_CONFIG: Record<
  AppStatus,
  { labelKey: string; className: string }
> = {
  submitted: {
    labelKey: "status.submitted",
    className: "bg-blue-100 text-blue-800 border-blue-200",
  },
  under_review: {
    labelKey: "status.under_review",
    className: "bg-amber-100 text-amber-800 border-amber-200",
  },
  approved: {
    labelKey: "status.approved",
    className: "bg-emerald-100 text-emerald-800 border-emerald-200",
  },
  rejected: {
    labelKey: "status.rejected",
    className: "bg-rose-100 text-rose-800 border-rose-200",
  },
  needs_correction: {
    labelKey: "status.needs_correction",
    className: "bg-orange-100 text-orange-800 border-orange-200",
  },
}

export const FILE_MAX_BYTES = 5 * 1024 * 1024 // 5MB
export const ACCEPTED_MIME = [
  "image/jpeg",
  "image/jpg",
  "image/png",
  "application/pdf",
]
export const ACCEPTED_EXT = ".pdf,.jpg,.jpeg,.png"

// Tamil Nadu districts (primary catchment) + common option.
export const DISTRICTS = [
  "Ariyalur","Chengalpattu","Chennai","Coimbatore","Cuddalore","Dharmapuri",
  "Dindigul","Erode","Kallakurichi","Kancheepuram","Karur","Krishnagiri",
  "Madurai","Mayiladuthurai","Nagapattinam","Namakkal","Nilgiris","Perambalur",
  "Pudukkottai","Ramanathapuram","Ranipet","Salem","Sivaganga","Tenkasi",
  "Thanjavur","Theni","Thoothukudi","Tiruchirappalli","Tirunelveli","Tirupathur",
  "Tiruppur","Tiruvallur","Tiruvannamalai","Tiruvarur","Vellore","Viluppuram",
  "Virudhunagar","Other",
] as const

export const STATES = [
  "Tamil Nadu","Andhra Pradesh","Karnataka","Kerala","Puducherry","Telangana",
  "Other",
] as const
