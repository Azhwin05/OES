"use client"

import { useState } from "react"
import { KeyRound, Info, Loader2 } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { useT } from "@/lib/i18n/context"
import { createClient } from "@/lib/supabase/client"
import type { UserRole } from "@/lib/constants"

export function SettingsView({
  email,
  role,
  mustChange,
}: {
  email: string
  role: UserRole
  mustChange: boolean
}) {
  const t = useT()
  const [password, setPassword] = useState("")
  const [saving, setSaving] = useState(false)

  async function updatePassword(e: React.FormEvent) {
    e.preventDefault()
    if (password.length < 8) return toast.error(t("err.required"))
    setSaving(true)
    const supabase = createClient()
    const { error } = await supabase.auth.updateUser({ password })
    setSaving(false)
    if (error) {
      toast.error(t("err.server"))
    } else {
      setPassword("")
      toast.success(t("settings.passwordUpdated"))
    }
  }

  return (
    <div className="grid max-w-2xl gap-5">
      {mustChange && (
        <div className="flex items-start gap-2 rounded-md border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          <Info className="mt-0.5 h-4 w-4 shrink-0" />
          {t("settings.firstLoginNotice")}
        </div>
      )}

      <Card>
        <CardHeader><CardTitle className="text-base">{t("settings.account")}</CardTitle></CardHeader>
        <CardContent className="grid gap-2 text-sm">
          <div className="flex justify-between border-b py-1.5">
            <span className="text-muted-foreground">{t("users.email")}</span>
            <span className="font-medium">{email}</span>
          </div>
          <div className="flex justify-between py-1.5">
            <span className="text-muted-foreground">{t("users.role")}</span>
            <Badge variant="outline">{t(`users.role.${role}`)}</Badge>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-base">{t("settings.changePassword")}</CardTitle></CardHeader>
        <CardContent>
          <form onSubmit={updatePassword} className="grid gap-3">
            <div className="grid gap-2">
              <Label htmlFor="new-password">{t("settings.newPassword")}</Label>
              <Input
                id="new-password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="new-password"
                minLength={8}
                required
              />
            </div>
            <Button type="submit" disabled={saving} className="justify-self-start">
              {saving ? <Loader2 className="mr-1 h-4 w-4 animate-spin" /> : <KeyRound className="mr-1 h-4 w-4" />}
              {t("settings.updatePassword")}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
