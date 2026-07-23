-- ============================================================================
-- OES — Secondary data collection: shortlisting, shared applicant login,
-- and additional document types.
-- ----------------------------------------------------------------------------
-- Purely additive: does not alter existing columns/rows, does not touch any
-- currently-running application flow.
-- ============================================================================

-- 1. Shortlist flag on applications (toggled manually by staff for now).
alter table oes_applications
  add column if not exists shortlisted boolean not null default false;

create index if not exists idx_oes_apps_shortlisted on oes_applications(shortlisted);

-- 2. Single shared password for the secondary-data portal (batch-generated,
--    shown to staff before mailing, never stored in plaintext).
create table if not exists oes_secondary_settings (
  id           boolean primary key default true,
  password_hash text,
  updated_at   timestamptz not null default now(),
  constraint oes_secondary_settings_singleton check (id)
);

insert into oes_secondary_settings (id, password_hash)
values (true, null)
on conflict (id) do nothing;

-- 3. Applicant sessions for the secondary portal (custom cookie-based auth;
--    applicants are not Supabase auth.users).
create table if not exists oes_applicant_sessions (
  token          uuid primary key default gen_random_uuid(),
  application_id uuid not null references oes_applications(id) on delete cascade,
  created_at     timestamptz not null default now(),
  expires_at     timestamptz not null default (now() + interval '7 days')
);

create index if not exists idx_oes_applicant_sessions_app on oes_applicant_sessions(application_id);
create index if not exists idx_oes_applicant_sessions_exp on oes_applicant_sessions(expires_at);

-- 4. Track whether an applicant has completed the secondary submission.
alter table oes_applications
  add column if not exists secondary_submitted_at timestamptz;

-- 5. Expand document_type enum with the secondary-data document categories.
--    (Bare statements — ALTER TYPE ... ADD VALUE cannot run inside a DO block
--    or the same transaction as a query using the new value.)
alter type oes_document_type add value if not exists 'student_id';
alter type oes_document_type add value if not exists 'marksheet_10';
alter type oes_document_type add value if not exists 'marksheet_12';
alter type oes_document_type add value if not exists 'first_graduate';
alter type oes_document_type add value if not exists 'parent_aadhaar';
alter type oes_document_type add value if not exists 'income_proof';
alter type oes_document_type add value if not exists 'single_parent_proof';
alter type oes_document_type add value if not exists 'disability_cert';
alter type oes_document_type add value if not exists 'address_proof';
alter type oes_document_type add value if not exists 'eb_bill';

-- 6. RLS: service-role only (no anon/authenticated policies) — all access to
--    these tables goes through server actions using the admin client.
alter table oes_secondary_settings   enable row level security;
alter table oes_applicant_sessions   enable row level security;
