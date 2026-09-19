"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ownerRouter = void 0;
const express_1 = require("express");
const db_1 = require("../db");
const schemas_1 = require("../schemas");
const validate_1 = require("../middleware/validate");
const auth_1 = require("../middleware/auth");
exports.ownerRouter = (0, express_1.Router)();
// Apply JWT authentication to all owner endpoints
exports.ownerRouter.use(auth_1.authenticateJWT);
exports.ownerRouter.use((0, auth_1.requireRole)('owner'));
/**
 * GET /api/owner/officers-live
 * Returns all field officers with extracted GPS coords (ST_X, ST_Y),
 * dynamic offline calculation (> 20 min inactivity), and hardware tracker info.
 */
exports.ownerRouter.get('/officers-live', async (req, res, next) => {
    try {
        const sql = `
        SELECT
          o.id,
          o.full_name,
          o.phone,
          o.assigned_territory,
          CASE
            WHEN o.last_seen_at IS NULL OR o.last_seen_at < NOW() - INTERVAL '20 minutes' THEN 'offline'
            ELSE o.current_status
          END AS current_status,
          o.battery_level,
          o.last_seen_at,
          CASE 
            WHEN o.last_location IS NOT NULL THEN ST_Y(o.last_location::geometry) 
            ELSE NULL 
          END AS latitude,
          CASE 
            WHEN o.last_location IS NOT NULL THEN ST_X(o.last_location::geometry) 
            ELSE NULL 
          END AS longitude,
          ht.imei AS tracker_imei,
          CASE WHEN ht.id IS NOT NULL AND ht.is_active = true THEN true ELSE false END AS has_hardware_tracker,
          o.created_at
        FROM officers o
        LEFT JOIN hardware_trackers ht 
          ON ht.assigned_officer_id = o.id AND ht.is_active = true
        ORDER BY o.full_name ASC;
      `;
        const result = await (0, db_1.query)(sql);
        res.status(200).json({
            status: 'success',
            count: result.rowCount,
            officers: result.rows,
        });
    }
    catch (error) {
        console.error('[Error - GET /api/owner/officers-live]:', error);
        res.status(500).json({
            error: 'Internal Server Error',
            message: 'Failed to retrieve live officer fleet locations',
        });
    }
});
/**
 * GET /api/owner/timeline
 * Accepts `officer_id` and `date` (YYYY-MM-DD).
 * Returns:
 * 1. All chronological breadcrumbs
 * 2. Detected dwell stops where distance < 50m for >= 10 minutes (using PostGIS window functions & ST_Distance).
 */
