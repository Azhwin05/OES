"use client"

import {
  Users,
  CalendarDays,
  CheckCircle2,
  XCircle,
  Clock,
  AlertTriangle,
  School,
  Building2,
  Award,
  Accessibility,
} from "lucide-react"
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  CartesianGrid,
} from "recharts"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useT } from "@/lib/i18n/context"
import type { DashboardStats } from "@/lib/queries"

const PIE_COLORS = [
  "var(--chart-1)",
  "var(--chart-2)",
  "var(--chart-3)",
  "var(--chart-4)",
  "var(--chart-5)",
]

export function DashboardView({ stats }: { stats: DashboardStats }) {
  const t = useT()

  const cards = [
    { icon: Users, label: t("dash.total"), value: stats.total, tone: "text-primary" },
    { icon: CalendarDays, label: t("dash.today"), value: stats.today, tone: "text-primary" },
    { icon: CheckCircle2, label: t("dash.approved"), value: stats.approved, tone: "text-emerald-600" },
    { icon: XCircle, label: t("dash.rejected"), value: stats.rejected, tone: "text-rose-600" },
    { icon: Clock, label: t("dash.underReview"), value: stats.under_review, tone: "text-amber-600" },
    { icon: AlertTriangle, label: t("dash.needsCorrection"), value: stats.needs_correction, tone: "text-orange-600" },
    { icon: School, label: t("dash.govSchool"), value: stats.govSchool, tone: "text-primary" },
    { icon: Building2, label: t("dash.privateSchool"), value: stats.privateSchool, tone: "text-primary" },
    { icon: Award, label: t("dash.scholarship"), value: stats.scholarship, tone: "text-emerald-600" },
    { icon: Accessibility, label: t("dash.impairment"), value: stats.impairment, tone: "text-violet-600" },
  ]

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
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

      <div className="grid gap-4 lg:grid-cols-2">
        <ChartCard title={t("dash.byDistrict")}>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={stats.byDistrict} layout="vertical" margin={{ left: 8, right: 16 }}>
              <CartesianGrid strokeDasharray="3 3" horizontal={false} />
              <XAxis type="number" allowDecimals={false} fontSize={11} />
              <YAxis type="category" dataKey="name" width={90} fontSize={11} />
              <Tooltip />
              <Bar dataKey="value" fill="var(--chart-1)" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title={t("dash.monthlyTrend")}>
          <ResponsiveContainer width="100%" height={260}>
            <LineChart data={stats.monthly} margin={{ left: 8, right: 16 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" fontSize={11} />
              <YAxis allowDecimals={false} fontSize={11} />
              <Tooltip />
              <Line type="monotone" dataKey="value" stroke="var(--chart-2)" strokeWidth={2} dot={{ r: 3 }} />
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>

        <PieCard title={t("dash.byGender")} data={stats.byGender} />
        <PieCard title={t("dash.bySchoolType")} data={stats.bySchoolType} />
        <PieCard title={t("dash.byInstitutionType")} data={stats.byInstitutionType} />
        <PieCard title={t("dash.byResidenceType")} data={stats.byResidenceType} />
      </div>
    </div>
  )
}

function ChartCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-semibold">{title}</CardTitle>
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  )
}

function PieCard({ title, data }: { title: string; data: { name: string; value: number }[] }) {
  const hasData = data.some((d) => d.value > 0)
  return (
    <ChartCard title={title}>
      {hasData ? (
        <ResponsiveContainer width="100%" height={260}>
          <PieChart>
            <Pie data={data} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={90} label>
              {data.map((_, i) => (
                <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
              ))}
            </Pie>
            <Tooltip />
          </PieChart>
        </ResponsiveContainer>
      ) : (
        <div className="flex h-[260px] items-center justify-center text-sm text-muted-foreground">
          —
        </div>
      )}
    </ChartCard>
  )
}
