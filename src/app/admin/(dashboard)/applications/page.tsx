import { getApplicationsList } from "@/lib/queries"
import { ApplicationsTable } from "@/components/admin/applications-table"
import { PageTitle } from "@/components/admin/page-title"

export const dynamic = "force-dynamic"

export default async function ApplicationsPage() {
  const data = await getApplicationsList()
  return (
    <div>
      <PageTitle titleKey="admin.nav.applications" />
      <ApplicationsTable data={data} />
    </div>
  )
}
