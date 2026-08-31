-- ============================================================================
-- DeskAtlas - 006_seed_staff.sql
-- Default Staff Account Initialization
-- ============================================================================

DO $$
DECLARE
  -- ==========================================================================
  -- >>> EDIT YOUR STAFF CREDENTIALS HERE <<<
  -- ==========================================================================
  v_staff_email text := 'staff@deskatlas.com';
  v_staff_password text := 'StaffPassword123!';
  v_staff_display_name text := 'Front Desk Staff';
  -- ==========================================================================

  v_user_id uuid;
  v_encrypted_pw text;
BEGIN
  IF btrim(v_staff_email) = '' OR btrim(v_staff_password) = '' OR btrim(v_staff_display_name) = '' THEN
    RAISE EXCEPTION 'Staff email, password, and display name cannot be blank';
  END IF;

  v_encrypted_pw := extensions.crypt(v_staff_password::text, extensions.gen_salt('bf'::text));

  SELECT id INTO v_user_id
  FROM auth.users
  WHERE email = lower(v_staff_email);

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
      lower(v_staff_email),
      v_encrypted_pw,
      now(),
      '{"provider": "email", "providers": ["email"]}'::jsonb,
      jsonb_build_object('display_name', v_staff_display_name, 'role', 'STAFF'),
      now(),
      now(),
      'authenticated',
      'authenticated',
      encode(gen_random_bytes(32), 'hex')
    );

    RAISE NOTICE 'Created auth.users record for % with ID %', v_staff_email, v_user_id;
  ELSE
    UPDATE auth.users
    SET
      encrypted_password = v_encrypted_pw,
      email_confirmed_at = COALESCE(email_confirmed_at, now()),
      raw_user_meta_data = jsonb_build_object('display_name', v_staff_display_name, 'role', 'STAFF'),
      updated_at = now()
    WHERE id = v_user_id;

    RAISE NOTICE 'Updated existing auth.users record for % with ID %', v_staff_email, v_user_id;
  END IF;

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
    'STAFF',
    v_staff_display_name,
    true,
    now(),
    now()
  )
  ON CONFLICT (user_id) DO UPDATE
  SET
    role = 'STAFF',
    display_name = EXCLUDED.display_name,
    is_active = true,
    updated_at = now();

  RAISE NOTICE 'Successfully configured staff_profiles for % as active STAFF', v_staff_email;
END $$;
