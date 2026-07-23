/**
 * Generates (or sets) the single shared password for the secondary-data
 * portal and stores its hash in oes_secondary_settings. Prints the plaintext
 * password once so staff can include it in the shortlist email — nothing
 * else in the app ever sees or stores the plaintext.
 *
 * Usage:
 *   SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... node scripts/set-secondary-password.mjs
 *   SECONDARY_PASSWORD=SomePass123 node scripts/set-secondary-password.mjs   (to set a specific one)
 */
import bcrypt from "bcryptjs"
import crypto from "node:crypto"

const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!url || !serviceKey) {
  console.error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY")
  process.exit(1)
}

function generatePassword() {
  // 10 chars, unambiguous alphabet, avoids look-alike characters.
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"
  return Array.from(crypto.randomFillSync(new Uint8Array(10)))
    .map((b) => alphabet[b % alphabet.length])
    .join("")
}

async function main() {
  const password = process.env.SECONDARY_PASSWORD || generatePassword()
  const hash = await bcrypt.hash(password, 10)

  const res = await fetch(`${url}/rest/v1/oes_secondary_settings`, {
    method: "POST",
    headers: {
      apikey: serviceKey,
      Authorization: `Bearer ${serviceKey}`,
      "Content-Type": "application/json",
      Prefer: "resolution=merge-duplicates",
    },
    body: JSON.stringify({ id: true, password_hash: hash, updated_at: new Date().toISOString() }),
  })

  if (!res.ok) {
    throw new Error(`Failed to set password: ${res.status} ${await res.text()}`)
  }

  console.log("✓ Secondary portal password set.")
  console.log(`  Password: ${password}`)
  console.log("  (This is shown once — save it now to include in the shortlist email.)")
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
