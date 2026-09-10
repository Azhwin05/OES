import { requireStaff, canManage } from "@/lib/auth"
import { getSecondaryOverview, getReviewersList } from "@/lib/queries"
import { SecondaryView } from "@/components/admin/secondary-view"
import { PageTitle } from "@/components/admin/page-title"

export const dynamic = "force-dynamic"

export default async function SecondaryOverviewPage() {
  const user = await requireStaff()
  const isManager = canManage(user)

  const [overview, reviewers] = await Promise.all([
    getSecondaryOverview(
      isManager ? undefined : { role: user.profile!.role, id: user.id }
    ),
    isManager ? getReviewersList() : Promise.resolve([]),
  ])

  return (
    <div>
      <PageTitle titleKey="secondary.title" subtitleKey="secondary.subtitle" />
      <SecondaryView overview={overview} canManage={isManager} reviewers={reviewers} />
    </div>
  )
}
