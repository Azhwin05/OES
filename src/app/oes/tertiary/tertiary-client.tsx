"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { LogOut, Upload, CheckCircle2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { createClient } from "@/lib/supabase/client"
import { validateFile } from "@/lib/upload"
import {
  TERTIARY_DOCUMENT_TYPES,
  TERTIARY_DOCUMENT_MANDATORY,
  TERTIARY_DOCUMENT_LABELS,
  PAYMENT_MODES,
  PAYMENT_MODE_LABELS,
  INSTITUTION_CONTACT_DESIGNATIONS,
  INSTITUTION_CONTACT_DESIGNATION_LABELS,
  DOCS_BUCKET,
  type TertiaryDocumentType,
  type TertiaryAnswers,
  type PaymentMode,
  type InstitutionContactDesignation,
} from "@/lib/constants"
import { submitTertiaryDocuments, tertiaryLogout, type TertiaryDocUpload } from "./actions"

async function uploadTertiaryFile(
  referenceNumber: string,
  type: TertiaryDocumentType,
  file: File
): Promise<string> {
  const supabase = createClient()
  const safeName = file.name.replace(/[^\w.\-]+/g, "_")
  const path = `applications/${referenceNumber}/tertiary/${type}/${Date.now()}_${safeName}`
  const { error } = await supabase.storage
    .from(DOCS_BUCKET)
    .upload(path, file, { upsert: false, contentType: file.type })
  if (error) throw error
  return path
}

type Props = {
  application: {
    reference_number: string
    applicant_name: string
    status: string
    tertiary_submitted_at: string | null
  }
  existingDocs: { document_type: string; file_name: string | null; created_at: string }[]
  existingAnswers: {
    mode_of_payment: string | null
    last_payment_date: string | null
    contact_person_name: string | null
    contact_person_designation: string | null
    contact_person_mobile: string | null
  } | null
}

type UploadState = {
  status: "idle" | "uploading" | "done" | "error"
  fileName?: string
  doc?: TertiaryDocUpload
}

