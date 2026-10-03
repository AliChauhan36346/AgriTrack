import { createClient } from '@supabase/supabase-js';
import { SUPABASE_URL, SUPABASE_ANON_KEY } from '../config/supabaseConfig';
import { FieldOfficer, ShopOwnerAccount } from '../types';

export const isSupabaseConfigured = (): boolean => {
  return (
    Boolean(SUPABASE_URL) &&
    !SUPABASE_URL.includes('YOUR_PROJECT_ID') &&
    Boolean(SUPABASE_ANON_KEY) &&
    !SUPABASE_ANON_KEY.includes('YOUR_SUPABASE_ANON_KEY')
  );
};

export const supabase = createClient(
  isSupabaseConfigured() ? SUPABASE_URL : 'https://placeholder.supabase.co',
  isSupabaseConfigured() ? SUPABASE_ANON_KEY : 'placeholder-anon-key',
  {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  }
);

/**
 * Register or sync Shop Owner account to Supabase
 */
export async function syncOwnerToSupabase(owner: ShopOwnerAccount): Promise<boolean> {
  if (!isSupabaseConfigured()) return false;

  try {
    const { error } = await supabase.from('shop_owners').upsert({
      id: owner.id,
      shop_name: owner.shopName,
      owner_name: owner.ownerName,
      phone: owner.phone,
      pin: owner.pin,
      city: owner.city,
      email: owner.email ?? null,
      created_at: owner.createdAt || new Date().toISOString(),
    });

    if (error) {
      console.warn('[Supabase] syncOwner error:', error.message);
      return false;
    }
    return true;
  } catch (err) {
    console.warn('[Supabase] syncOwner exception:', err);
    return false;
  }
}

/**
 * Register a newly created Field Officer to Supabase
 */
export async function syncOfficerToSupabase(officer: FieldOfficer): Promise<boolean> {
  if (!isSupabaseConfigured()) return false;

  try {
    const { error } = await supabase.from('field_officers').upsert({
      id: officer.id,
      owner_id: officer.ownerId,
      full_name: officer.fullName,
      phone: officer.phone,
      assigned_territory: officer.assignedTerritory,
      access_code: officer.accessCode.toUpperCase(),
      shift_start_time: officer.shiftStartTime || '09:00',
      shift_end_time: officer.shiftEndTime || '18:00',
      working_hours_display: officer.workingHoursDisplay || '09:00 AM - 06:00 PM',
      current_status: officer.currentStatus || 'offline',
      battery_level: officer.batteryLevel || 100,
      speed_kmh: officer.speedKmh || 0,
      latitude: officer.currentLocation?.latitude || 30.1984,
      longitude: officer.currentLocation?.longitude || 71.4687,
      heading: officer.currentLocation?.heading || 0,
      today_distance_km: officer.todayDistanceKm || 0,
      last_seen_at: officer.lastSeenAt || 'Just added',
      updated_at: new Date().toISOString(),
    });

    if (error) {
      console.warn('[Supabase] syncOfficer error:', error.message);
      return false;
    }
    return true;
  } catch (err) {
    console.warn('[Supabase] syncOfficer exception:', err);
    return false;
  }
}

/**
 * Verify Field Officer Access Code on Phone B from Supabase Cloud
 */
