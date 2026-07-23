-- ============================================================================
-- OES — Individual secondary passwords per application
-- ============================================================================
-- Changes from shared password (one for all) to individual passwords (one per person).
-- Each shortlisted applicant gets a unique password based on their name + OES ID.
-- Format: FirstName(3 letters) + OES_ID(last 4 digits)
-- Example: Lokeshwaran + OES20260205 → LOK0205
-- ============================================================================

-- Add password_hash column to oes_applications (nullable for non-shortlisted)
ALTER TABLE oes_applications
  ADD COLUMN IF NOT EXISTS secondary_password_hash text;

-- Index for faster lookups during login
CREATE INDEX IF NOT EXISTS idx_oes_apps_secondary_password
  ON oes_applications(reference_number)
  WHERE secondary_password_hash IS NOT NULL;

-- Deprecate the old shared password table (keep for safety, but mark as unused)
-- Do NOT drop oes_secondary_settings to preserve audit trail
ALTER TABLE oes_secondary_settings OWNER TO postgres;
COMMENT ON TABLE oes_secondary_settings IS 'DEPRECATED: Replaced by per-application passwords in oes_applications.secondary_password_hash';
