-- Migration 012: Allow same-instance backup candidate with different start time (MF-34)
-- Replaces reservation_candidates_instance_unique with reservation_candidates_instance_time_unique

ALTER TABLE public.reservation_candidates
  DROP CONSTRAINT IF EXISTS reservation_candidates_instance_unique;

ALTER TABLE public.reservation_candidates
  DROP CONSTRAINT IF EXISTS reservation_candidates_instance_time_unique;

ALTER TABLE public.reservation_candidates
  ADD CONSTRAINT reservation_candidates_instance_time_unique
  UNIQUE (reservation_id, workspace_instance_id, start_at);
