"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const server_1 = require("./server");
const auth_1 = require("./middleware/auth");
const schemas_1 = require("./schemas");
async function runTests() {
    console.log('🧪 Starting AgriRoute Backend Automated Verification Suite...\n');
    let passed = 0;
    let failed = 0;
    function assert(condition, testName) {
        if (condition) {
            console.log(`✅ PASS: ${testName}`);
            passed++;
        }
        else {
            console.error(`❌ FAIL: ${testName}`);
            failed++;
        }
    }
    // 1. Zod Schemas Verification
    try {
        const validBatch = schemas_1.SyncBatchSchema.parse({
            officer_id: 'a1111111-1111-1111-1111-111111111111',
            source: 'mobile_app',
            points: [
                {
                    latitude: 30.7258,
                    longitude: 72.6465,
                    speed_kmh: 34.0,
                    battery_level: 82,
                    recorded_at: '2026-09-19T08:30:00Z',
                },
            ],
        });
        assert(validBatch.points.length === 1, 'SyncBatchSchema validates valid payload');
    }
    catch {
        assert(false, 'SyncBatchSchema validates valid payload');
    }
    try {
        schemas_1.SyncBatchSchema.parse({
            officer_id: 'invalid-uuid',
            points: [],
        });
        assert(false, 'SyncBatchSchema rejects invalid UUID and empty points');
    }
    catch {
        assert(true, 'SyncBatchSchema rejects invalid UUID and empty points');
    }
    try {
        const validTimeline = schemas_1.TimelineQuerySchema.parse({
            officer_id: 'a1111111-1111-1111-1111-111111111111',
            date: '2026-09-19',
        });
        assert(validTimeline.date === '2026-09-19', 'TimelineQuerySchema validates valid query');
    }
    catch {
        assert(false, 'TimelineQuerySchema validates valid query');
    }
    try {
        const validLink = schemas_1.LinkTrackerSchema.parse({
            officer_id: 'a1111111-1111-1111-1111-111111111111',
            imei: '864209041284719',
        });
        assert(validLink.imei === '864209041284719', 'LinkTrackerSchema validates valid IMEI');
    }
    catch {
        assert(false, 'LinkTrackerSchema validates valid IMEI');
    }
    // 2. JWT Generation Verification
    const token = (0, auth_1.generateToken)({
        id: 'a1111111-1111-1111-1111-111111111111',
        role: 'owner',
        name: 'Shop Owner',
    });
    assert(typeof token === 'string' && token.split('.').length === 3, 'JWT generateToken creates valid 3-part token');
    // 3. Express App Route Inspection
    const registeredRoutes = [];
    server_1.app._router.stack.forEach((middleware) => {
        if (middleware.route) {
            registeredRoutes.push(`${Object.keys(middleware.route.methods).join(',').toUpperCase()} ${middleware.route.path}`);
        }
        else if (middleware.name === 'router') {
            middleware.handle.stack.forEach((handler) => {
                if (handler.route) {
                    const basePath = middleware.regexp.source.includes('locations')
                        ? '/api/locations'
                        : middleware.regexp.source.includes('owner')
                            ? '/api/owner'
                            : '';
                    registeredRoutes.push(`${Object.keys(handler.route.methods).join(',').toUpperCase()} ${basePath}${handler.route.path}`);
                }
            });
        }
    });
    console.log('\nRegistered Routes:');
    registeredRoutes.forEach((r) => console.log(`  • ${r}`));
    assert(registeredRoutes.some((r) => r.includes('/api/locations/sync-batch')), 'POST /api/locations/sync-batch is mounted');
    assert(registeredRoutes.some((r) => r.includes('/api/owner/officers-live')), 'GET /api/owner/officers-live is mounted');
    assert(registeredRoutes.some((r) => r.includes('/api/owner/timeline')), 'GET /api/owner/timeline is mounted');
    assert(registeredRoutes.some((r) => r.includes('/api/owner/link-tracker')), 'POST /api/owner/link-tracker is mounted');
    console.log(`\n========================================`);
    console.log(`Tests: ${passed + failed} | Passed: ${passed} | Failed: ${failed}`);
    console.log(`========================================\n`);
    if (failed > 0) {
        process.exit(1);
    }
    else {
        process.exit(0);
    }
}
runTests();
