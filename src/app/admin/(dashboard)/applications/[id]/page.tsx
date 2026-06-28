import { notFound } from "next/navigation"
import { getApplicationDetail } from "@/lib/queries"
import { requireStaff, canManage } from "@/lib/auth"
import { ApplicationDetail } from "@/components/admin/application-detail"

export const dynamic = "force-dynamic"

export default async function ApplicationDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const user = await requireStaff()
  const app = await getApplicationDetail(id)
  if (!app) notFound()
  return <ApplicationDetail app={app} canManage={canManage(user)} />
}
