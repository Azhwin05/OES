import { getApplicationsList } from "@/lib/queries"
import { ExportView } from "@/components/admin/export-view"
import { PageTitle } from "@/components/admin/page-title"

export const dynamic = "force-dynamic"

export default async function ExportPage() {
  const data = await getApplicationsList()
  return (
    <div>
      <PageTitle titleKey="export.title" subtitleKey="export.subtitle" />
      <ExportView data={data} />
    </div>
  )
}
