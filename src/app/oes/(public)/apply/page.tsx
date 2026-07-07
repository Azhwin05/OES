"use client"

import { ApplyForm } from "@/components/apply/apply-form"
import { useLanguage } from "@/lib/i18n/context"

export default function ApplyPage() {
  const { t, lang } = useLanguage()
  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="mb-6">
        {/* eslint-disable-next-line @next/next/no-img-element -- single-use static logo from Cloudinary, no responsive variants needed */}
        <img
          src="https://res.cloudinary.com/dmhonzqrm/image/upload/edu_logo_f_nnrof6.png"
          alt="Education logo"
          className="mb-4 h-14 w-auto"
        />
        <h1 className="text-2xl font-bold tracking-tight">{t("form.title")}</h1>
        <p className={`text-muted-foreground mt-1 text-sm ${lang === "ta" ? "font-tamil" : ""}`}>
          {t("form.subtitle")}
        </p>
      </div>
      <ApplyForm />
    </div>
  )
}
