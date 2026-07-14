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
  CheckCircle2,
  Search,
  Eye,
  Info,
  Sparkles,
  FileSpreadsheet,
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
import type {
  ShortlistIndex,
  ClassifiedRow,
  CriterionKey,
  ShortlistRow,
} from "@/lib/shortlist"
import { CRITERIA_ORDER, CRITERION_LABEL_KEYS, CRITERION_DESC_KEYS } from "@/lib/shortlist"

const TIER_ICON: Record<CriterionKey, React.ElementType> = {
  impairment: HeartPulse,
  parentless: UserX,
  singleParent: Users,
  bothParents: Home,
}

const TIER_COLOR: Record<CriterionKey, string> = {
  impairment: "bg-rose-100 text-rose-800 border-rose-200",
  parentless: "bg-purple-100 text-purple-800 border-purple-200",
  singleParent: "bg-amber-100 text-amber-800 border-amber-200",
  bothParents: "bg-blue-100 text-blue-800 border-blue-200",
}

const EMPTY_CRITERIA: Record<CriterionKey, boolean> = {
  impairment: false,
  parentless: false,
  singleParent: false,
  bothParents: false,
}

export function ShortlistView({
  index,
  canManage,
}: {
  index: ShortlistIndex
  canManage: boolean
}) {
  const t = useT()
  const [tab, setTab] = useState("builder")

  const shortlistedCount = useMemo(
    () => index.classified.filter((c) => c.row.shortlisted).length,
    [index]
  )
  const excludedOther = useMemo(
    () => index.classified.filter((c) => c.otherReasons.length > 0),
    [index]
  )
  const excludedBlank = useMemo(
    () => index.classified.filter((c) => c.blankReasons.length > 0),
    [index]
  )

  return (
    <div className="space-y-5">
      {!canManage && (
        <Alert>
          <Info />
          <AlertTitle>{t("shortlist.viewerNotice")}</AlertTitle>
        </Alert>
      )}

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard label={t("shortlist.stat.total")} value={index.total} />
        <StatCard label={t("shortlist.stat.shortlisted")} value={shortlistedCount} tone="blue" />
        <StatCard label={t("shortlist.stat.duplicates")} value={index.duplicateGroups.length} tone="amber" />
        <StatCard
          label={t("shortlist.stat.excludedOther") + " + " + t("shortlist.stat.excludedBlank")}
          value={new Set([...excludedOther, ...excludedBlank].map((c) => c.row.id)).size}
          tone="rose"
        />
      </div>

      <Tabs value={tab} onValueChange={(v) => v && setTab(String(v))}>
        <TabsList className="h-auto flex-wrap">
          <TabsTrigger value="builder">
            <Sparkles className="mr-1 h-3.5 w-3.5" /> {t("shortlist.tab.builder")}
          </TabsTrigger>
          <TabsTrigger value="duplicates">
            {t("shortlist.tab.duplicates")} ({index.duplicateGroups.length})
          </TabsTrigger>
          <TabsTrigger value="excluded">
            {t("shortlist.tab.excluded")} ({new Set([...excludedOther, ...excludedBlank].map((c) => c.row.id)).size})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="builder">
          <BuilderPanel index={index} canManage={canManage} />
        </TabsContent>
        <TabsContent value="duplicates">
          <DuplicatesPanel groups={index.duplicateGroups} />
        </TabsContent>
        <TabsContent value="excluded">
          <ExcludedPanel
            other={excludedOther.map((c) => ({ row: c.row, reasons: c.otherReasons }))}
            blank={excludedBlank.map((c) => ({ row: c.row, reasons: c.blankReasons }))}
          />
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

function BuilderPanel({
  index,
  canManage,
}: {
  index: ShortlistIndex
  canManage: boolean
}) {
  const t = useT()
  const router = useRouter()

  const [excludeOther, setExcludeOther] = useState(false)
  const [excludeBlank, setExcludeBlank] = useState(false)
  const [excludeDuplicate, setExcludeDuplicate] = useState(false)
  const [criteria, setCriteria] = useState<Record<CriterionKey, boolean>>(EMPTY_CRITERIA)
  const [search, setSearch] = useState("")
  const [selected, setSelected] = useState<Record<string, boolean>>({})
  const [confirm, setConfirm] = useState<{ ids: string[]; value: boolean } | null>(null)
  const [busy, setBusy] = useState(false)

  const totalOther = useMemo(() => index.classified.filter((c) => c.otherReasons.length > 0).length, [index])
  const totalBlank = useMemo(() => index.classified.filter((c) => c.blankReasons.length > 0).length, [index])
  const totalDuplicate = index.duplicateGroups.reduce((n, g) => n + g.rows.length, 0)

  const basePool = useMemo(
    () =>
      index.classified.filter(
        (c) =>
          (!excludeOther || c.otherReasons.length === 0) &&
          (!excludeBlank || c.blankReasons.length === 0) &&
          (!excludeDuplicate || !c.isDuplicate)
      ),
    [index, excludeOther, excludeBlank, excludeDuplicate]
  )

  const criteriaCounts = useMemo(() => {
    const counts = {} as Record<CriterionKey, number>
    for (const k of CRITERIA_ORDER) counts[k] = basePool.filter((c) => c.matches[k]).length
    return counts
  }, [basePool])

  const anySelected = CRITERIA_ORDER.some((k) => criteria[k])

  const matched = useMemo(() => {
    if (!anySelected) return []
    return basePool.filter((c) => CRITERIA_ORDER.some((k) => criteria[k] && c.matches[k]))
  }, [basePool, criteria, anySelected])

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return matched
    return matched.filter((c) => {
      const r = c.row
      const hay = [r.applicant_name, r.full_name, r.primary_phone, r.reference_number, r.district]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
      return hay.includes(q)
    })
  }, [matched, search])

  const selectedIds = Object.keys(selected).filter((id) => selected[id])
  const allChecked = filtered.length > 0 && filtered.every((c) => selected[c.row.id])

  function toggleAll(v: boolean) {
    const next = { ...selected }
    filtered.forEach((c) => {
      next[c.row.id] = v
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

  function exportCurrent() {
    if (filtered.length === 0) return toast.error(t("shortlist.empty"))
    const flat = filtered.map((c) => ({
      Reference: c.row.reference_number,
      Name: c.row.applicant_name,
      Phone: c.row.primary_phone,
      District: c.row.district ?? "",
      Course: c.row.course_name ?? "",
      MatchedCriteria: CRITERIA_ORDER.filter((k) => c.matches[k])
        .map((k) => t(CRITERION_LABEL_KEYS[k]))
        .join("; "),
      Duplicate: c.isDuplicate ? "Yes" : "No",
      Shortlisted: c.row.shortlisted ? "Yes" : "No",
    }))
    exportToExcel(flat, `oes-shortlist-${new Date().toISOString().slice(0, 10)}`)
  }

  return (
    <div className="space-y-4">
      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>{t("shortlist.builder.removeStep")}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <ToggleRow
              checked={excludeOther}
              onChange={setExcludeOther}
              label={t("shortlist.toggle.other")}
              count={totalOther}
            />
            <ToggleRow
              checked={excludeBlank}
              onChange={setExcludeBlank}
              label={t("shortlist.toggle.blank")}
              count={totalBlank}
            />
            <ToggleRow
              checked={excludeDuplicate}
              onChange={setExcludeDuplicate}
              label={t("shortlist.toggle.duplicates")}
              count={totalDuplicate}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t("shortlist.builder.addStep")}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {CRITERIA_ORDER.map((k) => {
              const Icon = TIER_ICON[k]
              return (
                <label
                  key={k}
                  className="flex cursor-pointer items-start gap-2 rounded-md p-1.5 hover:bg-muted/50"
                >
                  <Checkbox
                    checked={criteria[k]}
                    onCheckedChange={(v) => setCriteria((s) => ({ ...s, [k]: v === true }))}
                    className="mt-0.5"
                  />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <span className="flex items-center gap-1.5 text-sm font-medium">
                        <Icon className="h-4 w-4" /> {t(CRITERION_LABEL_KEYS[k])}
                      </span>
                      <Badge variant="outline" className={TIER_COLOR[k]}>
                        {criteriaCounts[k]}
                      </Badge>
                    </div>
                    <p className="text-muted-foreground text-xs">{t(CRITERION_DESC_KEYS[k])}</p>
                  </div>
                </label>
              )
            })}
          </CardContent>
        </Card>
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
        <span className="text-muted-foreground text-sm">
          {t("shortlist.builder.showing", { shown: filtered.length, total: index.total })}
        </span>
        <Button variant="outline" size="sm" onClick={exportCurrent}>
          <FileSpreadsheet className="mr-1 h-4 w-4" /> {t("shortlist.export.button")}
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

      {!anySelected ? (
        <Alert>
          <Sparkles />
          <AlertTitle>{t("shortlist.builder.empty")}</AlertTitle>
        </Alert>
      ) : (
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
                <th className="px-3 py-2.5 text-left font-medium text-muted-foreground">{t("shortlist.eligibleFor")}</th>
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
                filtered.map((c) => <BuilderRow key={c.row.id} entry={c} canManage={canManage} selected={!!selected[c.row.id]} onSelect={(v) => setSelected((s) => ({ ...s, [c.row.id]: v }))} />)
              )}
            </tbody>
          </table>
        </div>
      )}

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

function ToggleRow({
  checked,
  onChange,
  label,
  count,
}: {
  checked: boolean
  onChange: (v: boolean) => void
  label: string
  count: number
}) {
  return (
    <label className="flex cursor-pointer items-center justify-between gap-2 rounded-md p-1.5 hover:bg-muted/50">
      <span className="flex items-center gap-2 text-sm font-medium">
        <Checkbox checked={checked} onCheckedChange={(v) => onChange(v === true)} />
        {label}
      </span>
      <Badge variant="outline" className="border-rose-200 bg-rose-100 text-rose-800">
        {count}
      </Badge>
    </label>
  )
}

function BuilderRow({
  entry,
  canManage,
  selected,
  onSelect,
}: {
  entry: ClassifiedRow
  canManage: boolean
  selected: boolean
  onSelect: (v: boolean) => void
}) {
  const t = useT()
  const r = entry.row
  return (
    <tr className="border-b last:border-0 hover:bg-muted/30">
      {canManage && (
        <td className="px-3 py-2.5">
          <Checkbox checked={selected} onCheckedChange={(v) => onSelect(v === true)} />
        </td>
      )}
      <td className="px-3 py-2.5 font-mono text-xs">{r.reference_number}</td>
      <td className="px-3 py-2.5">
        <div className="flex items-center gap-1.5">
          <span className="font-medium">{r.applicant_name}</span>
          {entry.isDuplicate && (
            <Badge variant="outline" className="border-amber-200 bg-amber-100 text-[10px] text-amber-800">
              {t("shortlist.duplicate.badge")}
            </Badge>
          )}
        </div>
      </td>
      <td className="px-3 py-2.5">{r.primary_phone}</td>
      <td className="px-3 py-2.5">{r.district ?? "—"}</td>
      <td className="px-3 py-2.5">
        <div className="flex flex-wrap gap-1">
          {CRITERIA_ORDER.filter((k) => entry.matches[k]).map((k) => (
            <Badge key={k} variant="outline" className={TIER_COLOR[k] + " text-[10px]"}>
              {t(CRITERION_LABEL_KEYS[k]).split(" — ")[1] ?? t(CRITERION_LABEL_KEYS[k])}
            </Badge>
          ))}
        </div>
      </td>
      <td className="px-3 py-2.5">
        {r.shortlisted ? (
          <Badge className="bg-emerald-100 text-emerald-800 border-emerald-200" variant="outline">
            {t("shortlist.status.shortlisted")}
          </Badge>
        ) : (
          <Badge variant="outline">{t("shortlist.status.notShortlisted")}</Badge>
        )}
      </td>
      <td className="px-3 py-2.5">
        <Button variant="ghost" size="icon-sm" render={<Link href={`/oes/admin/applications/${r.id}`} />}>
          <Eye className="h-4 w-4" />
        </Button>
      </td>
    </tr>
  )
}

function DuplicatesPanel({ groups }: { groups: ShortlistIndex["duplicateGroups"] }) {
  const t = useT()
  if (groups.length === 0) {
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
      {groups.map((g) => (
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

function ExcludedPanel({
  other,
  blank,
}: {
  other: { row: ShortlistRow; reasons: { type: string; field: string }[] }[]
  blank: { row: ShortlistRow; reasons: { type: string; field: string }[] }[]
}) {
  const t = useT()
  return (
    <div className="space-y-5">
      <ExcludedTable title={t("shortlist.stat.excludedOther")} rows={other} />
      <ExcludedTable title={t("shortlist.stat.excludedBlank")} rows={blank} />
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
