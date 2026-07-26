import { getSecondaryOverview } from "@/lib/queries"
import { SecondaryView } from "@/components/admin/secondary-view"
import { PageTitle } from "@/components/admin/page-title"

export const dynamic = "force-dynamic"

export default async function SecondaryOverviewPage() {
  const overview = await getSecondaryOverview()

  return (
    <div>
      <PageTitle titleKey="secondary.title" subtitleKey="secondary.subtitle" />
      <SecondaryView overview={overview} />
    </div>
  )
}
