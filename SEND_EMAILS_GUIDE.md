# 📧 BREVO EMAIL CAMPAIGN - SEND 262 SHORTLISTED CANDIDATES

## ✅ STATUS: READY TO SEND

All passwords are now imported to Supabase and the email list is prepared!

---

## 📊 WHAT'S BEEN COMPLETED

### 1. ✅ Password Generation (262 candidates)
- Algorithm: FirstName(3) + OES_ID(last4)
- All passwords hashed with bcrypt (10 rounds)
- File: `passwords-output.json`

### 2. ✅ Supabase Import (DONE!)
- **262/262 passwords imported** to `oes_applications.secondary_password_hash`
- Database ready for login
- Verification: Portal login will work from 12:00 PM today

### 3. ✅ Email List Prepared
- File: `brevo-recipients.csv`
- Contains: EMAIL, FIRST_NAME, OES_ID, PASSWORD
- Ready for Brevo campaign

### 4. 📄 HTML Email Template
- File: `emails/secondary-submission.html`
- Professional, responsive design
- Ooruni Foundation branding
- Mobile-optimized

---

## 🚀 HOW TO SEND EMAILS VIA BREVO

### Step 1: Login to Brevo
1. Go to: https://app.brevo.com
2. Login with your Ooruni Foundation account
3. Click **Campaigns** → **Create Campaign** → **Email Campaign**

### Step 2: Upload Recipients
1. Click **Choose List** or **Add Recipients**
2. Select **Upload a list**
3. Upload: `brevo-recipients.csv`
4. Column mapping:
   - EMAIL → Email address
   - FIRST_NAME → First name (optional)
   - OES_ID → Custom attribute (create if needed)
   - PASSWORD → Custom attribute (create if needed)

### Step 3: Configure Campaign
**Campaign Name:**
```
OES Secondary Submission - Shortlist Batch 262
```

**Sender (From):**
```
Name: Ooruni Foundation
Email: oorunifoundation@gmail.com
```

**Reply To:**
```
oorunifoundation@gmail.com
```

**Subject Line:**
```
✅ Congratulations! Next Step: Secondary Document Submission [{{OES_ID}}]
```

### Step 4: Add Email Content
1. Click **Content**
2. Copy the HTML from: `emails/secondary-submission.html`
3. Paste into the HTML editor
4. Add personalization variables:
   - `{{FIRST_NAME}}` for candidate name
   - `{{OES_ID}}` for OES ID
   - `{{PASSWORD}}` for password

### Step 5: Personalization
Enable dynamic content:
- Replace hardcoded name with: `{{FIRST_NAME}}`
- Replace hardcoded OES ID with: `{{OES_ID}}`
- Replace hardcoded password with: `{{PASSWORD}}`

### Step 6: Schedule / Send
**Option A: Send Immediately** (Recommended for testing)
1. Click **Review**
2. Send test email to yourself
3. Verify formatting and links
4. Click **Send Now**

**Option B: Schedule for Tomorrow 7:30 AM**
1. Click **Review**
2. Click **Schedule** 
3. Set date/time: **July 24, 2026 at 7:30 AM IST**
4. Click **Schedule Campaign**

### Step 7: Monitor Delivery
1. Go to **Campaigns** → Select your campaign
2. Check:
   - ✅ Sent: Should show 262
   - ✅ Delivered: Should be 260+ (98%+)
   - ⚠️ Bounced: Check if any hard bounces
   - 📊 Opens: Track opens over next 24h
   - 🔗 Clicks: Track portal clicks

---

## 📋 FILES READY FOR BREVO

**Located in project root:**

```
brevo-recipients.csv           [262 recipients, ready to upload]
emails/secondary-submission.html  [HTML email template]
passwords-output.json          [Reference, don't upload]
```

### CSV Preview (first 5 rows):
```csv
EMAIL,FIRST_NAME,OES_ID,PASSWORD
rajeshlogesh2007@gmail.com,Lokeshwaran,OES20260205,LOK0205
vickynagaraj1999@gmail.com,Sabitha,OES20260582,SAB0582
snivedha216@gmail.com,Nivedha,OES20260119,NIV0119
stephy20081802@gmail.com,Stephy,OES20260001,STE0001
radhikasasikumar1975@gmail.com,S,OES20260134,S..0134
```

---

## 🔐 SECURITY CHECKLIST

Before sending:

- [ ] Check CSV has 262 rows (+ 1 header)
- [ ] Verify email addresses look correct
- [ ] Test login: OES20260205 / LOK0205 should work
- [ ] Send test email to your inbox first
- [ ] Verify password appears correctly in test email
- [ ] Check portal link is correct: https://www.ooruni.com/oes/secondary
- [ ] Verify logo loads (Cloudinary image)
- [ ] Check mobile rendering (Brevo has preview)

---

## ⏰ TIMELINE

**Today (July 23, 2026):**
- ✅ 6:45 PM - Passwords imported to Supabase (DONE)
- 🕐 7:00 PM - Create Brevo campaign
- 🕐 7:15 PM - Send test email
- 🕐 7:30 PM - Review and schedule/send

**Tomorrow (July 24, 2026):**
- 🕐 7:30 AM - Emails sent (if scheduled) or manual send
- 🕐 8:00 AM - Monitor delivery in Brevo
- 🕐 12:00 PM - Portal goes live (countdown ends, login available)

---

## 📞 SUPPORT

**Brevo Support:**
- Email: support@brevo.com
- Dashboard: https://app.brevo.com/support
- Docs: https://developers.brevo.com/docs

**Common Issues:**

### Issue: CSV upload fails
**Solution:** Make sure CSV uses UTF-8 encoding and LF line endings

### Issue: Emails going to spam
**Solution:** 
1. Brevo handles DKIM/SPF automatically
2. Check Brevo → Settings → Senders → Verify sender domain
3. Wait 24h for DKIM propagation

### Issue: Password showing as {{PASSWORD}}
**Solution:** Ensure you mapped the PASSWORD column in personalization settings

### Issue: Only partial emails sent
**Solution:** 
1. Check for invalid email addresses
2. Check for duplicates in recipient list
3. Verify list upload completed 100%

---

## ✅ SUCCESS METRICS

After sending, verify:
- [ ] All 262 emails show as "Sent" in Brevo dashboard
- [ ] Delivery rate > 98% (260+ delivered)
- [ ] No complaints/spam reports in first hour
- [ ] Portal login works at 12 PM
- [ ] First batch of opens/clicks tracked

---

## 🎯 NEXT STEPS

1. **Open Brevo dashboard:** https://app.brevo.com
2. **Create new email campaign** (Classic/Regular campaign)
3. **Follow steps 1-7 above**
4. **Monitor delivery** over next 24 hours
5. **Check portal analytics** after 12 PM launch

---

**Everything is ready! You're just 5-10 minutes away from sending emails to all 262 candidates! 🚀**

