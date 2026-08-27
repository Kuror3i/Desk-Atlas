BEGIN;

CREATE OR REPLACE FUNCTION public.approve_online_payment_and_allocate(
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

  IF NOT FOUND OR v_actor_role <> 'ADMIN' OR v_actor_active IS DISTINCT FROM true THEN
    RAISE EXCEPTION 'Only an active ADMIN may approve online payment proof';
  END IF;

  SELECT *
    INTO v_attempt
  FROM public.payment_attempts
  WHERE id = p_payment_attempt_id
    AND channel = 'WEB'
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Online payment attempt % was not found', p_payment_attempt_id;
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
  ELSIF v_attempt.status <> 'UNDER_REVIEW' THEN
    RAISE EXCEPTION 'Payment attempt % is not in an approvable review state', p_payment_attempt_id;
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
      'ADMIN',
      'payment_review_completed',
      'payment_attempt',
      v_attempt.id,
      jsonb_build_object(
        'decision', 'APPROVE',
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

CREATE OR REPLACE FUNCTION public.reject_online_payment_attempt(
  p_payment_attempt_id uuid,
  p_processed_by_user_id uuid,
  p_processed_at timestamptz,
  p_rejection_reason text
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

  IF p_rejection_reason IS NULL OR btrim(p_rejection_reason) = '' THEN
    RAISE EXCEPTION 'rejection_reason is required';
  END IF;

  SELECT role, is_active
    INTO v_actor_role, v_actor_active
  FROM public.staff_profiles
  WHERE user_id = p_processed_by_user_id
  FOR UPDATE;

  IF NOT FOUND OR v_actor_role <> 'ADMIN' OR v_actor_active IS DISTINCT FROM true THEN
    RAISE EXCEPTION 'Only an active ADMIN may reject online payment proof';
  END IF;

  SELECT *
    INTO v_attempt
  FROM public.payment_attempts
  WHERE id = p_payment_attempt_id
    AND channel = 'WEB'
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Online payment attempt % was not found', p_payment_attempt_id;
  END IF;

  SELECT *
    INTO v_reservation
  FROM public.reservations
  WHERE id = v_attempt.reservation_id
  FOR UPDATE;

  IF v_attempt.status <> 'UNDER_REVIEW' AND v_attempt.status <> 'REJECTED' THEN
    RAISE EXCEPTION 'Payment attempt % is not in a rejectable review state', p_payment_attempt_id;
  END IF;

  IF v_attempt.status = 'UNDER_REVIEW' THEN
    UPDATE public.payment_attempts
    SET
      status = 'REJECTED',
      processed_by_user_id = p_processed_by_user_id,
      processed_at = p_processed_at,
      rejection_reason = btrim(p_rejection_reason)
    WHERE id = v_attempt.id;

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
      'ADMIN',
      'payment_review_completed',
      'payment_attempt',
      v_attempt.id,
      jsonb_build_object(
        'decision', 'REJECT',
        'reservation_id', v_reservation.id,
        'rejection_reason', btrim(p_rejection_reason)
      )
    );
  END IF;

  SELECT *
    INTO v_attempt
  FROM public.payment_attempts
  WHERE id = p_payment_attempt_id;

  payment_attempt_id := v_attempt.id;
  reservation_id := v_reservation.id;
  reservation_reference_code := v_reservation.reference_code;
  reservation_status := v_reservation.status;
  payment_status := v_attempt.status;
  refund_status := v_attempt.refund_status;
  assigned_candidate_id := NULL;
  assigned_candidate_rank := NULL;
  assigned_workspace_instance_id := NULL;
  assigned_start_at := NULL;
  assigned_end_at := NULL;
  rejection_reason := v_attempt.rejection_reason;
  processed_at := v_attempt.processed_at;
  processed_by_user_id := v_attempt.processed_by_user_id;
  RETURN NEXT;
END;
$$;

REVOKE ALL ON FUNCTION public.approve_online_payment_and_allocate(uuid, uuid, timestamptz) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.approve_online_payment_and_allocate(uuid, uuid, timestamptz) FROM anon;
REVOKE ALL ON FUNCTION public.approve_online_payment_and_allocate(uuid, uuid, timestamptz) FROM authenticated;
GRANT EXECUTE ON FUNCTION public.approve_online_payment_and_allocate(uuid, uuid, timestamptz) TO service_role;

REVOKE ALL ON FUNCTION public.reject_online_payment_attempt(uuid, uuid, timestamptz, text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.reject_online_payment_attempt(uuid, uuid, timestamptz, text) FROM anon;
REVOKE ALL ON FUNCTION public.reject_online_payment_attempt(uuid, uuid, timestamptz, text) FROM authenticated;
GRANT EXECUTE ON FUNCTION public.reject_online_payment_attempt(uuid, uuid, timestamptz, text) TO service_role;

COMMIT;
