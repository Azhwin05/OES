import { redirect } from "next/navigation"
import { getAuditLogs } from "@/lib/queries"
import { requireStaff } from "@/lib/auth"
import { AuditView } from "@/components/admin/audit-view"
import { PageTitle } from "@/components/admin/page-title"
import type { AuditRow } from "@/lib/supabase/types"

export const dynamic = "force-dynamic"

export default async function AuditPage() {
  const user = await requireStaff()
  if (user.profile!.role === "viewer") redirect("/admin")
  const logs = (await getAuditLogs()) as AuditRow[]
  return (
    <div>
      <PageTitle titleKey="audit.title" subtitleKey="audit.subtitle" />
      <AuditView logs={logs} />
    </div>
  )
}
