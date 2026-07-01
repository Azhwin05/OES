"use client"

import type { UseFormReturn } from "react-hook-form"
import { Pencil } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { CheckboxField } from "@/components/apply/fields"
import { useT, useLanguage } from "@/lib/i18n/context"
import type { ApplicationFormValues } from "@/lib/validation/schemas"

type Props = {
  form: UseFormReturn<ApplicationFormValues>
  onEditStep: (i: number) => void
}

export function ReviewStep({ form, onEditStep }: Props) {
  const t = useT()
  const { lang } = useLanguage()
  const v = form.getValues()

  const row = (label: string, value?: unknown) =>
    value === undefined || value === null || value === "" ? null : (
      <div key={label} className="flex justify-between gap-4 py-1 text-sm">
        <span className="text-muted-foreground">{label}</span>
        <span className="text-right font-medium">{String(value)}</span>
      </div>
    )

  const tr = (key?: string | null, prefix = "") =>
    key ? t(`${prefix}${key}`) : undefined

  return (
    <div className="grid gap-5">
      <p className={`text-muted-foreground text-sm ${lang === "ta" ? "font-tamil" : ""}`}>
        {t("form.review.subtitle")}
      </p>

      <Section title={t("detail.personal")} onEdit={() => onEditStep(0)}>
        {row(t("f.fullName"), v.personal?.full_name)}
        {row(t("f.contactNumber"), v.personal?.contact_number)}
        {row(t("f.email"), v.personal?.email)}
        {row(t("f.dob"), v.personal?.dob)}
        {row(t("f.gender"), tr(v.personal?.gender, "f.gender."))}
        {row(t("f.district"), v.personal?.district)}
        {row(t("f.pincode"), v.personal?.pincode)}
      </Section>

      <Section title={t("detail.education")} onEdit={() => onEditStep(1)}>
        {row(t("f.schoolName"), v.education?.school_name)}
        {row(t("f.schoolType"), tr(v.education?.school_type, "f."))}
        {row(t("f.institutionName"), v.education?.institution_name)}
        {row(t("f.courseName"), v.education?.course_name)}
        {row(t("f.courseDuration"), v.education?.course_duration)}
        {row(t("f.currentYear"), v.education?.current_year)}
        {row(t("f.scholarshipDetails"), v.education?.scholarship_details)}
      </Section>

      <Section title={t("detail.family")} onEdit={() => onEditStep(2)}>
        {row(t("f.parentStatus"), tr(v.family?.parent_status, "f.parentStatus."))}
        {row(t("f.fatherName"), v.family?.father_name)}
        {row(t("f.motherName"), v.family?.mother_name)}
        {row(t("f.guardianName"), v.family?.guardian_name)}
        {row(t("f.annualIncome"), v.family?.annual_income)}
      </Section>

      <Section title={t("detail.siblings")} onEdit={() => onEditStep(3)}>
        {row(t("f.numberOfSiblings"), v.siblings?.number_of_siblings)}
        {(v.siblings?.siblings ?? []).map((s, i) =>
          row(`${t("f.sibling")} ${i + 1}`, [s.name, tr(s.birth_order, "f.siblingOrder."), tr(s.occupation, "f.siblingStatus.")].filter(Boolean).join(" · "))
        )}
      </Section>

      <Section title={t("detail.impairment")} onEdit={() => onEditStep(4)}>
        {row(t("f.hasImpairment"), v.impairment?.has_impairment ? t("common.yes") : t("common.no"))}
        {row(t("f.impairmentType"), v.impairment?.impairment_type)}
        {row(t("f.impairmentDescription"), v.impairment?.description)}
      </Section>

      <Section title={t("detail.residence")} onEdit={() => onEditStep(5)}>
        {row(t("f.residenceType"), tr(v.residence?.residence_type, "f.residenceType."))}
        {row(t("f.doorStreet"), v.residence?.door_street)}
        {row(t("f.district"), v.residence?.district)}
        {row(t("f.pincode"), v.residence?.pincode)}
      </Section>

      <Separator />

      <div className="rounded-lg border bg-accent/30 p-4">
        <CheckboxField
          control={form.control}
          name="declaration"
          label={t("form.review.declaration")}
        />
      </div>
    </div>
  )
}

function Section({
  title,
  onEdit,
  children,
}: {
  title: string
  onEdit: () => void
  children: React.ReactNode
}) {
  return (
    <div className="rounded-lg border p-4">
      <div className="mb-2 flex items-center justify-between">
        <h3 className="font-semibold">{title}</h3>
        <Button type="button" variant="ghost" size="sm" onClick={onEdit}>
          <Pencil className="mr-1 h-3.5 w-3.5" />
        </Button>
      </div>
      <div className="divide-y">{children}</div>
    </div>
  )
}
