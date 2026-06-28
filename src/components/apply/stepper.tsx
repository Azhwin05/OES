"use client"

import { Check } from "lucide-react"
import { cn } from "@/lib/utils"
import { useT } from "@/lib/i18n/context"

export const STEP_KEYS = [
  "step.personal",
  "step.education",
  "step.family",
  "step.siblings",
  "step.impairment",
  "step.residence",
  "step.documents",
  "step.review",
] as const

export function Stepper({
  current,
  onStepClick,
  maxReached,
}: {
  current: number
  onStepClick?: (i: number) => void
  maxReached: number
}) {
  const t = useT()

  return (
    <nav aria-label="Progress">
      {/* Mobile: compact */}
      <div className="mb-2 flex items-center justify-between md:hidden">
        <span className="text-sm font-medium">
          {t("common.step")} {current + 1} {t("common.of")} {STEP_KEYS.length}
        </span>
        <span className="text-muted-foreground text-sm">
          {t(STEP_KEYS[current])}
        </span>
      </div>
      <div className="mb-6 h-1.5 w-full overflow-hidden rounded-full bg-muted md:hidden">
        <div
          className="h-full rounded-full bg-primary transition-all"
          style={{ width: `${((current + 1) / STEP_KEYS.length) * 100}%` }}
        />
      </div>

      {/* Desktop: full stepper */}
      <ol className="hidden items-center md:flex">
        {STEP_KEYS.map((key, i) => {
          const done = i < current
          const active = i === current
          const clickable = i <= maxReached && onStepClick
          return (
            <li key={key} className="flex flex-1 items-center last:flex-none">
              <button
                type="button"
                disabled={!clickable}
                onClick={() => clickable && onStepClick?.(i)}
                className={cn(
                  "flex flex-col items-center gap-1",
                  clickable ? "cursor-pointer" : "cursor-default"
                )}
              >
                <span
                  className={cn(
                    "flex h-8 w-8 items-center justify-center rounded-full border-2 text-xs font-semibold transition-colors",
                    done && "border-primary bg-primary text-primary-foreground",
                    active && "border-primary text-primary",
                    !done && !active && "border-muted-foreground/30 text-muted-foreground"
                  )}
                >
                  {done ? <Check className="h-4 w-4" /> : i + 1}
                </span>
                <span
                  className={cn(
                    "max-w-20 text-center text-[11px] leading-tight",
                    active ? "font-semibold text-foreground" : "text-muted-foreground"
                  )}
                >
                  {t(key)}
                </span>
              </button>
              {i < STEP_KEYS.length - 1 && (
                <span
                  className={cn(
                    "mx-2 h-0.5 flex-1 rounded transition-colors",
                    i < current ? "bg-primary" : "bg-muted-foreground/20"
                  )}
                />
              )}
            </li>
          )
        })}
      </ol>
    </nav>
  )
}