export async function verifyAccessCodeInCloud(
  code: string
): Promise<{ success: boolean; officer?: FieldOfficer; error?: string }> {
  if (!isSupabaseConfigured()) {
    return { success: false, error: 'Cloud database not configured yet' };
  }

  try {
    const cleaned = code.trim().toUpperCase();
    const { data, error } = await supabase
      .from('field_officers')
      .select('*')
      .eq('access_code', cleaned)
      .maybeSingle();

    if (error) {
      return { success: false, error: error.message };
    }

    if (!data) {
      return {
        success: false,
        error: `کوڈ "${cleaned}" درست نہیں ہے (Access code not found in cloud)`,
      };
    }

    const officer: FieldOfficer = {
      id: data.id,
      ownerId: data.owner_id,
      fullName: data.full_name,
      name: data.full_name,
      roleTitle: 'Field Officer (فیلڈ آفیسر)',
      phone: data.phone,
      assignedTerritory: data.assigned_territory,
      accessCode: data.access_code,
      shiftStartTime: data.shift_start_time || '09:00',
      shiftEndTime: data.shift_end_time || '18:00',
      workingHoursDisplay: data.working_hours_display || '09:00 AM - 06:00 PM',
      currentStatus: (data.current_status as any) || 'active',
      status: (data.current_status as any) || 'active',
      batteryLevel: data.battery_level || 100,
      speedKmh: data.speed_kmh || 0,
      lastSeenAt: 'Just now (ابھی)',
      lastPingTime: 'Just now (ابھی)',
      currentLocation: {
        latitude: Number(data.latitude) || 30.1984,
        longitude: Number(data.longitude) || 71.4687,
        speed: data.speed_kmh || 0,
        heading: data.heading || 0,
        timestamp: Date.now(),
      },
      hasHardwareTracker: false,
      isCharging: false,
      todayDistanceKm: Number(data.today_distance_km) || 0,
      todayVisitsCount: 0,
      queuedPingsCount: 0,
    };

    return { success: true, officer };
  } catch (err: any) {
    return { success: false, error: err?.message || 'Network connection failed' };
  }
}

/**
 * Field Officer (Phone B) pushes live GPS coordinates & distance to Supabase Cloud
 */
