"use client"

import { ApplyForm } from "@/components/apply/apply-form"
import { useLanguage } from "@/lib/i18n/context"

export default function ApplyPage() {
  const { t, lang } = useLanguage()
  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight">{t("form.title")}</h1>
        <p className={`text-muted-foreground mt-1 text-sm ${lang === "ta" ? "font-tamil" : ""}`}>
          {t("form.subtitle")}
        </p>
      </div>
      <ApplyForm />
    </div>
  )
}
