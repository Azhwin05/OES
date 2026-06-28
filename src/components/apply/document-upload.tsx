"use client"

import { useRef, useState } from "react"
import { UploadCloud, FileCheck2, X, Loader2 } from "lucide-react"
import { toast } from "sonner"
import { useT } from "@/lib/i18n/context"
import { ACCEPTED_EXT, type DocumentType } from "@/lib/constants"
import {
  uploadDocument,
  removeDocument,
  validateFile,
} from "@/lib/upload"
import { getUploadToken } from "@/components/apply/form-data"
import type { UploadedDoc } from "@/lib/validation/schemas"
import { cn } from "@/lib/utils"

export function DocumentUpload({
  documentType,
  label,
  value,
  onChange,
}: {
  documentType: DocumentType
  label: string
  value?: UploadedDoc
  onChange: (doc: UploadedDoc | undefined) => void
}) {
  const t = useT()
  const inputRef = useRef<HTMLInputElement>(null)
  const [busy, setBusy] = useState(false)

  async function handleFile(file: File) {
    const v = validateFile(file)
    if (v === "size") return toast.error(t("err.fileTooLarge"))
    if (v === "type") return toast.error(t("err.fileType"))
    setBusy(true)
    try {
      const doc = await uploadDocument(file, documentType, getUploadToken())
      onChange(doc)
      toast.success(`${label}: ${t("doc.uploaded")}`)
    } catch {
      toast.error(t("err.uploadFailed"))
    } finally {
      setBusy(false)
    }
  }

  async function handleRemove() {
    if (value) {
      try {
        await removeDocument(value)
      } catch {
        /* ignore */
      }
    }
    onChange(undefined)
    if (inputRef.current) inputRef.current.value = ""
  }

  return (
    <div className="grid gap-1.5">
      <span className="text-sm font-medium">{label}</span>
      <input
        ref={inputRef}
        type="file"
        accept={ACCEPTED_EXT}
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0]
          if (f) handleFile(f)
        }}
      />
      {value ? (
        <div className="flex items-center justify-between gap-2 rounded-lg border border-success/30 bg-success/5 px-3 py-2.5">
          <span className="flex min-w-0 items-center gap-2 text-sm">
            <FileCheck2 className="h-4 w-4 shrink-0 text-success" />
            <span className="truncate">{value.file_name}</span>
          </span>
          <button
            type="button"
            onClick={handleRemove}
            aria-label={t("doc.remove")}
            className="text-muted-foreground hover:text-destructive"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      ) : (
        <button
          type="button"
          disabled={busy}
          onClick={() => inputRef.current?.click()}
          className={cn(
            "flex flex-col items-center justify-center gap-1.5 rounded-lg border border-dashed px-4 py-5 text-center text-sm transition-colors",
            "hover:border-primary hover:bg-accent/40 disabled:opacity-60"
          )}
        >
          {busy ? (
            <Loader2 className="h-5 w-5 animate-spin text-primary" />
          ) : (
            <UploadCloud className="h-5 w-5 text-muted-foreground" />
          )}
          <span className="text-muted-foreground">
            {busy ? t("doc.uploading") : t("doc.clickToUpload")}
          </span>
        </button>
      )}
    </div>
  )
}