export async function pushLocationUpdateToCloud(
  officerId: string,
  loc: { latitude: number; longitude: number; speed?: number; heading?: number },
  distanceDeltaKm: number
): Promise<void> {
  if (!isSupabaseConfigured()) return;

  try {
    // 1. Fetch current distance
    const { data: officer } = await supabase
      .from('field_officers')
      .select('today_distance_km')
      .eq('id', officerId)
      .maybeSingle();

    const currentKm = Number(officer?.today_distance_km) || 0;
    const newKm = Number((currentKm + distanceDeltaKm).toFixed(2));

    // 2. Update officer live record
    await supabase
      .from('field_officers')
      .update({
        latitude: loc.latitude,
        longitude: loc.longitude,
        speed_kmh: loc.speed || 0,
        heading: loc.heading || 0,
        today_distance_km: newKm,
        current_status: (loc.speed || 0) > 3 ? 'active' : 'stationary',
        last_seen_at: 'Just now (ابھی)',
        updated_at: new Date().toISOString(),
      })
      .eq('id', officerId);

    // 3. Insert historical breadcrumb
    await supabase.from('location_breadcrumbs').insert({
      id: `bc_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
      officer_id: officerId,
      latitude: loc.latitude,
      longitude: loc.longitude,
      speed_kmh: loc.speed || 0,
      recorded_at: new Date().toISOString(),
    });
  } catch (err) {
    console.warn('[Supabase] pushLocation error:', err);
  }
}

/**
 * Verify Shop Owner phone & PIN from Supabase Cloud
 */
export async function verifyOwnerInCloud(
  phone: string,
  pin: string
): Promise<{ success: boolean; owner?: ShopOwnerAccount; error?: string }> {
  if (!isSupabaseConfigured()) {
    return { success: false, error: 'Supabase is not configured yet' };
  }

  try {
    const cleanPhone = phone.trim();
    const cleanPin = pin.trim();

    const { data, error } = await supabase
      .from('shop_owners')
      .select('*')
      .eq('phone', cleanPhone)
      .eq('pin', cleanPin)
      .maybeSingle();

    if (error) {
      return { success: false, error: error.message };
    }

    if (!data) {
      return {
        success: false,
        error: 'اس موبائل نمبر اور پن پر کوئی دکان کھاتہ نہیں ملا (No account found for this phone and PIN)',
      };
    }

    const owner: ShopOwnerAccount = {
      id: data.id,
      shopName: data.shop_name,
      ownerName: data.owner_name,
      phone: data.phone,
      pin: data.pin,
      city: data.city,
      email: data.email || undefined,
      createdAt: data.created_at,
    };

    return { success: true, owner };
  } catch (err: any) {
    return { success: false, error: err?.message || 'Network error' };
  }
}

/**
 * Fetch all registered Field Officers for a shop owner from Supabase Cloud
 */
export async function fetchOfficersFromCloud(ownerId: string): Promise<FieldOfficer[]> {
  if (!isSupabaseConfigured()) return [];

  try {
    const { data, error } = await supabase
      .from('field_officers')
      .select('*')
      .eq('owner_id', ownerId);

    if (error || !data) {
      console.warn('[Supabase] fetchOfficers error:', error?.message);
      return [];
    }

    return data.map((row: any) => ({
      id: row.id,
      ownerId: row.owner_id,
      fullName: row.full_name,
      name: row.full_name,
      roleTitle: 'Field Officer (فیلڈ آفیسر)',
      phone: row.phone,
      email: row.email,
      assignedTerritory: row.assigned_territory,
      accessCode: row.access_code,
      shiftStartTime: row.shift_start_time || '09:00',
      shiftEndTime: row.shift_end_time || '18:00',
      workingHoursDisplay: row.working_hours_display || '09:00 AM - 06:00 PM',
      currentStatus: (row.current_status as any) || 'offline',
      status: (row.current_status as any) || 'offline',
      batteryLevel: row.battery_level || 100,
      speedKmh: row.speed_kmh || 0,
      lastSeenAt: row.last_seen_at || 'Just added',
      lastPingTime: row.last_seen_at || 'Just added',
      currentLocation: {
        latitude: Number(row.latitude) || 30.1984,
        longitude: Number(row.longitude) || 71.4687,
        speed: row.speed_kmh || 0,
        heading: row.heading || 0,
        timestamp: Date.now(),
      },
      hasHardwareTracker: false,
      isCharging: false,
      todayDistanceKm: Number(row.today_distance_km) || 0,
      todayVisitsCount: 0,
      queuedPingsCount: 0,
    }));
  } catch (err) {
    console.warn('[Supabase] fetchOfficers exception:', err);
    return [];
  }
}

/**
 * Shop Owner (Phone A) subscribes to live real-time fleet movements via WebSocket
 */
export function subscribeToLiveFleet(
  ownerId: string,
  onOfficerUpdated: (officer: Partial<FieldOfficer> & { id: string }) => void
) {
  if (!isSupabaseConfigured()) return () => {};

  const channelName = `fleet-tracking-${ownerId}-${Date.now()}`;
  const channel = supabase
    .channel(channelName)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'field_officers',
        filter: `owner_id=eq.${ownerId}`,
      },
      (payload) => {
        const row = payload.new as any;
        if (!row || !row.id) return;

        onOfficerUpdated({
          id: row.id,
          ownerId: row.owner_id,
          fullName: row.full_name,
          phone: row.phone,
          assignedTerritory: row.assigned_territory,
          accessCode: row.access_code,
          shiftStartTime: row.shift_start_time,
          shiftEndTime: row.shift_end_time,
          workingHoursDisplay: row.working_hours_display,
          speedKmh: row.speed_kmh || 0,
          currentStatus: row.current_status || 'active',
          status: row.current_status || 'active',
          todayDistanceKm: Number(row.today_distance_km) || 0,
          lastSeenAt: 'Just now (ابھی)',
          lastPingTime: 'Just now (ابھی)',
          currentLocation: {
            latitude: Number(row.latitude),
            longitude: Number(row.longitude),
            speed: row.speed_kmh || 0,
            heading: row.heading || 0,
            timestamp: Date.now(),
          },
        });
      }
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}
