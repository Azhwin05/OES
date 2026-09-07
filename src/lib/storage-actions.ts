"use server"

import { getUploadUrl, removeObject } from "@/lib/r2"

/**
 * Shared upload-URL action for every document upload flow (primary apply
 * form, secondary portal, tertiary portal). The browser calls this to get a
 * short-lived presigned PUT URL, then uploads the file directly to R2 —
 * mirrors the old pattern of uploading directly to Supabase Storage with
 * the anon key, just without ever handing the browser real credentials.
 */
export async function getR2UploadUrl(path: string, contentType: string): Promise<{ url?: string; error?: string }> {
  try {
    const url = await getUploadUrl(path, contentType)
    return { url }
  } catch (e) {
    console.error("getR2UploadUrl failed", e)
    return { error: "server" }
  }
}

/** Deletes a draft upload the applicant chose to remove before submitting. */
export async function removeR2Object(path: string): Promise<void> {
  try {
    await removeObject(path)
  } catch (e) {
    console.error("removeR2Object failed", e)
  }
}
