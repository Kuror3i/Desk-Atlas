-- 0005_auth_userfields_policies.sql
-- Add auth_user_id columns and stricter RLS policies tied to auth.uid()

BEGIN;

-- Add auth_user_id to reservations and customers for ownership checks
ALTER TABLE IF EXISTS reservations ADD COLUMN IF NOT EXISTS auth_user_id UUID;
ALTER TABLE IF EXISTS customers ADD COLUMN IF NOT EXISTS auth_user_id UUID;

-- Ensure staff_accounts has auth_user_id (should already exist but be safe)
ALTER TABLE IF EXISTS staff_accounts ADD COLUMN IF NOT EXISTS auth_user_id UUID;

-- Re-enable RLS (no-op if already enabled)
ALTER TABLE IF EXISTS reservations ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS payment_proofs ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS staff_accounts ENABLE ROW LEVEL SECURITY;

-- Helper function not available in Postgres plain SQL for auth uid cast safety, so use explicit checks

-- Policy: users can SELECT their own reservations or staff (admin/staff)
DROP POLICY IF EXISTS "select_reservations_owner_or_staff" ON reservations;
CREATE POLICY "select_reservations_owner_or_staff" ON reservations
  FOR SELECT USING (
    (auth.uid() IS NOT NULL AND auth.uid()::uuid = auth_user_id)
    OR EXISTS (
      SELECT 1 FROM staff_accounts s WHERE s.auth_user_id = auth.uid()::uuid AND s.role IN ('staff','admin')
    )
  );

-- Policy: users can INSERT reservations only for themselves (auth.uid matches provided auth_user_id)
DROP POLICY IF EXISTS "insert_reservations_owner" ON reservations;
CREATE POLICY "insert_reservations_owner" ON reservations
  FOR INSERT WITH CHECK (
    auth.uid() IS NOT NULL AND auth.uid()::uuid = auth_user_id
  );

-- Policy: users can UPDATE their own reservations; staff can update any
DROP POLICY IF EXISTS "update_reservations_owner_or_staff" ON reservations;
CREATE POLICY "update_reservations_owner_or_staff" ON reservations
  FOR UPDATE USING (
    (auth.uid() IS NOT NULL AND auth.uid()::uuid = auth_user_id)
    OR EXISTS (
      SELECT 1 FROM staff_accounts s WHERE s.auth_user_id = auth.uid()::uuid AND s.role IN ('staff','admin')
    )
  ) WITH CHECK (
    (auth.uid() IS NOT NULL AND auth.uid()::uuid = auth_user_id)
    OR EXISTS (
      SELECT 1 FROM staff_accounts s WHERE s.auth_user_id = auth.uid()::uuid AND s.role IN ('staff','admin')
    )
  );

-- Customers: owner can access their record, staff/admin can access all
DROP POLICY IF EXISTS "select_customers_owner_or_staff" ON customers;
CREATE POLICY "select_customers_owner_or_staff" ON customers
  FOR SELECT USING (
    (auth.uid() IS NOT NULL AND auth.uid()::uuid = auth_user_id)
    OR EXISTS (
      SELECT 1 FROM staff_accounts s WHERE s.auth_user_id = auth.uid()::uuid AND s.role IN ('staff','admin')
    )
  );

DROP POLICY IF EXISTS "insert_customers_owner" ON customers;
CREATE POLICY "insert_customers_owner" ON customers
  FOR INSERT WITH CHECK (
    auth.uid() IS NOT NULL AND auth.uid()::uuid = auth_user_id
  );

DROP POLICY IF EXISTS "update_customers_owner_or_staff" ON customers;
CREATE POLICY "update_customers_owner_or_staff" ON customers
  FOR UPDATE USING (
    (auth.uid() IS NOT NULL AND auth.uid()::uuid = auth_user_id)
    OR EXISTS (
      SELECT 1 FROM staff_accounts s WHERE s.auth_user_id = auth.uid()::uuid AND s.role IN ('staff','admin')
    )
  ) WITH CHECK (
    (auth.uid() IS NOT NULL AND auth.uid()::uuid = auth_user_id)
    OR EXISTS (
      SELECT 1 FROM staff_accounts s WHERE s.auth_user_id = auth.uid()::uuid AND s.role IN ('staff','admin')
    )
  );

-- Payments & payment_proofs: only owner (via reservation.auth_user_id) or staff may access
-- For payments we check reservation ownership by joining
DROP POLICY IF EXISTS "select_payments_owner_or_staff" ON payments;
CREATE POLICY "select_payments_owner_or_staff" ON payments
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM reservations r WHERE r.reservations_id = payments.reservation_id AND (
        (auth.uid() IS NOT NULL AND auth.uid()::uuid = r.auth_user_id)
        OR EXISTS (
          SELECT 1 FROM staff_accounts s WHERE s.auth_user_id = auth.uid()::uuid AND s.role IN ('staff','admin')
        )
      )
    )
  );

DROP POLICY IF EXISTS "insert_payments_authenticated" ON payments;
CREATE POLICY "insert_payments_authenticated" ON payments
  FOR INSERT WITH CHECK (
    auth.uid() IS NOT NULL
  );

-- Payment proofs: similar
DROP POLICY IF EXISTS "select_payment_proofs_owner_or_staff" ON payment_proofs;
CREATE POLICY "select_payment_proofs_owner_or_staff" ON payment_proofs
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM reservations r WHERE r.reservations_id = payment_proofs.reservation_id AND (
        (auth.uid() IS NOT NULL AND auth.uid()::uuid = r.auth_user_id)
        OR EXISTS (
          SELECT 1 FROM staff_accounts s WHERE s.auth_user_id = auth.uid()::uuid AND s.role IN ('staff','admin')
        )
      )
    )
  );

DROP POLICY IF EXISTS "insert_payment_proofs_authenticated" ON payment_proofs;
CREATE POLICY "insert_payment_proofs_authenticated" ON payment_proofs
  FOR INSERT WITH CHECK (
    auth.uid() IS NOT NULL
  );

COMMIT;
