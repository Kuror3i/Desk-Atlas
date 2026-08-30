-- ============================================================================
-- Migration 014: Production Authentication, Authorization, & RLS Security Gate
-- ============================================================================
-- Milestone: M17 — Authentication & Final Security Gate
--
-- Invariants enforced:
-- 1. Guest-first customer flows operate without customer accounts.
-- 2. Staff and Admin accounts require active staff_profiles records.
-- 3. Anonymous users cannot access draft maps, staff profiles, raw audit logs,
--    or direct payment-proof storage objects.
-- 4. Payment proof storage bucket is private; Admin accesses via signed URLs.
-- 5. Staff access is restricted to operational actions (check-in/out, QR scan,
--    kiosk payment confirmation); Admin retains full system authority.
-- ============================================================================

-- Helper functions for RLS role resolution
CREATE OR REPLACE FUNCTION public.current_actor_role()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
AS $$
DECLARE
  v_role TEXT;
BEGIN
  IF auth.uid() IS NULL THEN
    RETURN 'ANON';
  END IF;

  SELECT role INTO v_role
  FROM public.staff_profiles
  WHERE user_id = auth.uid() AND is_active = TRUE;

  RETURN COALESCE(v_role, 'ANON');
END;
$$;

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
AS $$
BEGIN
  RETURN (public.current_actor_role() = 'ADMIN');
END;
$$;

CREATE OR REPLACE FUNCTION public.is_staff_or_admin()
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
AS $$
DECLARE
  v_role TEXT := public.current_actor_role();
BEGIN
  RETURN (v_role = 'ADMIN' OR v_role = 'STAFF');
END;
$$;

-- 1. Table RLS: staff_profiles
ALTER TABLE public.staff_profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS p_staff_profiles_admin_all ON public.staff_profiles;
CREATE POLICY p_staff_profiles_admin_all ON public.staff_profiles
  FOR ALL
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS p_staff_profiles_self_read ON public.staff_profiles;
CREATE POLICY p_staff_profiles_self_read ON public.staff_profiles
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- 2. Table RLS: workspace_templates
ALTER TABLE public.workspace_templates ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS p_workspace_templates_public_read ON public.workspace_templates;
CREATE POLICY p_workspace_templates_public_read ON public.workspace_templates
  FOR SELECT
  TO public
  USING (is_active = TRUE OR public.is_staff_or_admin());

DROP POLICY IF EXISTS p_workspace_templates_admin_write ON public.workspace_templates;
CREATE POLICY p_workspace_templates_admin_write ON public.workspace_templates
  FOR ALL
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- 3. Table RLS: workspace_instances
ALTER TABLE public.workspace_instances ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS p_workspace_instances_public_read ON public.workspace_instances;
CREATE POLICY p_workspace_instances_public_read ON public.workspace_instances
  FOR SELECT
  TO public
  USING (TRUE);

DROP POLICY IF EXISTS p_workspace_instances_staff_update ON public.workspace_instances;
CREATE POLICY p_workspace_instances_staff_update ON public.workspace_instances
  FOR UPDATE
  TO authenticated
  USING (public.is_staff_or_admin())
  WITH CHECK (public.is_staff_or_admin());

DROP POLICY IF EXISTS p_workspace_instances_admin_all ON public.workspace_instances;
CREATE POLICY p_workspace_instances_admin_all ON public.workspace_instances
  FOR ALL
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- 4. Table RLS: floor_maps
ALTER TABLE public.floor_maps ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS p_floor_maps_public_read ON public.floor_maps;
CREATE POLICY p_floor_maps_public_read ON public.floor_maps
  FOR SELECT
  TO public
  USING (is_active = TRUE OR public.is_staff_or_admin());

DROP POLICY IF EXISTS p_floor_maps_admin_all ON public.floor_maps;
CREATE POLICY p_floor_maps_admin_all ON public.floor_maps
  FOR ALL
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- 5. Table RLS: map_versions
ALTER TABLE public.map_versions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS p_map_versions_public_published_read ON public.map_versions;
CREATE POLICY p_map_versions_public_published_read ON public.map_versions
  FOR SELECT
  TO public
  USING (status = 'PUBLISHED' OR public.is_admin());

DROP POLICY IF EXISTS p_map_versions_admin_all ON public.map_versions;
CREATE POLICY p_map_versions_admin_all ON public.map_versions
  FOR ALL
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- 6. Table RLS: map_elements
ALTER TABLE public.map_elements ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS p_map_elements_public_read ON public.map_elements;
CREATE POLICY p_map_elements_public_read ON public.map_elements
  FOR SELECT
  TO public
  USING (
    EXISTS (
      SELECT 1 FROM public.map_versions mv
      WHERE mv.id = map_elements.map_version_id
        AND (mv.status = 'PUBLISHED' OR public.is_admin())
    )
  );

DROP POLICY IF EXISTS p_map_elements_admin_all ON public.map_elements;
CREATE POLICY p_map_elements_admin_all ON public.map_elements
  FOR ALL
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- 7. Table RLS: reservations & candidates
ALTER TABLE public.reservations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reservation_candidates ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS p_reservations_insert_guest ON public.reservations;
CREATE POLICY p_reservations_insert_guest ON public.reservations
  FOR INSERT
  TO public
  WITH CHECK (TRUE);

