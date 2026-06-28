// Hand-authored DB types matching supabase/migrations. Regenerate with the
// Supabase CLI / MCP (`generate_typescript_types`) once the schema is applied.

import type {
  AppStatus,
  Gender,
  SchoolType,
  ParentStatus,
  SingleReason,
  UserRole,
  DocumentType,
} from "@/lib/constants"

type Timestamps = {
  created_at: string
  updated_at: string
}

export type ProfileRow = {
  id: string
  email: string
  full_name: string | null
  role: UserRole
  must_change_password: boolean
} & Timestamps

export type ApplicationRow = {
  id: string
  reference_number: string
  status: AppStatus
  primary_phone: string
  applicant_name: string
  submitted_at: string
  created_by: string | null
  updated_by: string | null
  deleted_at: string | null
} & Timestamps

export type PersonalRow = {
  id: string
  application_id: string
  full_name: string
  name_tamil: string | null
  contact_number: string
  alt_contact_number: string | null
  email: string | null
  dob: string | null
  gender: Gender | null
  town: string | null
  district: string | null
  state: string | null
  pincode: string | null
} & Timestamps

export type EducationRow = {
  id: string
  application_id: string
  school_name: string | null
  school_type: SchoolType | null
  institution_name: string | null
  institution_type: SchoolType | null
  course_name: string | null
  course_duration: number | null
  current_year: number | null
  current_semester: number | null
  scholarship_details: string | null
  has_scholarship: boolean
} & Timestamps

export type FamilyRow = {
  id: string
  application_id: string
  parent_status: ParentStatus | null
  single_parent_reason: SingleReason | null
  father_name: string | null
  mother_name: string | null
  guardian_name: string | null
  guardian_contact: string | null
  guardian_occupation: string | null
  annual_income: number | null
} & Timestamps

export type SiblingRow = {
  id: string
  application_id: string
  name: string | null
  birth_order: "elder" | "younger" | null
  occupation: "studying" | "working" | null
  details: string | null
} & Timestamps

export type ImpairmentRow = {
  id: string
  application_id: string
  has_impairment: boolean
  belongs_to: "self" | "parent" | null
  impairment_type: string | null
  description: string | null
} & Timestamps

export type ResidenceRow = {
  id: string
  application_id: string
  residence_type: "own" | "rental" | null
  roof_type: "concrete" | "thatched" | "tiled" | null
  ownership_source: "inheritance" | "built" | "other" | null
  door_street: string | null
  town: string | null
  district: string | null
  state: string | null
  pincode: string | null
} & Timestamps

export type DocumentRow = {
  id: string
  application_id: string
  document_type: DocumentType
  bucket: string
  path: string
  file_name: string | null
  mime_type: string | null
  size_bytes: number | null
  deleted_at: string | null
} & Timestamps

export type StatusHistoryRow = {
  id: string
  application_id: string
  from_status: AppStatus | null
  to_status: AppStatus
  note: string | null
  changed_by: string | null
  created_at: string
}

export type RemarkRow = {
  id: string
  application_id: string
  remark: string
  created_by: string | null
  deleted_at: string | null
} & Timestamps

export type AuditRow = {
  id: string
  action: string
  entity: string | null
  entity_id: string | null
  details: Record<string, unknown> | null
  actor_id: string | null
  actor_email: string | null
  created_at: string
}

type TableDef<Row, Insert = Partial<Row>, Update = Partial<Row>> = {
  Row: Row
  Insert: Insert
  Update: Update
  Relationships: []
}

export type Database = {
  public: {
    Tables: {
      oes_profiles: TableDef<ProfileRow>
      oes_applications: TableDef<ApplicationRow>
      oes_personal_details: TableDef<PersonalRow>
      oes_education_details: TableDef<EducationRow>
      oes_family_details: TableDef<FamilyRow>
      oes_siblings: TableDef<SiblingRow>
      oes_impairment_details: TableDef<ImpairmentRow>
      oes_residence_details: TableDef<ResidenceRow>
      oes_documents: TableDef<DocumentRow>
      oes_application_status_history: TableDef<StatusHistoryRow>
      oes_admin_remarks: TableDef<RemarkRow>
      oes_audit_logs: TableDef<AuditRow>
    }
    Views: Record<string, never>
    Functions: {
      oes_track_application: {
        Args: { p_reference: string; p_phone: string }
        Returns: {
          reference_number: string
          applicant_name: string
          status: AppStatus
          submitted_at: string
          latest_remark: string | null
        }[]
      }
    }
    Enums: {
      oes_app_status: AppStatus
      oes_user_role: UserRole
    }
    CompositeTypes: Record<string, never>
  }
}
