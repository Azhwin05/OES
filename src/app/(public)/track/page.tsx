"use client"

import { useState } from "react"
import { Search, FileSearch, Calendar, User, MessageSquare } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { StatusBadge } from "@/components/status-badge"
import { useLanguage } from "@/lib/i18n/context"
import { createClient } from "@/lib/supabase/client"
import type { AppStatus } from "@/lib/constants"

type TrackResult = {
  reference_number: string
  applicant_name: string
  status: AppStatus
  submitted_at: string
  latest_remark: string | null
}

export default function TrackPage() {
  const { t, lang } = useLanguage()
  const [reference, setReference] = useState("")
  const [phone, setPhone] = useState("")
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<TrackResult | null>(null)
  const [error, setError] = useState<string | null>(null)

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setResult(null)
    try {
      const supabase = createClient()
      const { data, error } = await supabase.rpc("oes_track_application", {
        p_reference: reference.trim().toUpperCase(),
        p_phone: phone.trim(),
      })
      if (error) throw error
      const row = (data as TrackResult[] | null)?.[0]
      if (!row) {
        setError(t("track.notFound"))
      } else {
        setResult(row)
      }
    } catch {
      setError(t("err.network"))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-12 sm:px-6 lg:px-8">
      <div className="mb-8 text-center">
        <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
          <FileSearch className="h-6 w-6" />
        </span>
        <h1 className="mt-4 text-2xl font-bold tracking-tight">{t("track.title")}</h1>
        <p className={`text-muted-foreground mt-1 ${lang === "ta" ? "font-tamil" : ""}`}>
          {t("track.subtitle")}
        </p>
      </div>

      <Card>
        <CardContent className="pt-6">
          <form onSubmit={onSubmit} className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="reference">{t("track.refNumber")}</Label>
              <Input
                id="reference"
                placeholder="OES-2026-000123"
                value={reference}
                onChange={(e) => setReference(e.target.value)}
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="phone">{t("track.phone")}</Label>
              <Input
                id="phone"
                inputMode="numeric"
                placeholder="9876543210"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                required
              />
            </div>
            <Button type="submit" disabled={loading} className="mt-2">
              <Search className="mr-1 h-4 w-4" />
              {loading ? t("common.loading") : t("track.check")}
            </Button>
          </form>
        </CardContent>
      </Card>

      {error && (
        <p className="mt-4 rounded-md border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {error}
        </p>
      )}

      {result && (
        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="flex items-center justify-between gap-2">
              <span className="font-mono text-base">{result.reference_number}</span>
              <StatusBadge status={result.status} />
            </CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 text-sm">
            <Row icon={User} label={t("track.applicantName")} value={result.applicant_name} />
            <Separator />
            <Row
              icon={Calendar}
              label={t("track.submittedDate")}
              value={new Date(result.submitted_at).toLocaleString()}
            />
            <Separator />
            <div className="flex items-start gap-3">
              <MessageSquare className="mt-0.5 h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-muted-foreground text-xs">{t("track.remarks")}</p>
                <p className="mt-0.5">{result.latest_remark || t("track.noRemarks")}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

function Row({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ComponentType<{ className?: string }>
  label: string
  value: string
}) {
  return (
    <div className="flex items-start gap-3">
      <Icon className="mt-0.5 h-4 w-4 text-muted-foreground" />
      <div>
        <p className="text-muted-foreground text-xs">{label}</p>
        <p className="mt-0.5 font-medium">{value}</p>
      </div>
    </div>
  )
}
