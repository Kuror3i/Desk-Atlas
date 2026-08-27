BEGIN;

CREATE OR REPLACE FUNCTION public.create_kiosk_reservation_with_counter_payment(
  p_first_name text,
  p_last_name text,
  p_email text,
  p_rate_snapshot numeric,
  p_amount_due numeric,
  p_candidates jsonb,
  p_payment_method_id uuid
)
RETURNS TABLE (
  reservation_id uuid,
  payment_attempt_id uuid
)
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  v_reservation public.reservations;
  v_candidate record;
  v_payment_method public.payment_methods%ROWTYPE;
  v_payment_attempt_id uuid;
BEGIN
  IF p_payment_method_id IS NULL THEN
    RAISE EXCEPTION 'payment_method_id is required';
  END IF;

  SELECT *
    INTO v_payment_method
  FROM public.payment_methods
  WHERE id = p_payment_method_id
    AND is_active = true
    AND allow_kiosk = true
  LIMIT 1;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Kiosk payment method % is not active or not kiosk-enabled', p_payment_method_id;
  END IF;

  INSERT INTO public.reservations (
    source,
    customer_first_name,
    customer_last_name,
    customer_email,
    status,
    rate_snapshot,
    amount_due
  )
  VALUES (
    'KIOSK',
    p_first_name,
    p_last_name,
    p_email,
    'PENDING_COUNTER_CONFIRMATION',
    p_rate_snapshot,
    p_amount_due
  )
  RETURNING * INTO v_reservation;

  FOR v_candidate IN
    SELECT * FROM jsonb_to_recordset(p_candidates) AS x(
      rank smallint,
      "workspaceInstanceId" uuid,
      "startAt" timestamptz,
      "endAt" timestamptz
    )
  LOOP
    INSERT INTO public.reservation_candidates (
      reservation_id,
      rank,
      workspace_instance_id,
      start_at,
      end_at,
      is_assigned
    )
    VALUES (
      v_reservation.id,
      v_candidate.rank,
      v_candidate."workspaceInstanceId",
      v_candidate."startAt",
      v_candidate."endAt",
      false
    );
  END LOOP;

  INSERT INTO public.payment_attempts (
    reservation_id,
    attempt_number,
    channel,
    payment_method_id,
    amount,
    status
  )
  VALUES (
    v_reservation.id,
    1,
    'KIOSK',
    p_payment_method_id,
    p_amount_due,
    'PENDING'
  )
  RETURNING id INTO v_payment_attempt_id;

  reservation_id := v_reservation.id;
  payment_attempt_id := v_payment_attempt_id;
  RETURN NEXT;
END;
$$;

