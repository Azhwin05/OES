"use client"

import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { Card, CardContent } from "@/components/ui/card"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { useT } from "@/lib/i18n/context"
import { USER_ROLES, type UserRole } from "@/lib/constants"
import { setUserRole } from "@/app/admin/actions"
import type { ProfileRow } from "@/lib/supabase/types"

export function UsersView({
  users,
  canEdit,
}: {
  users: ProfileRow[]
  canEdit: boolean
}) {
  const t = useT()
  const router = useRouter()

  async function changeRole(id: string, role: UserRole) {
    const res = await setUserRole(id, role)
    if (res.ok) {
      toast.success(t("detail.statusUpdated"))
      router.refresh()
    } else {
      toast.error(t("err.unauthorized"))
    }
  }

  return (
    <Card>
      <CardContent className="overflow-x-auto p-0">
        <table className="w-full text-sm">
          <thead className="border-b bg-muted/50">
            <tr className="text-muted-foreground">
              <th className="px-4 py-2.5 text-left font-medium">{t("users.email")}</th>
              <th className="px-4 py-2.5 text-left font-medium">{t("users.role")}</th>
              <th className="px-4 py-2.5 text-left font-medium">{t("users.created")}</th>
            </tr>
          </thead>
          <tbody>
            {users.length === 0 ? (
              <tr>
                <td colSpan={3} className="px-4 py-8 text-center text-muted-foreground">
                  {t("table.empty")}
                </td>
              </tr>
            ) : (
              users.map((u) => (
                <tr key={u.id} className="border-b last:border-0">
                  <td className="px-4 py-2.5">
                    <span className="font-medium">{u.full_name || u.email}</span>
                    <span className="text-muted-foreground block text-xs">{u.email}</span>
                  </td>
                  <td className="px-4 py-2.5">
                    {canEdit ? (
                      <Select value={u.role} onValueChange={(v) => changeRole(u.id, v as UserRole)}>
                        <SelectTrigger className="h-8 w-[150px]"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {USER_ROLES.map((r) => (
                            <SelectItem key={r} value={r}>{t(`users.role.${r}`)}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    ) : (
                      <Badge variant="outline">{t(`users.role.${u.role}`)}</Badge>
                    )}
                  </td>
                  <td className="px-4 py-2.5 text-muted-foreground">
                    {new Date(u.created_at).toLocaleDateString()}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </CardContent>
    </Card>
  )
}
