"use client"

import { useEffect, useRef, useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import {
  ArrowLeft,
  ArrowRight,
  Send,
  Loader2,
  CheckCircle2,
  Download,
  Printer,
  FileSearch,
  RotateCcw,
} from "lucide-react"
import Link from "next/link"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Form } from "@/components/ui/form"
import { Stepper, STEP_KEYS } from "@/components/apply/stepper"
import {
  PersonalStep,
  EducationStep,
  FamilyStep,
  SiblingsStep,
  ImpairmentStep,
  ResidenceStep,
  ReviewStep,
} from "@/components/apply/steps"
import {
  emptyFormData,
  loadDraft,
  saveDraft,
  clearDraft,
} from "@/components/apply/form-data"
import { fullApplicationSchema } from "@/lib/validation/schemas"
import type {
  ApplicationFormValues,
  FullApplication,
} from "@/lib/validation/schemas"
import { submitApplication } from "@/app/oes/(public)/apply/actions"
import { generateApplicationPdf } from "@/lib/pdf"
import { useT, useLanguage } from "@/lib/i18n/context"
import type { FieldPath } from "react-hook-form"

const STEP_FIELDS: FieldPath<ApplicationFormValues>[] = [
  "personal",
  "education",
  "family",
  "siblings",
  "impairment",
  "residence",
]

export function ApplyForm() {
  const t = useT()
  const { lang } = useLanguage()
  const [step, setStep] = useState(0)
  const [maxReached, setMaxReached] = useState(0)
  const [submitting, setSubmitting] = useState(false)
  const [done, setDone] = useState<{ reference: string; values: ApplicationFormValues } | null>(null)
  const restored = useRef(false)

  const form = useForm<ApplicationFormValues, unknown, FullApplication>({
    resolver: zodResolver(fullApplicationSchema),
    mode: "onTouched",
    defaultValues: { ...emptyFormData, declaration: false } as ApplicationFormValues,
  })

  // Restore draft once.
  useEffect(() => {
    if (restored.current) return
    restored.current = true
    const draft = loadDraft()
    if (draft) {
      form.reset({ ...draft, declaration: false } as ApplicationFormValues)
      toast.info(t("common.draftRestored"))
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Persist draft on change.
  useEffect(() => {
    const sub = form.watch((value) => {
      saveDraft(value as ApplicationFormValues)
    })
    return () => sub.unsubscribe()
  }, [form])

  const isLast = step === STEP_KEYS.length - 1

  async function next() {
    if (step < STEP_FIELDS.length) {
      const ok = await form.trigger(STEP_FIELDS[step])
      if (!ok) return
    }
    const n = Math.min(step + 1, STEP_KEYS.length - 1)
    setStep(n)
    setMaxReached((m) => Math.max(m, n))
    window.scrollTo({ top: 0, behavior: "smooth" })
  }

  function back() {
    setStep((s) => Math.max(s - 1, 0))
    window.scrollTo({ top: 0, behavior: "smooth" })
  }

  function goto(i: number) {
    if (i <= maxReached) {
      setStep(i)
      window.scrollTo({ top: 0, behavior: "smooth" })
    }
  }

  const onSubmit = form.handleSubmit(
    async (values) => {
      setSubmitting(true)
      try {
        const res = await submitApplication(values)
        if (res.ok) {
          const submitted = form.getValues()
          clearDraft()
          setDone({ reference: res.reference, values: submitted })
          window.scrollTo({ top: 0, behavior: "smooth" })
        } else if (res.error === "validation") {
          toast.error(t("err.server"))
        } else {
          toast.error(t("err.server"))
        }
      } catch {
        toast.error(t("err.network"))
      } finally {
        setSubmitting(false)
      }
    },
    () => {
      toast.error(t("err.declarationRequired"))
    }
  )

  if (done) {
    return <SuccessScreen reference={done.reference} values={done.values} />
  }

  return (
    <Card>
      <CardContent className="p-5 sm:p-7">
        <Stepper current={step} maxReached={maxReached} onStepClick={goto} />

        <Form {...form}>
          <form onSubmit={(e) => e.preventDefault()} className="mt-2">
            <h2 className={`mb-1 text-xl font-bold ${lang === "ta" ? "font-tamil" : ""}`}>
              {t(STEP_KEYS[step])}
            </h2>
            <div className="mt-5">
              {step === 0 && <PersonalStep form={form} />}
              {step === 1 && <EducationStep form={form} />}
              {step === 2 && <FamilyStep form={form} />}
              {step === 3 && <SiblingsStep form={form} />}
              {step === 4 && <ImpairmentStep form={form} />}
              {step === 5 && <ResidenceStep form={form} />}
              {step === 6 && <ReviewStep form={form} onEditStep={goto} />}
            </div>

            <div className="mt-8 flex items-center justify-between gap-3 border-t pt-5">
              <Button
                type="button"
                variant="outline"
                onClick={back}
                disabled={step === 0 || submitting}
              >
                <ArrowLeft className="mr-1 h-4 w-4" />
                {t("common.previous")}
              </Button>

              {isLast ? (
                <Button type="button" onClick={onSubmit} disabled={submitting}>
                  {submitting ? (
                    <Loader2 className="mr-1 h-4 w-4 animate-spin" />
                  ) : (
                    <Send className="mr-1 h-4 w-4" />
                  )}
                  {submitting ? t("form.submitting") : t("common.submit")}
                </Button>
              ) : (
                <Button type="button" onClick={next} disabled={submitting}>
                  {t("common.next")}
                  <ArrowRight className="ml-1 h-4 w-4" />
                </Button>
              )}
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  )
}

function SuccessScreen({
  reference,
  values,
}: {
  reference: string
  values: ApplicationFormValues
}) {
  const t = useT()
  const { lang } = useLanguage()
  return (
    <Card>
      <CardContent className="flex flex-col items-center gap-4 p-8 text-center">
        <span className="flex h-16 w-16 items-center justify-center rounded-full bg-success/10 text-success">
          <CheckCircle2 className="h-9 w-9" />
        </span>
        <h2 className="text-2xl font-bold">{t("success.title")}</h2>
        <p className={`text-muted-foreground max-w-md ${lang === "ta" ? "font-tamil" : ""}`}>
          {t("success.body")}
        </p>

        <div className="my-2 w-full max-w-sm rounded-xl border-2 border-dashed border-primary/40 bg-primary/5 p-5">
          <p className="text-muted-foreground text-xs uppercase tracking-wide">
            {t("success.refNumber")}
          </p>
          <p className="mt-1 font-mono text-2xl font-bold text-primary">{reference}</p>
        </div>
        <p className={`text-muted-foreground max-w-md text-sm ${lang === "ta" ? "font-tamil" : ""}`}>
          {t("success.keepSafe")}
        </p>

        <div className="mt-4 flex flex-wrap items-center justify-center gap-3">
          <Button onClick={() => generateApplicationPdf(values, reference)}>
            <Download className="mr-1 h-4 w-4" />
            {t("common.downloadPdf")}
          </Button>
          <Button variant="outline" onClick={() => window.print()}>
            <Printer className="mr-1 h-4 w-4" />
            {t("common.print")}
          </Button>
          <Button variant="outline" render={<Link href="/oes/track" />}>
            <FileSearch className="mr-1 h-4 w-4" />
            {t("success.trackNow")}
          </Button>
          <Button
            variant="ghost"
            onClick={() => window.location.reload()}
          >
            <RotateCcw className="mr-1 h-4 w-4" />
            {t("success.newApplication")}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
