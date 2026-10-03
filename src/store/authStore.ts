import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { UserRole, FieldOfficer, ShopOwnerAccount } from '../types';
import { MOCK_OFFICERS } from '../mockData';
import {
  syncOwnerToSupabase,
  syncOfficerToSupabase,
  verifyAccessCodeInCloud,
  pushLocationUpdateToCloud,
  verifyOwnerInCloud,
  fetchOfficersFromCloud,
} from '../services/supabase';

const STORAGE_KEYS = {
  OWNERS: '@agriroute_shop_owners_v1',
  OFFICERS: '@agriroute_officers_v1',
  SESSION: '@agriroute_session_v1',
};

// Phone normalizer (removes spaces, dashes, leading +92/0)
export function normalizePhone(raw: string): string {
  let cleaned = raw.replace(/[^0-9]/g, '');
  if (cleaned.startsWith('92')) {
    cleaned = '0' + cleaned.slice(2);
  }
  return cleaned;
}

export interface AuthState {
  // Core Auth State
  userRole: UserRole | null;
  isAuthenticated: boolean;
  currentOfficerId: string | null;
  currentOfficerName: string;
  currentOfficer: FieldOfficer | null;
  currentOwner: ShopOwnerAccount | null;

  // Stored Registries
  registeredOwners: ShopOwnerAccount[];
  registeredOfficers: FieldOfficer[];

  // Form State
  selectedRole: UserRole;
  phoneNumber: string;
  isLoading: boolean;
  error: string | null;

  // Lifecycle
  initializeFromStorage: () => Promise<void>;

  // Authentication Actions
  loginWithAccessCode: (accessCode: string) => Promise<{ success: boolean; error?: string }>;
  loginOwnerWithPhoneAndPin: (phone: string, pin: string) => Promise<{ success: boolean; error?: string }>;
  loginAs: (role: UserRole, officerId?: string) => void;
  logout: () => Promise<void>;

  // Shop Owner Registration & Officer Management
  registerShopOwner: (data: {
    shopName: string;
    ownerName: string;
    phone: string;
    pin: string;
    email?: string;
    city: string;
  }) => Promise<ShopOwnerAccount>;

  addFieldOfficer: (data: {
    fullName: string;
    phone: string;
    assignedTerritory: string;
    email?: string;
    shiftStartTime?: string;
    shiftEndTime?: string;
    workingHoursDisplay?: string;
  }) => Promise<{ officer: FieldOfficer; accessCode: string }>;

  updateOfficerLocationAndDistance: (
    officerId: string,
    location: { latitude: number; longitude: number; speed?: number; heading?: number },
    distanceDeltaKm: number
  ) => Promise<void>;

  deleteFieldOfficer: (officerId: string) => Promise<void>;

  // Cloud Sync
  fetchCloudOfficersForOwner: () => Promise<void>;
  mergeOfficersFromCloud: (cloudOfficers: FieldOfficer[]) => void;
  updateOfficerFromCloudPayload: (payload: Partial<FieldOfficer> & { id: string }) => void;

  // Form setters
  setSelectedRole: (role: UserRole) => void;
  setPhoneNumber: (phone: string) => void;
  setCurrentOfficer: (officer: FieldOfficer) => void;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  userRole: null,
  isAuthenticated: false,
  currentOfficerId: null,
  currentOfficerName: '',
  currentOfficer: null,
  currentOwner: null,

  registeredOwners: [],
  registeredOfficers: [],

  selectedRole: 'officer',
  phoneNumber: '',
  isLoading: false,
  error: null,

