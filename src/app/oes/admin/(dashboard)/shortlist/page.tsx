import { getShortlistPool } from "@/lib/queries"
import { buildShortlistIndex } from "@/lib/shortlist"
import { requireStaff, canManage } from "@/lib/auth"
import { ShortlistView } from "@/components/admin/shortlist-view"
import { PageTitle } from "@/components/admin/page-title"

export const dynamic = "force-dynamic"

export default async function ShortlistPage() {
  const user = await requireStaff()
  const pool = await getShortlistPool()
  const index = buildShortlistIndex(pool)

  return (
    <div>
      <PageTitle titleKey="shortlist.title" subtitleKey="shortlist.subtitle" />
      <ShortlistView index={index} canManage={canManage(user)} />
    </div>
  )
}
