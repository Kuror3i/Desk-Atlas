-- DeskAtlas M02 - Map draft/publish RPC
-- Adds the database-side atomic publish operation required by the map milestone.

CREATE OR REPLACE FUNCTION public.publish_map_version(
  p_draft_version_id uuid,
  p_published_by_user_id uuid
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_draft public.map_versions%ROWTYPE;
  v_floor public.floors%ROWTYPE;
  v_actor_role public.staff_role;
  v_actor_active boolean;
  v_previous_published_ids uuid[];
  v_result jsonb;
BEGIN
  IF p_published_by_user_id IS NULL THEN
    RAISE EXCEPTION 'published_by_user_id is required when publishing a map';
  END IF;

  SELECT role, is_active
    INTO v_actor_role, v_actor_active
  FROM public.staff_profiles
  WHERE user_id = p_published_by_user_id
  FOR UPDATE;

  --IF v_actor_role IS DISTINCT FROM 'ADMIN' OR v_actor_active IS DISTINCT FROM true THEN
  --  RAISE EXCEPTION 'Only an active ADMIN may publish a map version';
  --END IF;

  SELECT *
    INTO v_draft
  FROM public.map_versions
  WHERE id = p_draft_version_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Map draft version % does not exist', p_draft_version_id;
  END IF;

  IF v_draft.status <> 'DRAFT' THEN
    RAISE EXCEPTION 'Only a DRAFT map version can be published';
  END IF;

  SELECT *
    INTO v_floor
  FROM public.floors
  WHERE id = v_draft.floor_id
  FOR UPDATE;

  IF NOT FOUND OR v_floor.is_active IS DISTINCT FROM true THEN
    RAISE EXCEPTION 'Draft map version must belong to an active floor';
  END IF;

  PERFORM 1
  FROM public.map_elements e
  WHERE e.map_version_id = v_draft.id
    AND (
      e.x < 0
      OR e.y < 0
      OR e.width <= 0
      OR e.height <= 0
      OR e.x + e.width > v_draft.canvas_width
      OR e.y + e.height > v_draft.canvas_height
      OR e.rotation NOT IN (0, 90, 180, 270)
    )
  LIMIT 1;

  IF FOUND THEN
    RAISE EXCEPTION 'Draft contains invalid map geometry';
  END IF;

  PERFORM 1
  FROM public.map_elements e
  LEFT JOIN public.workspace_instances wi
    ON wi.id = e.workspace_instance_id
  WHERE e.map_version_id = v_draft.id
    AND e.element_role = 'WORKSPACE'
    AND (
      e.workspace_instance_id IS NULL
      OR wi.id IS NULL
      OR wi.floor_id <> v_draft.floor_id
      OR wi.operational_status = 'INACTIVE'
    )
  LIMIT 1;

  IF FOUND THEN
    RAISE EXCEPTION 'Draft contains an invalid bookable workspace placement';
  END IF;

  PERFORM e.workspace_instance_id
  FROM public.map_elements e
  WHERE e.map_version_id = v_draft.id
    AND e.workspace_instance_id IS NOT NULL
  GROUP BY e.workspace_instance_id
  HAVING count(*) > 1
  LIMIT 1;

  IF FOUND THEN
    RAISE EXCEPTION 'Draft contains duplicate workspace-instance placements';
  END IF;

  PERFORM 1
  FROM public.map_elements a
  JOIN public.map_elements b
    ON a.map_version_id = b.map_version_id
   AND a.id < b.id
  WHERE a.map_version_id = v_draft.id
    AND a.element_role = 'WORKSPACE'
    AND b.element_role = 'WORKSPACE'
    AND a.x < b.x + b.width
    AND a.x + a.width > b.x
    AND a.y < b.y + b.height
    AND a.y + a.height > b.y
  LIMIT 1;

  IF FOUND THEN
    RAISE EXCEPTION 'Draft contains overlapping bookable workspaces';
  END IF;

  PERFORM 1
  FROM public.map_elements workspace_element
  JOIN public.map_elements wall_element
    ON workspace_element.map_version_id = wall_element.map_version_id
   AND workspace_element.id <> wall_element.id
  WHERE workspace_element.map_version_id = v_draft.id
    AND workspace_element.element_role = 'WORKSPACE'
    AND wall_element.element_role = 'STRUCTURE'
    AND wall_element.element_type IN ('wall', 'divider')
    AND workspace_element.x < wall_element.x + wall_element.width
    AND workspace_element.x + workspace_element.width > wall_element.x
    AND workspace_element.y < wall_element.y + wall_element.height
    AND workspace_element.y + workspace_element.height > wall_element.y
  LIMIT 1;

  IF FOUND THEN
    RAISE EXCEPTION 'Draft contains a workspace conflicting with a wall/divider';
  END IF;

  WITH locked_published AS (
    SELECT id
    FROM public.map_versions
    WHERE floor_id = v_draft.floor_id
      AND status = 'PUBLISHED'
    FOR UPDATE
  )
  SELECT COALESCE(array_agg(id), ARRAY[]::uuid[])
    INTO v_previous_published_ids
  FROM locked_published;

  UPDATE public.map_versions
  SET status = 'ARCHIVED'
  WHERE id = ANY(v_previous_published_ids);

  UPDATE public.map_versions
  SET
    status = 'PUBLISHED',
    published_by_user_id = p_published_by_user_id,
    published_at = now()
  WHERE id = v_draft.id;

  INSERT INTO public.audit_logs (
    actor_user_id,
    actor_role,
    action,
    entity_type,
    entity_id,
    metadata
  )
  VALUES (
    p_published_by_user_id,
    'ADMIN',
    'map_published',
    'map_version',
    v_draft.id,
    jsonb_build_object(
      'floor_id', v_draft.floor_id,
      'archived_version_ids', v_previous_published_ids,
      'element_count', (
        SELECT count(*)
        FROM public.map_elements
        WHERE map_version_id = v_draft.id
      ),
      'workspace_instance_count', (
        SELECT count(*)
        FROM public.map_elements
        WHERE map_version_id = v_draft.id
          AND workspace_instance_id IS NOT NULL
      )
    )
  );

  SELECT jsonb_build_object(
    'floor', (
      SELECT to_jsonb(f)
      FROM public.floors f
      WHERE f.id = v_draft.floor_id
    ),
    'version', (
      SELECT to_jsonb(v)
      FROM public.map_versions v
      WHERE v.id = v_draft.id
    ),
    'elements', (
      SELECT COALESCE(jsonb_agg(to_jsonb(e) ORDER BY e.z_index, e.id), '[]'::jsonb)
      FROM public.map_elements e
      WHERE e.map_version_id = v_draft.id
    )
  )
    INTO v_result
  ;

  RETURN v_result;
END;
$$;

REVOKE ALL ON FUNCTION public.publish_map_version(uuid, uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.publish_map_version(uuid, uuid) FROM anon;
REVOKE ALL ON FUNCTION public.publish_map_version(uuid, uuid) FROM authenticated;
GRANT EXECUTE ON FUNCTION public.publish_map_version(uuid, uuid) TO service_role;
