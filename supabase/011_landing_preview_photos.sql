-- Migration 011: Landing Preview Photos for Business Settings
-- DeskAtlas Customer Landing Page Published Map Preview Carousel (MF-17)

ALTER TABLE public.business_settings
ADD COLUMN IF NOT EXISTS landing_preview_photos jsonb NOT NULL DEFAULT '[]'::jsonb;

-- Seed the initial singleton settings row (id = 1) if it doesn't exist yet
    INSERT INTO public.business_settings (
    id, business_name, timezone, booking_interval_minutes,
    payment_expiry_minutes, kiosk_timeout_minutes, landing_preview_photos
    ) VALUES (
    1, 'DeskAtlas Manila', 'Asia/Manila', 30, 60, 5, '[]'::jsonb
    ) ON CONFLICT (id) DO NOTHING;
