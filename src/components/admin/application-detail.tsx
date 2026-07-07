"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import {
  ArrowLeft,
  CheckCircle2,
  XCircle,
  Clock,
  AlertTriangle,
  Trash2,
  Printer,
  Download,
  FileDown,
  MessageSquarePlus,
  Loader2,
} from "lucide-react"
import Link from "next/link"
import { toast } from "sonner"
import { jsPDF } from "jspdf"
import autoTable from "jspdf-autotable"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { Separator } from "@/components/ui/separator"
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { StatusBadge } from "@/components/status-badge"
import { useT } from "@/lib/i18n/context"
import { updateStatus, addRemark, softDeleteApplications, getDocumentSignedUrl } from "@/app/oes/admin/actions"
import type { AppStatus } from "@/lib/constants"

/* eslint-disable @typescript-eslint/no-explicit-any */
type Detail = any

export function ApplicationDetail({
  app,
  canManage,
}: {
  app: Detail
  canManage: boolean
}) {
  const t = useT()
  const router = useRouter()
  const [remark, setRemark] = useState("")
  const [busy, setBusy] = useState(false)
  const [confirmDel, setConfirmDel] = useState(false)

  const p = app.oes_personal_details?.[0] ?? {}
  const e = app.oes_education_details?.[0] ?? {}
  const f = app.oes_family_details?.[0] ?? {}
  const im = app.oes_impairment_details?.[0] ?? {}
  const re = app.oes_residence_details?.[0] ?? {}
  const siblings = app.oes_siblings ?? []
  const documents = app.oes_documents ?? []
  const history = [...(app.oes_application_status_history ?? [])].sort(
    (a: any, b: any) => +new Date(a.created_at) - +new Date(b.created_at)
  )
  const remarks = [...(app.oes_admin_remarks ?? [])]
    .filter((r: any) => !r.deleted_at)
    .sort((a: any, b: any) => +new Date(b.created_at) - +new Date(a.created_at))

  async function changeStatus(s: AppStatus) {
    setBusy(true)
    const res = await updateStatus(app.id, s)
    setBusy(false)
    if (res.ok) {
      toast.success(t("detail.statusUpdated"))
      router.refresh()
    } else toast.error(t("err.unauthorized"))
  }

  async function postRemark() {
    if (!remark.trim()) return
    setBusy(true)
    const res = await addRemark(app.id, remark)
    setBusy(false)
    if (res.ok) {
      setRemark("")
      toast.success(t("detail.remarkAdded"))
      router.refresh()
    } else toast.error(t("err.unauthorized"))
  }

  async function doDelete() {
    setBusy(true)
    const res = await softDeleteApplications([app.id])
    setBusy(false)
    setConfirmDel(false)
    if (res.ok) {
      toast.success(t("common.delete"))
      router.push("/oes/admin/applications")
    } else toast.error(t("err.unauthorized"))
  }

  async function viewDoc(bucket: string, path: string) {
    const res = await getDocumentSignedUrl(bucket, path)
    if (res.url) window.open(res.url, "_blank")
    else toast.error(t("err.server"))
  }

  function downloadPdf() {
    const doc = new jsPDF({ unit: "pt", format: "a4" })
    doc.setFontSize(16); doc.setTextColor(30, 58, 138)
    doc.text(`OES Application — ${app.reference_number}`, 40, 44)
    const section = (title: string, rows: [string, string][], y: number) => {
      autoTable(doc, {
        startY: y, head: [[title, ""]], body: rows, theme: "striped",
        headStyles: { fillColor: [30, 58, 138] }, styles: { fontSize: 9 },
        columnStyles: { 0: { cellWidth: 180, fontStyle: "bold" } }, margin: { left: 40, right: 40 },
      })
      // @ts-expect-error plugin runtime field
      return (doc.lastAutoTable?.finalY ?? y) + 14
    }
    const sv = (v: any) => (v === null || v === undefined || v === "" ? "-" : String(v))
    let y = 64
    y = section("Personal", [["Name", sv(p.full_name)], ["Phone", sv(p.contact_number)], ["Email", sv(p.email)], ["District", sv(p.district)], ["PIN", sv(p.pincode)]], y)
    y = section("Education", [["School", sv(e.school_name)], ["Institution", sv(e.institution_name)], ["Course", sv(e.course_name)], ["Year", sv(e.current_year)]], y)
    y = section("Family", [["Father", sv(f.father_name)], ["Mother", sv(f.mother_name)], ["Guardian", sv(f.guardian_name)], ["Income", sv(f.annual_income)]], y)
    y = section("Residence", [["Type", sv(re.residence_type)], ["Address", sv(re.door_street)], ["District", sv(re.district)]], y)
    doc.save(`OES-${app.reference_number}.pdf`)
  }

  return (
    <div className="space-y-5">
      <div className="no-print flex flex-wrap items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <Button variant="ghost" size="icon-sm" render={<Link href="/oes/admin/applications" />}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className="min-w-0">
            <h1 className="truncate font-mono text-lg font-bold">{app.reference_number}</h1>
            <p className="text-muted-foreground truncate text-sm">{app.applicant_name}</p>
          </div>
          <StatusBadge status={app.status} />
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm" onClick={downloadPdf}>
            <Download className="mr-1 h-4 w-4" /> PDF
          </Button>
          <Button variant="outline" size="sm" onClick={() => window.print()}>
            <Printer className="mr-1 h-4 w-4" /> {t("common.print")}
          </Button>
          {canManage && (
            <Button variant="destructive" size="sm" onClick={() => setConfirmDel(true)}>
              <Trash2 className="mr-1 h-4 w-4" /> {t("common.delete")}
            </Button>
          )}
        </div>
      </div>

      {canManage && (
        <Card className="no-print">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">{t("detail.changeStatus")}</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-2">
            <Button size="sm" disabled={busy} onClick={() => changeStatus("approved")} className="bg-emerald-600 hover:bg-emerald-700">
              <CheckCircle2 className="mr-1 h-4 w-4" /> {t("detail.approve")}
            </Button>
            <Button size="sm" variant="destructive" disabled={busy} onClick={() => changeStatus("rejected")}>
              <XCircle className="mr-1 h-4 w-4" /> {t("detail.reject")}
            </Button>
            <Button size="sm" variant="outline" disabled={busy} onClick={() => changeStatus("under_review")}>
              <Clock className="mr-1 h-4 w-4" /> {t("detail.markUnderReview")}
            </Button>
            <Button size="sm" variant="outline" disabled={busy} onClick={() => changeStatus("needs_correction")}>
              <AlertTriangle className="mr-1 h-4 w-4" /> {t("detail.markNeedsCorrection")}
            </Button>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-5 lg:grid-cols-3">
        <div className="space-y-5 lg:col-span-2">
          <Section title={t("detail.personal")}>
            <Field label={t("f.fullName")} value={p.full_name} />
            <Field label={t("f.contactNumber")} value={p.contact_number} />
            <Field label={t("f.altContactNumber")} value={p.alt_contact_number} />
            <Field label={t("f.email")} value={p.email} />
            <Field label={t("f.dob")} value={p.dob} />
            <Field label={t("f.gender")} value={p.gender} />
            <Field label={t("f.town")} value={p.town} />
            <Field label={t("f.district")} value={p.district} />
            <Field label={t("f.state")} value={p.state} />
            <Field label={t("f.pincode")} value={p.pincode} />
          </Section>

          <Section title={t("detail.education")}>
            <Field label={t("f.schoolName")} value={e.school_name} />
            <Field label={t("f.schoolType")} value={e.school_type} />
            <Field label={t("f.institutionName")} value={e.institution_name} />
            <Field label={t("f.institutionType")} value={e.institution_type} />
            <Field label={t("f.courseName")} value={e.course_name} />
            <Field label={t("f.courseDuration")} value={e.course_duration} />
            <Field label={t("f.currentYear")} value={e.current_year} />
            <Field label={t("f.currentSemester")} value={e.current_semester} />
            <Field label={t("f.scholarshipDetails")} value={e.scholarship_details} />
          </Section>

          <Section title={t("detail.family")}>
            <Field label={t("f.parentStatus")} value={f.parent_status} />
            <Field label={t("f.singleParentReason")} value={f.single_parent_reason} />
            <Field label={t("f.fatherName")} value={f.father_name} />
            <Field label={t("f.motherName")} value={f.mother_name} />
            <Field label={t("f.guardianName")} value={f.guardian_name} />
            <Field label={t("f.guardianContact")} value={f.guardian_contact} />
            <Field label={t("f.guardianOccupation")} value={f.guardian_occupation} />
            <Field label={t("f.annualIncome")} value={f.annual_income} />
          </Section>

          <Section title={t("detail.siblings")}>
            {siblings.length === 0 ? (
              <p className="text-muted-foreground text-sm">—</p>
            ) : (
              siblings.map((s: any, i: number) => (
                <Field key={s.id ?? i} label={`${t("f.sibling")} ${i + 1}`}
                  value={[s.name, s.birth_order, s.occupation, s.details].filter(Boolean).join(" · ")} />
              ))
            )}
          </Section>

          <Section title={t("detail.impairment")}>
            <Field label={t("f.hasImpairment")} value={im.has_impairment ? t("common.yes") : t("common.no")} />
            <Field label={t("f.impairmentBelongsTo")} value={im.belongs_to} />
            <Field label={t("f.impairmentType")} value={im.impairment_type} />
            <Field label={t("f.impairmentDescription")} value={im.description} />
          </Section>

          <Section title={t("detail.residence")}>
            <Field label={t("f.residenceType")} value={re.residence_type} />
            <Field label={t("f.roofType")} value={re.roof_type} />
            <Field label={t("f.ownershipSource")} value={re.ownership_source} />
            <Field label={t("f.doorStreet")} value={re.door_street} />
            <Field label={t("f.town")} value={re.town} />
            <Field label={t("f.district")} value={re.district} />
            <Field label={t("f.pincode")} value={re.pincode} />
          </Section>

          <Section title={t("detail.documents")}>
            {documents.length === 0 ? (
              <p className="text-muted-foreground text-sm">{t("detail.noDocuments")}</p>
            ) : (
              <div className="grid gap-2 sm:grid-cols-2">
                {documents.map((d: any) => (
                  <button key={d.id} onClick={() => viewDoc(d.bucket, d.path)}
                    className="flex items-center gap-2 rounded-md border px-3 py-2 text-left text-sm hover:bg-accent">
                    <FileDown className="h-4 w-4 shrink-0 text-primary" />
                    <span className="min-w-0">
                      <span className="block font-medium">{t(`f.doc.${docKey(d.document_type)}`)}</span>
                      <span className="text-muted-foreground block truncate text-xs">{d.file_name}</span>
                    </span>
                  </button>
                ))}
              </div>
            )}
          </Section>
        </div>

        <div className="space-y-5">
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm">{t("detail.timeline")}</CardTitle></CardHeader>
            <CardContent>
              <ol className="relative space-y-4 border-l pl-4">
                {history.map((h: any) => (
                  <li key={h.id} className="relative">
                    <span className="absolute -left-[21px] top-1 h-2.5 w-2.5 rounded-full bg-primary" />
                    <StatusBadge status={h.to_status} />
                    <p className="text-muted-foreground mt-1 text-xs">
                      {new Date(h.created_at).toLocaleString()}
                    </p>
                    {h.note && <p className="text-sm">{h.note}</p>}
                  </li>
                ))}
              </ol>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm">{t("detail.remarks")}</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              {canManage && (
                <div className="no-print space-y-2">
                  <Textarea value={remark} onChange={(ev) => setRemark(ev.target.value)}
                    placeholder={t("detail.addRemark")} rows={2} />
                  <Button size="sm" onClick={postRemark} disabled={busy || !remark.trim()}>
                    {busy ? <Loader2 className="mr-1 h-4 w-4 animate-spin" /> : <MessageSquarePlus className="mr-1 h-4 w-4" />}
                    {t("detail.postRemark")}
                  </Button>
                </div>
              )}
              <Separator />
              {remarks.length === 0 ? (
                <p className="text-muted-foreground text-sm">{t("track.noRemarks")}</p>
              ) : (
                remarks.map((r: any) => (
                  <div key={r.id} className="rounded-md bg-muted/40 p-2 text-sm">
                    <p>{r.remark}</p>
                    <p className="text-muted-foreground mt-1 text-xs">{new Date(r.created_at).toLocaleString()}</p>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      <Dialog open={confirmDel} onOpenChange={setConfirmDel}>
        <DialogContent>
          <DialogHeader><DialogTitle>{t("common.delete")}?</DialogTitle></DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmDel(false)}>{t("common.cancel")}</Button>
            <Button variant="destructive" onClick={doDelete} disabled={busy}>{t("common.delete")}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

function docKey(type: string) {
  const map: Record<string, string> = {
    student_photo: "studentPhoto", aadhaar: "aadhaar", income: "income",
    community: "community", scholarship: "scholarship", impairment: "impairment", other: "other",
  }
  return map[type] ?? "other"
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <Card>
      <CardHeader className="pb-2"><CardTitle className="text-base">{title}</CardTitle></CardHeader>
      <CardContent className="grid gap-x-6 gap-y-1 sm:grid-cols-2">{children}</CardContent>
    </Card>
  )
}

function Field({ label, value, tamil }: { label: string; value: any; tamil?: boolean }) {
  if (value === null || value === undefined || value === "") return null
  return (
    <div className="flex justify-between gap-3 border-b py-1.5 text-sm last:border-0">
      <span className="text-muted-foreground">{label}</span>
      <span className={`text-right font-medium ${tamil ? "font-tamil" : ""}`}>{String(value)}</span>
    </div>
  )
}
