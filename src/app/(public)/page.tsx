"use client"

import Link from "next/link"
import {
  ArrowRight,
  FileText,
  ShieldCheck,
  Languages,
  Search,
  ClipboardList,
  Hash,
  CheckCircle2,
  Lock,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { useLanguage } from "@/lib/i18n/context"

export default function HomePage() {
  const { t, lang } = useLanguage()

  const benefits = [
    { icon: FileText, key: "1" },
    { icon: ShieldCheck, key: "2" },
    { icon: Languages, key: "3" },
    { icon: Search, key: "4" },
  ]

  const steps = [
    { icon: ClipboardList, key: "1" },
    { icon: Hash, key: "2" },
    { icon: CheckCircle2, key: "3" },
  ]

  return (
    <div>
      {/* Hero */}
      <section className="relative overflow-hidden border-b bg-gradient-to-b from-primary/5 via-background to-background">
        <div className="bg-grid pointer-events-none absolute inset-0 opacity-[0.03]" />
        <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8 lg:py-28">
          <div className="mx-auto max-w-3xl text-center">
            <span className="inline-flex items-center gap-2 rounded-full border bg-background px-3 py-1 text-xs font-medium text-muted-foreground shadow-sm">
              <span className="h-2 w-2 rounded-full bg-success" />
              {t("brand.full")} · {t("brand.short")}
            </span>
            <h1 className="mt-6 text-4xl font-bold tracking-tight text-foreground sm:text-5xl lg:text-6xl">
              {lang === "ta" ? (
                <span className="font-tamil">ஓ.இ.எஸ் — ஆன்லைன் கணக்கெடுப்பு அமைப்பு</span>
              ) : (
                <>OES — Online Enumeration System</>
              )}
            </h1>
            <p
              className={`mx-auto mt-6 max-w-2xl text-lg text-muted-foreground ${
                lang === "ta" ? "font-tamil" : ""
              }`}
            >
              {t("brand.tagline")}
            </p>
            <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Button
                size="lg"
                className="h-11 px-6 text-base"
                render={<Link href="/apply" />}
              >
                {t("home.hero.cta.start")}
                <ArrowRight className="ml-1 h-4 w-4" />
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="h-11 px-6 text-base"
                render={<Link href="/track" />}
              >
                {t("home.hero.cta.track")}
              </Button>
              <Button
                size="lg"
                variant="ghost"
                className="h-11 px-6 text-base"
                render={<Link href="/admin/login" />}
              >
                {t("home.hero.cta.admin")}
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* About */}
      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">
            {t("home.about.title")}
          </h2>
          <p
            className={`mt-4 text-muted-foreground ${
              lang === "ta" ? "font-tamil" : ""
            }`}
          >
            {t("home.about.body")}
          </p>
        </div>
      </section>

      {/* Benefits */}
      <section className="border-y bg-muted/30">
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
          <h2 className="text-center text-2xl font-bold tracking-tight sm:text-3xl">
            {t("home.benefits.title")}
          </h2>
          <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {benefits.map(({ icon: Icon, key }) => (
              <Card key={key} className="border-muted-foreground/10">
                <CardContent className="flex flex-col gap-3 p-6">
                  <span className="flex h-11 w-11 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <Icon className="h-5 w-5" />
                  </span>
                  <h3 className="font-semibold">
                    {t(`home.benefits.${key}.title`)}
                  </h3>
                  <p
                    className={`text-muted-foreground text-sm ${
                      lang === "ta" ? "font-tamil" : ""
                    }`}
                  >
                    {t(`home.benefits.${key}.body`)}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <h2 className="text-center text-2xl font-bold tracking-tight sm:text-3xl">
          {t("home.how.title")}
        </h2>
        <div className="mt-10 grid gap-8 md:grid-cols-3">
          {steps.map(({ icon: Icon, key }, i) => (
            <div key={key} className="relative flex flex-col items-center text-center">
              <span className="flex h-14 w-14 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-md">
                <Icon className="h-6 w-6" />
              </span>
              <span className="mt-2 text-xs font-semibold text-primary">
                {t("common.step")} {i + 1}
              </span>
              <h3 className="mt-2 font-semibold">{t(`home.how.${key}.title`)}</h3>
              <p
                className={`text-muted-foreground mt-1 max-w-xs text-sm ${
                  lang === "ta" ? "font-tamil" : ""
                }`}
              >
                {t(`home.how.${key}.body`)}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Privacy */}
      <section className="border-t bg-primary text-primary-foreground">
        <div className="mx-auto max-w-4xl px-4 py-14 sm:px-6 lg:px-8">
          <div className="flex flex-col items-start gap-4 sm:flex-row">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-white/10">
              <Lock className="h-5 w-5" />
            </span>
            <div>
              <h2 className="text-xl font-bold">{t("home.privacy.title")}</h2>
              <p
                className={`mt-2 text-sm text-primary-foreground/80 ${
                  lang === "ta" ? "font-tamil" : ""
                }`}
              >
                {t("home.privacy.body")}
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