CREATE OR REPLACE FUNCTION public.confirm_kiosk_payment_and_allocate(
  p_payment_attempt_id uuid,
  p_processed_by_user_id uuid,
  p_processed_at timestamptz
)
RETURNS TABLE (
  payment_attempt_id uuid,
  reservation_id uuid,
  reservation_reference_code text,
  reservation_status public.reservation_status,
  payment_status public.payment_status,
  refund_status public.refund_status,
  assigned_candidate_id uuid,
  assigned_candidate_rank smallint,
  assigned_workspace_instance_id uuid,
  assigned_start_at timestamptz,
  assigned_end_at timestamptz,
  rejection_reason text,
  processed_at timestamptz,
  processed_by_user_id uuid
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_actor_role public.staff_role;
  v_actor_active boolean;
  v_attempt public.payment_attempts%ROWTYPE;
  v_reservation public.reservations%ROWTYPE;
  v_candidate public.reservation_candidates%ROWTYPE;
  v_assigned_candidate public.reservation_candidates%ROWTYPE;
BEGIN
  IF p_payment_attempt_id IS NULL THEN
    RAISE EXCEPTION 'payment_attempt_id is required';
  END IF;

  IF p_processed_by_user_id IS NULL THEN
    RAISE EXCEPTION 'processed_by_user_id is required';
  END IF;

  IF p_processed_at IS NULL THEN
    RAISE EXCEPTION 'processed_at is required';
  END IF;

  SELECT role, is_active
    INTO v_actor_role, v_actor_active
  FROM public.staff_profiles
  WHERE user_id = p_processed_by_user_id
  FOR UPDATE;

  IF NOT FOUND OR v_actor_role NOT IN ('ADMIN', 'STAFF') OR v_actor_active IS DISTINCT FROM true THEN
    RAISE EXCEPTION 'Only an active ADMIN or STAFF may confirm kiosk counter payment';
  END IF;

  SELECT *
    INTO v_attempt
  FROM public.payment_attempts
  WHERE id = p_payment_attempt_id
    AND channel = 'KIOSK'
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Kiosk payment attempt % was not found', p_payment_attempt_id;
  END IF;

  SELECT *
    INTO v_reservation
  FROM public.reservations
  WHERE id = v_attempt.reservation_id
  FOR UPDATE;

  IF v_attempt.status = 'APPROVED' THEN
    SELECT *
      INTO v_assigned_candidate
    FROM public.reservation_candidates
    WHERE reservation_id = v_reservation.id
      AND is_assigned = true
    LIMIT 1;
  ELSIF v_attempt.status <> 'PENDING' THEN
    RAISE EXCEPTION 'Counter payment attempt % is not in a confirmable state', p_payment_attempt_id;
  ELSE
    FOR v_candidate IN
      SELECT *
      FROM public.reservation_candidates
      WHERE reservation_id = v_reservation.id
      ORDER BY rank ASC
      FOR UPDATE
    LOOP
      BEGIN
        UPDATE public.reservation_candidates
        SET is_assigned = true
        WHERE id = v_candidate.id;

        v_assigned_candidate := v_candidate;
        EXIT;
      EXCEPTION
        WHEN exclusion_violation THEN
          CONTINUE;
      END;
    END LOOP;

    UPDATE public.payment_attempts
    SET
      status = 'APPROVED',
      processed_by_user_id = p_processed_by_user_id,
      processed_at = p_processed_at,
      rejection_reason = NULL
    WHERE id = v_attempt.id;

    IF v_assigned_candidate.id IS NOT NULL THEN
      UPDATE public.reservations
      SET
        status = 'CONFIRMED',
        confirmed_at = COALESCE(confirmed_at, p_processed_at)
      WHERE id = v_reservation.id;
    ELSE
      UPDATE public.reservations
      SET status = 'NEEDS_MANUAL_RESOLUTION'
      WHERE id = v_reservation.id;
    END IF;

    INSERT INTO public.audit_logs (
      actor_user_id,
      actor_role,
      action,
      entity_type,
      entity_id,
      metadata
    )
    VALUES (
      p_processed_by_user_id,
      v_actor_role,
      'kiosk_payment_confirmed',
      'payment_attempt',
      v_attempt.id,
      jsonb_build_object(
        'reservation_id', v_reservation.id,
        'assigned_candidate_id', v_assigned_candidate.id,
        'assigned_candidate_rank', v_assigned_candidate.rank,
        'assigned_workspace_instance_id', v_assigned_candidate.workspace_instance_id,
        'manual_resolution_required', v_assigned_candidate.id IS NULL
      )
    );
  END IF;

  SELECT *
    INTO v_attempt
  FROM public.payment_attempts
  WHERE id = p_payment_attempt_id;

  SELECT *
    INTO v_reservation
  FROM public.reservations
  WHERE id = v_attempt.reservation_id;

  IF v_assigned_candidate.id IS NULL THEN
    SELECT *
      INTO v_assigned_candidate
    FROM public.reservation_candidates
    WHERE reservation_id = v_reservation.id
      AND is_assigned = true
    LIMIT 1;
  END IF;

  payment_attempt_id := v_attempt.id;
  reservation_id := v_reservation.id;
  reservation_reference_code := v_reservation.reference_code;
  reservation_status := v_reservation.status;
  payment_status := v_attempt.status;
  refund_status := v_attempt.refund_status;
  assigned_candidate_id := v_assigned_candidate.id;
  assigned_candidate_rank := v_assigned_candidate.rank;
  assigned_workspace_instance_id := v_assigned_candidate.workspace_instance_id;
  assigned_start_at := v_assigned_candidate.start_at;
  assigned_end_at := v_assigned_candidate.end_at;
  rejection_reason := v_attempt.rejection_reason;
  processed_at := v_attempt.processed_at;
  processed_by_user_id := v_attempt.processed_by_user_id;
  RETURN NEXT;
END;
$$;

REVOKE ALL ON FUNCTION public.confirm_kiosk_payment_and_allocate(uuid, uuid, timestamptz) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.confirm_kiosk_payment_and_allocate(uuid, uuid, timestamptz) FROM anon;
REVOKE ALL ON FUNCTION public.confirm_kiosk_payment_and_allocate(uuid, uuid, timestamptz) FROM authenticated;
GRANT EXECUTE ON FUNCTION public.confirm_kiosk_payment_and_allocate(uuid, uuid, timestamptz) TO service_role;

COMMIT;
