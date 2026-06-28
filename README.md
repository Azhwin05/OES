# OES — Online Enumeration System

**ஓ.இ.எஸ் — ஆன்லைன் கணக்கெடுப்பு அமைப்பு**

A secure, bilingual (English / Tamil) online form-submission platform with an admin dashboard, built to collect, manage, and review educational beneficiary information.

> This is an **online form submission platform with an admin dashboard** — not a field communication app.

---

## ✨ Features

**Public**
- Professional bilingual landing page (English / Tamil) with a live language switcher
- 8-step guided application form with a step indicator, per-step validation, local draft autosave, dynamic siblings, conditional fields, document uploads, a final review, and a declaration
- Unique reference number generation, success page, and PDF download
- Track application status with reference number + phone
- Contact page

**Admin**
- Supabase Auth login, role-gated dashboard (`super_admin` / `admin` / `viewer`)
- Dashboard overview: 10 KPI cards + 6 charts (district, gender, school type, institution type, residence type, monthly trend) via Recharts
- Applications data table (TanStack Table): search, multi-filter, sort, pagination, bulk select, export (Excel/CSV), soft delete
- Application detail: full profile, status timeline, remarks, document viewing via short-lived signed URLs, status actions, PDF/print
- Reports (8 aggregations) with Excel/CSV/PDF export
- Export center, user management, settings (password change), audit logs

**Platform**
- Zod validation on both client and server (the server never trusts the client)
- Row Level Security on every table; private storage buckets with signed-URL access
- Soft deletes, audit logging, indexed search columns

---

## 🧱 Tech stack

Next.js 16 (App Router) · React 19 · TypeScript · Tailwind CSS v4 · shadcn/ui (Base UI) · Supabase (PostgreSQL, Auth, Storage) · React Hook Form · Zod · TanStack Table · Recharts · Lucide · jsPDF · SheetJS · Vitest · Playwright.

---

## 🚀 Getting started

### 1. Install
```bash
npm install
```

### 2. Configure environment
Copy `.env.example` to `.env.local` and fill in your Supabase values:
```bash
cp .env.example .env.local
```
| Variable | Description |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Anon / publishable key (browser-safe) |
| `SUPABASE_SERVICE_ROLE_KEY` | Service role key (**server only**, never exposed to the browser) |
| `NEXT_PUBLIC_APP_URL` | Public base URL |

### 3. Apply the database schema
Run the SQL migrations against your Supabase project (SQL editor or CLI), in order:
```
supabase/migrations/20260628000001_oes_schema.sql      # tables, enums, indexes, RLS, RPC
supabase/migrations/20260628000002_oes_storage.sql     # buckets + storage policies
```

### 4. Seed the admin
```bash
SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... node scripts/seed-admin.mjs
```
Creates **admin@oes.org / ChangeMe@123** (`super_admin`). Change the password on first login.

### 5. Run
```bash
npm run dev      # http://localhost:3000
```

---

## 🧪 Quality gates
```bash
npm run typecheck   # tsc --noEmit
npm run lint        # eslint
npm run test        # vitest (unit + validation)
npm run test:e2e    # playwright (end-to-end)
npm run build       # production build
```

---

## 🗄️ Database

All OES objects are prefixed `oes_` and live in the `public` schema (kept isolated by naming so the project can be shared safely). Tables: `oes_profiles`, `oes_applications`, `oes_personal_details`, `oes_education_details`, `oes_family_details`, `oes_siblings`, `oes_impairment_details`, `oes_residence_details`, `oes_documents`, `oes_application_status_history`, `oes_admin_remarks`, `oes_audit_logs`.

**RLS summary**
- Public (`anon`): may INSERT applications + child rows during submission; no direct SELECT.
- Public tracking: only via the `oes_track_application(reference, phone)` security-definer RPC.
- Staff (`authenticated` with a profile): SELECT.
- Admins (`admin` / `super_admin`): full manage. Viewers: read-only.

**Storage**: private buckets `oes-student-photos`, `oes-application-documents`; anon may upload during submission; admins read via signed URLs.

---

## ☁️ Deploy to Vercel
1. Push to GitHub and import the repo in Vercel.
2. Set the four env vars above in the Vercel project (use the production Supabase values; keep the service role key as a server env var).
3. Deploy. Set `NEXT_PUBLIC_APP_URL` to the deployed URL.

---

## 📁 Structure
```
src/
  app/
    (public)/        home, apply, track, contact
    admin/           login, (dashboard) overview/applications/reports/export/users/settings/audit
  components/
    apply/           multi-step form, steps, fields, document upload, review
    admin/           shell, dashboard, table, detail, reports, users, audit, settings
    ui/              shadcn/ui (Base UI) primitives
  lib/
    i18n/            translations (en/ta) + context
    supabase/        browser / server / admin clients + types
    validation/      zod schemas (+ tests)
    queries.ts, auth.ts, export.ts, pdf.ts, upload.ts, audit.ts, constants.ts
supabase/migrations/ schema + storage SQL
scripts/seed-admin.mjs
e2e/                 playwright specs
```

---

## ⚠️ Notes / limitations
- The submission PDF is English-only (core jsPDF fonts lack Tamil glyphs); use **Print** for a bilingual copy.
- Contact form is a front-end acknowledgement; wire it to an email service or table to persist.
- Confirmation email is not enabled by default (no mail provider configured).

---

## 🔐 Default admin
`admin@oes.org` / `ChangeMe@123` — change immediately after first login (Settings → Change Password).
