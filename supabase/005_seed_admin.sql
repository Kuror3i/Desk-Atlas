-- ============================================================================
-- DeskAtlas - 005_seed_admin.sql
-- Default Business Settings Seed & Admin Account Initialization
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. Default Business Settings Seed
-- ----------------------------------------------------------------------------

INSERT INTO public.business_settings (
  id,
  business_name,
  timezone,
  booking_interval_minutes,
  payment_expiry_minutes,
  kiosk_timeout_minutes,
  landing_preview_photos
) VALUES (
  1,
  'DeskAtlas Manila',
  'Asia/Manila',
  30,
  60,
  5,
  '[]'::jsonb
) ON CONFLICT (id) DO UPDATE
SET
  business_name = EXCLUDED.business_name,
  timezone = EXCLUDED.timezone,
  booking_interval_minutes = EXCLUDED.booking_interval_minutes,
  payment_expiry_minutes = EXCLUDED.payment_expiry_minutes,
  kiosk_timeout_minutes = EXCLUDED.kiosk_timeout_minutes;

-- ----------------------------------------------------------------------------
-- 2. Create Admin Account in auth.users and public.staff_profiles
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
  IF btrim(v_admin_email) = '' OR btrim(v_admin_password) = '' OR btrim(v_admin_display_name) = '' THEN
    RAISE EXCEPTION 'Admin email, password, and display name cannot be blank';
  END IF;

  v_encrypted_pw := extensions.crypt(v_admin_password::text, extensions.gen_salt('bf'::text));

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
    UPDATE auth.users
    SET
      encrypted_password = v_encrypted_pw,
      email_confirmed_at = COALESCE(email_confirmed_at, now()),
      raw_user_meta_data = jsonb_build_object('display_name', v_admin_display_name, 'role', 'ADMIN'),
      updated_at = now()
    WHERE id = v_user_id;

    RAISE NOTICE 'Updated existing auth.users record for % with ID %', v_admin_email, v_user_id;
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
