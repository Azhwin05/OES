"use client"

import { useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { LogOut, Upload, CheckCircle2, User, GraduationCap, Users } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { createClient } from "@/lib/supabase/client"
import { validateFile } from "@/lib/upload"
import {
  SECONDARY_DOCUMENT_LABELS,
  DOCS_BUCKET,
  INCOME_PROOF_FOR,
  INCOME_PROOF_FOR_LABELS,
  SINGLE_PARENT_LIVING_WITH,
  SINGLE_PARENT_LIVING_WITH_LABELS,
  SINGLE_PARENT_REASONS,
  SINGLE_PARENT_REASON_LABELS,
  computeSecondaryMandatory,
  type SecondaryDocumentType,
  type SecondaryAnswers,
  type IncomeProofFor,
  type SingleParentLivingWith,
  type SingleParentReasonSecondary,
} from "@/lib/constants"
import { submitSecondaryDocuments, secondaryLogout, type SecondaryDocUpload } from "./actions"

async function uploadSecondaryFile(
  referenceNumber: string,
  type: SecondaryDocumentType,
  slot: string,
  file: File
): Promise<string> {
  const supabase = createClient()
  const safeName = file.name.replace(/[^\w.\-]+/g, "_")
  const path = `applications/${referenceNumber}/secondary/${type}/${slot}_${Date.now()}_${safeName}`
  const { error } = await supabase.storage
    .from(DOCS_BUCKET)
    .upload(path, file, { upsert: false, contentType: file.type })
  if (error) throw error
  return path
}

type Row = Record<string, unknown> | null

type Props = {
  application: {
    reference_number: string
    applicant_name: string
    status: string
    secondary_submitted_at: string | null
  }
  personal: Row
  education: Row
  family: Row
  siblings: Row[]
  impairment: Row
  existingDocs: { document_type: string; file_name: string | null; created_at: string }[]
  existingAnswers: Row
}

type UploadState = {
  status: "idle" | "uploading" | "done" | "error"
  fileName?: string
  doc?: SecondaryDocUpload
}

type ChecklistRow = {
  key: string
  type: SecondaryDocumentType
  label: string
}

function str(v: unknown): string {
  return typeof v === "string" && v.trim() ? v : "—"
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium">{value}</span>
    </div>
  )
}

function YesNoToggle({
  value,
  onChange,
}: {
  value: boolean | null
  onChange: (v: boolean) => void
}) {
  return (
    <div className="flex gap-2">
      <Button
        type="button"
        size="sm"
        variant={value === true ? "default" : "outline"}
        onClick={() => onChange(true)}
      >
        Yes
      </Button>
      <Button
        type="button"
        size="sm"
        variant={value === false ? "default" : "outline"}
        onClick={() => onChange(false)}
      >
        No
      </Button>
    </div>
  )
}

