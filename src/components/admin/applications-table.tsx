"use client"

import { useMemo, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
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
  ArrowUpDown,
  Eye,
  Trash2,
  FileSpreadsheet,
  FileText,
  ChevronLeft,
  ChevronRight,
  Search,
  X,
} from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { StatusBadge } from "@/components/status-badge"
import { useT } from "@/lib/i18n/context"
import { APP_STATUSES, DISTRICTS, GENDERS, SCHOOL_TYPES, RESIDENCE_TYPES } from "@/lib/constants"
import type { ApplicationListRow } from "@/lib/queries"
import { softDeleteApplications } from "@/app/admin/actions"
import { exportToExcel, exportToCsv } from "@/lib/export"

const ALL = "all"

export function ApplicationsTable({ data }: { data: ApplicationListRow[] }) {
  const t = useT()
  const router = useRouter()

  const [search, setSearch] = useState("")
  const [status, setStatus] = useState(ALL)
  const [district, setDistrict] = useState(ALL)
  const [gender, setGender] = useState(ALL)
  const [schoolType, setSchoolType] = useState(ALL)
  const [residenceType, setResidenceType] = useState(ALL)
  const [scholarship, setScholarship] = useState(ALL)
  const [impairment, setImpairment] = useState(ALL)
  const [dateFrom, setDateFrom] = useState("")
  const [dateTo, setDateTo] = useState("")

  const [sorting, setSorting] = useState<SortingState>([])
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({})
  const [confirmDelete, setConfirmDelete] = useState<string[] | null>(null)
  const [deleting, setDeleting] = useState(false)

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return data.filter((r) => {
      if (q) {
        const hay = [
          r.applicant_name, r.name_tamil, r.primary_phone, r.email,
          r.reference_number, r.district, r.institution_name, r.course_name,
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase()
        if (!hay.includes(q)) return false
      }
      if (status !== ALL && r.status !== status) return false
      if (district !== ALL && r.district !== district) return false
      if (gender !== ALL && r.gender !== gender) return false
      if (schoolType !== ALL && r.school_type !== schoolType) return false
      if (residenceType !== ALL && r.residence_type !== residenceType) return false
      if (scholarship !== ALL && r.has_scholarship !== (scholarship === "yes")) return false
      if (impairment !== ALL && r.has_impairment !== (impairment === "yes")) return false
      if (dateFrom && new Date(r.submitted_at) < new Date(dateFrom)) return false
      if (dateTo && new Date(r.submitted_at) > new Date(dateTo + "T23:59:59")) return false
      return true
    })
  }, [data, search, status, district, gender, schoolType, residenceType, scholarship, impairment, dateFrom, dateTo])

  const columns = useMemo<ColumnDef<ApplicationListRow>[]>(
    () => [
      {
        id: "select",
        header: ({ table }) => (
          <Checkbox
            checked={table.getIsAllPageRowsSelected()}
            onCheckedChange={(v) => table.toggleAllPageRowsSelected(v === true)}
            aria-label="Select all"
          />
        ),
        cell: ({ row }) => (
          <Checkbox
            checked={row.getIsSelected()}
            onCheckedChange={(v) => row.toggleSelected(v === true)}
            aria-label="Select row"
          />
        ),
        enableSorting: false,
      },
      {
        accessorKey: "reference_number",
        header: t("table.refNumber"),
        cell: ({ row }) => (
          <Link
            href={`/admin/applications/${row.original.id}`}
            className="font-mono text-xs font-medium text-primary hover:underline"
          >
            {row.original.reference_number}
          </Link>
        ),
      },
      {
        accessorKey: "applicant_name",
        header: ({ column }) => (
          <SortHeader label={t("table.name")} onClick={() => column.toggleSorting()} />
        ),
        cell: ({ row }) => (
          <div className="min-w-0">
            <p className="truncate font-medium">{row.original.applicant_name}</p>
            {row.original.name_tamil && (
              <p className="text-muted-foreground truncate font-tamil text-xs">
                {row.original.name_tamil}
              </p>
            )}
          </div>
        ),
      },
      { accessorKey: "primary_phone", header: t("table.phone") },
      { accessorKey: "district", header: t("table.district"), cell: ({ row }) => row.original.district ?? "—" },
      { accessorKey: "course_name", header: t("table.course"), cell: ({ row }) => row.original.course_name ?? "—" },
      {
        accessorKey: "status",
        header: t("table.status"),
        cell: ({ row }) => <StatusBadge status={row.original.status} />,
      },
      {
        accessorKey: "submitted_at",
        header: ({ column }) => (
          <SortHeader label={t("table.submitted")} onClick={() => column.toggleSorting()} />
        ),
        cell: ({ row }) => new Date(row.original.submitted_at).toLocaleDateString(),
      },
      {
        id: "actions",
        header: t("common.actions"),
        cell: ({ row }) => (
          <Button variant="ghost" size="icon-sm" render={<Link href={`/admin/applications/${row.original.id}`} />}>
            <Eye className="h-4 w-4" />
          </Button>
        ),
        enableSorting: false,
      },
    ],
    [t]
  )

  const table = useReactTable({
    data: filtered,
    columns,
    state: { sorting, rowSelection },
    onSortingChange: setSorting,
    onRowSelectionChange: setRowSelection,
    getRowId: (r) => r.id,
    enableRowSelection: true,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: { pagination: { pageSize: 10 } },
  })

  const selectedIds = Object.keys(rowSelection).filter((id) => rowSelection[id])

  function exportRows(rows: ApplicationListRow[], kind: "xlsx" | "csv") {
    if (rows.length === 0) return toast.error(t("table.empty"))
    const flat = rows.map((r) => ({
      Reference: r.reference_number,
      Name: r.applicant_name,
      TamilName: r.name_tamil ?? "",
      Phone: r.primary_phone,
      Email: r.email ?? "",
      Gender: r.gender ?? "",
      District: r.district ?? "",
      Course: r.course_name ?? "",
      Institution: r.institution_name ?? "",
      SchoolType: r.school_type ?? "",
      Scholarship: r.has_scholarship ? "Yes" : "No",
      Impairment: r.has_impairment ? "Yes" : "No",
      Status: r.status,
      Submitted: new Date(r.submitted_at).toLocaleString(),
    }))
    const name = `oes-applications-${new Date().toISOString().slice(0, 10)}`
    if (kind === "xlsx") exportToExcel(flat, name)
    else exportToCsv(flat, name)
  }

  async function doDelete() {
    if (!confirmDelete) return
    setDeleting(true)
    const res = await softDeleteApplications(confirmDelete)
    setDeleting(false)
    setConfirmDelete(null)
    if (res.ok) {
      setRowSelection({})
      toast.success(t("common.delete"))
      router.refresh()
    } else {
      toast.error(t("err.unauthorized"))
    }
  }

  function clearFilters() {
    setSearch(""); setStatus(ALL); setDistrict(ALL); setGender(ALL)
    setSchoolType(ALL); setResidenceType(ALL); setScholarship(ALL)
    setImpairment(ALL); setDateFrom(""); setDateTo("")
  }

  const selectedRows = filtered.filter((r) => selectedIds.includes(r.id))

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex flex-col gap-3">
        <div className="relative">
          <Search className="text-muted-foreground absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2" />
          <Input
            placeholder={t("table.searchPlaceholder")}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
          <FilterSelect label={t("filter.status")} value={status} onChange={setStatus}
            options={APP_STATUSES.map((s) => ({ value: s, label: t(`status.${s}`) }))} />
          <FilterSelect label={t("filter.district")} value={district} onChange={setDistrict}
            options={DISTRICTS.map((d) => ({ value: d, label: d }))} />
          <FilterSelect label={t("filter.gender")} value={gender} onChange={setGender}
            options={GENDERS.map((g) => ({ value: g, label: t(`f.gender.${g}`) }))} />
          <FilterSelect label={t("filter.schoolType")} value={schoolType} onChange={setSchoolType}
            options={SCHOOL_TYPES.map((s) => ({ value: s, label: t(`f.${s}`) }))} />
          <FilterSelect label={t("filter.residenceType")} value={residenceType} onChange={setResidenceType}
            options={RESIDENCE_TYPES.map((r) => ({ value: r, label: t(`f.residenceType.${r}`) }))} />
          <FilterSelect label={t("filter.scholarship")} value={scholarship} onChange={setScholarship}
            options={[{ value: "yes", label: t("common.yes") }, { value: "no", label: t("common.no") }]} />
          <FilterSelect label={t("filter.impairment")} value={impairment} onChange={setImpairment}
            options={[{ value: "yes", label: t("common.yes") }, { value: "no", label: t("common.no") }]} />
          <div className="flex items-end gap-1">
            <div className="grid gap-1">
              <span className="text-muted-foreground text-[11px]">{t("filter.dateFrom")}</span>
              <Input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} className="h-8" />
            </div>
            <div className="grid gap-1">
              <span className="text-muted-foreground text-[11px]">{t("filter.dateTo")}</span>
              <Input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} className="h-8" />
            </div>
          </div>
        </div>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <Button variant="ghost" size="sm" onClick={clearFilters}>
            <X className="mr-1 h-4 w-4" /> {t("filter.clearAll")}
          </Button>
          <div className="flex flex-wrap items-center gap-2">
            {selectedIds.length > 0 && (
              <>
                <span className="text-muted-foreground text-sm">
                  {selectedIds.length} {t("table.selected")}
                </span>
                <Button variant="destructive" size="sm" onClick={() => setConfirmDelete(selectedIds)}>
                  <Trash2 className="mr-1 h-4 w-4" /> {t("table.bulkDelete")}
                </Button>
              </>
            )}
            <Button variant="outline" size="sm"
              onClick={() => exportRows(selectedRows.length ? selectedRows : filtered, "xlsx")}>
              <FileSpreadsheet className="mr-1 h-4 w-4" /> Excel
            </Button>
            <Button variant="outline" size="sm"
              onClick={() => exportRows(selectedRows.length ? selectedRows : filtered, "csv")}>
              <FileText className="mr-1 h-4 w-4" /> CSV
            </Button>
          </div>
        </div>
      </div>

      {/* Table */}
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

      {/* Pagination */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-sm">
          <span className="text-muted-foreground">{t("table.rowsPerPage")}</span>
          <Select value={String(table.getState().pagination.pageSize)}
            onValueChange={(v) => table.setPageSize(Number(v))}>
            <SelectTrigger className="h-8 w-[72px]"><SelectValue /></SelectTrigger>
            <SelectContent>
              {[10, 20, 50, 100].map((n) => (
                <SelectItem key={n} value={String(n)}>{n}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
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

      <Dialog open={!!confirmDelete} onOpenChange={(o) => !o && setConfirmDelete(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("table.bulkDelete")}</DialogTitle>
            <DialogDescription>
              {confirmDelete?.length} {t("table.selected")}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmDelete(null)}>{t("common.cancel")}</Button>
            <Button variant="destructive" onClick={doDelete} disabled={deleting}>
              {t("common.delete")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
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

function FilterSelect({
  label,
  value,
  onChange,
  options,
}: {
  label: string
  value: string
  onChange: (v: string) => void
  options: { value: string; label: string }[]
}) {
  const t = useT()
  return (
    <div className="grid gap-1">
      <span className="text-muted-foreground text-[11px]">{label}</span>
      <Select value={value} onValueChange={(v) => onChange(v ?? "all")}>
        <SelectTrigger className="h-8 w-full"><SelectValue /></SelectTrigger>
        <SelectContent>
          <SelectItem value="all">{t("common.all")}</SelectItem>
          {options.map((o) => (
            <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}
