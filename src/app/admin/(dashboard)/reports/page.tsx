import { getApplicationsList } from "@/lib/queries"
import { ReportsView } from "@/components/admin/reports-view"
import { PageTitle } from "@/components/admin/page-title"

export const dynamic = "force-dynamic"

export default async function ReportsPage() {
  const data = await getApplicationsList()
  return (
    <div>
      <PageTitle titleKey="reports.title" subtitleKey="reports.subtitle" />
      <ReportsView data={data} />
    </div>
  )
}
