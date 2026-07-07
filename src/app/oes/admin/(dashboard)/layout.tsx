import { requireStaff } from "@/lib/auth"
import { AdminShell } from "@/components/admin/admin-shell"

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const user = await requireStaff()
  return (
    <AdminShell email={user.email} role={user.profile!.role}>
      {children}
    </AdminShell>
  )
}
