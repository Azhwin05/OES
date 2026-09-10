"use client"

import { useMemo, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getPaginationRowModel,
  flexRender,
  type ColumnDef,
  type SortingState,
  type RowSelectionState,
} from "@tanstack/react-table"
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts"
import {
  Users,
  CheckCircle2,
  Hourglass,
  CircleDashed,
  TrendingUp,
  CalendarClock,
  Eye,
  Search,
  ArrowUpDown,
  FileSpreadsheet,
  FileText,
  ChevronLeft,
  ChevronRight,
  ClipboardCheck,
  XCircle,
  AlertTriangle,
  UserX,
  UserCheck,
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { Progress, ProgressTrack, ProgressIndicator } from "@/components/ui/progress"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useT } from "@/lib/i18n/context"
import { cn } from "@/lib/utils"
import { exportToExcel, exportToCsv } from "@/lib/export"
import {
  SECONDARY_REVIEW_STATUS_CLASSNAMES,
  type SecondaryReviewStatus,
} from "@/lib/constants"
import { assignSecondaryReviewer } from "@/app/oes/admin/actions"
import type { SecondaryOverview, SecondarySubmissionRow } from "@/lib/queries"

type Status = "submitted" | "in_progress" | "not_started"
const ALL = "all"
const UNASSIGNED = "__unassigned__"

function statusOf(r: SecondarySubmissionRow): Status {
  if (r.secondary_submitted_at) return "submitted"
  if (r.coreDocsUploaded > 0) return "in_progress"
  return "not_started"
}

const STATUS_STYLE: Record<Status, string> = {
  submitted: "bg-emerald-100 text-emerald-800 border-emerald-200",
  in_progress: "bg-amber-100 text-amber-800 border-amber-200",
  not_started: "bg-muted text-muted-foreground border-border",
}

type Reviewer = { id: string; name: string; email: string }

