-- ============================================================================
-- DeskAtlas - Staff Management RPCs & Audit Logging
-- 
-- Milestone: MF-08 (PRD-F13)
-- Scope: Admin-only staff account creation, listing, updating, and deactivation
-- with full audit logging in public.audit_logs.
-- ============================================================================

CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA extensions;

-- ----------------------------------------------------------------------------
-- 1. List Staff Members RPC
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.admin_list_staff(
  p_actor_user_id uuid DEFAULT NULL
)
RETURNS TABLE (
  id uuid,
  email text,
  role public.staff_role,
  display_name text,
  is_active boolean,
  created_at timestamptz,
  updated_at timestamptz,
  last_sign_in_at timestamptz
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth, extensions
AS $$
BEGIN
  -- If actor ID provided, verify caller is an active ADMIN
  IF p_actor_user_id IS NOT NULL THEN
    IF NOT EXISTS (
      SELECT 1 FROM public.staff_profiles
      WHERE user_id = p_actor_user_id
        AND role = 'ADMIN'
        AND is_active = true
    ) THEN
      RAISE EXCEPTION 'Only active ADMIN profiles may view staff management';
    END IF;
  END IF;

  RETURN QUERY
  SELECT
    p.user_id AS id,
    COALESCE(u.email, 'unknown@deskatlas.com')::text AS email,
    p.role,
    p.display_name,
    p.is_active,
    p.created_at,
    p.updated_at,
    u.last_sign_in_at
  FROM public.staff_profiles p
  LEFT JOIN auth.users u ON u.id = p.user_id
  ORDER BY p.created_at ASC;
END;
$$;

REVOKE ALL ON FUNCTION public.admin_list_staff(uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.admin_list_staff(uuid) FROM anon;
REVOKE ALL ON FUNCTION public.admin_list_staff(uuid) FROM authenticated;
GRANT EXECUTE ON FUNCTION public.admin_list_staff(uuid) TO service_role;

-- ----------------------------------------------------------------------------
-- 2. Create Staff Account RPC
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.admin_create_staff(
  p_actor_user_id uuid,
  p_email text,
  p_password text,
  p_display_name text,
  p_role public.staff_role
)
RETURNS TABLE (
  id uuid,
  email text,
  role public.staff_role,
  display_name text,
  is_active boolean,
  created_at timestamptz,
  updated_at timestamptz,
  last_sign_in_at timestamptz
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth, extensions
AS $$
DECLARE
  v_trimmed_email text;
  v_trimmed_name text;
  v_new_user_id uuid;
  v_encrypted_pw text;
BEGIN
  -- Verify actor is an active ADMIN
  IF p_actor_user_id IS NOT NULL THEN
    IF NOT EXISTS (
      SELECT 1 FROM public.staff_profiles
      WHERE user_id = p_actor_user_id
        AND role = 'ADMIN'
        AND is_active = true
    ) THEN
      RAISE EXCEPTION 'Only active ADMIN profiles may create staff accounts';
    END IF;
  END IF;

  v_trimmed_email := lower(btrim(p_email));
  v_trimmed_name := btrim(p_display_name);

  IF v_trimmed_email = '' OR position('@' in v_trimmed_email) = 0 THEN
    RAISE EXCEPTION 'A valid email address is required';
  END IF;

  IF v_trimmed_name = '' THEN
    RAISE EXCEPTION 'Display name cannot be blank';
  END IF;

  IF p_password IS NULL OR length(p_password) < 6 THEN
    RAISE EXCEPTION 'Password must be at least 6 characters long';
  END IF;

  IF p_role NOT IN ('ADMIN', 'STAFF') THEN
    RAISE EXCEPTION 'Role must be either ADMIN or STAFF';
  END IF;

  -- Check duplicate email in auth.users
  IF EXISTS (SELECT 1 FROM auth.users WHERE email = v_trimmed_email) THEN
    RAISE EXCEPTION 'A user with email % already exists', v_trimmed_email;
  END IF;

  v_new_user_id := gen_random_uuid();
  v_encrypted_pw := extensions.crypt(p_password::text, extensions.gen_salt('bf'::text));

  -- Insert auth.users record
  INSERT INTO auth.users (
    id,
    instance_id,
    email,
    encrypted_password,
    email_confirmed_at,
    raw_app_meta_data,
    raw_user_meta_data,
    created_at,
    updated_at,
    role,
    aud,
    confirmation_token
  )
  VALUES (
    v_new_user_id,
    '00000000-0000-0000-0000-000000000000',
    v_trimmed_email,
    v_encrypted_pw,
    now(),
    '{"provider": "email", "providers": ["email"]}'::jsonb,
    jsonb_build_object('display_name', v_trimmed_name, 'role', p_role::text),
    now(),
    now(),
    'authenticated',
    'authenticated',
    encode(gen_random_bytes(32), 'hex')
  );

  -- Insert public.staff_profiles record
  INSERT INTO public.staff_profiles (
    user_id,
    role,
    display_name,
    is_active,
    created_at,
    updated_at
  )
  VALUES (
    v_new_user_id,
    p_role,
    v_trimmed_name,
    true,
    now(),
    now()
  );

  -- Insert audit log if actor is provided
  IF p_actor_user_id IS NOT NULL THEN
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
      'ADMIN',
      'CREATE_STAFF_ACCOUNT',
      'staff_profiles',
      v_new_user_id,
      jsonb_build_object(
        'email', v_trimmed_email,
        'role', p_role::text,
        'display_name', v_trimmed_name
      )
    );
  END IF;

  RETURN QUERY
  SELECT
    p.user_id AS id,
    v_trimmed_email AS email,
    p.role,
    p.display_name,
    p.is_active,
    p.created_at,
    p.updated_at,
    NULL::timestamptz AS last_sign_in_at
  FROM public.staff_profiles p
  WHERE p.user_id = v_new_user_id;
END;
$$;

REVOKE ALL ON FUNCTION public.admin_create_staff(uuid, text, text, text, public.staff_role) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.admin_create_staff(uuid, text, text, text, public.staff_role) FROM anon;
REVOKE ALL ON FUNCTION public.admin_create_staff(uuid, text, text, text, public.staff_role) FROM authenticated;
GRANT EXECUTE ON FUNCTION public.admin_create_staff(uuid, text, text, text, public.staff_role) TO service_role;

-- ----------------------------------------------------------------------------
-- 3. Update Staff Account RPC
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.admin_update_staff(
  p_actor_user_id uuid,
  p_target_user_id uuid,
  p_display_name text DEFAULT NULL,
  p_role public.staff_role DEFAULT NULL,
  p_is_active boolean DEFAULT NULL,
  p_new_password text DEFAULT NULL
)
RETURNS TABLE (
  id uuid,
  email text,
  role public.staff_role,
  display_name text,
  is_active boolean,
  created_at timestamptz,
  updated_at timestamptz,
  last_sign_in_at timestamptz
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth, extensions
AS $$
DECLARE
  v_current_profile public.staff_profiles%ROWTYPE;
  v_action text := 'UPDATE_STAFF_ACCOUNT';
BEGIN
  -- Verify actor is an active ADMIN
  IF p_actor_user_id IS NOT NULL THEN
    IF NOT EXISTS (
      SELECT 1 FROM public.staff_profiles
      WHERE user_id = p_actor_user_id
        AND role = 'ADMIN'
        AND is_active = true
    ) THEN
      RAISE EXCEPTION 'Only active ADMIN profiles may manage staff accounts';
    END IF;
  END IF;

  SELECT * INTO v_current_profile
  FROM public.staff_profiles
  WHERE user_id = p_target_user_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Staff member not found';
  END IF;

  -- Validate display name if provided
  IF p_display_name IS NOT NULL AND btrim(p_display_name) = '' THEN
    RAISE EXCEPTION 'Display name cannot be blank';
  END IF;

  -- Update auth user password if new password is provided
  IF p_new_password IS NOT NULL AND btrim(p_new_password) <> '' THEN
    IF length(p_new_password) < 6 THEN
      RAISE EXCEPTION 'Password must be at least 6 characters long';
    END IF;
    UPDATE auth.users
    SET
      encrypted_password = extensions.crypt(p_new_password::text, extensions.gen_salt('bf'::text)),
      updated_at = now()
    WHERE id = p_target_user_id;
  END IF;

  -- Determine audit action description
  IF p_is_active IS NOT NULL AND p_is_active <> v_current_profile.is_active THEN
    IF p_is_active = false THEN
      v_action := 'DEACTIVATE_STAFF_ACCOUNT';
    ELSE
      v_action := 'REACTIVATE_STAFF_ACCOUNT';
    END IF;
  END IF;

  -- Update staff profile
  UPDATE public.staff_profiles
  SET
    display_name = COALESCE(btrim(p_display_name), display_name),
    role = COALESCE(p_role, role),
    is_active = COALESCE(p_is_active, is_active),
    updated_at = now()
  WHERE user_id = p_target_user_id;

  -- Insert audit log if actor is provided
  IF p_actor_user_id IS NOT NULL THEN
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
      'ADMIN',
      v_action,
      'staff_profiles',
      p_target_user_id,
      jsonb_build_object(
        'previous_role', v_current_profile.role::text,
        'new_role', COALESCE(p_role::text, v_current_profile.role::text),
        'previous_display_name', v_current_profile.display_name,
        'new_display_name', COALESCE(btrim(p_display_name), v_current_profile.display_name),
        'previous_is_active', v_current_profile.is_active,
        'new_is_active', COALESCE(p_is_active, v_current_profile.is_active),
        'password_changed', (p_new_password IS NOT NULL AND btrim(p_new_password) <> '')
      )
    );
  END IF;

  RETURN QUERY
  SELECT
    p.user_id AS id,
    COALESCE(u.email, 'unknown@deskatlas.com')::text AS email,
    p.role,
    p.display_name,
    p.is_active,
    p.created_at,
    p.updated_at,
    u.last_sign_in_at
  FROM public.staff_profiles p
  LEFT JOIN auth.users u ON u.id = p.user_id
  WHERE p.user_id = p_target_user_id;
END;
$$;

REVOKE ALL ON FUNCTION public.admin_update_staff(uuid, uuid, text, public.staff_role, boolean, text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.admin_update_staff(uuid, uuid, text, public.staff_role, boolean, text) FROM anon;
REVOKE ALL ON FUNCTION public.admin_update_staff(uuid, uuid, text, public.staff_role, boolean, text) FROM authenticated;
GRANT EXECUTE ON FUNCTION public.admin_update_staff(uuid, uuid, text, public.staff_role, boolean, text) TO service_role;
