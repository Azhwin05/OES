import { FILE_MAX_BYTES, ACCEPTED_MIME, type DocumentType } from "@/lib/constants"
import { getR2UploadUrl, removeR2Object } from "@/lib/storage-actions"
import type { UploadedDoc } from "@/lib/validation/schemas"

export type UploadError = "size" | "type" | "failed"

export const R2_BUCKET = "oes-application-documents"

export function validateFile(file: File): UploadError | null {
  if (file.size > FILE_MAX_BYTES) return "size"
  if (!ACCEPTED_MIME.includes(file.type)) return "type"
  return null
}

/** Uploads a file directly to R2 via a short-lived presigned URL. */
export async function uploadToR2(path: string, file: File): Promise<void> {
  const { url, error } = await getR2UploadUrl(path, file.type)
  if (error || !url) throw new Error(error ?? "upload_url_failed")
  const res = await fetch(url, {
    method: "PUT",
    body: file,
    headers: { "Content-Type": file.type },
  })
  if (!res.ok) throw new Error(`upload_failed_${res.status}`)
}

/**
 * Uploads a file to the draft folder for the current application token and
 * returns its document metadata. The bucket is private; admins read via
 * presigned URLs. On submit the server moves the file to the
 * reference-number path.
 */
export async function uploadDocument(
  file: File,
  documentType: DocumentType,
  token: string
): Promise<UploadedDoc> {
  const safeName = file.name.replace(/[^\w.\-]+/g, "_")
  const path = `applications/_drafts/${token}/${documentType}/${Date.now()}_${safeName}`

  await uploadToR2(path, file)

  return {
    document_type: documentType,
    bucket: R2_BUCKET,
    path,
    file_name: file.name,
    mime_type: file.type,
    size_bytes: file.size,
  }
}

export async function removeDocument(doc: UploadedDoc) {
  await removeR2Object(doc.path)
}
