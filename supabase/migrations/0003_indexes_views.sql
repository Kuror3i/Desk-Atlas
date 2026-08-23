-- 0003_indexes_views.sql
-- Add useful indexes and a view for upcoming reservations

BEGIN;

-- Indexes for faster lookup
CREATE INDEX IF NOT EXISTS idx_reservations_start_time ON reservations(start_time);
CREATE INDEX IF NOT EXISTS idx_reservations_status ON reservations(status);
CREATE INDEX IF NOT EXISTS idx_payments_status ON payments(status);
CREATE INDEX IF NOT EXISTS idx_customers_email ON customers(email);

-- View: upcoming reservations (next 7 days)
CREATE OR REPLACE VIEW upcoming_reservations AS
SELECT r.reservations_id, r.workspace_id, r.customer_name, r.start_time, r.end_time, r.status
FROM reservations r
WHERE r.start_time >= now() AND r.start_time < now() + interval '7 days'
ORDER BY r.start_time ASC;

COMMIT;
