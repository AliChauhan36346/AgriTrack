"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.LinkTrackerSchema = exports.TimelineQuerySchema = exports.SyncBatchSchema = exports.LocationPointSchema = void 0;
const zod_1 = require("zod");
exports.LocationPointSchema = zod_1.z.object({
    latitude: zod_1.z.number().min(-90).max(90),
    longitude: zod_1.z.number().min(-180).max(180),
    speed_kmh: zod_1.z.number().min(0).default(0),
    battery_level: zod_1.z.number().int().min(0).max(100).default(100),
    recorded_at: zod_1.z.string().datetime({ offset: true }).or(zod_1.z.string().regex(/^\d{4}-\d{2}-\d{2}T.*$/)),
});
exports.SyncBatchSchema = zod_1.z.object({
    officer_id: zod_1.z.string().uuid({ message: 'Invalid officer_id UUID format' }),
    source: zod_1.z.enum(['mobile_app', 'hardware_tracker']).default('mobile_app'),
    points: zod_1.z.array(exports.LocationPointSchema).min(1, { message: 'Points array must contain at least 1 coordinate' }),
});
exports.TimelineQuerySchema = zod_1.z.object({
    officer_id: zod_1.z.string().uuid({ message: 'Valid officer_id UUID is required' }),
    date: zod_1.z.string().regex(/^\d{4}-\d{2}-\d{2}$/, { message: 'Date must be formatted as YYYY-MM-DD' }),
});
exports.LinkTrackerSchema = zod_1.z.object({
    officer_id: zod_1.z.string().uuid({ message: 'Invalid officer_id UUID format' }),
    imei: zod_1.z.string().min(8).max(32, { message: 'IMEI must be between 8 and 32 characters' }),
});
