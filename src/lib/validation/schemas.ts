import { z } from "zod"
import {
  GENDERS,
  SCHOOL_TYPES,
  PARENT_STATUSES,
  SINGLE_REASONS,
  SIBLING_ORDERS,
  SIBLING_STATUSES,
  IMPAIRMENT_OWNERS,
  RESIDENCE_TYPES,
  ROOF_TYPES,
  OWNERSHIP_SOURCES,
  DOCUMENT_TYPES,
} from "@/lib/constants"

// Validation messages are i18n KEYS; FormMessage translates them at render time.
const phoneRegex = /^[6-9]\d{9}$/
const pinRegex = /^\d{6}$/

// `{ error }` covers the undefined/empty type errors too (Zod v4).
const requiredText = z.string({ error: "err.required" }).min(1, "err.required")
const phone = z
  .string({ error: "err.invalidPhone" })
  .regex(phoneRegex, "err.invalidPhone")
const optionalPhone = z
  .string()
  .optional()
  .or(z.literal(""))
  .refine((v) => !v || phoneRegex.test(v), "err.invalidPhone")
const pin = z.string({ error: "err.invalidPin" }).regex(pinRegex, "err.invalidPin")
const optionalEmail = z
  .string()
  .optional()
  .or(z.literal(""))
  .refine((v) => !v || z.string().email().safeParse(v).success, "err.invalidEmail")

// ---- Step 1: Personal ----
export const personalSchema = z.object({
  full_name: requiredText,
  name_tamil: z.string().optional().or(z.literal("")),
  contact_number: phone,
  alt_contact_number: optionalPhone,
  email: optionalEmail,
  dob: z.string().optional().or(z.literal("")),
  gender: z.enum(GENDERS).optional(),
  town: z.string().optional().or(z.literal("")),
  district: requiredText,
  state: requiredText,
  pincode: pin,
})

// ---- Step 2: Education ----
export const educationSchema = z
  .object({
    school_name: requiredText,
    school_type: z.enum(SCHOOL_TYPES).optional(),
    institution_name: requiredText,
    institution_type: z.enum(SCHOOL_TYPES).optional(),
    course_name: requiredText,
    course_duration: z.coerce.number().int().min(1).max(10),
    current_year: z.coerce.number().int().min(1).max(10),
    current_semester: z.coerce.number().int().min(0).max(20).optional(),
    scholarship_details: z.string().optional().or(z.literal("")),
    has_scholarship: z.boolean().default(false),
  })
  .refine((d) => d.current_year <= d.course_duration, {
    message: "err.yearExceedsDuration",
    path: ["current_year"],
  })

// ---- Step 3: Family ----
export const familySchema = z
  .object({
    parent_status: z.enum(PARENT_STATUSES, { message: "err.required" }),
    single_parent_reason: z.enum(SINGLE_REASONS).optional(),
    father_name: z.string().optional().or(z.literal("")),
    mother_name: z.string().optional().or(z.literal("")),
    guardian_name: z.string().optional().or(z.literal("")),
    guardian_contact: optionalPhone,
    guardian_occupation: z.string().optional().or(z.literal("")),
    annual_income: z.coerce.number().min(0).optional(),
  })
  .refine(
    (d) => d.parent_status !== "single" || !!d.single_parent_reason,
    { message: "err.required", path: ["single_parent_reason"] }
  )
  .refine(
    (d) => d.parent_status !== "parentless" || !!d.guardian_name?.trim(),
    { message: "err.guardianRequired", path: ["guardian_name"] }
  )

// ---- Step 4: Siblings ----
export const siblingSchema = z.object({
  name: requiredText,
  birth_order: z.enum(SIBLING_ORDERS, { message: "err.required" }),
  occupation: z.enum(SIBLING_STATUSES, { message: "err.required" }),
  details: z.string().optional().or(z.literal("")),
})

export const siblingsSchema = z
  .object({
    number_of_siblings: z.coerce.number().int().min(0).max(20),
    siblings: z.array(siblingSchema),
  })
  .refine((d) => d.siblings.length === d.number_of_siblings, {
    message: "err.siblingsRequired",
    path: ["siblings"],
  })

// ---- Step 5: Impairment ----
export const impairmentSchema = z
  .object({
    has_impairment: z.boolean().default(false),
    belongs_to: z.enum(IMPAIRMENT_OWNERS).optional(),
    impairment_type: z.string().optional().or(z.literal("")),
    description: z.string().optional().or(z.literal("")),
  })
  .refine(
    (d) =>
      !d.has_impairment ||
      (!!d.impairment_type?.trim() && !!d.description?.trim()),
    { message: "err.impairmentRequired", path: ["impairment_type"] }
  )

// ---- Step 6: Residence ----
export const residenceSchema = z.object({
  residence_type: z.enum(RESIDENCE_TYPES, { message: "err.required" }),
  roof_type: z.enum(ROOF_TYPES).optional(),
  ownership_source: z.enum(OWNERSHIP_SOURCES).optional(),
  door_street: requiredText,
  town: z.string().optional().or(z.literal("")),
  district: requiredText,
  state: requiredText,
  pincode: pin,
})

// ---- Step 7: Documents (metadata of uploaded files) ----
export const uploadedDocSchema = z.object({
  document_type: z.enum(DOCUMENT_TYPES),
  bucket: z.string(),
  path: z.string(),
  file_name: z.string().optional(),
  mime_type: z.string().optional(),
  size_bytes: z.number().optional(),
})

export const documentsSchema = z.object({
  documents: z.array(uploadedDocSchema).default([]),
})

// ---- Step 8: Review ----
export const reviewSchema = z.object({
  declaration: z
    .boolean()
    .refine((v) => v === true, { message: "err.declarationRequired" }),
})

// ---- Full application (server-side validation) ----
export const fullApplicationSchema = z.object({
  personal: personalSchema,
  education: educationSchema,
  family: familySchema,
  siblings: siblingsSchema,
  impairment: impairmentSchema,
  residence: residenceSchema,
  documents: z.array(uploadedDocSchema).default([]),
  declaration: z
    .boolean()
    .refine((v) => v === true, { message: "err.declarationRequired" }),
})

export type PersonalValues = z.infer<typeof personalSchema>
export type EducationValues = z.infer<typeof educationSchema>
export type FamilyValues = z.infer<typeof familySchema>
export type SiblingsValues = z.infer<typeof siblingsSchema>
export type ImpairmentValues = z.infer<typeof impairmentSchema>
export type ResidenceValues = z.infer<typeof residenceSchema>
export type UploadedDoc = z.infer<typeof uploadedDocSchema>
export type FullApplication = z.infer<typeof fullApplicationSchema>
export type ApplicationFormValues = z.input<typeof fullApplicationSchema>
