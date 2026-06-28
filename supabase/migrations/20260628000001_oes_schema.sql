-- ============================================================================
-- OES — Online Enumeration System : Database schema
-- ----------------------------------------------------------------------------
-- All objects are prefixed `oes_` and created in the `public` schema so they
-- live on Supabase's API-exposed schema while remaining isolated (by name)
-- from any other application sharing the same project.
-- Idempotent where practical so it can be re-run safely.
-- ============================================================================

create extension if not exists "pgcrypto";

-- ----------------------------------------------------------------------------
-- ENUM TYPES
-- ----------------------------------------------------------------------------
do $$ begin
  create type oes_user_role         as enum ('super_admin', 'admin', 'viewer');
exception when duplicate_object then null; end $$;
do $$ begin
  create type oes_app_status        as enum ('submitted', 'under_review', 'approved', 'rejected', 'needs_correction');
exception when duplicate_object then null; end $$;
do $$ begin
  create type oes_gender            as enum ('male', 'female', 'other');
exception when duplicate_object then null; end $$;
do $$ begin
  create type oes_school_type       as enum ('government', 'private');
exception when duplicate_object then null; end $$;
do $$ begin
  create type oes_parent_status     as enum ('both', 'single', 'parentless');
exception when duplicate_object then null; end $$;
do $$ begin
  create type oes_single_reason     as enum ('divorced', 'separated', 'deceased', 'other');
exception when duplicate_object then null; end $$;
do $$ begin
  create type oes_sibling_order     as enum ('elder', 'younger');
exception when duplicate_object then null; end $$;
do $$ begin
  create type oes_sibling_status    as enum ('studying', 'working');
exception when duplicate_object then null; end $$;
do $$ begin
  create type oes_impairment_owner  as enum ('self', 'parent');
exception when duplicate_object then null; end $$;
do $$ begin
  create type oes_residence_type    as enum ('own', 'rental');
exception when duplicate_object then null; end $$;
do $$ begin
  create type oes_roof_type         as enum ('concrete', 'thatched', 'tiled');
exception when duplicate_object then null; end $$;
do $$ begin
  create type oes_ownership_source  as enum ('inheritance', 'built', 'other');
exception when duplicate_object then null; end $$;
do $$ begin
  create type oes_document_type     as enum ('student_photo','aadhaar','income','community','scholarship','impairment','other');
exception when duplicate_object then null; end $$;

-- ----------------------------------------------------------------------------
-- UTILITY: updated_at trigger
-- ----------------------------------------------------------------------------
create or replace function oes_set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end; $$;

-- ----------------------------------------------------------------------------
-- REFERENCE NUMBER generator : OES-YYYY-NNNNNN
-- ----------------------------------------------------------------------------
create sequence if not exists oes_reference_seq start 1;

create or replace function oes_generate_reference()
returns text language plpgsql as $$
declare
  n bigint;
begin
  n := nextval('oes_reference_seq');
  return 'OES-' || to_char(now(), 'YYYY') || '-' || lpad(n::text, 6, '0');
end; $$;

-- ============================================================================
-- TABLES
-- ============================================================================

-- 1. profiles (admin / viewer accounts; FK -> auth.users)
create table if not exists oes_profiles (
  id                   uuid primary key references auth.users(id) on delete cascade,
  email                text not null,
  full_name            text,
  role                 oes_user_role not null default 'viewer',
  must_change_password boolean not null default true,
  created_at           timestamptz not null default now(),
  updated_at           timestamptz not null default now()
);

-- 2. applications (root record)
create table if not exists oes_applications (
  id               uuid primary key default gen_random_uuid(),
  reference_number text not null unique default oes_generate_reference(),
  status           oes_app_status not null default 'submitted',
  primary_phone    text not null,                 -- indexed for track lookups
  applicant_name   text not null,
  submitted_at     timestamptz not null default now(),
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now(),
  created_by       uuid,
  updated_by       uuid,
  deleted_at       timestamptz
);

