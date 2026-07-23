-- ============================================================================
-- OES — Secondary form: conditional document rules
-- ----------------------------------------------------------------------------
-- Adds a small answers table for the yes/no + choice questions that gate
-- which documents are mandatory, and new document types for the specific
-- single-parent proof documents. Purely additive.
-- ============================================================================

create table if not exists oes_secondary_answers (
  application_id            uuid primary key references oes_applications(id) on delete cascade,
  first_graduate            boolean,
  has_other_scholarship     boolean,
  income_proof_for          text[] not null default '{}',
  single_parent_living_with text,
  single_parent_reason      text,
  created_at                timestamptz not null default now(),
  updated_at                timestamptz not null default now()
);

alter table oes_secondary_answers enable row level security;

drop trigger if exists set_updated_at on oes_secondary_answers;
create trigger set_updated_at before update on oes_secondary_answers
  for each row execute function oes_set_updated_at();

-- New document categories for the single-parent reason branch.
alter type oes_document_type add value if not exists 'death_certificate';
alter type oes_document_type add value if not exists 'legal_separation_proof';
alter type oes_document_type add value if not exists 'vao_letter';
