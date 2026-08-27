-- Migration 003: Reservation Creation RPC
-- Ensures atomic insert of a reservation and its candidates without holding inventory

BEGIN;

CREATE OR REPLACE FUNCTION public.create_reservation(
    p_source public.reservation_source,
    p_first_name text,
    p_last_name text,
    p_email text,
    p_rate_snapshot numeric,
    p_amount_due numeric,
    p_candidates jsonb
)
RETURNS public.reservations
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
    v_reservation public.reservations;
    v_status public.reservation_status;
    v_candidate record;
BEGIN
    -- Determine initial status based on source
    IF p_source = 'WEB' THEN
        v_status := 'PENDING_PAYMENT';
    ELSE
        v_status := 'PENDING_COUNTER_CONFIRMATION';
    END IF;

    -- Insert the reservation
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
        p_source,
        p_first_name,
        p_last_name,
        p_email,
        v_status,
        p_rate_snapshot,
        p_amount_due
    )
    RETURNING * INTO v_reservation;

    -- Insert candidates
    -- Expects p_candidates to be a JSON array of objects:
    -- { "rank": 0, "workspaceInstanceId": "uuid", "startAt": "iso-string", "endAt": "iso-string" }
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

    RETURN v_reservation;
END;
$$;

COMMIT;
