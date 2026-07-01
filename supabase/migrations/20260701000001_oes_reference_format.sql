-- ============================================================================
-- OES — Change reference number format to  OES<YY><NNNN>  e.g. OES260001
-- ----------------------------------------------------------------------------
-- Previous format was  OES-YYYY-NNNNNN. New applications get a compact SNO of
-- the form OES + 2-digit year + 4-digit zero-padded running number.
-- Existing rows keep their original reference_number.
-- ============================================================================

create or replace function oes_generate_reference()
returns text language plpgsql as $$
declare
  n bigint;
begin
  n := nextval('oes_reference_seq');
  return 'OES' || to_char(now(), 'YY') || lpad(n::text, 4, '0');
end; $$;
