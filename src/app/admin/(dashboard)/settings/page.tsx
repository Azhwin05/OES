import { requireStaff } from "@/lib/auth"
import { SettingsView } from "@/components/admin/settings-view"
import { PageTitle } from "@/components/admin/page-title"

export const dynamic = "force-dynamic"

export default async function SettingsPage() {
  const user = await requireStaff()
  return (
    <div>
      <PageTitle titleKey="settings.title" subtitleKey="settings.subtitle" />
      <SettingsView
        email={user.email}
        role={user.profile!.role}
        mustChange={user.profile!.must_change_password}
      />
    </div>
  )
}
