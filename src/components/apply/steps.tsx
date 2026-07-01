"use client"

import { useEffect } from "react"
import { useFieldArray, type UseFormReturn } from "react-hook-form"
import { Plus, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { useT } from "@/lib/i18n/context"
import {
  TextField,
  NumberField,
  TextAreaField,
  SelectField,
  RadioField,
  BooleanRadioField,
  type Option,
} from "@/components/apply/fields"
import { DocumentUpload } from "@/components/apply/document-upload"
import {
  DISTRICTS,
  STATES,
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
} from "@/lib/constants"
import type { ApplicationFormValues, UploadedDoc } from "@/lib/validation/schemas"

type StepProps = { form: UseFormReturn<ApplicationFormValues> }

function opts(values: readonly string[], t: (k: string) => string, prefix: string): Option[] {
  return values.map((v) => ({ value: v, label: t(`${prefix}${v}`) }))
}
function plain(values: readonly string[]): Option[] {
  return values.map((v) => ({ value: v, label: v }))
}

/* ------------------------------ Step 1: Personal ------------------------------ */
export function PersonalStep({ form }: StepProps) {
  const t = useT()
  const c = form.control
  return (
    <div className="grid gap-5 sm:grid-cols-2">
      <TextField control={c} name="personal.full_name" label={t("f.fullName")} required />
      <TextField control={c} name="personal.contact_number" label={t("f.contactNumber")} required inputMode="tel" placeholder="9876543210" />
      <TextField control={c} name="personal.alt_contact_number" label={t("f.altContactNumber")} inputMode="tel" />
      <TextField control={c} name="personal.email" label={t("f.email")} type="email" inputMode="email" required />
      <TextField control={c} name="personal.dob" label={t("f.dob")} type="date" />
      <div className="sm:col-span-2">
        <RadioField control={c} name="personal.gender" label={t("f.gender")} options={opts(GENDERS, t, "f.gender.")} />
      </div>
      <TextField control={c} name="personal.town" label={t("f.town")} />
      <SelectField control={c} name="personal.district" label={t("f.district")} required placeholder={t("common.select")} options={plain(DISTRICTS)} />
      <SelectField control={c} name="personal.state" label={t("f.state")} required placeholder={t("common.select")} options={plain(STATES)} />
      <TextField control={c} name="personal.pincode" label={t("f.pincode")} required inputMode="numeric" placeholder="600001" />
    </div>
  )
}

/* ------------------------------ Step 2: Education ------------------------------ */
export function EducationStep({ form }: StepProps) {
  const t = useT()
  const c = form.control
  return (
    <div className="grid gap-5 sm:grid-cols-2">
      <TextField control={c} name="education.school_name" label={t("f.schoolName")} required />
      <RadioField control={c} name="education.school_type" label={t("f.schoolType")} options={opts(SCHOOL_TYPES, t, "f.")} />
      <TextField control={c} name="education.institution_name" label={t("f.institutionName")} required />
      <RadioField control={c} name="education.institution_type" label={t("f.institutionType")} options={opts(SCHOOL_TYPES, t, "f.")} />
      <TextField control={c} name="education.course_name" label={t("f.courseName")} required />
      <NumberField control={c} name="education.course_duration" label={t("f.courseDuration")} required min={1} max={10} />
      <NumberField control={c} name="education.current_year" label={t("f.currentYear")} required min={1} max={10} />
      <NumberField control={c} name="education.current_semester" label={t("f.currentSemester")} min={0} max={20} />
      <div className="sm:col-span-2">
        <TextAreaField control={c} name="education.scholarship_details" label={t("f.scholarshipDetails")} placeholder={t("common.optional")} />
      </div>
    </div>
  )
}

/* ------------------------------ Step 3: Family ------------------------------ */
export function FamilyStep({ form }: StepProps) {
  const t = useT()
  const c = form.control
  const parentStatus = form.watch("family.parent_status")
  return (
    <div className="grid gap-5 sm:grid-cols-2">
      <div className="sm:col-span-2">
        <RadioField control={c} name="family.parent_status" label={t("f.parentStatus")} required options={opts(PARENT_STATUSES, t, "f.parentStatus.")} />
      </div>
      {parentStatus === "single" && (
        <SelectField control={c} name="family.single_parent_reason" label={t("f.singleParentReason")} required placeholder={t("common.select")} options={opts(SINGLE_REASONS, t, "f.reason.")} />
      )}
      <TextField control={c} name="family.father_name" label={t("f.fatherName")} />
      <TextField control={c} name="family.mother_name" label={t("f.motherName")} />
      <TextField control={c} name="family.guardian_name" label={t("f.guardianName")} required={parentStatus === "parentless"} />
      <TextField control={c} name="family.guardian_contact" label={t("f.guardianContact")} inputMode="tel" />
      <TextField control={c} name="family.guardian_occupation" label={t("f.guardianOccupation")} />
      <NumberField control={c} name="family.annual_income" label={t("f.annualIncome")} min={0} />
    </div>
  )
}

/* ------------------------------ Step 4: Siblings ------------------------------ */
export function SiblingsStep({ form }: StepProps) {
  const t = useT()
  const c = form.control
  const { fields, append, remove } = useFieldArray({ control: c, name: "siblings.siblings" })
  const count = form.watch("siblings.number_of_siblings")

  // Keep the dynamic rows in sync with the requested count.
  useEffect(() => {
    const n = Number(count) || 0
    if (n > fields.length) {
      for (let i = fields.length; i < n; i++) {
        append({ name: "", birth_order: "younger", occupation: "studying", details: "" })
      }
    } else if (n < fields.length) {
      for (let i = fields.length; i > n; i--) remove(i - 1)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [count])

  return (
    <div className="grid gap-5">
      <div className="max-w-xs">
        <NumberField control={c} name="siblings.number_of_siblings" label={t("f.numberOfSiblings")} min={0} max={20} />
      </div>
      {fields.map((field, i) => (
        <div key={field.id} className="rounded-lg border bg-muted/20 p-4">
          <div className="mb-3 flex items-center justify-between">
            <span className="text-sm font-semibold">{t("f.sibling")} {i + 1}</span>
            <Button type="button" variant="ghost" size="sm" onClick={() => { remove(i); form.setValue("siblings.number_of_siblings", fields.length - 1) }}>
              <Trash2 className="mr-1 h-4 w-4" /> {t("f.removeSibling")}
            </Button>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <TextField control={c} name={`siblings.siblings.${i}.name`} label={t("f.siblingName")} required />
            <TextField control={c} name={`siblings.siblings.${i}.details`} label={t("f.siblingDetails")} />
            <RadioField control={c} name={`siblings.siblings.${i}.birth_order`} label={t("f.siblingOrder")} options={opts(SIBLING_ORDERS, t, "f.siblingOrder.")} />
            <RadioField control={c} name={`siblings.siblings.${i}.occupation`} label={t("f.siblingStatus")} options={opts(SIBLING_STATUSES, t, "f.siblingStatus.")} />
          </div>
        </div>
      ))}
      <div>
        <Button type="button" variant="outline" size="sm" onClick={() => { append({ name: "", birth_order: "younger", occupation: "studying", details: "" }); form.setValue("siblings.number_of_siblings", fields.length + 1) }}>
          <Plus className="mr-1 h-4 w-4" /> {t("f.addSibling")}
        </Button>
      </div>
    </div>
  )
}

/* ------------------------------ Step 5: Impairment ------------------------------ */
export function ImpairmentStep({ form }: StepProps) {
  const t = useT()
  const c = form.control
  const has = form.watch("impairment.has_impairment")
  const docs = (form.watch("documents") ?? []) as UploadedDoc[]
  const cert = docs.find((d) => d.document_type === "impairment")

  function setDoc(doc: UploadedDoc | undefined) {
    const others = docs.filter((d) => d.document_type !== "impairment")
    form.setValue("documents", doc ? [...others, doc] : others)
  }

  return (
    <div className="grid gap-5">
      <BooleanRadioField
        control={c}
        name="impairment.has_impairment"
        label={t("f.hasImpairment")}
        yesLabel={t("common.yes")}
        noLabel={t("common.no")}
      />
      {has && (
        <div className="grid gap-5 rounded-lg border bg-muted/20 p-4 sm:grid-cols-2">
          <RadioField control={c} name="impairment.belongs_to" label={t("f.impairmentBelongsTo")} options={opts(IMPAIRMENT_OWNERS, t, "f.impairmentBelongsTo.")} />
          <TextField control={c} name="impairment.impairment_type" label={t("f.impairmentType")} required />
          <div className="sm:col-span-2">
            <TextAreaField control={c} name="impairment.description" label={t("f.impairmentDescription")} required />
          </div>
          <div className="sm:col-span-2">
            <DocumentUpload documentType="impairment" label={t("f.impairmentCertificate")} value={cert} onChange={setDoc} />
          </div>
        </div>
      )}
    </div>
  )
}

/* ------------------------------ Step 6: Residence ------------------------------ */
export function ResidenceStep({ form }: StepProps) {
  const t = useT()
  const c = form.control
  const type = form.watch("residence.residence_type")
  return (
    <div className="grid gap-5 sm:grid-cols-2">
      <div className="sm:col-span-2">
        <RadioField control={c} name="residence.residence_type" label={t("f.residenceType")} required options={opts(RESIDENCE_TYPES, t, "f.residenceType.")} />
      </div>
      {type === "own" && (
        <>
          <SelectField control={c} name="residence.roof_type" label={t("f.roofType")} placeholder={t("common.select")} options={opts(ROOF_TYPES, t, "f.roofType.")} />
          <SelectField control={c} name="residence.ownership_source" label={t("f.ownershipSource")} placeholder={t("common.select")} options={opts(OWNERSHIP_SOURCES, t, "f.ownershipSource.")} />
        </>
      )}
      <div className="sm:col-span-2">
        <TextField control={c} name="residence.door_street" label={t("f.doorStreet")} required />
      </div>
      <TextField control={c} name="residence.town" label={t("f.town")} />
      <SelectField control={c} name="residence.district" label={t("f.district")} required placeholder={t("common.select")} options={plain(DISTRICTS)} />
      <SelectField control={c} name="residence.state" label={t("f.state")} required placeholder={t("common.select")} options={plain(STATES)} />
      <TextField control={c} name="residence.pincode" label={t("f.pincode")} required inputMode="numeric" />
    </div>
  )
}

/* ------------------------------ Step 7: Review ------------------------------ */
export { ReviewStep } from "@/components/apply/review-step"

export { Separator }
