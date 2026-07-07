"use client"

import { useState } from "react"
import { Mail, MapPin, Phone, Send } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useLanguage } from "@/lib/i18n/context"

export default function ContactPage() {
  const { t, lang } = useLanguage()
  const [sending, setSending] = useState(false)

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setSending(true)
    // Front-end acknowledgement. Wire to an email service / table as needed.
    setTimeout(() => {
      setSending(false)
      ;(e.target as HTMLFormElement).reset()
      toast.success(t("contact.sent"))
    }, 600)
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6 lg:px-8">
      <div className="mb-8 text-center">
        <h1 className="text-2xl font-bold tracking-tight">{t("contact.title")}</h1>
        <p className={`text-muted-foreground mt-1 ${lang === "ta" ? "font-tamil" : ""}`}>
          {t("contact.subtitle")}
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-5">
        <Card className="md:col-span-3">
          <CardHeader>
            <CardTitle>{t("contact.send")}</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={onSubmit} className="grid gap-4">
              <div className="grid gap-2">
                <Label htmlFor="name">{t("contact.name")}</Label>
                <Input id="name" name="name" required />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="email">{t("contact.email")}</Label>
                <Input id="email" name="email" type="email" required />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="message">{t("contact.message")}</Label>
                <Textarea id="message" name="message" rows={5} required />
              </div>
              <Button type="submit" disabled={sending} className="justify-self-start">
                <Send className="mr-1 h-4 w-4" />
                {sending ? t("common.loading") : t("contact.send")}
              </Button>
            </form>
          </CardContent>
        </Card>

        <div className="space-y-4 md:col-span-2">
          <InfoCard icon={MapPin} title={t("contact.address")}>
            {t("contact.office")}
            <br />
            Chennai, Tamil Nadu, India
          </InfoCard>
          <InfoCard icon={Phone} title={t("contact.phone")}>
            +91 44 0000 0000
          </InfoCard>
          <InfoCard icon={Mail} title={t("contact.email.label")}>
            support@oes.org
          </InfoCard>
        </div>
      </div>
    </div>
  )
}

function InfoCard({
  icon: Icon,
  title,
  children,
}: {
  icon: React.ComponentType<{ className?: string }>
  title: string
  children: React.ReactNode
}) {
  return (
    <Card>
      <CardContent className="flex items-start gap-3 p-5">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
          <Icon className="h-5 w-5" />
        </span>
        <div>
          <p className="font-semibold">{title}</p>
          <p className="text-muted-foreground mt-0.5 text-sm">{children}</p>
        </div>
      </CardContent>
    </Card>
  )
}