-- 3. personal_details
create table if not exists oes_personal_details (
  id                  uuid primary key default gen_random_uuid(),
  application_id      uuid not null references oes_applications(id) on delete cascade,
  full_name          text not null,
  name_tamil         text,
  contact_number     text not null,
  alt_contact_number text,
  email              text,
  dob                date,
  gender             oes_gender,
  town               text,
  district           text,
  state              text,
  pincode            text,
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now()
);

-- 4. education_details
create table if not exists oes_education_details (
  id                  uuid primary key default gen_random_uuid(),
  application_id      uuid not null references oes_applications(id) on delete cascade,
  school_name         text,
  school_type         oes_school_type,
  institution_name    text,
  institution_type    oes_school_type,
  course_name         text,
  course_duration     integer,
  current_year        integer,
  current_semester    integer,
  scholarship_details text,
  has_scholarship     boolean not null default false,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);

-- 5. family_details
create table if not exists oes_family_details (
  id                   uuid primary key default gen_random_uuid(),
  application_id       uuid not null references oes_applications(id) on delete cascade,
  parent_status        oes_parent_status,
  single_parent_reason oes_single_reason,
  father_name          text,
  mother_name          text,
  guardian_name        text,
  guardian_contact     text,
  guardian_occupation  text,
  annual_income        numeric(12,2),
  created_at           timestamptz not null default now(),
  updated_at           timestamptz not null default now()
);

-- 6. siblings (many per application)
create table if not exists oes_siblings (
  id             uuid primary key default gen_random_uuid(),
  application_id uuid not null references oes_applications(id) on delete cascade,
  name           text,
  birth_order    oes_sibling_order,
  occupation     oes_sibling_status,
  details        text,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);

-- 7. impairment_details
create table if not exists oes_impairment_details (
  id             uuid primary key default gen_random_uuid(),
  application_id uuid not null references oes_applications(id) on delete cascade,
  has_impairment boolean not null default false,
  belongs_to     oes_impairment_owner,
  impairment_type text,
  description    text,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);

