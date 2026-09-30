-- ==============================================================================
-- AgriRoute PostGIS Master Database Schema & Migrations
-- Compatible with PostgreSQL 14+, PostGIS 3+, and Supabase
-- ==============================================================================

-- 1. Enable Required Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "postgis";

-- 2. Create Enumerated Check Constraints & Officers Table
CREATE TABLE IF NOT EXISTS officers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    access_code VARCHAR(16) UNIQUE,
    owner_id UUID,
    full_name VARCHAR(255) NOT NULL,
    phone VARCHAR(32) NOT NULL,
    assigned_territory VARCHAR(255) NOT NULL,
    current_status VARCHAR(20) NOT NULL DEFAULT 'offline' CHECK (current_status IN ('active', 'stationary', 'offline')),
    battery_level INTEGER DEFAULT 100 CHECK (battery_level >= 0 AND battery_level <= 100),
    last_seen_at TIMESTAMPTZ,
    last_location GEOGRAPHY(Point, 4326),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. Hardware GPS Trackers Table
CREATE TABLE IF NOT EXISTS hardware_trackers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    imei VARCHAR(32) NOT NULL UNIQUE,
    assigned_officer_id UUID REFERENCES officers(id) ON DELETE SET NULL,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. Location Breadcrumbs Ingestion Table (High-throughput spatial log)
CREATE TABLE IF NOT EXISTS location_breadcrumbs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    officer_id UUID NOT NULL REFERENCES officers(id) ON DELETE CASCADE,
    source VARCHAR(32) NOT NULL DEFAULT 'mobile_app' CHECK (source IN ('mobile_app', 'hardware_tracker')),
    location GEOGRAPHY(Point, 4326) NOT NULL,
    speed_kmh REAL DEFAULT 0,
    battery_level INTEGER CHECK (battery_level >= 0 AND battery_level <= 100),
    recorded_at TIMESTAMPTZ NOT NULL,
    synced_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ==============================================================================
-- Performance & Spatial Indexes
-- ==============================================================================

-- GIST Index on location breadcrumbs for rapid spatial radius & geofence queries
CREATE INDEX IF NOT EXISTS idx_location_breadcrumbs_location 
ON location_breadcrumbs USING GIST (location);

-- Composite B-Tree Index for chronological route reconstruction per officer
CREATE INDEX IF NOT EXISTS idx_location_breadcrumbs_officer_recorded_at 
ON location_breadcrumbs (officer_id, recorded_at ASC);

-- GIST Index on officers' latest location for live fleet map rendering
CREATE INDEX IF NOT EXISTS idx_officers_last_location 
ON officers USING GIST (last_location);

-- Index for fast IMEI lookup during hardware telemetry ingestion
CREATE INDEX IF NOT EXISTS idx_hardware_trackers_imei 
ON hardware_trackers (imei);

CREATE INDEX IF NOT EXISTS idx_hardware_trackers_officer 
ON hardware_trackers (assigned_officer_id);
