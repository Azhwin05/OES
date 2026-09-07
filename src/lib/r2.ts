import "server-only"
import {
  S3Client,
  GetObjectCommand,
  PutObjectCommand,
  DeleteObjectCommand,
  CopyObjectCommand,
  HeadObjectCommand,
} from "@aws-sdk/client-s3"
import { getSignedUrl } from "@aws-sdk/s3-request-presigner"

/**
 * Cloudflare R2 (S3-compatible) client. Server-only — never ships to the
 * browser. Uploads still happen client-side, but via short-lived presigned
 * URLs generated here rather than exposing R2 credentials directly.
 */
function r2Client() {
  const accountId = process.env.R2_ACCOUNT_ID
  const accessKeyId = process.env.R2_ACCESS_KEY_ID
  const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY
  const endpoint = process.env.R2_ENDPOINT

  if (!accountId || !accessKeyId || !secretAccessKey || !endpoint) {
    throw new Error("Missing Cloudflare R2 configuration (R2_ACCOUNT_ID / R2_ACCESS_KEY_ID / R2_SECRET_ACCESS_KEY / R2_ENDPOINT).")
  }

  return new S3Client({
    region: "auto",
    endpoint,
    credentials: { accessKeyId, secretAccessKey },
  })
}

export const R2_BUCKET = "oes-application-documents"

/** Presigned PUT URL — the browser uploads the file directly to R2 with this. */
export async function getUploadUrl(path: string, contentType: string, expiresInSeconds = 300): Promise<string> {
  const client = r2Client()
  const command = new PutObjectCommand({ Bucket: R2_BUCKET, Key: path, ContentType: contentType })
  return getSignedUrl(client, command, { expiresIn: expiresInSeconds })
}

/** Presigned GET URL for viewing/downloading a private object. */
export async function getDownloadUrl(path: string, expiresInSeconds = 600): Promise<string> {
  const client = r2Client()
  const command = new GetObjectCommand({ Bucket: R2_BUCKET, Key: path })
  return getSignedUrl(client, command, { expiresIn: expiresInSeconds })
}

/**
 * Batch presigned GET URLs. Unlike Supabase's createSignedUrls, presigning
 * with the S3 SDK is a local cryptographic operation (no network round
 * trip), so "batch" is just running the same local computation N times —
 * still effectively one cost regardless of count.
 */
export async function getDownloadUrls(paths: string[], expiresInSeconds = 600): Promise<(string | null)[]> {
  const client = r2Client()
  return Promise.all(
    paths.map(async (path) => {
      try {
        const command = new GetObjectCommand({ Bucket: R2_BUCKET, Key: path })
        return await getSignedUrl(client, command, { expiresIn: expiresInSeconds })
      } catch {
        return null
      }
    })
  )
}

/** S3-compatible storage has no native "move" — copy then delete the source. */
export async function moveObject(fromPath: string, toPath: string): Promise<void> {
  const client = r2Client()
  await client.send(
    new CopyObjectCommand({
      Bucket: R2_BUCKET,
      CopySource: `${R2_BUCKET}/${encodeURIComponent(fromPath)}`,
      Key: toPath,
    })
  )
  await client.send(new DeleteObjectCommand({ Bucket: R2_BUCKET, Key: fromPath }))
}

export async function objectExists(path: string): Promise<boolean> {
  const client = r2Client()
  try {
    await client.send(new HeadObjectCommand({ Bucket: R2_BUCKET, Key: path }))
    return true
  } catch {
    return false
  }
}

export async function removeObject(path: string): Promise<void> {
  const client = r2Client()
  await client.send(new DeleteObjectCommand({ Bucket: R2_BUCKET, Key: path }))
}