export function SecondaryView({
  overview,
  canManage,
  reviewers,
}: {
  overview: SecondaryOverview
  canManage: boolean
  reviewers: Reviewer[]
}) {
  const t = useT()
  const router = useRouter()
  const { rows, trend, documentCoverage, daysLeft } = overview

  const statusLabel: Record<Status, string> = useMemo(
    () => ({
      submitted: t("secondary.status.submitted"),
      in_progress: t("secondary.status.inProgress"),
      not_started: t("secondary.status.notStarted"),
    }),
    [t]
  )

  const reviewStatusLabel: Record<SecondaryReviewStatus, string> = useMemo(
    () => ({
      pending: t("secondary.status.review.pending"),
      approved: t("secondary.status.review.approved"),
      rejected: t("secondary.status.review.rejected"),
      needs_correction: t("secondary.status.review.needs_correction"),
    }),
    [t]
  )

  const cards = [
    { icon: Users, label: t("secondary.stat.total"), value: overview.totalShortlisted, tone: "text-primary" },
    { icon: CheckCircle2, label: t("secondary.stat.submitted"), value: overview.submitted, tone: "text-emerald-600" },
    { icon: Hourglass, label: t("secondary.stat.inProgress"), value: overview.inProgress, tone: "text-amber-600" },
    { icon: CircleDashed, label: t("secondary.stat.notStarted"), value: overview.notStarted, tone: "text-muted-foreground" },
    { icon: TrendingUp, label: t("secondary.stat.rate"), value: `${overview.submissionRate}%`, tone: "text-primary" },
    { icon: CalendarClock, label: t("secondary.stat.daysLeft"), value: daysLeft, tone: daysLeft <= 3 ? "text-destructive" : "text-primary" },
  ]

  const recommendationCards = [
    { icon: ClipboardCheck, label: t("secondary.stat.pendingReview"), value: overview.pendingReview, tone: "text-amber-600" },
    { icon: CheckCircle2, label: t("secondary.stat.approved"), value: overview.approved, tone: "text-emerald-600" },
    { icon: XCircle, label: t("secondary.stat.rejected"), value: overview.rejected, tone: "text-rose-600" },
    { icon: AlertTriangle, label: t("secondary.stat.needsCorrection"), value: overview.needsCorrection, tone: "text-amber-600" },
  ]

  const finalCards = [
    { icon: ClipboardCheck, label: t("secondary.stat.finalPending"), value: overview.finalPending, tone: "text-amber-600" },
    { icon: CheckCircle2, label: t("secondary.stat.finalApproved"), value: overview.finalApproved, tone: "text-emerald-600" },
    { icon: XCircle, label: t("secondary.stat.finalRejected"), value: overview.finalRejected, tone: "text-rose-600" },
    { icon: AlertTriangle, label: t("secondary.stat.finalNeedsCorrection"), value: overview.finalNeedsCorrection, tone: "text-amber-600" },
    { icon: UserX, label: t("secondary.stat.unassigned"), value: overview.unassigned, tone: "text-muted-foreground" },
  ]

  const [search, setSearch] = useState("")
  const [status, setStatus] = useState<string>(ALL)
  const [reviewFilter, setReviewFilter] = useState<string>(ALL)
  const [finalFilter, setFinalFilter] = useState<string>(ALL)
  const [assigneeFilter, setAssigneeFilter] = useState<string>(ALL)
  const [sorting, setSorting] = useState<SortingState>([])
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({})
  const [assignTarget, setAssignTarget] = useState<string>("")
  const [assigning, setAssigning] = useState(false)

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return rows.filter((r) => {
      if (q) {
        const hay = [r.reference_number, r.applicant_name, r.district].filter(Boolean).join(" ").toLowerCase()
        if (!hay.includes(q)) return false
      }
      if (status !== ALL && statusOf(r) !== status) return false
      if (reviewFilter !== ALL && r.reviewStatus !== reviewFilter) return false
      if (finalFilter !== ALL && r.finalStatus !== finalFilter) return false
      if (assigneeFilter !== ALL) {
        if (assigneeFilter === UNASSIGNED && r.assignedReviewerId) return false
        if (assigneeFilter !== UNASSIGNED && r.assignedReviewerId !== assigneeFilter) return false
      }
      return true
    })
  }, [rows, search, status, reviewFilter, finalFilter, assigneeFilter])

  const columns = useMemo<ColumnDef<SecondarySubmissionRow>[]>(
    () => [
      ...(canManage
        ? [
            {
              id: "select",
              header: ({ table }: { table: import("@tanstack/react-table").Table<SecondarySubmissionRow> }) => (
                <Checkbox
                  checked={table.getIsAllPageRowsSelected()}
                  onCheckedChange={(v: boolean) => table.toggleAllPageRowsSelected(v === true)}
                  aria-label="Select all"
                />
              ),
              cell: ({ row }: { row: import("@tanstack/react-table").Row<SecondarySubmissionRow> }) => (
                <Checkbox
                  checked={row.getIsSelected()}
                  onCheckedChange={(v: boolean) => row.toggleSelected(v === true)}
                  aria-label="Select row"
                />
              ),
              enableSorting: false,
            } satisfies ColumnDef<SecondarySubmissionRow>,
          ]
        : []),
      {
        accessorKey: "reference_number",
        header: t("secondary.table.refNumber"),
        cell: ({ row }) => (
          <span className="font-mono text-xs font-medium">{row.original.reference_number}</span>
        ),
      },
      {
        accessorKey: "applicant_name",
        header: ({ column }) => (
          <SortHeader label={t("secondary.table.name")} onClick={() => column.toggleSorting()} />
        ),
        cell: ({ row }) => <p className="truncate font-medium">{row.original.applicant_name}</p>,
      },
      {
        accessorKey: "district",
        header: t("secondary.table.district"),
        cell: ({ row }) => row.original.district ?? "—",
      },
      {
        id: "status",
        header: t("secondary.table.status"),
        cell: ({ row }) => {
          const s = statusOf(row.original)
          return (
            <Badge variant="outline" className={cn("font-medium", STATUS_STYLE[s])}>
              {statusLabel[s]}
            </Badge>
          )
        },
      },
      {
        id: "coreDocs",
        header: t("secondary.table.coreDocs"),
        cell: ({ row }) => {
          const { coreDocsUploaded, coreDocsTotal } = row.original
          const pct = coreDocsTotal ? Math.round((coreDocsUploaded / coreDocsTotal) * 100) : 0
          return (
            <div className="flex items-center gap-2">
              <Progress value={pct} className="w-16 gap-0">
                <ProgressTrack className="h-1.5">
                  <ProgressIndicator
                    className={coreDocsUploaded === coreDocsTotal ? "bg-emerald-500" : "bg-amber-500"}
                  />
                </ProgressTrack>
              </Progress>
              <span className="text-muted-foreground text-xs tabular-nums">
                {coreDocsUploaded}/{coreDocsTotal}
              </span>
            </div>
          )
        },
      },
      {
        accessorKey: "secondary_submitted_at",
        header: ({ column }) => (
          <SortHeader label={t("secondary.table.submittedAt")} onClick={() => column.toggleSorting()} />
        ),
        cell: ({ row }) =>
          row.original.secondary_submitted_at
            ? new Date(row.original.secondary_submitted_at).toLocaleString()
            : "—",
      },
      {
        id: "assignedTo",
        header: t("secondary.table.assignedTo"),
        cell: ({ row }) =>
          row.original.assignedReviewerName ? (
            <span className="inline-flex items-center gap-1 text-sm">
              <UserCheck className="h-3.5 w-3.5 text-muted-foreground" />
              {row.original.assignedReviewerName}
            </span>
          ) : (
            <span className="text-muted-foreground text-xs italic">{t("secondary.table.unassignedLabel")}</span>
          ),
      },
      {
        id: "review",
        header: t("secondary.table.recommendation"),
        cell: ({ row }) =>
          row.original.secondary_submitted_at ? (
            <Badge
              variant="outline"
              className={cn("font-medium", SECONDARY_REVIEW_STATUS_CLASSNAMES[row.original.reviewStatus])}
            >
              {reviewStatusLabel[row.original.reviewStatus]}
            </Badge>
          ) : (
            "—"
          ),
      },
      {
        id: "final",
        header: t("secondary.table.finalDecision"),
        cell: ({ row }) =>
          row.original.secondary_submitted_at ? (
            <Badge
              variant="outline"
              className={cn("font-medium", SECONDARY_REVIEW_STATUS_CLASSNAMES[row.original.finalStatus])}
            >
              {reviewStatusLabel[row.original.finalStatus]}
            </Badge>
          ) : (
            "—"
          ),
      },
      {
        id: "actions",
        header: t("common.actions"),
        cell: ({ row }) => (
          <Button
            variant="ghost"
            size="icon-sm"
            render={<Link href={`/oes/admin/applications/${row.original.id}`} />}
            title={t("secondary.table.viewDocuments")}
          >
            <Eye className="h-4 w-4" />
          </Button>
        ),
        enableSorting: false,
      },
    ],
    [t, statusLabel, reviewStatusLabel, canManage]
  )

  const table = useReactTable({
    data: filtered,
    columns,
    state: { sorting, rowSelection },
    onSortingChange: setSorting,
    onRowSelectionChange: setRowSelection,
    getRowId: (r) => r.id,
    enableRowSelection: canManage,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: { pagination: { pageSize: 20 } },
  })

  const selectedIds = Object.keys(rowSelection).filter((id) => rowSelection[id])

  function exportRows(kind: "xlsx" | "csv") {
    const flat = filtered.map((r) => ({
      OES_ID: r.reference_number,
      Name: r.applicant_name,
      District: r.district ?? "",
      Status: statusLabel[statusOf(r)],
      CoreDocuments: `${r.coreDocsUploaded}/${r.coreDocsTotal}`,
      SubmittedAt: r.secondary_submitted_at ? new Date(r.secondary_submitted_at).toLocaleString() : "",
      AssignedReviewer: r.assignedReviewerName ?? "",
      ReviewerRecommendation: r.secondary_submitted_at ? reviewStatusLabel[r.reviewStatus] : "",
      FinalDecision: r.secondary_submitted_at ? reviewStatusLabel[r.finalStatus] : "",
    }))
    const name = `oes-secondary-submissions-${new Date().toISOString().slice(0, 10)}`
    if (kind === "xlsx") exportToExcel(flat, name)
    else exportToCsv(flat, name)
  }

  async function assignSelected() {
    if (selectedIds.length === 0 || !assignTarget) return
    setAssigning(true)
    const reviewerId = assignTarget === UNASSIGNED ? null : assignTarget
    const res = await assignSecondaryReviewer(selectedIds, reviewerId)
    setAssigning(false)
    if (res.ok) {
      toast.success(t("secondary.assign.success"))
      setRowSelection({})
      setAssignTarget("")
      router.refresh()
    } else {
      toast.error(t("err.unauthorized"))
    }
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        {cards.map((c) => (
          <Card key={c.label}>
            <CardContent className="flex flex-col gap-1 p-4">
              <c.icon className={`h-5 w-5 ${c.tone}`} />
              <span className="mt-1 text-2xl font-bold tabular-nums">{c.value}</span>
              <span className="text-muted-foreground text-xs leading-tight">{c.label}</span>
            </CardContent>
          </Card>
        ))}
      </div>

      <div>
        <h3 className="mb-2 text-sm font-semibold text-muted-foreground">{t("secondary.section.recommendations")}</h3>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {recommendationCards.map((c) => (
            <Card key={c.label}>
              <CardContent className="flex flex-col gap-1 p-4">
                <c.icon className={`h-5 w-5 ${c.tone}`} />
                <span className="mt-1 text-2xl font-bold tabular-nums">{c.value}</span>
                <span className="text-muted-foreground text-xs leading-tight">{c.label}</span>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {canManage && (
        <div>
          <h3 className="mb-2 text-sm font-semibold text-muted-foreground">{t("secondary.section.finalDecisions")}</h3>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
            {finalCards.map((c) => (
              <Card key={c.label}>
                <CardContent className="flex flex-col gap-1 p-4">
                  <c.icon className={`h-5 w-5 ${c.tone}`} />
                  <span className="mt-1 text-2xl font-bold tabular-nums">{c.value}</span>
                  <span className="text-muted-foreground text-xs leading-tight">{c.label}</span>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {canManage && overview.reviewerProgress.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold">{t("secondary.section.reviewerProgress")}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-muted-foreground">
                    <th className="px-2 py-1.5 text-left font-medium">{t("secondary.table.reviewer")}</th>
                    <th className="px-2 py-1.5 text-left font-medium">{t("secondary.progress.assigned")}</th>
                    <th className="px-2 py-1.5 text-left font-medium">{t("secondary.progress.reviewed")}</th>
                    <th className="px-2 py-1.5 text-left font-medium">{t("secondary.progress.finalized")}</th>
                    <th className="px-2 py-1.5 text-left font-medium">{t("secondary.progress.completion")}</th>
                  </tr>
                </thead>
                <tbody>
                  {overview.reviewerProgress.map((p) => {
                    const pct = p.assigned ? Math.round((p.reviewed / p.assigned) * 100) : 0
                    return (
                      <tr key={p.reviewerId} className="border-b last:border-0">
                        <td className="px-2 py-2 font-medium">{p.reviewerName}</td>
                        <td className="px-2 py-2 tabular-nums">{p.assigned}</td>
                        <td className="px-2 py-2 tabular-nums">{p.reviewed}</td>
                        <td className="px-2 py-2 tabular-nums">{p.finalized}</td>
                        <td className="px-2 py-2">
                          <div className="flex items-center gap-2">
                            <Progress value={pct} className="w-24 gap-0">
                              <ProgressTrack className="h-1.5">
                                <ProgressIndicator className={pct === 100 ? "bg-emerald-500" : "bg-amber-500"} />
                              </ProgressTrack>
                            </Progress>
                            <span className="text-muted-foreground text-xs tabular-nums">{pct}%</span>
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold">{t("secondary.chart.trend")}</CardTitle>
          </CardHeader>
          <CardContent>
            {trend.length > 0 ? (
              <ResponsiveContainer width="100%" height={240}>
                <BarChart data={trend} margin={{ left: 8, right: 16 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" fontSize={11} />
                  <YAxis allowDecimals={false} fontSize={11} />
                  <Tooltip />
                  <Bar dataKey="count" fill="var(--chart-2)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-[240px] items-center justify-center text-sm text-muted-foreground">—</div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold">{t("secondary.chart.docCoverage")}</CardTitle>
          </CardHeader>
          <CardContent>
            {documentCoverage.length > 0 ? (
              <ResponsiveContainer width="100%" height={240}>
                <BarChart data={documentCoverage} layout="vertical" margin={{ left: 8, right: 16 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                  <XAxis type="number" allowDecimals={false} fontSize={11} />
                  <YAxis type="category" dataKey="label" width={130} fontSize={10} />
                  <Tooltip />
                  <Bar dataKey="count" fill="var(--chart-1)" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-[240px] items-center justify-center text-sm text-muted-foreground">—</div>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="space-y-3">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-1 flex-col gap-2 sm:flex-row sm:flex-wrap">
            <div className="relative flex-1 sm:max-w-xs">
              <Search className="text-muted-foreground absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2" />
              <Input
                placeholder={t("secondary.table.searchPlaceholder")}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={status} onValueChange={(v) => setStatus(v ?? ALL)}>
              <SelectTrigger className="h-9 w-full sm:w-44"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL}>{t("common.all")}</SelectItem>
                <SelectItem value="submitted">{statusLabel.submitted}</SelectItem>
                <SelectItem value="in_progress">{statusLabel.in_progress}</SelectItem>
                <SelectItem value="not_started">{statusLabel.not_started}</SelectItem>
              </SelectContent>
            </Select>
            <Select value={reviewFilter} onValueChange={(v) => setReviewFilter(v ?? ALL)}>
              <SelectTrigger className="h-9 w-full sm:w-44"><SelectValue placeholder={t("secondary.table.recommendation")} /></SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL}>{t("common.all")}</SelectItem>
                <SelectItem value="pending">{reviewStatusLabel.pending}</SelectItem>
                <SelectItem value="approved">{reviewStatusLabel.approved}</SelectItem>
                <SelectItem value="rejected">{reviewStatusLabel.rejected}</SelectItem>
                <SelectItem value="needs_correction">{reviewStatusLabel.needs_correction}</SelectItem>
              </SelectContent>
            </Select>
            {canManage && (
              <>
                <Select value={finalFilter} onValueChange={(v) => setFinalFilter(v ?? ALL)}>
                  <SelectTrigger className="h-9 w-full sm:w-44"><SelectValue placeholder={t("secondary.table.finalDecision")} /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value={ALL}>{t("common.all")}</SelectItem>
                    <SelectItem value="pending">{reviewStatusLabel.pending}</SelectItem>
                    <SelectItem value="approved">{reviewStatusLabel.approved}</SelectItem>
                    <SelectItem value="rejected">{reviewStatusLabel.rejected}</SelectItem>
                    <SelectItem value="needs_correction">{reviewStatusLabel.needs_correction}</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={assigneeFilter} onValueChange={(v) => setAssigneeFilter(v ?? ALL)}>
                  <SelectTrigger className="h-9 w-full sm:w-44"><SelectValue placeholder={t("secondary.table.assignedTo")} /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value={ALL}>{t("common.all")}</SelectItem>
                    <SelectItem value={UNASSIGNED}>{t("secondary.table.unassignedLabel")}</SelectItem>
                    {reviewers.map((r) => (
                      <SelectItem key={r.id} value={r.id}>{r.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </>
            )}
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => exportRows("xlsx")}>
              <FileSpreadsheet className="mr-1 h-4 w-4" /> Excel
            </Button>
            <Button variant="outline" size="sm" onClick={() => exportRows("csv")}>
              <FileText className="mr-1 h-4 w-4" /> CSV
            </Button>
          </div>
        </div>

        {canManage && selectedIds.length > 0 && (
          <div className="flex flex-wrap items-center gap-2 rounded-md border bg-accent/30 p-3">
            <span className="text-sm font-medium">
              {selectedIds.length} {t("secondary.table.matching")}
            </span>
            <Select value={assignTarget} onValueChange={(v) => setAssignTarget(v ?? "")}>
              <SelectTrigger className="h-9 w-56"><SelectValue placeholder={t("secondary.assign.placeholder")} /></SelectTrigger>
              <SelectContent>
                <SelectItem value={UNASSIGNED}>{t("secondary.table.unassignedLabel")}</SelectItem>
                {reviewers.map((r) => (
                  <SelectItem key={r.id} value={r.id}>{r.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button size="sm" onClick={assignSelected} disabled={!assignTarget || assigning}>
              {assigning ? t("common.loading") : t("secondary.assign.button")}
            </Button>
          </div>
        )}

        <div className="overflow-x-auto rounded-lg border bg-background">
          <table className="w-full text-sm">
            <thead className="border-b bg-muted/50">
              {table.getHeaderGroups().map((hg) => (
                <tr key={hg.id}>
                  {hg.headers.map((h) => (
                    <th key={h.id} className="px-3 py-2.5 text-left font-medium text-muted-foreground">
                      {h.isPlaceholder ? null : flexRender(h.column.columnDef.header, h.getContext())}
                    </th>
                  ))}
                </tr>
              ))}
            </thead>
            <tbody>
              {table.getRowModel().rows.length === 0 ? (
                <tr>
                  <td colSpan={columns.length} className="px-3 py-10 text-center text-muted-foreground">
                    {t("table.empty")}
                  </td>
                </tr>
              ) : (
                table.getRowModel().rows.map((row) => (
                  <tr key={row.id} className="border-b last:border-0 hover:bg-muted/30">
                    {row.getVisibleCells().map((cell) => (
                      <td key={cell.id} className="px-3 py-2.5 align-middle">
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </td>
                    ))}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3">
          <span className="text-muted-foreground text-sm">
            {filtered.length} {t("secondary.table.matching")}
          </span>
          <div className="flex items-center gap-2 text-sm">
            <span className="text-muted-foreground">
              {t("table.page")} {table.getState().pagination.pageIndex + 1} {t("common.of")}{" "}
              {table.getPageCount() || 1}
            </span>
            <Button variant="outline" size="icon-sm" onClick={() => table.previousPage()} disabled={!table.getCanPreviousPage()}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="icon-sm" onClick={() => table.nextPage()} disabled={!table.getCanNextPage()}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}

function SortHeader({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button type="button" onClick={onClick} className="inline-flex items-center gap-1 hover:text-foreground">
      {label}
      <ArrowUpDown className="h-3 w-3" />
    </button>
  )
}
