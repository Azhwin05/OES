import { getDashboardStats } from "@/lib/queries"
import { DashboardView } from "@/components/admin/dashboard-view"
import { PageTitle } from "@/components/admin/page-title"

export const dynamic = "force-dynamic"

export default async function DashboardPage() {
  const stats = await getDashboardStats()
  return (
    <div>
      <PageTitle titleKey="admin.nav.overview" subtitleKey="dash.overview" />
      <DashboardView stats={stats} />
    </div>
  )
}
