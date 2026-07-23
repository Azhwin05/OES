#!/usr/bin/env node
/**
 * Import hashed passwords to Supabase
 * Usage: node scripts/import-passwords.mjs
 */

import fs from 'fs'
import ws from 'ws'
import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('❌ Missing env vars: NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

const passwords = JSON.parse(fs.readFileSync('passwords-output.json', 'utf-8'))
console.log(`📦 Loaded ${passwords.length} passwords\n`)

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
  realtime: { transport: ws }
})

console.log(`💾 Importing to Supabase...\n`)
let imported = 0, failed = 0, errors = []

for (const pwd of passwords) {
  const { error } = await supabase
    .from('oes_applications')
    .update({ secondary_password_hash: pwd.hashedPassword })
    .eq('reference_number', pwd.reference)

  if (error) {
    failed++
    errors.push(`${pwd.reference}: ${error.message}`)
  } else {
    imported++
    if (imported % 50 === 0) {
      console.log(`  ✓ Imported ${imported}/${passwords.length}...`)
    }
  }
}

console.log(`\n${'='.repeat(50)}`)
console.log(`✅ IMPORT COMPLETE!`)
console.log(`${'='.repeat(50)}`)
console.log(`   Total:    ${passwords.length}`)
console.log(`   Imported: ${imported}`)
console.log(`   Failed:   ${failed}`)
console.log(`${'='.repeat(50)}`)

if (errors.length > 0) {
  console.log(`\nFirst ${Math.min(5, errors.length)} errors:`)
  errors.slice(0, 5).forEach(e => console.log(`  - ${e}`))
}

// Output email list for Brevo
const emailList = passwords.map(p => ({
  oes_id: p.reference,
  name: p.name,
  password: p.plainPassword,
}))

fs.writeFileSync('email-list-for-brevo.json', JSON.stringify(emailList, null, 2))
console.log(`\n✅ Email list saved to email-list-for-brevo.json`)
console.log(`📧 Ready to create Brevo campaign with ${emailList.length} recipients`)

process.exit(failed > 0 ? 1 : 0)
