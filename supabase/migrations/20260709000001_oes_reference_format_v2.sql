-- ============================================================================
-- OES — Reference number format: OES<YYYY><NNNN>  e.g. OES20260001
-- ----------------------------------------------------------------------------
-- The 20260701000001 migration attempted OES<YY><NNNN> but was never applied
-- to production, which kept generating the original OES-YYYY-NNNNNN format.
-- This migration clears all existing application data (a clean restart) and
-- redefines the generator so the next reference is OES20260001.
-- ============================================================================

-- Clear all application data (cascades to personal/education/family/siblings/
-- impairment/residence/documents/status-history/remarks — see FKs).
truncate table oes_applications restart identity cascade;

-- Reset the reference sequence so the next value is 1.
alter sequence oes_reference_seq restart with 1;

create or replace function oes_generate_reference()
returns text language plpgsql as $$
declare
  n bigint;
begin
  n := nextval('oes_reference_seq');
  return 'OES' || to_char(now(), 'YYYY') || lpad(n::text, 4, '0');
end; $$;
