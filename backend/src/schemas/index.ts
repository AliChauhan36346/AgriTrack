import { z } from 'zod';

export const LocationPointSchema = z.object({
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  speed_kmh: z.number().min(0).default(0),
  battery_level: z.number().int().min(0).max(100).default(100),
  recorded_at: z.string().datetime({ offset: true }).or(z.string().regex(/^\d{4}-\d{2}-\d{2}T.*$/)),
});

export const SyncBatchSchema = z.object({
  officer_id: z.string().uuid({ message: 'Invalid officer_id UUID format' }),
  source: z.enum(['mobile_app', 'hardware_tracker']).default('mobile_app'),
  points: z.array(LocationPointSchema).min(1, { message: 'Points array must contain at least 1 coordinate' }),
});

export const TimelineQuerySchema = z.object({
  officer_id: z.string().uuid({ message: 'Valid officer_id UUID is required' }),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, { message: 'Date must be formatted as YYYY-MM-DD' }),
});

export const LinkTrackerSchema = z.object({
  officer_id: z.string().uuid({ message: 'Invalid officer_id UUID format' }),
  imei: z.string().min(8).max(32, { message: 'IMEI must be between 8 and 32 characters' }),
});

export type SyncBatchPayload = z.infer<typeof SyncBatchSchema>;
export type TimelineQueryParams = z.infer<typeof TimelineQuerySchema>;
export type LinkTrackerPayload = z.infer<typeof LinkTrackerSchema>;
