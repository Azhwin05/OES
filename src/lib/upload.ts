import { createClient } from "@/lib/supabase/client"
import {
  bucketForDocType,
  FILE_MAX_BYTES,
  ACCEPTED_MIME,
  type DocumentType,
} from "@/lib/constants"
import type { UploadedDoc } from "@/lib/validation/schemas"

export type UploadError = "size" | "type" | "failed"

export function validateFile(file: File): UploadError | null {
  if (file.size > FILE_MAX_BYTES) return "size"
  if (!ACCEPTED_MIME.includes(file.type)) return "type"
  return null
}

/**
 * Uploads a file to the draft folder for the current application token and
 * returns its document metadata. Buckets are private; admins read via signed
 * URLs. On submit the server moves the file to the reference-number path.
 */
export async function uploadDocument(
  file: File,
  documentType: DocumentType,
  token: string
): Promise<UploadedDoc> {
  const supabase = createClient()
  const bucket = bucketForDocType(documentType)
  const safeName = file.name.replace(/[^\w.\-]+/g, "_")
  const path = `applications/_drafts/${token}/${documentType}/${Date.now()}_${safeName}`

  const { error } = await supabase.storage.from(bucket).upload(path, file, {
    upsert: true,
    contentType: file.type,
  })
  if (error) throw error

  return {
    document_type: documentType,
    bucket,
    path,
    file_name: file.name,
    mime_type: file.type,
    size_bytes: file.size,
  }
}

export async function removeDocument(doc: UploadedDoc) {
  const supabase = createClient()
  await supabase.storage.from(doc.bucket).remove([doc.path])
}
