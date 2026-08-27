BEGIN;

CREATE OR REPLACE FUNCTION public.create_web_reservation_with_payment_session(
  p_first_name text,
  p_last_name text,
  p_email text,
  p_rate_snapshot numeric,
  p_amount_due numeric,
  p_candidates jsonb,
  p_token_hash text,
  p_expires_at timestamptz
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
  v_payment_attempt_id uuid;
BEGIN
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
    'WEB',
    p_first_name,
    p_last_name,
    p_email,
    'PENDING_PAYMENT',
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
    amount,
    status,
    token_hash,
    expires_at
  )
  VALUES (
    v_reservation.id,
    1,
    'WEB',
    p_amount_due,
    'PENDING',
    p_token_hash,
    p_expires_at
  )
  RETURNING id INTO v_payment_attempt_id;

  reservation_id := v_reservation.id;
  payment_attempt_id := v_payment_attempt_id;
  RETURN NEXT;
END;
$$;

CREATE OR REPLACE FUNCTION public.submit_web_payment_proof(
  p_token_hash text,
  p_payment_method_id uuid,
  p_proof_storage_path text,
  p_proof_submitted_at timestamptz
)
RETURNS TABLE (
  payment_attempt_id uuid,
  reservation_id uuid,
  reservation_status public.reservation_status,
  payment_status public.payment_status,
  proof_submitted_at timestamptz
)
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  v_attempt public.payment_attempts;
BEGIN
  SELECT *
  INTO v_attempt
  FROM public.payment_attempts
  WHERE token_hash = p_token_hash
    AND channel = 'WEB'
  LIMIT 1;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Invalid payment token';
  END IF;

  IF v_attempt.status <> 'PENDING' OR v_attempt.proof_submitted_at IS NOT NULL THEN
    RAISE EXCEPTION 'Payment proof already submitted or no longer pending';
  END IF;

  IF p_proof_submitted_at >= v_attempt.expires_at THEN
    UPDATE public.payment_attempts
    SET status = 'EXPIRED'
    WHERE id = v_attempt.id
      AND status = 'PENDING';

    UPDATE public.reservations
    SET status = 'EXPIRED'
    WHERE id = v_attempt.reservation_id
      AND status = 'PENDING_PAYMENT';

    RAISE EXCEPTION 'Payment session has expired';
  END IF;

  UPDATE public.payment_attempts
  SET
    payment_method_id = p_payment_method_id,
    proof_storage_path = p_proof_storage_path,
    proof_submitted_at = p_proof_submitted_at,
    status = 'UNDER_REVIEW'
  WHERE id = v_attempt.id;

  UPDATE public.reservations
  SET status = 'PAYMENT_UNDER_REVIEW'
  WHERE id = v_attempt.reservation_id;

  payment_attempt_id := v_attempt.id;
  reservation_id := v_attempt.reservation_id;
  reservation_status := 'PAYMENT_UNDER_REVIEW';
  payment_status := 'UNDER_REVIEW';
  proof_submitted_at := p_proof_submitted_at;
  RETURN NEXT;
END;
$$;

CREATE OR REPLACE FUNCTION public.expire_web_payment_session(
  p_token_hash text,
  p_expired_at timestamptz
)
RETURNS TABLE (
  payment_attempt_id uuid,
  reservation_id uuid
)
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  v_attempt public.payment_attempts;
BEGIN
  SELECT *
  INTO v_attempt
  FROM public.payment_attempts
  WHERE token_hash = p_token_hash
    AND channel = 'WEB'
  LIMIT 1;

  IF NOT FOUND THEN
    RETURN;
  END IF;

  IF v_attempt.status <> 'PENDING'
     OR v_attempt.proof_submitted_at IS NOT NULL
     OR p_expired_at < v_attempt.expires_at THEN
    RETURN;
  END IF;

  UPDATE public.payment_attempts
  SET status = 'EXPIRED'
  WHERE id = v_attempt.id;

  UPDATE public.reservations
  SET status = 'EXPIRED'
  WHERE id = v_attempt.reservation_id
    AND status = 'PENDING_PAYMENT';

  payment_attempt_id := v_attempt.id;
  reservation_id := v_attempt.reservation_id;
  RETURN NEXT;
END;
$$;

COMMIT;