  initializeFromStorage: async () => {
    try {
      // 1. Load registered shop owners
      const storedOwners = await AsyncStorage.getItem(STORAGE_KEYS.OWNERS);
      let owners: ShopOwnerAccount[] = [];
      if (storedOwners) {
        owners = JSON.parse(storedOwners);
        set({ registeredOwners: owners });
      }

      // 2. Load registered officers (pure owner-created fleet, filter out legacy mock IDs)
      const storedOfficers = await AsyncStorage.getItem(STORAGE_KEYS.OFFICERS);
      if (storedOfficers) {
        const parsed: FieldOfficer[] = JSON.parse(storedOfficers);
        const cleanedOfficers = parsed.filter((o) => !o.id.startsWith('off-0'));
        set({ registeredOfficers: cleanedOfficers });
      } else {
        set({ registeredOfficers: [] });
        await AsyncStorage.setItem(STORAGE_KEYS.OFFICERS, JSON.stringify([]));
      }

      // 3. Restore last active session if available
      const storedSession = await AsyncStorage.getItem(STORAGE_KEYS.SESSION);
      if (storedSession) {
        const session = JSON.parse(storedSession);
        if (session.role === 'owner' && session.ownerId) {
          const owner = owners.find((o) => o.id === session.ownerId);
          if (owner) {
            set({
              userRole: 'owner',
              selectedRole: 'owner',
              isAuthenticated: true,
              currentOwner: owner,
            });
            fetchOfficersFromCloud(owner.id).then((cloudOfficers) => {
              if (cloudOfficers && cloudOfficers.length > 0) {
                get().mergeOfficersFromCloud(cloudOfficers);
              }
            });
          }
        } else if (session.role === 'officer' && session.officerId) {
          const officers = get().registeredOfficers;
          const officer = officers.find((o) => o.id === session.officerId);
          if (officer) {
            set({
              userRole: 'officer',
              selectedRole: 'officer',
              isAuthenticated: true,
              currentOfficer: officer,
              currentOfficerId: officer.id,
              currentOfficerName: officer.fullName,
            });
          }
        }
      }
    } catch (err) {
      console.warn('[AuthStore] Failed to load data from AsyncStorage:', err);
    }
  },

  registerShopOwner: async (data) => {
    set({ isLoading: true, error: null });
    const normalized = normalizePhone(data.phone);

    const newOwner: ShopOwnerAccount = {
      id: `owner_${Date.now()}`,
      shopName: data.shopName,
      ownerName: data.ownerName,
      phone: data.phone,
      pin: data.pin.trim(),
      email: data.email,
      city: data.city,
      createdAt: new Date().toISOString(),
    };

    // Filter out existing owner with same phone number
    const updatedOwners = [
      newOwner,
      ...get().registeredOwners.filter((o) => normalizePhone(o.phone) !== normalized),
    ];

    try {
      await AsyncStorage.setItem(STORAGE_KEYS.OWNERS, JSON.stringify(updatedOwners));
      await AsyncStorage.setItem(
        STORAGE_KEYS.SESSION,
        JSON.stringify({ role: 'owner', ownerId: newOwner.id })
      );
    } catch (e) {
      console.warn('[AuthStore] Storage save error:', e);
    }

    set({
      registeredOwners: updatedOwners,
      currentOwner: newOwner,
      userRole: 'owner',
      selectedRole: 'owner',
      isAuthenticated: true,
      error: null,
      isLoading: false,
    });

    // Sync to Supabase Cloud for multi-device access
    syncOwnerToSupabase(newOwner).catch(() => {});

    return newOwner;
  },

