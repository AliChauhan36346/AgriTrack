-- ====================================================================
-- AgriRoute Multi-Device Real-Time Cloud Schema for Supabase
-- ====================================================================
-- Copy and paste this entire script into your Supabase SQL Editor and click "Run".
-- This sets up the database tables, enables Realtime WebSockets for live rider tracking,
-- and configures access permissions for both phones (Shop Owner & Field Officer).
-- ====================================================================

-- 1. Shop Owners Table
CREATE TABLE IF NOT EXISTS public.shop_owners (
  id TEXT PRIMARY KEY,
  shop_name TEXT NOT NULL,
  owner_name TEXT NOT NULL,
  phone TEXT NOT NULL UNIQUE,
  pin TEXT NOT NULL,
  city TEXT NOT NULL,
  email TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Field Officers Table (stores access codes, assigned territory, shift hours, and real-time GPS)
CREATE TABLE IF NOT EXISTS public.field_officers (
  id TEXT PRIMARY KEY,
  owner_id TEXT NOT NULL REFERENCES public.shop_owners(id) ON DELETE CASCADE,
  access_code TEXT NOT NULL UNIQUE,
  full_name TEXT NOT NULL,
  phone TEXT NOT NULL,
  assigned_territory TEXT NOT NULL,
  shift_start_time TEXT DEFAULT '09:00',
  shift_end_time TEXT DEFAULT '18:00',
  working_hours_display TEXT DEFAULT '09:00 AM - 06:00 PM',
  current_status TEXT DEFAULT 'offline',
  battery_level INTEGER DEFAULT 100,
  speed_kmh REAL DEFAULT 0,
  latitude DOUBLE PRECISION DEFAULT 30.1984,
  longitude DOUBLE PRECISION DEFAULT 71.4687,
  heading REAL DEFAULT 0,
  today_distance_km REAL DEFAULT 0,
  last_seen_at TEXT DEFAULT 'Just added',
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Location Breadcrumbs Table (stores GPS route history for playback)
CREATE TABLE IF NOT EXISTS public.location_breadcrumbs (
  id TEXT PRIMARY KEY,
  officer_id TEXT NOT NULL REFERENCES public.field_officers(id) ON DELETE CASCADE,
  latitude DOUBLE PRECISION NOT NULL,
  longitude DOUBLE PRECISION NOT NULL,
  speed_kmh REAL DEFAULT 0,
  recorded_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Enable Row Level Security (RLS) with open anon policies for the mobile app
ALTER TABLE public.shop_owners ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.field_officers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.location_breadcrumbs ENABLE ROW LEVEL SECURITY;

-- Allow mobile clients using the Supabase anon key to read and write
DROP POLICY IF EXISTS "Allow anon all on shop_owners" ON public.shop_owners;
CREATE POLICY "Allow anon all on shop_owners" 
  ON public.shop_owners 
  FOR ALL 
  TO anon 
  USING (true) 
  WITH CHECK (true);

DROP POLICY IF EXISTS "Allow anon all on field_officers" ON public.field_officers;
CREATE POLICY "Allow anon all on field_officers" 
  ON public.field_officers 
  FOR ALL 
  TO anon 
  USING (true) 
  WITH CHECK (true);

DROP POLICY IF EXISTS "Allow anon all on location_breadcrumbs" ON public.location_breadcrumbs;
CREATE POLICY "Allow anon all on location_breadcrumbs" 
  ON public.location_breadcrumbs 
  FOR ALL 
  TO anon 
  USING (true) 
  WITH CHECK (true);

-- 5. Enable Realtime Publications for live moving rider on Map
-- This allows Phone A (Owner) to receive instant WebSocket updates when Phone B (Field Officer) moves
ALTER PUBLICATION supabase_realtime ADD TABLE public.field_officers;

-- 6. Indexes for ultra-fast query performance
CREATE INDEX IF NOT EXISTS idx_field_officers_owner ON public.field_officers(owner_id);
CREATE INDEX IF NOT EXISTS idx_field_officers_code ON public.field_officers(access_code);
CREATE INDEX IF NOT EXISTS idx_breadcrumbs_officer ON public.location_breadcrumbs(officer_id);
