-- ============================================================================
-- Migration 013: Kiosk "You Are Here" Marker Constraint & Index
-- ============================================================================
-- Purpose:
--   Supports PRD-F17 (Kiosk Map - "You Are Here" Marker).
--   Ensures at most one Kiosk You-Are-Here marker can exist per floor map version.
--   Marker uses element_role = 'INFORMATION', element_type = 'KIOSK_YOU_ARE_HERE',
--   and is non-bookable (workspace_instance_id IS NULL).
-- ============================================================================

CREATE UNIQUE INDEX IF NOT EXISTS uq_map_elements_kiosk_marker
  ON public.map_elements(map_version_id)
  WHERE element_type = 'KIOSK_YOU_ARE_HERE';

COMMENT ON INDEX public.uq_map_elements_kiosk_marker IS
  'Ensures at most one Kiosk You-Are-Here marker can exist per floor map version (PRD-F17).';
