-- 0006_audit_policy_documents.sql
-- Add audit_log and policy_documents tables; ensure staff_accounts has is_active

BEGIN;

-- Ensure staff_accounts has an is_active flag
ALTER TABLE IF EXISTS staff_accounts ADD COLUMN IF NOT EXISTS is_active BOOLEAN NOT NULL DEFAULT TRUE;

-- Audit log for actions across tables (polymorphic target)
CREATE TABLE IF NOT EXISTS audit_log (
  audit_log_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  actor_id UUID,
  actor_role TEXT,
  action TEXT NOT NULL,
  target_table TEXT,
  target_id UUID,
  timestamp TIMESTAMPTZ NOT NULL DEFAULT now(),
  notes TEXT
);

CREATE INDEX IF NOT EXISTS idx_audit_actor_id ON audit_log(actor_id);
CREATE INDEX IF NOT EXISTS idx_audit_timestamp ON audit_log(timestamp);

-- Policy / document storage for terms, policies, etc.
CREATE TABLE IF NOT EXISTS policy_documents (
  policy_documents_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  file_url TEXT,
  effective_date DATE,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMIT;