export function SecondaryPortalClient({
  application,
  personal,
  education,
  family,
  siblings,
  impairment,
  existingDocs,
  existingAnswers,
}: Props) {
  const router = useRouter()
  const hasImpairment = !!impairment?.has_impairment
  const isSingleParent = family?.parent_status === "single"

  const [firstGraduate, setFirstGraduate] = useState<boolean | null>(
    (existingAnswers?.first_graduate as boolean | null) ?? null
  )
  const [hasOtherScholarship, setHasOtherScholarship] = useState<boolean | null>(
    (existingAnswers?.has_other_scholarship as boolean | null) ?? null
  )
  const [incomeProofFor, setIncomeProofFor] = useState<IncomeProofFor[]>(
    (existingAnswers?.income_proof_for as IncomeProofFor[] | null) ?? []
  )
  const [livingWith, setLivingWith] = useState<SingleParentLivingWith | null>(
    (existingAnswers?.single_parent_living_with as SingleParentLivingWith | null) ?? null
  )
  const [reason, setReason] = useState<SingleParentReasonSecondary | null>(
    (existingAnswers?.single_parent_reason as SingleParentReasonSecondary | null) ?? null
  )

  const [uploads, setUploads] = useState<Record<string, UploadState>>({})
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(!!application.secondary_submitted_at)
  const [error, setError] = useState<string | null>(null)
  const [missing, setMissing] = useState<SecondaryDocumentType[]>([])

  const alreadyUploadedTypes = useMemo(
    () => new Set(existingDocs.map((d) => d.document_type)),
    [existingDocs]
  )

  const answers: SecondaryAnswers = {
    firstGraduate,
    hasOtherScholarship,
    incomeProofFor,
    singleParentLivingWith: livingWith,
    singleParentReason: reason,
  }

  const mandatory = computeSecondaryMandatory(answers, hasImpairment)

  const checklist: ChecklistRow[] = useMemo(() => {
    const rows: ChecklistRow[] = [
      { key: "aadhaar", type: "aadhaar", label: SECONDARY_DOCUMENT_LABELS.aadhaar },
      { key: "student_id", type: "student_id", label: SECONDARY_DOCUMENT_LABELS.student_id },
      { key: "marksheet_10", type: "marksheet_10", label: SECONDARY_DOCUMENT_LABELS.marksheet_10 },
      { key: "marksheet_12", type: "marksheet_12", label: SECONDARY_DOCUMENT_LABELS.marksheet_12 },
      { key: "parent_aadhaar", type: "parent_aadhaar", label: SECONDARY_DOCUMENT_LABELS.parent_aadhaar },
    ]

    if (firstGraduate === true) {
      rows.push({ key: "first_graduate", type: "first_graduate", label: SECONDARY_DOCUMENT_LABELS.first_graduate })
    }
    if (hasOtherScholarship === true) {
      rows.push({ key: "scholarship", type: "scholarship", label: SECONDARY_DOCUMENT_LABELS.scholarship })
    }
    for (const who of incomeProofFor) {
      rows.push({
        key: `income_proof:${who}`,
        type: "income_proof",
        label: `${SECONDARY_DOCUMENT_LABELS.income_proof} — ${INCOME_PROOF_FOR_LABELS[who]}`,
      })
    }
    if (hasImpairment) {
      rows.push({ key: "disability_cert", type: "disability_cert", label: SECONDARY_DOCUMENT_LABELS.disability_cert })
    }
    if (reason === "deceased") {
      rows.push({ key: "death_certificate", type: "death_certificate", label: SECONDARY_DOCUMENT_LABELS.death_certificate })
      rows.push({ key: "vao_letter", type: "vao_letter", label: SECONDARY_DOCUMENT_LABELS.vao_letter })
    } else if (reason === "legally_separated") {
      rows.push({ key: "legal_separation_proof", type: "legal_separation_proof", label: SECONDARY_DOCUMENT_LABELS.legal_separation_proof })
    } else if (reason === "separated") {
      rows.push({ key: "vao_letter", type: "vao_letter", label: SECONDARY_DOCUMENT_LABELS.vao_letter })
    }

    rows.push({ key: "address_proof", type: "address_proof", label: SECONDARY_DOCUMENT_LABELS.address_proof })
    rows.push({ key: "eb_bill", type: "eb_bill", label: SECONDARY_DOCUMENT_LABELS.eb_bill })

    return rows
  }, [firstGraduate, hasOtherScholarship, incomeProofFor, hasImpairment, reason])

  async function onFileChange(row: ChecklistRow, file: File | undefined) {
    if (!file) return
    const err = validateFile(file)
    if (err) {
      setUploads((u) => ({ ...u, [row.key]: { status: "error" } }))
      return
    }
    setUploads((u) => ({ ...u, [row.key]: { status: "uploading", fileName: file.name } }))
    try {
      const path = await uploadSecondaryFile(application.reference_number, row.type, row.key, file)
      setUploads((u) => ({
        ...u,
        [row.key]: {
          status: "done",
          fileName: file.name,
          doc: {
            document_type: row.type,
            bucket: DOCS_BUCKET,
            path,
            file_name: file.name,
            mime_type: file.type,
            size_bytes: file.size,
          },
        },
      }))
    } catch {
      setUploads((u) => ({ ...u, [row.key]: { status: "error", fileName: file.name } }))
    }
  }

  function toggleIncomeProofFor(who: IncomeProofFor) {
    setIncomeProofFor((cur) =>
      cur.includes(who) ? cur.filter((w) => w !== who) : [...cur, who]
    )
  }

  async function onSubmit() {
    setSubmitting(true)
    setError(null)
    setMissing([])
    try {
      if (incomeProofFor.length === 0) {
        setError("Please select who the income proof is for.")
        return
      }
      if (isSingleParent && (!livingWith || !reason)) {
        setError("Please answer the single-parent questions.")
        return
      }
      const docs = Object.values(uploads)
        .filter((u): u is UploadState & { doc: SecondaryDocUpload } => !!u.doc)
        .map((u) => u.doc)
      const result = await submitSecondaryDocuments(answers, docs)
      if (!result.ok) {
        setError(
          result.error === "missing_mandatory"
            ? "Please upload all mandatory documents before submitting."
            : result.error === "missing_income_proof_for"
              ? "Please select who the income proof is for."
              : "Something went wrong. Please try again."
        )
        setMissing(result.missing ?? [])
        return
      }
      setSubmitted(true)
    } finally {
      setSubmitting(false)
    }
  }

  async function onLogout() {
    await secondaryLogout()
    router.push("/oes/secondary/login")
    router.refresh()
  }

  if (submitted) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-16 text-center">
        <CheckCircle2 className="mx-auto h-12 w-12 text-emerald-600" />
        <h1 className="mt-4 text-2xl font-bold">Documents submitted</h1>
        <p className="text-muted-foreground mt-2">
          Thank you, {application.applicant_name}. We&apos;ve received your secondary data
          submission for {application.reference_number}.
        </p>
        <Button variant="outline" className="mt-6" onClick={onLogout}>
          <LogOut className="mr-1 h-4 w-4" />
          Log out
        </Button>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Secondary Data Submission</h1>
          <p className="text-muted-foreground mt-1 font-mono text-sm">
            {application.reference_number}
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={onLogout}>
          <LogOut className="mr-1 h-4 w-4" />
          Log out
        </Button>
      </div>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <User className="h-4 w-4" /> Your details on file
          </CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 text-sm">
          <SummaryRow label="Name" value={application.applicant_name} />
          <SummaryRow label="Contact" value={str(personal?.contact_number)} />
          <SummaryRow label="District" value={str(personal?.district)} />
          <Separator />
          <div className="flex items-center gap-2 text-muted-foreground">
            <GraduationCap className="h-4 w-4" /> Education
          </div>
          <SummaryRow label="Institution" value={str(education?.institution_name)} />
          <SummaryRow label="Course" value={str(education?.course_name)} />
          <Separator />
          <div className="flex items-center gap-2 text-muted-foreground">
            <Users className="h-4 w-4" /> Family
          </div>
          <SummaryRow label="Father" value={str(family?.father_name)} />
          <SummaryRow label="Mother" value={str(family?.mother_name)} />
          <SummaryRow label="Guardian" value={str(family?.guardian_name)} />
          <SummaryRow label="Siblings" value={String(siblings.length)} />
        </CardContent>
      </Card>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-base">A few questions</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-6">
          <div className="flex items-center justify-between gap-4">
            <span className="text-sm font-medium">Are you the first graduate in your family?</span>
            <YesNoToggle value={firstGraduate} onChange={setFirstGraduate} />
          </div>
          <div className="flex items-center justify-between gap-4">
            <span className="text-sm font-medium">Are you availing any other scholarship?</span>
            <YesNoToggle value={hasOtherScholarship} onChange={setHasOtherScholarship} />
          </div>
          <div>
            <span className="text-sm font-medium">Proof of income is for (select all that apply)</span>
            <div className="mt-2 flex flex-wrap gap-2">
              {INCOME_PROOF_FOR.map((who) => (
                <Button
                  key={who}
                  type="button"
                  size="sm"
                  variant={incomeProofFor.includes(who) ? "default" : "outline"}
                  onClick={() => toggleIncomeProofFor(who)}
                >
                  {INCOME_PROOF_FOR_LABELS[who]}
                </Button>
              ))}
            </div>
          </div>

          {isSingleParent && (
            <>
              <Separator />
              <div>
                <span className="text-sm font-medium">Currently living with</span>
                <div className="mt-2 flex flex-wrap gap-2">
                  {SINGLE_PARENT_LIVING_WITH.map((w) => (
                    <Button
                      key={w}
                      type="button"
                      size="sm"
                      variant={livingWith === w ? "default" : "outline"}
                      onClick={() => setLivingWith(w)}
                    >
                      {SINGLE_PARENT_LIVING_WITH_LABELS[w]}
                    </Button>
                  ))}
                </div>
              </div>
              <div>
                <span className="text-sm font-medium">Reason</span>
                <div className="mt-2 flex flex-wrap gap-2">
                  {SINGLE_PARENT_REASONS.map((r) => (
                    <Button
                      key={r}
                      type="button"
                      size="sm"
                      variant={reason === r ? "default" : "outline"}
                      onClick={() => setReason(r)}
                    >
                      {SINGLE_PARENT_REASON_LABELS[r]}
                    </Button>
                  ))}
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Documents</CardTitle>
          <p className="text-muted-foreground text-xs">
            Fields marked * are mandatory based on your answers above.
          </p>
        </CardHeader>
        <CardContent className="grid gap-4">
          {checklist.map((row) => {
            const isMandatory = mandatory[row.type]
            const already = alreadyUploadedTypes.has(row.type) && !uploads[row.key]
            const state = uploads[row.key]
            const isMissing = missing.includes(row.type)
            return (
              <div
                key={row.key}
                className={`flex flex-col gap-2 rounded-md border p-3 sm:flex-row sm:items-center sm:justify-between ${
                  isMissing ? "border-destructive/50 bg-destructive/5" : ""
                }`}
              >
                <div className="text-sm">
                  <span className="font-medium">
                    {row.label}
                    {isMandatory && <span className="text-destructive"> *</span>}
                  </span>
                  {already && <p className="text-xs text-emerald-600">Already uploaded</p>}
                  {state?.status === "done" && (
                    <p className="text-xs text-emerald-600">Uploaded: {state.fileName}</p>
                  )}
                  {state?.status === "uploading" && (
                    <p className="text-xs text-muted-foreground">Uploading...</p>
                  )}
                  {state?.status === "error" && (
                    <p className="text-xs text-destructive">
                      Upload failed. Use PDF/JPG/PNG under 5MB.
                    </p>
                  )}
                </div>
                <label className="inline-flex cursor-pointer items-center gap-2 rounded-md border px-3 py-1.5 text-sm hover:bg-muted">
                  <Upload className="h-4 w-4" />
                  {already || state?.status === "done" ? "Replace" : "Upload"}
                  <input
                    type="file"
                    accept=".pdf,.jpg,.jpeg,.png"
                    className="hidden"
                    onChange={(e) => onFileChange(row, e.target.files?.[0])}
                  />
                </label>
              </div>
            )
          })}
        </CardContent>
      </Card>

      {error && (
        <p className="mt-4 rounded-md border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {error}
        </p>
      )}

      <Button className="mt-6 w-full" onClick={onSubmit} disabled={submitting}>
        {submitting ? "Submitting..." : "Submit documents"}
      </Button>
    </div>
  )
}
