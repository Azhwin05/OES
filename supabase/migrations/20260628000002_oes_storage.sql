-- ============================================================================
-- OES — Storage buckets + policies
-- Buckets are PRIVATE. Public users may upload during submission; admins read
-- via short-lived signed URLs. Bucket names prefixed `oes-` for isolation.
-- ============================================================================

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  ('oes-student-photos', 'oes-student-photos', false, 5242880,
    array['image/jpeg','image/jpg','image/png']),
  ('oes-application-documents', 'oes-application-documents', false, 5242880,
    array['image/jpeg','image/jpg','image/png','application/pdf'])
on conflict (id) do update
  set public = excluded.public,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

-- Public users (anon) may UPLOAD into the OES buckets during a submission.
drop policy if exists oes_storage_anon_upload on storage.objects;
create policy oes_storage_anon_upload on storage.objects
  for insert to anon, authenticated
  with check (bucket_id in ('oes-student-photos','oes-application-documents'));

-- Staff (authenticated admins/viewers) may READ objects in the OES buckets.
drop policy if exists oes_storage_staff_read on storage.objects;
create policy oes_storage_staff_read on storage.objects
  for select to authenticated
  using (
    bucket_id in ('oes-student-photos','oes-application-documents')
    and oes_is_staff()
  );

-- Admins may DELETE objects in the OES buckets.
drop policy if exists oes_storage_admin_delete on storage.objects;
create policy oes_storage_admin_delete on storage.objects
  for delete to authenticated
  using (
    bucket_id in ('oes-student-photos','oes-application-documents')
    and oes_is_admin()
  );
