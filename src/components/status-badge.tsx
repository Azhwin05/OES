"use client"

import { Badge } from "@/components/ui/badge"
import { useT } from "@/lib/i18n/context"
import { STATUS_CONFIG, type AppStatus } from "@/lib/constants"
import { cn } from "@/lib/utils"

export function StatusBadge({ status }: { status: AppStatus }) {
  const t = useT()
  const cfg = STATUS_CONFIG[status]
  return (
    <Badge
      variant="outline"
      className={cn("font-medium", cfg.className)}
    >
      {t(cfg.labelKey)}
    </Badge>
  )
}
