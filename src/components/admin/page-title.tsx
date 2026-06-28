"use client"

import { useT, useLanguage } from "@/lib/i18n/context"

export function PageTitle({
  titleKey,
  subtitleKey,
  children,
}: {
  titleKey: string
  subtitleKey?: string
  children?: React.ReactNode
}) {
  const t = useT()
  const { lang } = useLanguage()
  return (
    <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
      <div>
        <h1 className="text-xl font-bold tracking-tight sm:text-2xl">{t(titleKey)}</h1>
        {subtitleKey && (
          <p className={`text-muted-foreground text-sm ${lang === "ta" ? "font-tamil" : ""}`}>
            {t(subtitleKey)}
          </p>
        )}
      </div>
      {children}
    </div>
  )
}