-- 8. residence_details
create table if not exists oes_residence_details (
  id               uuid primary key default gen_random_uuid(),
  application_id    uuid not null references oes_applications(id) on delete cascade,
  residence_type   oes_residence_type,
  roof_type        oes_roof_type,
  ownership_source oes_ownership_source,
  door_street      text,
  town             text,
  district         text,
  state            text,
  pincode          text,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

-- 9. documents (registry; files live in Supabase Storage)
create table if not exists oes_documents (
  id             uuid primary key default gen_random_uuid(),
  application_id uuid not null references oes_applications(id) on delete cascade,
  document_type  oes_document_type not null,
  bucket         text not null,
  path           text not null,
  file_name      text,
  mime_type      text,
  size_bytes     bigint,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now(),
  deleted_at     timestamptz
);

-- 10. application_status_history
create table if not exists oes_application_status_history (
  id             uuid primary key default gen_random_uuid(),
  application_id uuid not null references oes_applications(id) on delete cascade,
  from_status    oes_app_status,
  to_status      oes_app_status not null,
  note           text,
  changed_by     uuid,
  created_at     timestamptz not null default now()
);

-- 11. admin_remarks
create table if not exists oes_admin_remarks (
  id             uuid primary key default gen_random_uuid(),
  application_id uuid not null references oes_applications(id) on delete cascade,
  remark         text not null,
  created_by     uuid,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now(),
  deleted_at     timestamptz
);

-- 12. audit_logs
create table if not exists oes_audit_logs (
  id          uuid primary key default gen_random_uuid(),
  action      text not null,
  entity      text,
  entity_id   uuid,
  details     jsonb,
  actor_id    uuid,
  actor_email text,
  created_at  timestamptz not null default now()
);

-- ----------------------------------------------------------------------------
-- INDEXES
-- ----------------------------------------------------------------------------
create index if not exists idx_oes_apps_status        on oes_applications(status);
create index if not exists idx_oes_apps_phone         on oes_applications(primary_phone);
create index if not exists idx_oes_apps_ref           on oes_applications(reference_number);
create index if not exists idx_oes_apps_submitted_at  on oes_applications(submitted_at);
create index if not exists idx_oes_apps_deleted_at    on oes_applications(deleted_at);
create index if not exists idx_oes_personal_app       on oes_personal_details(application_id);
create index if not exists idx_oes_personal_district  on oes_personal_details(district);
create index if not exists idx_oes_personal_gender    on oes_personal_details(gender);
create index if not exists idx_oes_education_app      on oes_education_details(application_id);
create index if not exists idx_oes_family_app         on oes_family_details(application_id);
create index if not exists idx_oes_siblings_app       on oes_siblings(application_id);
create index if not exists idx_oes_impairment_app     on oes_impairment_details(application_id);
create index if not exists idx_oes_residence_app      on oes_residence_details(application_id);
create index if not exists idx_oes_documents_app      on oes_documents(application_id);
create index if not exists idx_oes_status_hist_app    on oes_application_status_history(application_id);
create index if not exists idx_oes_remarks_app        on oes_admin_remarks(application_id);
create index if not exists idx_oes_audit_entity       on oes_audit_logs(entity, entity_id);

-- ----------------------------------------------------------------------------
-- updated_at TRIGGERS
-- ----------------------------------------------------------------------------
do $$
declare t text;
begin
  foreach t in array array[
    'oes_profiles','oes_applications','oes_personal_details','oes_education_details',
    'oes_family_details','oes_siblings','oes_impairment_details','oes_residence_details',
    'oes_documents','oes_admin_remarks'
  ] loop
    execute format('drop trigger if exists set_updated_at on %I', t);
    execute format('create trigger set_updated_at before update on %I for each row execute function oes_set_updated_at()', t);
  end loop;
end $$;

-- ============================================================================
-- AUTH HELPERS (SECURITY DEFINER to avoid RLS recursion on profiles)
-- ============================================================================
create or replace function oes_current_role()
returns oes_user_role language sql stable security definer set search_path = public as $$
  select role from oes_profiles where id = auth.uid();
$$;

create or replace function oes_is_admin()
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from oes_profiles
    where id = auth.uid() and role in ('super_admin','admin')
  );
$$;

create or replace function oes_is_staff()
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from oes_profiles
    where id = auth.uid() and role in ('super_admin','admin','viewer')
  );
$$;

-- ============================================================================
-- ROW LEVEL SECURITY
-- ============================================================================
alter table oes_profiles                  enable row level security;
alter table oes_applications              enable row level security;
alter table oes_personal_details          enable row level security;
alter table oes_education_details         enable row level security;
alter table oes_family_details            enable row level security;
alter table oes_siblings                  enable row level security;
alter table oes_impairment_details        enable row level security;
alter table oes_residence_details         enable row level security;
alter table oes_documents                 enable row level security;
alter table oes_application_status_history enable row level security;
alter table oes_admin_remarks             enable row level security;
alter table oes_audit_logs                enable row level security;

-- ---- profiles ----
drop policy if exists oes_profiles_self_read on oes_profiles;
create policy oes_profiles_self_read on oes_profiles
  for select to authenticated using (id = auth.uid() or oes_is_admin());

drop policy if exists oes_profiles_self_update on oes_profiles;
create policy oes_profiles_self_update on oes_profiles
  for update to authenticated using (id = auth.uid() or oes_is_admin());

drop policy if exists oes_profiles_admin_insert on oes_profiles;
create policy oes_profiles_admin_insert on oes_profiles
  for insert to authenticated with check (oes_is_admin());