  loginOwnerWithPhoneAndPin: async (phoneInput: string, pinInput: string) => {
    set({ isLoading: true, error: null });
    const normalized = normalizePhone(phoneInput);
    const cleanPin = pinInput.trim();

    if (!normalized) {
      const err = 'براہ کرم اپنا موبائل نمبر درج کریں (Please enter mobile number)';
      set({ isLoading: false, error: err });
      return { success: false, error: err };
    }

    if (!cleanPin || cleanPin.length !== 4) {
      const err = 'براہ کرم 4 ہندسوں کا سیکیورٹی پن درج کریں (Please enter 4-digit PIN)';
      set({ isLoading: false, error: err });
      return { success: false, error: err };
    }

    // Lookup owner in registered owners
    const owners = get().registeredOwners;
    let foundOwner = owners.find((o) => normalizePhone(o.phone) === normalized);

    if (!foundOwner) {
      // Check Supabase Cloud if owner registered on another phone
      set({ isLoading: true });
      const cloudRes = await verifyOwnerInCloud(phoneInput, cleanPin);
      set({ isLoading: false });

      if (cloudRes.success && cloudRes.owner) {
        foundOwner = cloudRes.owner;
        const updatedOwners = [foundOwner, ...get().registeredOwners];
        set({ registeredOwners: updatedOwners });
        try {
          await AsyncStorage.setItem(STORAGE_KEYS.OWNERS, JSON.stringify(updatedOwners));
        } catch {}
      }
    }

    if (!foundOwner) {
      const err =
        'اس موبائل نمبر پر کوئی دکان کھاتہ نہیں ملا۔ براہ کرم پہلے "نیا دکان کھاتہ بنائیں" پر کلک کریں۔ (No account found for this mobile number. Please register first.)';
      set({ isLoading: false, error: err });
      return { success: false, error: err };
    }

    // Verify PIN
    if (foundOwner.pin && foundOwner.pin !== cleanPin) {
      const err =
        'درج کردہ 4 ہندسوں کا پن درست نہیں ہے۔ دوبارہ کوشش کریں۔ (Incorrect 4-digit PIN. Please try again.)';
      set({ isLoading: false, error: err });
      return { success: false, error: err };
    }

    // Save session
    try {
      await AsyncStorage.setItem(
        STORAGE_KEYS.SESSION,
        JSON.stringify({ role: 'owner', ownerId: foundOwner.id })
      );
    } catch (e) {
      console.warn('[AuthStore] Session save error:', e);
    }

    set({
      userRole: 'owner',
      selectedRole: 'owner',
      isAuthenticated: true,
      currentOwner: foundOwner,
      currentOfficer: null,
      currentOfficerId: null,
      currentOfficerName: '',
      error: null,
      isLoading: false,
    });

    // Fetch cloud officers for this owner in the background
    fetchOfficersFromCloud(foundOwner.id).then((cloudOfficers) => {
      if (cloudOfficers && cloudOfficers.length > 0) {
        get().mergeOfficersFromCloud(cloudOfficers);
      }
    });

    return { success: true };
  },

  loginWithAccessCode: async (code: string) => {
    const cleaned = code.trim().toUpperCase();
    if (!cleaned) {
      const err = 'براہ کرم اپنا آفیسر رسائی کوڈ درج کریں (Please enter your access code)';
      set({ error: err });
      return { success: false, error: err };
    }

    let officer = get().registeredOfficers.find(
      (o) =>
        o.accessCode.toUpperCase() === cleaned ||
        o.id.toUpperCase() === cleaned ||
        o.id.replace('-', '_').toUpperCase() === cleaned
    );

    // If not found in local phone storage, verify with Supabase Cloud
    if (!officer) {
      set({ isLoading: true });
      const cloudResult = await verifyAccessCodeInCloud(cleaned);
      set({ isLoading: false });

      if (cloudResult.success && cloudResult.officer) {
        officer = cloudResult.officer;
        const updated = [officer, ...get().registeredOfficers];
        set({ registeredOfficers: updated });
        try {
          await AsyncStorage.setItem(STORAGE_KEYS.OFFICERS, JSON.stringify(updated));
        } catch {}
      }
    }

    if (officer) {
      try {
        await AsyncStorage.setItem(
          STORAGE_KEYS.SESSION,
          JSON.stringify({ role: 'officer', officerId: officer.id })
        );
      } catch (e) {
        console.warn('[AuthStore] Session save error:', e);
      }

      set({
        userRole: 'officer',
        selectedRole: 'officer',
        isAuthenticated: true,
        currentOfficer: officer,
        currentOfficerId: officer.id,
        currentOfficerName: officer.fullName || officer.name || 'Field Officer',
        error: null,
        isLoading: false,
      });
      return { success: true };
    } else {
      const err = `کوڈ "${cleaned}" درست نہیں ہے۔ اپنے دکان مالک سے نیا کوڈ حاصل کریں۔ (Invalid code. Contact your shop owner)`;
      set({ error: err });
      return { success: false, error: err };
    }
  },

