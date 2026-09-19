"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.locationsRouter = void 0;
const express_1 = require("express");
const db_1 = require("../db");
const schemas_1 = require("../schemas");
const validate_1 = require("../middleware/validate");
const auth_1 = require("../middleware/auth");
exports.locationsRouter = (0, express_1.Router)();
/**
 * POST /api/locations/sync-batch
 * Ingests a batch of telemetry coordinates from mobile app or hardware tracker,
 * bulk-inserts into location_breadcrumbs, and updates officer live position & status.
 */
exports.locationsRouter.post('/sync-batch', auth_1.authenticateJWT, (0, validate_1.validate)(schemas_1.SyncBatchSchema, 'body'), async (req, res, next) => {
    const { officer_id, source, points } = req.body;
    try {
        const insertedCount = await (0, db_1.withTransaction)(async (client) => {
            // 1. Build multi-row parameterized bulk insert
            const valueClauses = [];
            const params = [];
            let paramIdx = 1;
            for (const pt of points) {
                valueClauses.push(`($${paramIdx++}, $${paramIdx++}, ST_SetSRID(ST_MakePoint($${paramIdx++}, $${paramIdx++}), 4326), $${paramIdx++}, $${paramIdx++}, $${paramIdx++})`);
                params.push(officer_id, source, pt.longitude, pt.latitude, pt.speed_kmh, pt.battery_level, pt.recorded_at);
            }
            const insertQuery = `
          INSERT INTO location_breadcrumbs (
            officer_id, source, location, speed_kmh, battery_level, recorded_at
          ) VALUES ${valueClauses.join(', ')}
        `;
            await client.query(insertQuery, params);
            // 2. Identify the most recent point chronologically
            const sortedPoints = [...points].sort((a, b) => new Date(b.recorded_at).getTime() - new Date(a.recorded_at).getTime());
            const latestPoint = sortedPoints[0];
            // Determine dynamic status: 'active' if speed > 5 km/h, else 'stationary'
            const computedStatus = latestPoint.speed_kmh > 5 ? 'active' : 'stationary';
            // 3. Update the officers table with latest telemetry
            const updateOfficerQuery = `
          UPDATE officers
          SET 
            last_location = ST_SetSRID(ST_MakePoint($1, $2), 4326),
            battery_level = $3,
            last_seen_at = $4,
            current_status = $5
          WHERE id = $6
        `;
            await client.query(updateOfficerQuery, [
                latestPoint.longitude,
                latestPoint.latitude,
                latestPoint.battery_level,
                latestPoint.recorded_at,
                computedStatus,
                officer_id,
            ]);
            return points.length;
        });
        res.status(200).json({
            status: 'success',
            count: insertedCount,
        });
    }
    catch (error) {
        console.error('[Ingestion Error - POST /api/locations/sync-batch]:', error);
        res.status(500).json({
            error: 'Internal Server Error',
            message: 'Failed to process location batch transaction',
        });
    }
});
