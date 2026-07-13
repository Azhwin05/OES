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

// --- Secondary data collection (post-shortlist document upload) ------------
export const SECONDARY_DOCUMENT_TYPES = [
  "aadhaar",
  "student_id",
  "marksheet_10",
  "marksheet_12",
  "first_graduate",
  "scholarship",
  "parent_aadhaar",
  "income_proof",
  "single_parent_proof",
  "disability_cert",
  "address_proof",
  "eb_bill",
] as const
export type SecondaryDocumentType = (typeof SECONDARY_DOCUMENT_TYPES)[number]

// Mandatory per the client's checklist — only 12th marksheet and address
// proof are optional.
export const SECONDARY_DOCUMENT_MANDATORY: Record<SecondaryDocumentType, boolean> = {
  aadhaar: true,
  student_id: true,
  marksheet_10: true,
  marksheet_12: false,
  first_graduate: true,
  scholarship: true,
  parent_aadhaar: true,
  income_proof: true,
  single_parent_proof: true,
  disability_cert: true,
  address_proof: false,
  eb_bill: true,
}

export const SECONDARY_DOCUMENT_LABELS: Record<SecondaryDocumentType, string> = {
  aadhaar: "Aadhar card of the applicant",
  student_id: "Student ID of the current institution",
  marksheet_10: "10th Mark sheet",
  marksheet_12: "12th Mark sheet",
  first_graduate: "First graduate certificate (if yes)",
  scholarship: "Proof of availing scholarship (if any)",
  parent_aadhaar: "Aadhar of the parent (Mother / Father / Guardian)",
  income_proof: "Proof of income — parent / sibling (if any)",
  single_parent_proof: "If single parent — deceased / separated proof",
  disability_cert: "Disability certificate (if yes)",
  address_proof: "Address proof",
  eb_bill: "EB Bill",
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
