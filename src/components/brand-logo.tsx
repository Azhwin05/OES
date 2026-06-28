import { GraduationCap } from "lucide-react"
import { cn } from "@/lib/utils"

export function BrandLogo({
  className,
  iconClassName,
}: {
  className?: string
  iconClassName?: string
}) {
  return (
    <span className={cn("inline-flex items-center gap-2", className)}>
      <span
        className={cn(
          "flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-sm",
          iconClassName
        )}
      >
        <GraduationCap className="h-5 w-5" />
      </span>
      <span className="flex flex-col leading-none">
        <span className="text-base font-bold tracking-tight">OES</span>
        <span className="text-muted-foreground text-[10px] font-medium">
          Online Enumeration System
        </span>
      </span>
    </span>
  )
}
