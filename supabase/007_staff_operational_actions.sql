CREATE OR REPLACE FUNCTION public.check_in_reservation(
  p_reservation_id uuid,
  p_actor_user_id uuid,
  p_acted_at timestamptz
)
RETURNS TABLE (
  reservation_id uuid,
  reservation_status public.reservation_status,
  checked_in_at timestamptz,
  checked_out_at timestamptz,
  reentry boolean
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_actor_role public.staff_role;
  v_reservation public.reservations%ROWTYPE;
  v_candidate public.reservation_candidates%ROWTYPE;
  v_reentry boolean := false;
BEGIN
  IF p_reservation_id IS NULL THEN
    RAISE EXCEPTION 'Reservation ID is required';
  END IF;

  IF p_actor_user_id IS NULL THEN
    RAISE EXCEPTION 'Actor user ID is required';
  END IF;

  IF p_acted_at IS NULL THEN
    RAISE EXCEPTION 'Action timestamp is required';
  END IF;

  SELECT role
    INTO v_actor_role
  FROM public.staff_profiles
  WHERE user_id = p_actor_user_id
    AND is_active = true;

  IF NOT FOUND OR v_actor_role NOT IN ('ADMIN', 'STAFF') THEN
    RAISE EXCEPTION 'Only active ADMIN or STAFF profiles may check in reservations';
  END IF;

  SELECT *
    INTO v_reservation
  FROM public.reservations
  WHERE id = p_reservation_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Reservation was not found';
  END IF;

  SELECT *
    INTO v_candidate
  FROM public.reservation_candidates
  WHERE reservation_id = v_reservation.id
    AND is_assigned = true
  LIMIT 1;

  IF v_candidate.id IS NULL THEN
    RAISE EXCEPTION 'Reservation has no assigned workspace to check in';
  END IF;

  IF v_reservation.status = 'CHECKED_IN' THEN
    v_reentry := true;
  ELSIF v_reservation.status <> 'CONFIRMED' THEN
    RAISE EXCEPTION 'Reservation is not in a check-in state';
  END IF;

  IF p_acted_at < v_candidate.start_at OR p_acted_at > v_candidate.end_at THEN
    RAISE EXCEPTION 'Reservation is not currently active for check-in';
  END IF;

  UPDATE public.reservations
  SET
    status = 'CHECKED_IN',
    checked_in_at = COALESCE(checked_in_at, p_acted_at),
    updated_at = p_acted_at
  WHERE id = v_reservation.id;

  INSERT INTO public.audit_logs (
    actor_user_id,
    actor_role,
    action,
    entity_type,
    entity_id,
    metadata
  )
  VALUES (
    p_actor_user_id,
    v_actor_role,
    'reservation_checked_in',
    'reservation',
    v_reservation.id,
    jsonb_build_object(
      'reentry', v_reentry,
      'workspace_instance_id', v_candidate.workspace_instance_id,
      'start_at', v_candidate.start_at,
      'end_at', v_candidate.end_at
    )
  );

  SELECT id, status, checked_in_at, checked_out_at
    INTO reservation_id, reservation_status, checked_in_at, checked_out_at
  FROM public.reservations
  WHERE id = v_reservation.id;

  reentry := v_reentry;
  RETURN NEXT;
END;
$$;

CREATE OR REPLACE FUNCTION public.check_out_reservation(
  p_reservation_id uuid,
  p_actor_user_id uuid,
  p_acted_at timestamptz
)
RETURNS TABLE (
  reservation_id uuid,
  reservation_status public.reservation_status,
  checked_in_at timestamptz,
  checked_out_at timestamptz
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_actor_role public.staff_role;
  v_reservation public.reservations%ROWTYPE;
BEGIN
  IF p_reservation_id IS NULL THEN
    RAISE EXCEPTION 'Reservation ID is required';
  END IF;

  IF p_actor_user_id IS NULL THEN
    RAISE EXCEPTION 'Actor user ID is required';
  END IF;

  IF p_acted_at IS NULL THEN
    RAISE EXCEPTION 'Action timestamp is required';
  END IF;

  SELECT role
    INTO v_actor_role
  FROM public.staff_profiles
  WHERE user_id = p_actor_user_id
    AND is_active = true;

  IF NOT FOUND OR v_actor_role NOT IN ('ADMIN', 'STAFF') THEN
    RAISE EXCEPTION 'Only active ADMIN or STAFF profiles may check out reservations';
  END IF;

  SELECT *
    INTO v_reservation
  FROM public.reservations
  WHERE id = p_reservation_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Reservation was not found';
  END IF;

  IF v_reservation.status = 'COMPLETED' THEN
    SELECT id, status, checked_in_at, checked_out_at
      INTO reservation_id, reservation_status, checked_in_at, checked_out_at
    FROM public.reservations
    WHERE id = v_reservation.id;

    RETURN NEXT;
  END IF;

  IF v_reservation.status <> 'CHECKED_IN' THEN
    RAISE EXCEPTION 'Reservation is not currently checked in';
  END IF;

  UPDATE public.reservations
  SET
    status = 'COMPLETED',
    checked_out_at = COALESCE(checked_out_at, p_acted_at),
    updated_at = p_acted_at
  WHERE id = v_reservation.id;

  INSERT INTO public.audit_logs (
    actor_user_id,
    actor_role,
    action,
    entity_type,
    entity_id,
    metadata
  )
  VALUES (
    p_actor_user_id,
    v_actor_role,
    'reservation_checked_out',
    'reservation',
    v_reservation.id,
    jsonb_build_object(
      'checked_in_at', v_reservation.checked_in_at,
      'checked_out_at', p_acted_at
    )
  );

  SELECT id, status, checked_in_at, checked_out_at
    INTO reservation_id, reservation_status, checked_in_at, checked_out_at
  FROM public.reservations
  WHERE id = v_reservation.id;

  RETURN NEXT;
END;
$$;

REVOKE ALL ON FUNCTION public.check_in_reservation(uuid, uuid, timestamptz) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.check_in_reservation(uuid, uuid, timestamptz) FROM anon;
REVOKE ALL ON FUNCTION public.check_in_reservation(uuid, uuid, timestamptz) FROM authenticated;
GRANT EXECUTE ON FUNCTION public.check_in_reservation(uuid, uuid, timestamptz) TO service_role;

REVOKE ALL ON FUNCTION public.check_out_reservation(uuid, uuid, timestamptz) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.check_out_reservation(uuid, uuid, timestamptz) FROM anon;
REVOKE ALL ON FUNCTION public.check_out_reservation(uuid, uuid, timestamptz) FROM authenticated;
GRANT EXECUTE ON FUNCTION public.check_out_reservation(uuid, uuid, timestamptz) TO service_role;
