import { notFound } from "next/navigation"
import { getApplicationDetail, getReviewersList } from "@/lib/queries"
import { requireStaff, canManage, canActOnAssignment } from "@/lib/auth"
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

  const isManager = canManage(user)
  const reviewers = isManager ? await getReviewersList() : []

  return (
    <ApplicationDetail
      app={app}
      canManage={isManager}
      canReview={canActOnAssignment(user, app.secondary_assigned_reviewer_id)}
      reviewers={reviewers}
    />
  )
}