export function TertiaryPortalClient({ application, existingDocs, existingAnswers }: Props) {
  const router = useRouter()

  const [modeOfPayment, setModeOfPayment] = useState<PaymentMode | null>(
    (existingAnswers?.mode_of_payment as PaymentMode | null) ?? null
  )
  const [lastPaymentDate, setLastPaymentDate] = useState<string>(
    existingAnswers?.last_payment_date ?? ""
  )
  const [contactPersonName, setContactPersonName] = useState<string>(
    existingAnswers?.contact_person_name ?? ""
  )
  const [contactPersonDesignation, setContactPersonDesignation] =
    useState<InstitutionContactDesignation | null>(
      (existingAnswers?.contact_person_designation as InstitutionContactDesignation | null) ?? null
    )
  const [contactPersonMobile, setContactPersonMobile] = useState<string>(
    existingAnswers?.contact_person_mobile ?? ""
  )

  const [uploads, setUploads] = useState<Record<string, UploadState>>({})
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(!!application.tertiary_submitted_at)
  const [error, setError] = useState<string | null>(null)
  const [missing, setMissing] = useState<TertiaryDocumentType[]>([])

  const alreadyUploadedTypes = new Set(existingDocs.map((d) => d.document_type))

  async function onFileChange(type: TertiaryDocumentType, file: File | undefined) {
    if (!file) return
    const err = validateFile(file)
    if (err) {
      setUploads((u) => ({ ...u, [type]: { status: "error" } }))
      return
    }
    setUploads((u) => ({ ...u, [type]: { status: "uploading", fileName: file.name } }))
    try {
      const path = await uploadTertiaryFile(application.reference_number, type, file)
      setUploads((u) => ({
        ...u,
        [type]: {
          status: "done",
          fileName: file.name,
          doc: {
            document_type: type,
            bucket: DOCS_BUCKET,
            path,
            file_name: file.name,
            mime_type: file.type,
            size_bytes: file.size,
          },
        },
      }))
    } catch {
      setUploads((u) => ({ ...u, [type]: { status: "error", fileName: file.name } }))
    }
  }

  async function onSubmit() {
    setSubmitting(true)
    setError(null)
    setMissing([])
    try {
      if (!modeOfPayment) {
        setError("Please select the mode of payment.")
        return
      }
      if (!lastPaymentDate) {
        setError("Please enter the last date of payment.")
        return
      }
      if (!contactPersonName.trim()) {
        setError("Please enter the name of the institution contact person.")
        return
      }
      if (!contactPersonDesignation) {
        setError("Please select the designation of the institution contact person.")
        return
      }
      if (!/^[6-9]\d{9}$/.test(contactPersonMobile)) {
        setError("Please enter a valid 10-digit mobile number for the institution contact person.")
        return
      }
      const stillUploading = Object.values(uploads).some((u) => u.status === "uploading")
      if (stillUploading) {
        setError("Please wait for all uploads to finish before submitting.")
        return
      }
      const answers: TertiaryAnswers = {
        modeOfPayment,
        lastPaymentDate,
        contactPersonName,
        contactPersonDesignation,
        contactPersonMobile,
      }
      const docs = Object.values(uploads)
        .filter((u): u is UploadState & { doc: TertiaryDocUpload } => !!u.doc)
        .map((u) => u.doc)
      const result = await submitTertiaryDocuments(answers, docs)
      if (!result.ok) {
        setError(
          result.error === "missing_mandatory"
            ? "Please upload all mandatory documents before submitting."
            : result.error === "missing_mode_of_payment"
              ? "Please select the mode of payment."
              : result.error === "missing_payment_date"
                ? "Please enter the last date of payment."
                : result.error === "missing_contact_name"
                  ? "Please enter the name of the institution contact person."
                  : result.error === "missing_contact_designation"
                    ? "Please select the designation of the institution contact person."
                    : result.error === "invalid_contact_mobile"
                      ? "Please enter a valid 10-digit mobile number for the institution contact person."
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
    await tertiaryLogout()
    router.push("/oes/secondary/login")
    router.refresh()
  }

  if (submitted) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-16 text-center">
        <CheckCircle2 className="mx-auto h-12 w-12 text-emerald-600" />
        <h1 className="mt-4 text-2xl font-bold">Tertiary data submitted</h1>
        <p className="text-muted-foreground mt-2">
          Thank you, {application.applicant_name}. We&apos;ve received your academic progress
          and payment confirmation for {application.reference_number}.
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
          <h1 className="text-2xl font-bold tracking-tight">Tertiary Data Submission</h1>
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
          <CardTitle className="text-base">Institution Contact Person</CardTitle>
          <p className="text-muted-foreground text-xs">
            Contact person at the institution (HOD / Lecturer / Faculty) — mandatory.
          </p>
        </CardHeader>
        <CardContent className="grid gap-5 sm:grid-cols-2">
          <div className="grid gap-2">
            <Label htmlFor="contact-person-name">Name of the Contact Person *</Label>
            <Input
              id="contact-person-name"
              value={contactPersonName}
              onChange={(e) => setContactPersonName(e.target.value)}
            />
          </div>
          <div className="grid gap-2">
            <Label>Designation *</Label>
            <Select
              items={INSTITUTION_CONTACT_DESIGNATIONS.map((d) => ({
                value: d,
                label: INSTITUTION_CONTACT_DESIGNATION_LABELS[d],
              }))}
              value={contactPersonDesignation ?? null}
              onValueChange={(v) => setContactPersonDesignation((v as InstitutionContactDesignation) ?? null)}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select..." />
              </SelectTrigger>
              <SelectContent>
                {INSTITUTION_CONTACT_DESIGNATIONS.map((d) => (
                  <SelectItem key={d} value={d}>
                    {INSTITUTION_CONTACT_DESIGNATION_LABELS[d]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid gap-2 sm:col-span-2">
            <Label htmlFor="contact-person-mobile">Mobile Number *</Label>
            <Input
              id="contact-person-mobile"
              inputMode="tel"
              placeholder="9876543210"
              value={contactPersonMobile}
              onChange={(e) => setContactPersonMobile(e.target.value)}
            />
          </div>
        </CardContent>
      </Card>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-base">Scholarship Payment Details</CardTitle>
          <p className="text-muted-foreground text-xs">
            Confirm how and when the scholarship payment reached your institution.
          </p>
        </CardHeader>
        <CardContent className="grid gap-5 sm:grid-cols-2">
          <div className="grid gap-2">
            <Label>Mode of Payment *</Label>
            <Select
              items={PAYMENT_MODES.map((m) => ({ value: m, label: PAYMENT_MODE_LABELS[m] }))}
              value={modeOfPayment ?? null}
              onValueChange={(v) => setModeOfPayment((v as PaymentMode) ?? null)}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select..." />
              </SelectTrigger>
              <SelectContent>
                {PAYMENT_MODES.map((m) => (
                  <SelectItem key={m} value={m}>
                    {PAYMENT_MODE_LABELS[m]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="last-payment-date">Last Date of Payment *</Label>
            <Input
              id="last-payment-date"
              type="date"
              value={lastPaymentDate}
              onChange={(e) => setLastPaymentDate(e.target.value)}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Documents</CardTitle>
          <p className="text-muted-foreground text-xs">
            Fields marked * are mandatory.
          </p>
        </CardHeader>
        <CardContent className="grid gap-4">
          {TERTIARY_DOCUMENT_TYPES.map((type) => {
            const isMandatory = TERTIARY_DOCUMENT_MANDATORY[type]
            const already = alreadyUploadedTypes.has(type) && !uploads[type]
            const state = uploads[type]
            const isMissing = missing.includes(type)
            return (
              <div
                key={type}
                className={`flex flex-col gap-2 rounded-md border p-3 sm:flex-row sm:items-center sm:justify-between ${
                  isMissing ? "border-destructive/50 bg-destructive/5" : ""
                }`}
              >
                <div className="text-sm">
                  <span className="font-medium">
                    {TERTIARY_DOCUMENT_LABELS[type]}
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
                    onChange={(e) => onFileChange(type, e.target.files?.[0])}
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
        {submitting ? "Submitting..." : "Submit"}
      </Button>
    </div>
  )
}
