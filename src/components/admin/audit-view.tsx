"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { useT } from "@/lib/i18n/context"
import type { AuditRow } from "@/lib/supabase/types"

export function AuditView({ logs }: { logs: AuditRow[] }) {
  const t = useT()
  return (
    <Card>
      <CardContent className="overflow-x-auto p-0">
        <table className="w-full text-sm">
          <thead className="border-b bg-muted/50">
            <tr className="text-muted-foreground">
              <th className="px-4 py-2.5 text-left font-medium">{t("audit.action")}</th>
              <th className="px-4 py-2.5 text-left font-medium">{t("audit.entity")}</th>
              <th className="px-4 py-2.5 text-left font-medium">{t("audit.actor")}</th>
              <th className="px-4 py-2.5 text-left font-medium">{t("audit.time")}</th>
            </tr>
          </thead>
          <tbody>
            {logs.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-4 py-8 text-center text-muted-foreground">
                  {t("table.empty")}
                </td>
              </tr>
            ) : (
              logs.map((l) => (
                <tr key={l.id} className="border-b last:border-0">
                  <td className="px-4 py-2.5">
                    <Badge variant="outline" className="font-mono text-xs">{l.action}</Badge>
                  </td>
                  <td className="px-4 py-2.5 text-muted-foreground">
                    {l.entity ?? "—"}
                  </td>
                  <td className="px-4 py-2.5 text-muted-foreground">
                    {l.actor_email ?? "system"}
                  </td>
                  <td className="px-4 py-2.5 text-muted-foreground">
                    {new Date(l.created_at).toLocaleString()}
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
