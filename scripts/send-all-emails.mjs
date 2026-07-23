#!/usr/bin/env node
/**
 * Send all 262 secondary submission emails via Brevo
 * Usage: BREVO_API_KEY=... node scripts/send-all-emails.mjs
 */

import fs from 'fs'
import path from 'path'

const BREVO_API_KEY = process.env.BREVO_API_KEY
const CSV_FILE = process.env.CSV_FILE || 'C:/Users/ashwi/Documents/OES_Final_Selected_262_Complete_Normalized_Data.csv'

if (!BREVO_API_KEY) {
  console.error('❌ Missing BREVO_API_KEY environment variable')
  process.exit(1)
}

// Read password file
const passwords = JSON.parse(fs.readFileSync('passwords-output.json', 'utf-8'))
console.log(`📧 Loaded ${passwords.length} passwords\n`)

// Read CSV and build email map
const csvContent = fs.readFileSync(CSV_FILE, 'utf-8')
const lines = csvContent.split('\n')
const headers = lines[0].split(',').map(h => h.trim())
const emailIdx = headers.indexOf('Email')
const refIdx = headers.indexOf('Reference')

const emailMap = new Map()
for (let i = 1; i < lines.length; i++) {
  if (!lines[i].trim()) continue
  const cols = lines[i].split(',')
  const ref = cols[refIdx]?.trim()
  const email = cols[emailIdx]?.trim()
  if (ref && email) emailMap.set(ref, email)
}

console.log(`✅ Loaded ${emailMap.size} emails from CSV\n`)

// Send emails
let sent = 0
let failed = 0
const errors = []

console.log(`📤 Sending ${passwords.length} emails via Brevo...\n`)

for (const p of passwords) {
  const email = emailMap.get(p.reference)
  if (!email) {
    console.warn(`⚠️  ${p.reference}: No email found`)
    failed++
    continue
  }

  try {
    const res = await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: {
        'api-key': BREVO_API_KEY,
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        sender: {
          name: 'Ooruni Foundation',
          email: 'oorunifoundation@gmail.com'
        },
        to: [{ email, name: p.name }],
        subject: `✅ Congratulations! Next Step: Secondary Document Submission [${p.reference}]`,
        htmlContent: `<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width"><style>body{font-family:Arial,sans-serif;background:#f5f5f5;margin:0;padding:0}a{color:#667eea;text-decoration:none}.container{max-width:600px;margin:20px auto;background:white;border-radius:8px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.1)}.header{background:linear-gradient(135deg,#667eea 0%,#764ba2 100%);color:white;padding:40px;text-align:center}.header img{height:50px;margin-bottom:20px}.header h1{margin:10px 0;font-size:24px}.content{padding:40px}.section{margin-bottom:30px}.section h2{color:#333;font-size:18px;border-bottom:2px solid #667eea;padding-bottom:10px}.section p{color:#555;line-height:1.6}.credentials{background:#f9f9f9;border-left:4px solid #667eea;padding:15px;margin:15px 0}.credentials strong{color:#333}.button{display:inline-block;background:#667eea;color:white;padding:12px 30px;border-radius:6px;text-decoration:none;font-weight:bold;margin:15px 0}.button-green{background:#4caf50}.footer{background:#f5f5f5;padding:20px;text-align:center;color:#999;font-size:12px}@media (max-width:600px){.container{margin:0;border-radius:0}.header{padding:30px}.content{padding:20px}.button{display:block;text-align:center;margin:15px 0}}</style></head><body><div class="container"><div class="header"><img src="https://res.cloudinary.com/dmhonzqrm/image/upload/v1783403036/Ooruni_logo_dbsggm.webp" alt="Ooruni Foundation"><h1>Congratulations! 🎉</h1></div><div class="content"><p>Hi <strong>${p.name}</strong>,</p><p>Great News! Your application has been <strong>SHORTLISTED</strong> for the next round of Ooruni OES!</p><div class="section"><h2>📋 Your Login Credentials</h2><div class="credentials"><p><strong>OES ID:</strong> ${p.reference}</p><p><strong>Password:</strong> <code>${p.plainPassword}</code></p></div></div><div class="section"><p><a href="https://www.ooruni.com/oes/secondary" class="button">📱 Open Portal & Submit Documents</a></p><p><strong>⏰ Portal Opens TODAY at 12:00 PM (Noon IST)</strong><br><strong>Deadline:</strong> 31st July 2026, 11:59 PM</p></div><div class="section"><h2>📄 What You Need to Prepare</h2><ul><li>Student ID / Roll Number</li><li>Latest Marksheet (PDF/Image)</li><li>Income Proof Document</li><li>Supporting Documents (if applicable)</li></ul></div><div class="section"><h2>💬 Join Our Community</h2><a href="https://chat.whatsapp.com/FlS75nzpko8EXfPrPx0VWw" class="button button-green">📱 Join WhatsApp Group</a></div><div class="section"><h2>❓ Need Help?</h2><p>Email: <a href="mailto:oorunifoundation@gmail.com">oorunifoundation@gmail.com</a></p><p>We're here to help!</p></div><div class="footer"><p>© 2026 Ooruni Foundation. All rights reserved.<br>This is an automated message. Please do not reply to this email.</p></div></div></body></html>`,
      }),
    })

    if (res.ok) {
      sent++
      if (sent % 50 === 0) console.log(`  ✓ Sent ${sent}/${passwords.length}...`)
    } else {
      const txt = await res.text()
      failed++
      errors.push(`${p.reference}: ${txt.substring(0, 80)}`)
      if (errors.length <= 5) console.error(`  ❌ ${p.reference}: Failed`)
    }
  } catch (e) {
    failed++
    errors.push(`${p.reference}: ${e.message}`)
    if (errors.length <= 5) console.error(`  ❌ ${p.reference}: ${e.message}`)
  }
}

console.log(`\n${'='.repeat(50)}`)
console.log(`✅ EMAIL SEND COMPLETE!`)
console.log(`${'='.repeat(50)}`)
console.log(`   Total:   ${passwords.length}`)
console.log(`   Sent:    ${sent}`)
console.log(`   Failed:  ${failed}`)
console.log(`${'='.repeat(50)}`)

if (errors.length > 0) {
  console.log(`\nFirst ${Math.min(5, errors.length)} errors:`)
  errors.slice(0, 5).forEach(e => console.log(`  - ${e}`))
}

process.exit(failed > 0 ? 1 : 0)
