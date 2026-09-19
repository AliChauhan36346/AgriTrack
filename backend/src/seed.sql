-- ==============================================================================
-- AgriRoute Initial Pakistani Regional Seed Data
-- ==============================================================================

-- Insert Pakistani Agricultural Field Officers
INSERT INTO officers (id, full_name, phone, assigned_territory, current_status, battery_level, last_seen_at, last_location)
VALUES 
  (
    'a1111111-1111-1111-1111-111111111111',
    'Muhammad Tariq',
    '+92 300 1234567',
    'Multan Cotton & Wheat Zone',
    'active',
    84,
    NOW() - INTERVAL '2 minutes',
    ST_SetSRID(ST_MakePoint(71.4687, 30.1984), 4326)
  ),
  (
    'a2222222-2222-2222-2222-222222222222',
    'Zahid Mehmood',
    '+92 321 7654321',
    'Faisalabad Crop Circle',
    'stationary',
    62,
    NOW() - INTERVAL '8 minutes',
    ST_SetSRID(ST_MakePoint(73.0791, 31.4187), 4326)
  ),
  (
    'a3333333-3333-3333-3333-333333333333',
    'Farhan Ali',
    '+92 333 4567890',
    'Sahiwal Dairy & Maize Belt',
    'offline',
    18,
    NOW() - INTERVAL '45 minutes',
    ST_SetSRID(ST_MakePoint(73.1068, 30.6682), 4326)
  ),
  (
    'a4444444-4444-4444-4444-444444444444',
    'Kamran Shahzad',
    '+92 302 9876543',
    'Rahim Yar Khan Sugar Belt',
    'active',
    92,
    NOW() - INTERVAL '1 minute',
    ST_SetSRID(ST_MakePoint(70.2989, 28.4212), 4326)
  )
ON CONFLICT (id) DO NOTHING;

-- Insert Hardware GPS Trackers
INSERT INTO hardware_trackers (id, imei, assigned_officer_id, is_active)
VALUES
  ('b1111111-1111-1111-1111-111111111111', '864209041284719', 'a1111111-1111-1111-1111-111111111111', true),
  ('b2222222-2222-2222-2222-222222222222', '864209041284727', 'a4444444-4444-4444-4444-444444444444', true)
ON CONFLICT (imei) DO NOTHING;
