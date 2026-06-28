"use client"

import { FileSpreadsheet, FileText, FileDown } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useT } from "@/lib/i18n/context"
import { exportToExcel, exportToCsv, exportToPdf } from "@/lib/export"
import type { ApplicationListRow } from "@/lib/queries"

type ReportDef = {
  titleKey: string
  field: keyof ApplicationListRow
  transform?: (v: unknown) => string
}

const REPORTS: ReportDef[] = [
  { titleKey: "reports.byDistrict", field: "district" },
  { titleKey: "reports.byGender", field: "gender" },
  { titleKey: "reports.bySchoolType", field: "school_type" },
  { titleKey: "reports.byInstitutionType", field: "institution_type" },
  { titleKey: "reports.byParentStatus", field: "parent_status" },
  { titleKey: "reports.byResidenceType", field: "residence_type" },
  { titleKey: "reports.byScholarship", field: "has_scholarship", transform: (v) => (v ? "Yes" : "No") },
  { titleKey: "reports.byImpairment", field: "has_impairment", transform: (v) => (v ? "Yes" : "No") },
]

export function ReportsView({ data }: { data: ApplicationListRow[] }) {
  const t = useT()

  function aggregate(def: ReportDef) {
    const map = new Map<string, number>()
    for (const row of data) {
      const raw = row[def.field]
      const key = def.transform ? def.transform(raw) : (raw as string) || "—"
      map.set(key, (map.get(key) ?? 0) + 1)
    }
    return [...map.entries()]
      .map(([category, count]) => ({ category, count }))
      .sort((a, b) => b.count - a.count)
  }

  return (
    <div className="grid gap-5 lg:grid-cols-2">
      {REPORTS.map((def) => {
        const rows = aggregate(def)
        const title = t(def.titleKey)
        const fileBase = `oes-report-${def.field}`
        return (
          <Card key={def.titleKey}>
            <CardHeader className="flex flex-row items-center justify-between gap-2 pb-2">
              <CardTitle className="text-sm">{title}</CardTitle>
              <div className="flex gap-1">
                <Button variant="ghost" size="icon-sm" title={t("reports.exportExcel")}
                  onClick={() => exportToExcel(rows.map((r) => ({ [t("reports.category")]: r.category, [t("reports.count")]: r.count })), fileBase)}>
                  <FileSpreadsheet className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="icon-sm" title={t("reports.exportCsv")}
                  onClick={() => exportToCsv(rows.map((r) => ({ [t("reports.category")]: r.category, [t("reports.count")]: r.count })), fileBase)}>
                  <FileText className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="icon-sm" title={t("reports.exportPdf")}
                  onClick={() => exportToPdf([t("reports.category"), t("reports.count")], rows.map((r) => [r.category, r.count]), fileBase, title)}>
                  <FileDown className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-muted-foreground">
                    <th className="py-1.5 text-left font-medium">{t("reports.category")}</th>
                    <th className="py-1.5 text-right font-medium">{t("reports.count")}</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((r) => (
                    <tr key={r.category} className="border-b last:border-0">
                      <td className="py-1.5">{r.category}</td>
                      <td className="py-1.5 text-right font-medium tabular-nums">{r.count}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}
