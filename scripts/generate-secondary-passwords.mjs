#!/usr/bin/env node
/**
 * Generate individual secondary portal passwords for all 262 shortlisted candidates
 *
 * Usage:
 *   node scripts/generate-secondary-passwords.mjs <csv-file> <output-file>
 *
 * Example:
 *   node scripts/generate-secondary-passwords.mjs \
 *     "C:/Users/ashwi/Documents/OES_Final_Selected_262_Complete_Normalized_Data.csv" \
 *     "passwords.json"
 *
 * Output format: JSON array with { reference, name, plainPassword, hashedPassword }
 * IMPORTANT: Keep plainPassword ONLY in the email. Never store plain passwords in DB.
 */

import fs from 'fs'
import bcrypt from 'bcryptjs'

/**
 * Generate password: FirstName(3) + OES_ID(last 4 digits)
 * Example: Lokeshwaran + OES20260205 → LOK0205
 */
function generatePassword(firstName, oesId) {
  const firstThree = firstName.trim().slice(0, 3).toUpperCase()
  const lastFour = oesId.slice(-4)
  return `${firstThree}${lastFour}`
}

/**
 * Parse CSV line (simple, no quoted fields)
 */
function parseCSVLine(line) {
  return line.split(',').map((x) => x.trim())
}

async function main() {
  const csvFile = process.argv[2]
  const outputFile = process.argv[3] || 'passwords.json'

  if (!csvFile || !fs.existsSync(csvFile)) {
    console.error(`Usage: node generate-secondary-passwords.mjs <csv-file> [output-file]`)
    process.exit(1)
  }

  console.log(`📖 Reading ${csvFile}...`)
  const content = fs.readFileSync(csvFile, 'utf-8')
  const lines = content.trim().split('\n')

  // Parse header
  const header = parseCSVLine(lines[0])
  const refIdx = header.indexOf('Reference')
  const nameIdx = header.indexOf('Name')

  if (refIdx === -1 || nameIdx === -1) {
    console.error('❌ CSV must have "Reference" and "Name" columns')
    process.exit(1)
  }

  console.log(`\n🔐 Generating passwords for ${lines.length - 1} candidates...`)

  const passwords = []
  const stats = { total: 0, success: 0, error: 0 }

  for (let i = 1; i < lines.length; i++) {
    const parts = parseCSVLine(lines[i])
    const reference = parts[refIdx]?.trim()
    const name = parts[nameIdx]?.trim()

    if (!reference || !name) {
      console.warn(`⚠️  Line ${i + 1}: Missing reference or name, skipping`)
      stats.error++
      continue
    }

    const firstName = name.split(' ')[0]
    const plainPassword = generatePassword(firstName, reference)
    const hashedPassword = await bcrypt.hash(plainPassword, 10)

    passwords.push({
      reference,
      name,
      firstName,
      plainPassword, // ⚠️ ONLY FOR EMAIL, never store in DB
      hashedPassword, // ✅ Store THIS in database
    })

    stats.total++
    stats.success++

    if (stats.success % 50 === 0) {
      console.log(`  ✓ Processed ${stats.success} candidates...`)
    }
  }

  console.log(`\n📊 Results:`)
  console.log(`  Total:   ${stats.total}`)
  console.log(`  Success: ${stats.success}`)
  console.log(`  Errors:  ${stats.error}`)

  // Write output
  fs.writeFileSync(outputFile, JSON.stringify(passwords, null, 2), 'utf-8')
  console.log(`\n✅ Passwords written to ${outputFile}`)

  // Show 3 samples
  console.log(`\n📧 Sample passwords (for email):`)
  passwords.slice(0, 3).forEach((p) => {
    console.log(`  ${p.reference} ${p.name} → Password: ${p.plainPassword}`)
  })

  console.log(
    `\n⚠️  NEXT STEP: Import hashed passwords into Supabase oes_applications.secondary_password_hash`
  )
}

main().catch((err) => {
  console.error('❌ Error:', err.message)
  process.exit(1)
})
