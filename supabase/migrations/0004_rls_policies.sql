-- 0004_rls_policies.sql
-- Enable Row Level Security and add basic policies for public read and authenticated writes

BEGIN;

-- Helper: ensure auth.uid() exists in this context; Supabase exposes auth.uid()

-- Enable RLS on tables that should be protected
ALTER TABLE IF EXISTS workspaces ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS reservations ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS payment_proofs ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS staff_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS invoices ENABLE ROW LEVEL SECURITY;

-- Allow public (anon) to read workspaces and upcoming_reservations view
DROP POLICY IF EXISTS "allow_public_select_workspaces" ON workspaces;
CREATE POLICY "allow_public_select_workspaces" ON workspaces
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "allow_public_select_reservations_view" ON reservations;
CREATE POLICY "allow_public_select_reservations_view" ON reservations
  FOR SELECT USING (true);

-- Allow authenticated users to insert reservations
DROP POLICY IF EXISTS "auth_insert_reservations" ON reservations;
CREATE POLICY "auth_insert_reservations" ON reservations
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- Allow authenticated users to select their own reservations if we store auth_user_id (future)
-- For now allow authenticated select (more strict policies recommended for production)
DROP POLICY IF EXISTS "auth_select_reservations" ON reservations;
CREATE POLICY "auth_select_reservations" ON reservations
  FOR SELECT USING (auth.uid() IS NOT NULL);

-- Staff accounts: disallow anonymous inserts; only service-role or authenticated users via server
DROP POLICY IF EXISTS "authenticated_insert_staff_accounts" ON staff_accounts;
CREATE POLICY "authenticated_insert_staff_accounts" ON staff_accounts
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- Payments and payment_proofs: only authenticated users can insert (service role recommended for review actions)
DROP POLICY IF EXISTS "auth_insert_payments" ON payments;
CREATE POLICY "auth_insert_payments" ON payments
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "auth_insert_payment_proofs" ON payment_proofs;
CREATE POLICY "auth_insert_payment_proofs" ON payment_proofs
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

COMMIT;