DROP POLICY IF EXISTS p_reservations_staff_read ON public.reservations;
CREATE POLICY p_reservations_staff_read ON public.reservations
  FOR SELECT
  TO authenticated
  USING (public.is_staff_or_admin());

DROP POLICY IF EXISTS p_reservations_admin_all ON public.reservations;
CREATE POLICY p_reservations_admin_all ON public.reservations
  FOR ALL
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS p_candidates_insert_guest ON public.reservation_candidates;
CREATE POLICY p_candidates_insert_guest ON public.reservation_candidates
  FOR INSERT
  TO public
  WITH CHECK (TRUE);

DROP POLICY IF EXISTS p_candidates_staff_read ON public.reservation_candidates;
CREATE POLICY p_candidates_staff_read ON public.reservation_candidates
  FOR SELECT
  TO authenticated
  USING (public.is_staff_or_admin());

-- 8. Table RLS: payment_attempts
ALTER TABLE public.payment_attempts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS p_payment_attempts_insert_guest ON public.payment_attempts;
CREATE POLICY p_payment_attempts_insert_guest ON public.payment_attempts
  FOR INSERT
  TO public
  WITH CHECK (TRUE);

DROP POLICY IF EXISTS p_payment_attempts_staff_read ON public.payment_attempts;
CREATE POLICY p_payment_attempts_staff_read ON public.payment_attempts
  FOR SELECT
  TO authenticated
  USING (public.is_staff_or_admin());

DROP POLICY IF EXISTS p_payment_attempts_admin_all ON public.payment_attempts;
CREATE POLICY p_payment_attempts_admin_all ON public.payment_attempts
  FOR ALL
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- 9. Table RLS: audit_logs
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS p_audit_logs_admin_read ON public.audit_logs;
CREATE POLICY p_audit_logs_admin_read ON public.audit_logs
  FOR SELECT
  TO authenticated
  USING (public.is_admin());

DROP POLICY IF EXISTS p_audit_logs_insert_all ON public.audit_logs;
CREATE POLICY p_audit_logs_insert_all ON public.audit_logs
  FOR INSERT
  TO public
  WITH CHECK (TRUE);

-- 10. Table RLS: business_hours, business_closures, payment_methods
ALTER TABLE public.business_hours ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.business_closures ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_methods ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS p_business_hours_read ON public.business_hours;
CREATE POLICY p_business_hours_read ON public.business_hours FOR SELECT TO public USING (TRUE);

DROP POLICY IF EXISTS p_business_closures_read ON public.business_closures;
CREATE POLICY p_business_closures_read ON public.business_closures FOR SELECT TO public USING (TRUE);

DROP POLICY IF EXISTS p_payment_methods_read ON public.payment_methods;
CREATE POLICY p_payment_methods_read ON public.payment_methods FOR SELECT TO public USING (TRUE);

DROP POLICY IF EXISTS p_settings_admin_write_hours ON public.business_hours;
CREATE POLICY p_settings_admin_write_hours ON public.business_hours FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS p_settings_admin_write_closures ON public.business_closures;
CREATE POLICY p_settings_admin_write_closures ON public.business_closures FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS p_settings_admin_write_methods ON public.payment_methods;
CREATE POLICY p_settings_admin_write_methods ON public.payment_methods FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

-- 11. Storage Bucket Policies: payment-proofs (PRIVATE)
INSERT INTO storage.buckets (id, name, public)
VALUES ('payment-proofs', 'payment-proofs', FALSE)
ON CONFLICT (id) DO UPDATE SET public = FALSE;

DROP POLICY IF EXISTS p_storage_proofs_guest_insert ON storage.objects;
CREATE POLICY p_storage_proofs_guest_insert ON storage.objects
  FOR INSERT
  TO public
  WITH CHECK (bucket_id = 'payment-proofs');

DROP POLICY IF EXISTS p_storage_proofs_admin_read ON storage.objects;
CREATE POLICY p_storage_proofs_admin_read ON storage.objects
  FOR SELECT
  TO authenticated
  USING (bucket_id = 'payment-proofs' AND public.is_admin());

-- 12. Storage Bucket Policies: workspace-templates & payment-qr-codes (PUBLIC READ)
INSERT INTO storage.buckets (id, name, public)
VALUES ('workspace-templates', 'workspace-templates', TRUE)
ON CONFLICT (id) DO UPDATE SET public = TRUE;

INSERT INTO storage.buckets (id, name, public)
VALUES ('payment-qr-codes', 'payment-qr-codes', TRUE)
ON CONFLICT (id) DO UPDATE SET public = TRUE;

DROP POLICY IF EXISTS p_storage_templates_public_read ON storage.objects;
CREATE POLICY p_storage_templates_public_read ON storage.objects
  FOR SELECT
  TO public
  USING (bucket_id IN ('workspace-templates', 'payment-qr-codes'));

DROP POLICY IF EXISTS p_storage_templates_admin_write ON storage.objects;
CREATE POLICY p_storage_templates_admin_write ON storage.objects
  FOR ALL
  TO authenticated
  USING (bucket_id IN ('workspace-templates', 'payment-qr-codes') AND public.is_admin())
  WITH CHECK (bucket_id IN ('workspace-templates', 'payment-qr-codes') AND public.is_admin());
