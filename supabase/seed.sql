-- seed.sql
-- Minimal seed data for DeskAtlas

-- Example workspace
INSERT INTO workspaces (workspace_id, name, capacity, price, layout_position, is_active)
VALUES
  ('11111111-1111-1111-1111-111111111111', 'Main Conference Room', 12, 120.00, 1, TRUE)
ON CONFLICT (workspace_id) DO NOTHING;

-- Example reservation
INSERT INTO reservations (reservations_id, workspace_id, customer_name, customer_email, start_time, end_time, status, reference_code, created_via)
VALUES
  ('22222222-2222-2222-2222-222222222222', '11111111-1111-1111-1111-111111111111', 'Jane Doe', 'jane@example.com', now() + interval '1 day', now() + interval '1 day' + interval '2 hours', 'confirmed', 'REF-1001', 'website')
ON CONFLICT (reservations_id) DO NOTHING;

-- Example payment proof
INSERT INTO payment_proofs (payment_proof_id, reservation_id, file_url, review_status)
VALUES
  ('33333333-3333-3333-3333-333333333333', '22222222-2222-2222-2222-222222222222', 'https://example.com/proofs/333.png', 'approved')
ON CONFLICT (payment_proof_id) DO NOTHING;

-- Example staff account
INSERT INTO staff_accounts (staff_account_id, auth_user_id, role, display_name)
VALUES
  ('44444444-4444-4444-4444-444444444444', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'admin', 'Alice Admin')
ON CONFLICT (staff_account_id) DO NOTHING;