exports.ownerRouter.get('/timeline', (0, validate_1.validate)(schemas_1.TimelineQuerySchema, 'query'), async (req, res, next) => {
    const { officer_id, date } = req.query;
    try {
        // Query 1: Chronological Breadcrumbs for the selected day
        const breadcrumbsSql = `
        SELECT
          id,
          officer_id,
          ST_Y(location::geometry) AS latitude,
          ST_X(location::geometry) AS longitude,
          speed_kmh,
          battery_level,
          source,
          recorded_at
        FROM location_breadcrumbs
        WHERE officer_id = $1
          AND recorded_at >= $2::TIMESTAMPTZ
          AND recorded_at < ($2::DATE + INTERVAL '1 day')::TIMESTAMPTZ
        ORDER BY recorded_at ASC;
      `;
        // Query 2: Spatial Stop Detection Window Functions
        // Detects points where officer moved < 50m for >= 10 consecutive minutes (600 seconds)
        const stopsSql = `
        WITH ordered_pings AS (
          SELECT
            id,
            officer_id,
            location,
            ST_Y(location::geometry) AS latitude,
            ST_X(location::geometry) AS longitude,
            recorded_at,
            LAG(location) OVER (ORDER BY recorded_at ASC) AS prev_location,
            LAG(recorded_at) OVER (ORDER BY recorded_at ASC) AS prev_time
          FROM location_breadcrumbs
          WHERE officer_id = $1
            AND recorded_at >= $2::TIMESTAMPTZ
            AND recorded_at < ($2::DATE + INTERVAL '1 day')::TIMESTAMPTZ
        ),
        step_clusters AS (
          SELECT
            *,
            CASE
              WHEN prev_location IS NULL THEN 0
              WHEN ST_Distance(location, prev_location) > 50 THEN 1
              ELSE 0
            END AS is_new_cluster
          FROM ordered_pings
        ),
        clustered_groups AS (
          SELECT
            *,
            SUM(is_new_cluster) OVER (ORDER BY recorded_at ASC) AS cluster_id
          FROM step_clusters
        ),
        dwell_stops AS (
          SELECT
            cluster_id,
            ROUND(AVG(latitude)::numeric, 6) AS latitude,
            ROUND(AVG(longitude)::numeric, 6) AS longitude,
            MIN(recorded_at) AS arrived_at,
            MAX(recorded_at) AS departed_at,
            ROUND(EXTRACT(EPOCH FROM (MAX(recorded_at) - MIN(recorded_at))) / 60) AS duration_minutes,
            COUNT(*) AS ping_count
          FROM clustered_groups
          GROUP BY cluster_id
          HAVING EXTRACT(EPOCH FROM (MAX(recorded_at) - MIN(recorded_at))) >= 600
        )
        SELECT
          latitude,
          longitude,
          arrived_at,
          departed_at,
          duration_minutes
        FROM dwell_stops
        ORDER BY arrived_at ASC;
      `;
        const [breadcrumbsResult, stopsResult] = await Promise.all([
            (0, db_1.query)(breadcrumbsSql, [officer_id, date]),
            (0, db_1.query)(stopsSql, [officer_id, date]),
        ]);
        res.status(200).json({
            officer_id,
            date,
            breadcrumbs: breadcrumbsResult.rows,
            stops: stopsResult.rows,
        });
    }
    catch (error) {
        console.error('[Error - GET /api/owner/timeline]:', error);
        res.status(500).json({
            error: 'Internal Server Error',
            message: 'Failed to compute timeline and dwell stops for officer',
        });
    }
});
/**
 * POST /api/owner/link-tracker
 * Links or reassigns a hardware GPS tracker IMEI to a specified field officer.
 */
exports.ownerRouter.post('/link-tracker', (0, validate_1.validate)(schemas_1.LinkTrackerSchema, 'body'), async (req, res, next) => {
    const { officer_id, imei } = req.body;
    try {
        const tracker = await (0, db_1.withTransaction)(async (client) => {
            // 1. Verify that the officer exists
            const officerCheck = await client.query('SELECT id, full_name FROM officers WHERE id = $1', [
                officer_id,
            ]);
            if (officerCheck.rowCount === 0) {
                throw new Error('Officer not found');
            }
            // 2. Upsert the tracker IMEI assignment
            const upsertQuery = `
          INSERT INTO hardware_trackers (imei, assigned_officer_id, is_active, updated_at)
          VALUES ($1, $2, true, NOW())
          ON CONFLICT (imei) DO UPDATE
          SET 
            assigned_officer_id = EXCLUDED.assigned_officer_id,
            is_active = true,
            updated_at = NOW()
          RETURNING id, imei, assigned_officer_id, is_active, updated_at;
        `;
            const result = await client.query(upsertQuery, [imei, officer_id]);
            return result.rows[0];
        });
        res.status(200).json({
            status: 'success',
            message: 'Hardware tracker paired successfully',
            tracker,
        });
    }
    catch (error) {
        if (error.message === 'Officer not found') {
            res.status(404).json({ error: 'Not Found', message: 'Specified officer does not exist' });
            return;
        }
        console.error('[Error - POST /api/owner/link-tracker]:', error);
        res.status(500).json({
            error: 'Internal Server Error',
            message: 'Failed to pair hardware tracker',
        });
    }
});