-- ---- applications + child tables ----
-- Public (anon) can INSERT during submission; staff can read; admins manage.
do $$
declare t text;
begin
  foreach t in array array[
    'oes_applications','oes_personal_details','oes_education_details',
    'oes_family_details','oes_siblings','oes_impairment_details',
    'oes_residence_details','oes_documents'
  ] loop
    execute format('drop policy if exists %I on %I', t||'_anon_insert', t);
    execute format('create policy %I on %I for insert to anon, authenticated with check (true)', t||'_anon_insert', t);

    execute format('drop policy if exists %I on %I', t||'_staff_read', t);
    execute format('create policy %I on %I for select to authenticated using (oes_is_staff())', t||'_staff_read', t);

    execute format('drop policy if exists %I on %I', t||'_admin_update', t);
    execute format('create policy %I on %I for update to authenticated using (oes_is_admin())', t||'_admin_update', t);

    execute format('drop policy if exists %I on %I', t||'_admin_delete', t);
    execute format('create policy %I on %I for delete to authenticated using (oes_is_admin())', t||'_admin_delete', t);
  end loop;
end $$;

-- ---- status history ----
drop policy if exists oes_status_hist_staff_read on oes_application_status_history;
create policy oes_status_hist_staff_read on oes_application_status_history
  for select to authenticated using (oes_is_staff());
drop policy if exists oes_status_hist_admin_insert on oes_application_status_history;
create policy oes_status_hist_admin_insert on oes_application_status_history
  for insert to authenticated with check (oes_is_admin());
-- also allow anon insert of the initial 'submitted' row during submission
drop policy if exists oes_status_hist_anon_insert on oes_application_status_history;
create policy oes_status_hist_anon_insert on oes_application_status_history
  for insert to anon with check (to_status = 'submitted');

-- ---- admin remarks ----
drop policy if exists oes_remarks_staff_read on oes_admin_remarks;
create policy oes_remarks_staff_read on oes_admin_remarks
  for select to authenticated using (oes_is_staff());
drop policy if exists oes_remarks_admin_write on oes_admin_remarks;
create policy oes_remarks_admin_write on oes_admin_remarks
  for insert to authenticated with check (oes_is_admin());
drop policy if exists oes_remarks_admin_update on oes_admin_remarks;
create policy oes_remarks_admin_update on oes_admin_remarks
  for update to authenticated using (oes_is_admin());

-- ---- audit logs ----
drop policy if exists oes_audit_staff_read on oes_audit_logs;
create policy oes_audit_staff_read on oes_audit_logs
  for select to authenticated using (oes_is_staff());
drop policy if exists oes_audit_admin_insert on oes_audit_logs;
create policy oes_audit_admin_insert on oes_audit_logs
  for insert to authenticated with check (oes_is_admin());

-- ============================================================================
-- PUBLIC TRACKING RPC  (ref number + phone only -> limited fields)
-- ============================================================================
create or replace function oes_track_application(p_reference text, p_phone text)
returns table (
  reference_number text,
  applicant_name   text,
  status           oes_app_status,
  submitted_at     timestamptz,
  latest_remark    text
)
language sql stable security definer set search_path = public as $$
  select a.reference_number,
         a.applicant_name,
         a.status,
         a.submitted_at,
         (select r.remark from oes_admin_remarks r
            where r.application_id = a.id and r.deleted_at is null
            order by r.created_at desc limit 1) as latest_remark
  from oes_applications a
  where a.reference_number = p_reference
    and a.primary_phone = p_phone
    and a.deleted_at is null
  limit 1;
$$;

grant execute on function oes_track_application(text, text) to anon, authenticated;

-- ============================================================================
-- NEW USER -> profile (default viewer). Admin promotes via seed/script.
-- ============================================================================
create or replace function oes_handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into oes_profiles (id, email, full_name, role)
  values (new.id, new.email, coalesce(new.raw_user_meta_data->>'full_name', new.email), 'viewer')
  on conflict (id) do nothing;
  return new;
end; $$;

-- NOTE: trigger on auth.users intentionally omitted to avoid interfering with
-- the other application sharing this project. OES admin accounts are created
-- explicitly by the seed script (scripts/seed-admin.ts).

grant usage on schema public to anon, authenticated, service_role;
