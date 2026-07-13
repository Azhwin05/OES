import { getShortlistPool } from "@/lib/queries"
import { buildShortlistReport } from "@/lib/shortlist"
import { requireStaff, canManage } from "@/lib/auth"
import { ShortlistView } from "@/components/admin/shortlist-view"
import { PageTitle } from "@/components/admin/page-title"

export const dynamic = "force-dynamic"

export default async function ShortlistPage() {
  const user = await requireStaff()
  const pool = await getShortlistPool()
  const report = buildShortlistReport(pool)

  return (
    <div>
      <PageTitle titleKey="shortlist.title" subtitleKey="shortlist.subtitle" />
      <ShortlistView report={report} canManage={canManage(user)} />
    </div>
  )
}