  addFieldOfficer: async (data) => {
    const existingCodes = new Set(get().registeredOfficers.map((o) => o.accessCode.toUpperCase()));
    let randomNum = Math.floor(1000 + Math.random() * 9000);
    let generatedCode = `FO-${randomNum}`;

    while (existingCodes.has(generatedCode)) {
      randomNum = Math.floor(1000 + Math.random() * 9000);
      generatedCode = `FO-${randomNum}`;
    }

    const currentOwner = get().currentOwner;
    const newOfficer: FieldOfficer = {
      id: `off_${Date.now()}`,
      accessCode: generatedCode,
      ownerId: currentOwner?.id || 'owner_01',
      fullName: data.fullName,
      name: data.fullName,
      roleTitle: 'Field Officer (فیلڈ آفیسر)',
      phone: data.phone,
      email: data.email,
      assignedTerritory: data.assignedTerritory,
      shiftStartTime: data.shiftStartTime || '09:00',
      shiftEndTime: data.shiftEndTime || '18:00',
      workingHoursDisplay: data.workingHoursDisplay || '09:00 AM - 06:00 PM',
      currentStatus: 'offline',
      status: 'offline',
      batteryLevel: 100,
      speedKmh: 0,
      lastSeenAt: 'ابھی شامل کیا گیا (Just added)',
      lastPingTime: 'ابھی شامل کیا گیا (Just added)',
      currentLocation: {
        latitude: 30.1984,
        longitude: 71.4687,
        speed: 0,
        heading: 0,
        timestamp: Date.now(),
      },
      hasHardwareTracker: false,
      isCharging: false,
      todayDistanceKm: 0,
      todayVisitsCount: 0,
      queuedPingsCount: 0,
    };

    const updatedOfficers = [newOfficer, ...get().registeredOfficers];
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.OFFICERS, JSON.stringify(updatedOfficers));
    } catch (e) {
      console.warn('[AuthStore] Officer save error:', e);
    }

    set({ registeredOfficers: updatedOfficers });

    // Sync to Supabase Cloud so Phone B can verify access code
    syncOfficerToSupabase(newOfficer).catch((err) => {
      console.warn('[AuthStore] Cloud sync officer failed:', err);
    });

    return { officer: newOfficer, accessCode: generatedCode };
  },

  updateOfficerLocationAndDistance: async (officerId, loc, distanceDeltaKm) => {
    const officers = get().registeredOfficers;
    const updatedOfficers = officers.map((o) => {
      if (o.id !== officerId) return o;
      const newDistance = Number(((o.todayDistanceKm || 0) + distanceDeltaKm).toFixed(2));
      const speed = loc.speed !== undefined ? loc.speed : o.speedKmh;
      return {
        ...o,
        currentLocation: {
          latitude: loc.latitude,
          longitude: loc.longitude,
          speed,
          heading: loc.heading || o.currentLocation?.heading || 0,
          timestamp: Date.now(),
        },
        speedKmh: speed,
        todayDistanceKm: newDistance,
        lastSeenAt: 'Just now (ابھی)',
        lastPingTime: 'Just now (ابھی)',
        currentStatus: 'active' as const,
        status: 'active' as const,
      };
    });

    set({ registeredOfficers: updatedOfficers });

    if (get().currentOfficerId === officerId) {
      const me = updatedOfficers.find((o) => o.id === officerId);
      if (me) set({ currentOfficer: me });
    }

    try {
      await AsyncStorage.setItem(STORAGE_KEYS.OFFICERS, JSON.stringify(updatedOfficers));
    } catch (e) {
      console.warn('[AuthStore] Officer distance update error:', e);
    }

    // Push live coordinates & distance to Supabase Cloud so Phone A (Owner) sees live marker moving
    pushLocationUpdateToCloud(officerId, loc, distanceDeltaKm).catch((err) => {
      console.warn('[AuthStore] Cloud push location failed:', err);
    });
  },

  deleteFieldOfficer: async (officerId: string) => {
    const updatedOfficers = get().registeredOfficers.filter((o) => o.id !== officerId);
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.OFFICERS, JSON.stringify(updatedOfficers));
    } catch (e) {
      console.warn('[AuthStore] Officer delete error:', e);
    }
    set({ registeredOfficers: updatedOfficers });
  },

  fetchCloudOfficersForOwner: async () => {
    const owner = get().currentOwner;
    if (!owner) return;
    try {
      const cloudOfficers = await fetchOfficersFromCloud(owner.id);
      if (cloudOfficers && cloudOfficers.length > 0) {
        get().mergeOfficersFromCloud(cloudOfficers);
      }
    } catch (err) {
      console.warn('[AuthStore] fetchCloudOfficers error:', err);
    }
  },

  mergeOfficersFromCloud: (cloudOfficers: FieldOfficer[]) => {
    const existing = get().registeredOfficers;
    const existingMap = new Map(existing.map((o) => [o.id, o]));

    cloudOfficers.forEach((co) => {
      const current = existingMap.get(co.id);
      existingMap.set(co.id, {
        ...(current || co),
        ...co,
        // Preserve current location if newer
        currentLocation: co.currentLocation || current?.currentLocation,
      });
    });

    const merged = Array.from(existingMap.values());
    set({ registeredOfficers: merged });
    AsyncStorage.setItem(STORAGE_KEYS.OFFICERS, JSON.stringify(merged)).catch(() => {});
  },

  updateOfficerFromCloudPayload: (payload) => {
    const officers = get().registeredOfficers;
    let found = false;
    const updated = officers.map((o) => {
      if (o.id === payload.id) {
        found = true;
        return {
          ...o,
          ...payload,
          currentLocation: payload.currentLocation || o.currentLocation,
        };
      }
      return o;
    });

    if (!found && payload.fullName) {
      updated.unshift(payload as FieldOfficer);
    }

    set({ registeredOfficers: updated });

    if (get().currentOfficerId === payload.id) {
      const me = updated.find((o) => o.id === payload.id);
      if (me) set({ currentOfficer: me });
    }
  },

  loginAs: (role: UserRole, officerId?: string) => {
    if (role === 'owner') {
      const owner = get().currentOwner || get().registeredOwners[0];
      set({
        userRole: 'owner',
        selectedRole: 'owner',
        isAuthenticated: true,
        currentOwner: owner || null,
        currentOfficer: null,
        currentOfficerId: null,
        currentOfficerName: '',
        error: null,
        isLoading: false,
      });
      return;
    }

    const targetOfficerId = officerId || 'off-01';
    const officers = get().registeredOfficers;
    const matchedOfficer =
      officers.find(
        (o) =>
          o.id === targetOfficerId ||
          o.id.replace('-', '_') === targetOfficerId.replace('-', '_')
      ) || officers[0];

    set({
      userRole: 'officer',
      selectedRole: 'officer',
      isAuthenticated: true,
      currentOfficerId: matchedOfficer?.id || 'off-01',
      currentOfficerName: matchedOfficer?.fullName || 'Field Officer',
      currentOfficer: matchedOfficer || null,
      error: null,
      isLoading: false,
    });
  },

  logout: async () => {
    try {
      await AsyncStorage.removeItem(STORAGE_KEYS.SESSION);
    } catch (e) {
      console.warn('[AuthStore] Session remove error:', e);
    }

    set({
      userRole: null,
      isAuthenticated: false,
      currentOfficerId: null,
      currentOfficerName: '',
      currentOfficer: null,
      error: null,
      isLoading: false,
    });
  },

  setSelectedRole: (role: UserRole) => set({ selectedRole: role }),
  setPhoneNumber: (phone: string) => set({ phoneNumber: phone }),
  setCurrentOfficer: (officer: FieldOfficer) =>
    set({
      currentOfficer: officer,
      currentOfficerId: officer.id,
      currentOfficerName: officer.fullName || officer.name || '',
    }),
}));

// Initialize storage on app load
useAuthStore.getState().initializeFromStorage();
