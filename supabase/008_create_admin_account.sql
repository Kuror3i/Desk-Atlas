-- ============================================================================
-- DeskAtlas - Admin Account Creation, Storage Initialization & Staff Auth RPC
-- 
-- Instructions:
-- 1. Edit the placeholder values below (v_admin_email, v_admin_password, v_admin_display_name).
-- 2. Run this script in the Supabase SQL Editor.
-- ============================================================================

CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA extensions;

-- ----------------------------------------------------------------------------
-- 1. Initialize Supabase Storage Bucket for Workspace Images
-- ----------------------------------------------------------------------------
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'workspace-images',
  'workspace-images',
  true,
  5242880, -- 5MB limit
  ARRAY['image/png', 'image/jpeg', 'image/jpg', 'image/webp']
)
ON CONFLICT (id) DO UPDATE
SET
  public = true,
  file_size_limit = 5242880,
  allowed_mime_types = ARRAY['image/png', 'image/jpeg', 'image/jpg', 'image/webp'];

-- Storage bucket access policies for workspace-images
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'Public Access for Workspace Images' AND tablename = 'objects'
  ) THEN
    CREATE POLICY "Public Access for Workspace Images"
      ON storage.objects FOR SELECT
      USING (bucket_id = 'workspace-images');
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'Allow service_role and authenticated upload' AND tablename = 'objects'
  ) THEN
    CREATE POLICY "Allow service_role and authenticated upload"
      ON storage.objects FOR INSERT
      WITH CHECK (bucket_id = 'workspace-images');
  END IF;
END $$;

-- ----------------------------------------------------------------------------
-- 2. Staff Authentication Verification RPC
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.verify_staff_login(
  p_email text,
  p_password text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth, extensions
AS $$
DECLARE
  v_user auth.users%ROWTYPE;
  v_profile public.staff_profiles%ROWTYPE;
BEGIN
  SELECT * INTO v_user
  FROM auth.users
  WHERE email = lower(btrim(p_email));

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Invalid email or password');
  END IF;

  -- Check bcrypt password hash with explicit schema and text casting
  IF v_user.encrypted_password IS NULL OR v_user.encrypted_password::text <> extensions.crypt(p_password::text, v_user.encrypted_password::text) THEN
    RETURN jsonb_build_object('success', false, 'error', 'Invalid email or password');
  END IF;

  -- Verify active staff/admin profile
  SELECT * INTO v_profile
  FROM public.staff_profiles
  WHERE user_id = v_user.id;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'No staff profile configured for this user');
  END IF;

  IF v_profile.is_active IS DISTINCT FROM true THEN
    RETURN jsonb_build_object('success', false, 'error', 'This account has been deactivated');
  END IF;

  RETURN jsonb_build_object(
    'success', true,
    'user', jsonb_build_object(
      'id', v_user.id,
      'email', v_user.email,
      'role', lower(v_profile.role::text),
      'displayName', v_profile.display_name
    )
  );
END;
$$;

REVOKE ALL ON FUNCTION public.verify_staff_login(text, text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.verify_staff_login(text, text) FROM anon;
REVOKE ALL ON FUNCTION public.verify_staff_login(text, text) FROM authenticated;
GRANT EXECUTE ON FUNCTION public.verify_staff_login(text, text) TO service_role;

-- ----------------------------------------------------------------------------
-- 3. Create Admin Account in auth.users and public.staff_profiles
-- ----------------------------------------------------------------------------
DO $$
DECLARE
  -- ==========================================================================
  -- >>> EDIT YOUR ADMIN CREDENTIALS HERE <<<
  -- ==========================================================================
  v_admin_email text := 'admin@deskatlas.com';
  v_admin_password text := 'AdminPassword123!';
  v_admin_display_name text := 'Admin User';
  -- ==========================================================================

  v_user_id uuid;
  v_encrypted_pw text;
BEGIN
  -- Validate non-empty credentials
  IF btrim(v_admin_email) = '' OR btrim(v_admin_password) = '' OR btrim(v_admin_display_name) = '' THEN
    RAISE EXCEPTION 'Admin email, password, and display name cannot be blank';
  END IF;

  -- Generate bcrypt encrypted password hash using extensions.crypt
  v_encrypted_pw := extensions.crypt(v_admin_password::text, extensions.gen_salt('bf'::text));

  -- Check if user already exists in auth.users
  SELECT id INTO v_user_id
  FROM auth.users
  WHERE email = lower(v_admin_email);

  IF v_user_id IS NULL THEN
    v_user_id := gen_random_uuid();

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
      v_user_id,
      '00000000-0000-0000-0000-000000000000',
      lower(v_admin_email),
      v_encrypted_pw,
      now(),
      '{"provider": "email", "providers": ["email"]}'::jsonb,
      jsonb_build_object('display_name', v_admin_display_name, 'role', 'ADMIN'),
      now(),
      now(),
      'authenticated',
      'authenticated',
      encode(gen_random_bytes(32), 'hex')
    );

    RAISE NOTICE 'Created auth.users record for % with ID %', v_admin_email, v_user_id;
  ELSE
    -- Update existing user password and confirmed status
    UPDATE auth.users
    SET
      encrypted_password = v_encrypted_pw,
      email_confirmed_at = COALESCE(email_confirmed_at, now()),
      raw_user_meta_data = jsonb_build_object('display_name', v_admin_display_name, 'role', 'ADMIN'),
      updated_at = now()
    WHERE id = v_user_id;

    RAISE NOTICE 'Updated existing auth.users record for % with ID %', v_admin_email, v_user_id;
  END IF;

  -- Ensure staff_profiles record is linked and has ADMIN role
  INSERT INTO public.staff_profiles (
    user_id,
    role,
    display_name,
    is_active,
    created_at,
    updated_at
  )
  VALUES (
    v_user_id,
    'ADMIN',
    v_admin_display_name,
    true,
    now(),
    now()
  )
  ON CONFLICT (user_id) DO UPDATE
  SET
    role = 'ADMIN',
    display_name = EXCLUDED.display_name,
    is_active = true,
    updated_at = now();

  RAISE NOTICE 'Successfully configured staff_profiles for % as active ADMIN', v_admin_email;
END $$;
