import { redirect } from "next/navigation"
import { getUsers } from "@/lib/queries"
import { requireStaff } from "@/lib/auth"
import { UsersView } from "@/components/admin/users-view"
import { PageTitle } from "@/components/admin/page-title"
import type { ProfileRow } from "@/lib/supabase/types"

export const dynamic = "force-dynamic"

export default async function UsersPage() {
  const user = await requireStaff()
  if (user.profile!.role === "viewer") redirect("/admin")
  const users = (await getUsers()) as ProfileRow[]
  return (
    <div>
      <PageTitle titleKey="users.title" subtitleKey="users.subtitle" />
      <UsersView users={users} canEdit={user.profile!.role === "super_admin"} />
    </div>
  )
}
