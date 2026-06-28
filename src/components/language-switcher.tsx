"use client"

import { Languages } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useLanguage } from "@/lib/i18n/context"
import { LANGUAGES } from "@/lib/i18n/translations"

export function LanguageSwitcher({
  variant = "outline",
}: {
  variant?: "outline" | "ghost" | "secondary"
}) {
  const { lang, setLang } = useLanguage()
  const current = LANGUAGES.find((l) => l.code === lang)

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button variant={variant} size="sm" className="gap-2">
            <Languages className="h-4 w-4" />
            <span>{current?.native}</span>
          </Button>
        }
      />
      <DropdownMenuContent align="end">
        {LANGUAGES.map((l) => (
          <DropdownMenuItem
            key={l.code}
            onClick={() => setLang(l.code)}
            data-active={l.code === lang}
            className="data-[active=true]:bg-accent"
          >
            <span className={l.code === "ta" ? "font-tamil" : ""}>
              {l.native}
            </span>
            <span className="text-muted-foreground ml-2 text-xs">{l.label}</span>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
