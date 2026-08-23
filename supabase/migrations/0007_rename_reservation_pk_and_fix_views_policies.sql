-- 0007_rename_reservation_pk_and_fix_views_policies.sql
-- Rename reservations PK to match ERD (`reservations_id`) and update dependent views/policies

BEGIN;

-- Rename primary key column if it exists
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'reservations' AND column_name = 'reservation_id'
  ) THEN
    ALTER TABLE reservations RENAME COLUMN reservation_id TO reservations_id;
  END IF;
END$$;

-- Recreate upcoming_reservations view to use new column name
DROP VIEW IF EXISTS upcoming_reservations;
CREATE OR REPLACE VIEW upcoming_reservations AS
SELECT r.reservations_id, r.workspace_id, r.customer_name, r.start_time, r.end_time, r.status
FROM reservations r
WHERE r.start_time >= now() AND r.start_time < now() + interval '7 days'
ORDER BY r.start_time ASC;

-- Recreate policies that referenced the old column name to reference the new one

-- Reservations select policy (owner or staff)
DROP POLICY IF EXISTS "select_reservations_owner_or_staff" ON reservations;
CREATE POLICY "select_reservations_owner_or_staff" ON reservations
  FOR SELECT USING (
    (auth.uid() IS NOT NULL AND auth.uid()::uuid = auth_user_id)
    OR EXISTS (
      SELECT 1 FROM staff_accounts s WHERE s.auth_user_id = auth.uid()::uuid AND s.role IN ('staff','admin')
    )
  );

-- Insert policy for reservations (owner)
DROP POLICY IF EXISTS "insert_reservations_owner" ON reservations;
CREATE POLICY "insert_reservations_owner" ON reservations
  FOR INSERT WITH CHECK (
    auth.uid() IS NOT NULL AND auth.uid()::uuid = auth_user_id
  );

-- Update policy for reservations (owner or staff)
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

-- Payments: recreate select policy to reference reservations.reservations_id
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

-- Payment proofs: recreate select policy to reference reservations.reservations_id
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

COMMIT;
