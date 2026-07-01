"use client"

import { FileSpreadsheet, FileText } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useT } from "@/lib/i18n/context"
import { exportToExcel, exportToCsv } from "@/lib/export"
import type { ApplicationListRow } from "@/lib/queries"

export function ExportView({ data }: { data: ApplicationListRow[] }) {
  const t = useT()

  const flat = data.map((r) => ({
    Reference: r.reference_number,
    Name: r.applicant_name,
    Phone: r.primary_phone,
    Email: r.email ?? "",
    Gender: r.gender ?? "",
    District: r.district ?? "",
    Course: r.course_name ?? "",
    Institution: r.institution_name ?? "",
    SchoolType: r.school_type ?? "",
    InstitutionType: r.institution_type ?? "",
    ParentStatus: r.parent_status ?? "",
    ResidenceType: r.residence_type ?? "",
    Scholarship: r.has_scholarship ? "Yes" : "No",
    Impairment: r.has_impairment ? "Yes" : "No",
    Status: r.status,
    Submitted: new Date(r.submitted_at).toLocaleString(),
  }))

  const name = `oes-all-applications-${new Date().toISOString().slice(0, 10)}`

  return (
    <Card className="max-w-xl">
      <CardHeader>
        <CardTitle className="text-base">{t("export.all")}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-muted-foreground text-sm">
          {data.length} {t("dash.total").toLowerCase()}
        </p>
        <div className="flex flex-wrap gap-2">
          <Button onClick={() => exportToExcel(flat, name)} disabled={data.length === 0}>
            <FileSpreadsheet className="mr-1 h-4 w-4" /> {t("reports.exportExcel")}
          </Button>
          <Button variant="outline" onClick={() => exportToCsv(flat, name)} disabled={data.length === 0}>
            <FileText className="mr-1 h-4 w-4" /> {t("reports.exportCsv")}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
