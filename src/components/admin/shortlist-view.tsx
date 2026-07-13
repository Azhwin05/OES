"use client"

import { useMemo, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import {
  HeartPulse,
  Users,
  UserX,
  Home,
  ShieldAlert,
  Copy,
  Ban,
  CheckCircle2,
  Search,
  Eye,
  Info,
} from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { useT } from "@/lib/i18n/context"
import { setShortlisted } from "@/app/oes/admin/actions"
import { exportToExcel } from "@/lib/export"
import type { ShortlistReport, ShortlistRow, PriorityEntry, PriorityTier } from "@/lib/shortlist"
import { PRIORITY_LABELS } from "@/lib/shortlist"

const TIER_ICON: Record<PriorityTier, React.ElementType> = {
  1: HeartPulse,
  2: UserX,
  3: Users,
  4: Home,
}

const TIER_COLOR: Record<PriorityTier, string> = {
  1: "bg-rose-100 text-rose-800 border-rose-200",
  2: "bg-purple-100 text-purple-800 border-purple-200",
  3: "bg-amber-100 text-amber-800 border-amber-200",
  4: "bg-blue-100 text-blue-800 border-blue-200",
}

export function ShortlistView({
  report,
  canManage,
}: {
  report: ShortlistReport
  canManage: boolean
}) {
  const t = useT()
  const [tab, setTab] = useState("overview")

  const shortlistedCount = useMemo(() => {
    let n = 0
    for (const tier of [1, 2, 3, 4] as PriorityTier[]) {
      n += report.priorityGroups[tier].filter((e) => e.row.shortlisted).length
    }
    n += report.notEligible.filter((e) => e.row.shortlisted).length
    return n
  }, [report])

  return (
    <div className="space-y-5">
      {!canManage && (
        <Alert>
          <Info />
          <AlertTitle>{t("shortlist.viewerNotice")}</AlertTitle>
        </Alert>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        <StatCard label={t("shortlist.stat.total")} value={report.total} />
        <StatCard label={t("shortlist.stat.excludedOther")} value={report.excludedOther.length} tone="rose" />
        <StatCard label={t("shortlist.stat.excludedBlank")} value={report.excludedBlank.length} tone="rose" />
        <StatCard label={t("shortlist.stat.duplicates")} value={report.duplicateGroups.length} tone="amber" />
        <StatCard label={t("shortlist.stat.clean")} value={report.cleanCount} tone="emerald" />
        <StatCard label={t("shortlist.stat.shortlisted")} value={shortlistedCount} tone="blue" />
      </div>

      <Tabs value={tab} onValueChange={(v) => v && setTab(String(v))}>
        <TabsList className="h-auto flex-wrap">
          <TabsTrigger value="overview">{t("shortlist.tab.overview")}</TabsTrigger>
          <TabsTrigger value="p1">{t("shortlist.tab.priority1")}</TabsTrigger>
          <TabsTrigger value="p2">{t("shortlist.tab.priority2")}</TabsTrigger>
          <TabsTrigger value="p3">{t("shortlist.tab.priority3")}</TabsTrigger>
          <TabsTrigger value="p4">{t("shortlist.tab.priority4")}</TabsTrigger>
          <TabsTrigger value="duplicates">
            {t("shortlist.tab.duplicates")} ({report.duplicateGroups.length})
          </TabsTrigger>
          <TabsTrigger value="excluded">
            {t("shortlist.tab.excluded")} ({report.excludedOther.length + report.excludedBlank.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <OverviewPanel report={report} />
        </TabsContent>
        <TabsContent value="p1">
          <PriorityPanel tier={1} entries={report.priorityGroups[1]} canManage={canManage} />
        </TabsContent>
        <TabsContent value="p2">
          <PriorityPanel tier={2} entries={report.priorityGroups[2]} canManage={canManage} />
        </TabsContent>
        <TabsContent value="p3">
          <PriorityPanel tier={3} entries={report.priorityGroups[3]} canManage={canManage} />
        </TabsContent>
        <TabsContent value="p4">
          <PriorityPanel tier={4} entries={report.priorityGroups[4]} canManage={canManage} />
        </TabsContent>
        <TabsContent value="duplicates">
          <DuplicatesPanel report={report} />
        </TabsContent>
        <TabsContent value="excluded">
          <ExcludedPanel report={report} />
        </TabsContent>
      </Tabs>
    </div>
  )
}

function StatCard({
  label,
  value,
  tone,
}: {
  label: string
  value: number
  tone?: "rose" | "amber" | "emerald" | "blue"
}) {
  const toneClass =
    tone === "rose"
      ? "text-rose-600"
      : tone === "amber"
        ? "text-amber-600"
        : tone === "emerald"
          ? "text-emerald-600"
          : tone === "blue"
            ? "text-blue-600"
            : "text-foreground"
  return (
    <Card size="sm">
      <CardContent className="py-1">
        <p className={`text-2xl font-bold tabular-nums ${toneClass}`}>{value}</p>
        <p className="text-muted-foreground text-xs">{label}</p>
      </CardContent>
    </Card>
  )
}

function OverviewPanel({ report }: { report: ShortlistReport }) {
  const t = useT()
  const tiers: PriorityTier[] = [1, 2, 3, 4]
  const maxTier = Math.max(1, ...tiers.map((tier) => report.priorityGroups[tier].length))
  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle>{t("shortlist.tab.overview")}</CardTitle>
          <CardDescription>{t("shortlist.subtitle")}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {tiers.map((tier) => {
            const Icon = TIER_ICON[tier]
            const count = report.priorityGroups[tier].length
            const pct = Math.round((count / maxTier) * 100)
            return (
              <div key={tier} className="space-y-1">
                <div className="flex items-center justify-between text-sm">
                  <span className="flex items-center gap-1.5 font-medium">
                    <Icon className="h-4 w-4" /> {t(PRIORITY_LABELS[tier])}
                  </span>
                  <span className="text-muted-foreground tabular-nums">{count}</span>
                </div>
                <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                  <div
                    className={`h-full rounded-full ${TIER_COLOR[tier].split(" ")[0].replace("100", "500")}`}
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </div>
            )
          })}
          <div className="flex items-center justify-between border-t pt-2 text-sm text-muted-foreground">
            <span>{t("shortlist.priority4.title").split(" — ")[0]} → Not eligible</span>
            <span className="tabular-nums">{report.notEligible.length}</span>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-1.5">
            <Ban className="h-4 w-4" /> {t("shortlist.tab.excluded")}
          </CardTitle>
          <CardDescription>
            {t("shortlist.stat.excludedOther")} + {t("shortlist.stat.excludedBlank")}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <div className="flex items-center justify-between">
            <span>{t("shortlist.stat.excludedOther")}</span>
            <Badge variant="outline" className="border-rose-200 bg-rose-100 text-rose-800">
              {report.excludedOther.length}
            </Badge>
          </div>
          <div className="flex items-center justify-between">
            <span>{t("shortlist.stat.excludedBlank")}</span>
            <Badge variant="outline" className="border-rose-200 bg-rose-100 text-rose-800">
              {report.excludedBlank.length}
            </Badge>
          </div>
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <Copy className="h-3.5 w-3.5" /> {t("shortlist.stat.duplicates")}
            </span>
            <Badge variant="outline" className="border-amber-200 bg-amber-100 text-amber-800">
              {report.duplicateGroups.length}
            </Badge>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

function PriorityPanel({
  tier,
  entries,
  canManage,
}: {
  tier: PriorityTier
  entries: PriorityEntry[]
  canManage: boolean
}) {
  const t = useT()
  const router = useRouter()
  const [search, setSearch] = useState("")
  const [selected, setSelected] = useState<Record<string, boolean>>({})
  const [confirm, setConfirm] = useState<{ ids: string[]; value: boolean } | null>(null)
  const [busy, setBusy] = useState(false)

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return entries
    return entries.filter((e) => {
      const r = e.row
      const hay = [r.applicant_name, r.full_name, r.primary_phone, r.reference_number, r.district]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
      return hay.includes(q)
    })
  }, [entries, search])

  const selectedIds = Object.keys(selected).filter((id) => selected[id])
  const allChecked = filtered.length > 0 && filtered.every((e) => selected[e.row.id])

  function toggleAll(v: boolean) {
    const next = { ...selected }
    filtered.forEach((e) => {
      next[e.row.id] = v
    })
    setSelected(next)
  }

  async function apply() {
    if (!confirm) return
    setBusy(true)
    const res = await setShortlisted(confirm.ids, confirm.value)
    setBusy(false)
    setConfirm(null)
    if (res.ok) {
      toast.success(t("shortlist.toast.success"))
      setSelected({})
      router.refresh()
    } else {
      toast.error(t("shortlist.toast.error"))
    }
  }

  function exportGroup() {
    const flat = filtered.map((e) => ({
      Reference: e.row.reference_number,
      Name: e.row.applicant_name,
      Phone: e.row.primary_phone,
      District: e.row.district ?? "",
      Course: e.row.course_name ?? "",
      Reasons: e.reasons.join("; "),
      Duplicate: e.isDuplicate ? "Yes" : "No",
      Shortlisted: e.row.shortlisted ? "Yes" : "No",
    }))
    exportToExcel(flat, `oes-shortlist-priority-${tier}-${new Date().toISOString().slice(0, 10)}`)
  }

  const Icon = TIER_ICON[tier]

  return (
    <div className="space-y-3">
      <div className="flex items-start gap-2 rounded-lg border bg-background p-3">
        <Icon className="mt-0.5 h-5 w-5 shrink-0 text-muted-foreground" />
        <div>
          <p className="font-medium">{t(PRIORITY_LABELS[tier])}</p>
          <p className="text-muted-foreground text-sm">
            {t(`shortlist.priority${tier}.desc` as const)}
          </p>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="text-muted-foreground absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2" />
          <Input
            placeholder={t("shortlist.searchPlaceholder")}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Button variant="outline" size="sm" onClick={exportGroup}>
          {t("common.view")} → Excel
        </Button>
        {canManage && selectedIds.length > 0 && (
          <>
            <Button size="sm" onClick={() => setConfirm({ ids: selectedIds, value: true })}>
              <CheckCircle2 className="mr-1 h-4 w-4" />
              {t("shortlist.action.markShortlisted")} ({selectedIds.length})
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setConfirm({ ids: selectedIds, value: false })}
            >
              {t("shortlist.action.removeShortlisted")}
            </Button>
          </>
        )}
      </div>

      <div className="overflow-x-auto rounded-lg border bg-background">
        <table className="w-full text-sm">
          <thead className="border-b bg-muted/50">
            <tr>
              {canManage && (
                <th className="px-3 py-2.5 text-left">
                  <Checkbox checked={allChecked} onCheckedChange={(v) => toggleAll(v === true)} />
                </th>
              )}
              <th className="px-3 py-2.5 text-left font-medium text-muted-foreground">{t("table.refNumber")}</th>
              <th className="px-3 py-2.5 text-left font-medium text-muted-foreground">{t("table.name")}</th>
              <th className="px-3 py-2.5 text-left font-medium text-muted-foreground">{t("table.phone")}</th>
              <th className="px-3 py-2.5 text-left font-medium text-muted-foreground">{t("table.district")}</th>
              <th className="px-3 py-2.5 text-left font-medium text-muted-foreground">{t("shortlist.reasonsFor")}</th>
              <th className="px-3 py-2.5 text-left font-medium text-muted-foreground">{t("table.status")}</th>
              <th className="px-3 py-2.5 text-left font-medium text-muted-foreground">{t("common.view")}</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-3 py-10 text-center text-muted-foreground">
                  {t("shortlist.empty")}
                </td>
              </tr>
            ) : (
              filtered.map((e) => (
                <tr key={e.row.id} className="border-b last:border-0 hover:bg-muted/30">
                  {canManage && (
                    <td className="px-3 py-2.5">
                      <Checkbox
                        checked={!!selected[e.row.id]}
                        onCheckedChange={(v) =>
                          setSelected((s) => ({ ...s, [e.row.id]: v === true }))
                        }
                      />
                    </td>
                  )}
                  <td className="px-3 py-2.5 font-mono text-xs">{e.row.reference_number}</td>
                  <td className="px-3 py-2.5">
                    <div className="flex items-center gap-1.5">
                      <span className="font-medium">{e.row.applicant_name}</span>
                      {e.isDuplicate && (
                        <Badge variant="outline" className="border-amber-200 bg-amber-100 text-[10px] text-amber-800">
                          {t("shortlist.duplicate.badge")}
                        </Badge>
                      )}
                    </div>
                  </td>
                  <td className="px-3 py-2.5">{e.row.primary_phone}</td>
                  <td className="px-3 py-2.5">{e.row.district ?? "—"}</td>
                  <td className="px-3 py-2.5">
                    <div className="flex flex-wrap gap-1">
                      {e.reasons.map((r) => (
                        <Badge key={r} variant="outline" className={TIER_COLOR[tier] + " text-[10px]"}>
                          {r}
                        </Badge>
                      ))}
                    </div>
                  </td>
                  <td className="px-3 py-2.5">
                    {e.row.shortlisted ? (
                      <Badge className="bg-emerald-100 text-emerald-800 border-emerald-200" variant="outline">
                        {t("shortlist.status.shortlisted")}
                      </Badge>
                    ) : (
                      <Badge variant="outline">{t("shortlist.status.notShortlisted")}</Badge>
                    )}
                  </td>
                  <td className="px-3 py-2.5">
                    <Button variant="ghost" size="icon-sm" render={<Link href={`/oes/admin/applications/${e.row.id}`} />}>
                      <Eye className="h-4 w-4" />
                    </Button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <Dialog open={!!confirm} onOpenChange={(o) => !o && setConfirm(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {confirm?.value ? t("shortlist.confirm.markTitle") : t("shortlist.confirm.removeTitle")}
            </DialogTitle>
            <DialogDescription>
              {confirm?.ids.length} {t("table.selected")} — {t("shortlist.confirm.desc")}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirm(null)}>
              {t("common.cancel")}
            </Button>
            <Button onClick={apply} disabled={busy}>
              {confirm?.value ? t("shortlist.action.markShortlisted") : t("shortlist.action.removeShortlisted")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

function DuplicatesPanel({ report }: { report: ShortlistReport }) {
  const t = useT()
  if (report.duplicateGroups.length === 0) {
    return (
      <Alert>
        <CheckCircle2 />
        <AlertTitle>{t("shortlist.empty")}</AlertTitle>
      </Alert>
    )
  }
  return (
    <div className="space-y-3">
      <Alert>
        <ShieldAlert />
        <AlertTitle>{t("shortlist.duplicate.title")}</AlertTitle>
        <AlertDescription>{t("shortlist.duplicate.subtitle")}</AlertDescription>
      </Alert>
      {report.duplicateGroups.map((g) => (
        <Card key={g.id}>
          <CardHeader>
            <CardTitle className="flex flex-wrap items-center gap-2 text-sm">
              <Copy className="h-4 w-4" /> {g.rows.length} {t("table.selected")}
              <span className="text-muted-foreground text-xs font-normal">
                {t("shortlist.duplicate.match")}:
              </span>
              {g.matchTypes.map((mt) => (
                <Badge key={mt} variant="outline" className="border-amber-200 bg-amber-100 text-amber-800">
                  {mt}
                </Badge>
              ))}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto rounded-lg border">
              <table className="w-full text-sm">
                <thead className="border-b bg-muted/50">
                  <tr>
                    <th className="px-3 py-2 text-left font-medium text-muted-foreground">{t("table.refNumber")}</th>
                    <th className="px-3 py-2 text-left font-medium text-muted-foreground">{t("table.name")}</th>
                    <th className="px-3 py-2 text-left font-medium text-muted-foreground">{t("table.phone")}</th>
                    <th className="px-3 py-2 text-left font-medium text-muted-foreground">Email</th>
                    <th className="px-3 py-2 text-left font-medium text-muted-foreground">{t("table.submitted")}</th>
                    <th className="px-3 py-2 text-left font-medium text-muted-foreground">{t("common.view")}</th>
                  </tr>
                </thead>
                <tbody>
                  {g.rows.map((r: ShortlistRow) => (
                    <tr key={r.id} className="border-b last:border-0 hover:bg-muted/30">
                      <td className="px-3 py-2 font-mono text-xs">{r.reference_number}</td>
                      <td className="px-3 py-2 font-medium">{r.applicant_name}</td>
                      <td className="px-3 py-2">{r.primary_phone}</td>
                      <td className="px-3 py-2">{r.email ?? "—"}</td>
                      <td className="px-3 py-2">{new Date(r.submitted_at).toLocaleDateString()}</td>
                      <td className="px-3 py-2">
                        <Button variant="ghost" size="icon-sm" render={<Link href={`/oes/admin/applications/${r.id}`} />}>
                          <Eye className="h-4 w-4" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

function ExcludedPanel({ report }: { report: ShortlistReport }) {
  const t = useT()
  return (
    <div className="space-y-5">
      <ExcludedTable
        title={t("shortlist.stat.excludedOther")}
        rows={report.excludedOther}
      />
      <ExcludedTable
        title={t("shortlist.stat.excludedBlank")}
        rows={report.excludedBlank}
      />
    </div>
  )
}

function ExcludedTable({
  title,
  rows,
}: {
  title: string
  rows: { row: ShortlistRow; reasons: { type: string; field: string }[] }[]
}) {
  const t = useT()
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{rows.length} {t("table.selected")}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto rounded-lg border">
          <table className="w-full text-sm">
            <thead className="border-b bg-muted/50">
              <tr>
                <th className="px-3 py-2 text-left font-medium text-muted-foreground">{t("table.refNumber")}</th>
                <th className="px-3 py-2 text-left font-medium text-muted-foreground">{t("table.name")}</th>
                <th className="px-3 py-2 text-left font-medium text-muted-foreground">{t("table.phone")}</th>
                <th className="px-3 py-2 text-left font-medium text-muted-foreground">{t("shortlist.reasonsFor")}</th>
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-3 py-8 text-center text-muted-foreground">
                    {t("shortlist.empty")}
                  </td>
                </tr>
              ) : (
                rows.map(({ row, reasons }) => (
                  <tr key={row.id} className="border-b last:border-0 hover:bg-muted/30">
                    <td className="px-3 py-2 font-mono text-xs">{row.reference_number}</td>
                    <td className="px-3 py-2 font-medium">{row.applicant_name}</td>
                    <td className="px-3 py-2">{row.primary_phone}</td>
                    <td className="px-3 py-2">
                      <div className="flex flex-wrap gap-1">
                        {reasons.map((r, i) => (
                          <Badge key={i} variant="outline" className="border-rose-200 bg-rose-100 text-[10px] text-rose-800">
                            {r.field}
                          </Badge>
                        ))}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  )
}
