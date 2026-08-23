-- 0001_init.sql
-- Initial schema for DeskAtlas (Postgres)

BEGIN;

-- UUID helper
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Workspaces
CREATE TABLE IF NOT EXISTS workspaces (
  workspace_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  capacity INTEGER NOT NULL DEFAULT 1,
  price NUMERIC(10,2) NOT NULL DEFAULT 0,
  layout_position INTEGER,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Reservations
CREATE TABLE IF NOT EXISTS reservations (
  reservations_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workspace_id UUID NOT NULL REFERENCES workspaces(workspace_id) ON DELETE CASCADE,
  customer_name TEXT NOT NULL,
  customer_email TEXT,
  start_time TIMESTAMPTZ NOT NULL,
  end_time TIMESTAMPTZ NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  reference_code TEXT,
  created_via TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Payment proofs
CREATE TABLE IF NOT EXISTS payment_proofs (
  payment_proof_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  reservation_id UUID NOT NULL REFERENCES reservations(reservations_id) ON DELETE CASCADE,
  file_url TEXT,
  review_status TEXT DEFAULT 'pending',
  reviewed_by UUID,
  reviewed_at TIMESTAMPTZ,
  rejection_reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Staff accounts
CREATE TABLE IF NOT EXISTS staff_accounts (
  staff_account_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  auth_user_id UUID,
  role TEXT NOT NULL DEFAULT 'staff',
  display_name TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_reservations_workspace_id ON reservations(workspace_id);
CREATE INDEX IF NOT EXISTS idx_payment_reservation_id ON payment_proofs(reservation_id);
CREATE INDEX IF NOT EXISTS idx_workspaces_is_active ON workspaces(is_active);

COMMIT;
