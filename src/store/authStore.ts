import { create } from 'zustand';
import { UserRole, FieldOfficer, ShopOwnerAccount } from '../types';
import { MOCK_OFFICERS } from '../mockData';

export interface AuthState {
  // Core Auth State
  userRole: UserRole | null;
  isAuthenticated: boolean;
  currentOfficerId: string | null;
  currentOfficerName: string;
  currentOfficer: FieldOfficer | null;
  currentOwner: ShopOwnerAccount | null;

  // Officer Registry
  registeredOfficers: FieldOfficer[];

  // Form & Navigation State
  selectedRole: UserRole;
  phoneNumber: string;
  otpSent: boolean;
  isLoading: boolean;
  error: string | null;

  // Actions
  loginAs: (role: UserRole, officerId?: string) => void;
  logout: () => void;
  setSelectedRole: (role: UserRole) => void;
  setPhoneNumber: (phone: string) => void;
  requestOtp: (phone: string) => Promise<boolean>;
  verifyOtp: (code: string) => Promise<boolean>;
  setCurrentOfficer: (officer: FieldOfficer) => void;

  // Direct Officer Access Code Authentication
  loginWithAccessCode: (accessCode: string) => { success: boolean; error?: string };

  // Shop Owner Registration & Officer Management
  registerShopOwner: (data: {
    shopName: string;
    ownerName: string;
    phone: string;
    email?: string;
    city: string;
  }) => ShopOwnerAccount;
  addFieldOfficer: (data: {
    fullName: string;
    phone: string;
    assignedTerritory: string;
    email?: string;
  }) => { officer: FieldOfficer; accessCode: string };
  deleteFieldOfficer: (officerId: string) => void;
}

const DEFAULT_SHOP_OWNER: ShopOwnerAccount = {
  id: 'owner-01',
  shopName: 'Al-Madina Zari Markaz (المدینہ زرعی مرکز)',
  ownerName: 'Haji Abdul Rasheed',
  phone: '+92 300 8765432',
  email: 'owner@almadinazari.pk',
  city: 'Multan',
  createdAt: new Date().toISOString(),
};

export const useAuthStore = create<AuthState>((set, get) => ({
  userRole: null,
  isAuthenticated: false,
  currentOfficerId: null,
  currentOfficerName: '',
  currentOfficer: null,
  currentOwner: DEFAULT_SHOP_OWNER,

  registeredOfficers: [...MOCK_OFFICERS],

  selectedRole: 'officer',
  phoneNumber: '+92 300 1234567',
  otpSent: false,
  isLoading: false,
  error: null,

  loginWithAccessCode: (code: string) => {
    const cleaned = code.trim().toUpperCase();
    if (!cleaned) {
      set({ error: 'براہ کرم اپنا آفیسر کوڈ درج کریں (Please enter your access code)' });
      return { success: false, error: 'Access code required' };
    }

    const officer = get().registeredOfficers.find(
      (o) =>
        o.accessCode.toUpperCase() === cleaned ||
        o.id.toUpperCase() === cleaned ||
        o.id.replace('-', '_').toUpperCase() === cleaned
    );

    if (officer) {
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

  registerShopOwner: (data) => {
    const newOwner: ShopOwnerAccount = {
      id: `owner-${Date.now()}`,
      shopName: data.shopName,
      ownerName: data.ownerName,
      phone: data.phone,
      email: data.email,
      city: data.city,
      createdAt: new Date().toISOString(),
    };

    set({
      currentOwner: newOwner,
      userRole: 'owner',
      selectedRole: 'owner',
      isAuthenticated: true,
      error: null,
      isLoading: false,
    });

    return newOwner;
  },

  addFieldOfficer: (data) => {
    // Generate a memorable 4-digit numeric code with prefix FO-
    const existingCodes = new Set(get().registeredOfficers.map((o) => o.accessCode.toUpperCase()));
    let randomNum = Math.floor(1000 + Math.random() * 9000);
    let generatedCode = `FO-${randomNum}`;

    while (existingCodes.has(generatedCode)) {
      randomNum = Math.floor(1000 + Math.random() * 9000);
      generatedCode = `FO-${randomNum}`;
    }

    const currentOwner = get().currentOwner;
    const newOfficer: FieldOfficer = {
      id: `off-${Date.now()}`,
      accessCode: generatedCode,
      ownerId: currentOwner?.id || 'owner-01',
      fullName: data.fullName,
      name: data.fullName,
      roleTitle: 'Field Officer (فیلڈ آفیسر)',
      phone: data.phone,
      email: data.email,
      assignedTerritory: data.assignedTerritory,
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

    set((state) => ({
      registeredOfficers: [newOfficer, ...state.registeredOfficers],
    }));

    return { officer: newOfficer, accessCode: generatedCode };
  },

  deleteFieldOfficer: (officerId: string) => {
    set((state) => ({
      registeredOfficers: state.registeredOfficers.filter((o) => o.id !== officerId),
    }));
  },

  loginAs: (role: UserRole, officerId?: string) => {
    if (role === 'owner') {
      const owner = get().currentOwner || DEFAULT_SHOP_OWNER;
      set({
        userRole: 'owner',
        selectedRole: 'owner',
        isAuthenticated: true,
        currentOwner: owner,
        currentOfficer: null,
        currentOfficerId: null,
        currentOfficerName: '',
        error: null,
        isLoading: false,
        otpSent: false,
      });
      return;
    }

    // Role is officer
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
      currentOfficerId: matchedOfficer.id,
      currentOfficerName: matchedOfficer.fullName || matchedOfficer.name || 'Muhammad Tariq',
      currentOfficer: matchedOfficer,
      error: null,
      isLoading: false,
      otpSent: false,
    });
  },

  logout: () => {
    set({
      userRole: null,
      isAuthenticated: false,
      currentOfficerId: null,
      currentOfficerName: '',
      currentOfficer: null,
      otpSent: false,
      error: null,
      isLoading: false,
    });
  },

  setSelectedRole: (role: UserRole) => set({ selectedRole: role }),

  setPhoneNumber: (phone: string) => set({ phoneNumber: phone }),

  requestOtp: async (phone: string) => {
    set({ isLoading: true, error: null });
    await new Promise((resolve) => setTimeout(resolve, 300));
    set({ phoneNumber: phone, otpSent: true, isLoading: false });
    return true;
  },

  verifyOtp: async (code: string) => {
    set({ isLoading: true, error: null });
    await new Promise((resolve) => setTimeout(resolve, 300));
    if (code.length === 6) {
      const activeRole = get().selectedRole || 'owner';
      get().loginAs(activeRole);
      return true;
    } else {
      set({
        isLoading: false,
        error: 'براہ کرم 6 ہندسوں کا کوڈ درج کریں (Please enter a valid 6-digit code)',
      });
      return false;
    }
  },

  setCurrentOfficer: (officer: FieldOfficer) =>
    set({
      currentOfficer: officer,
      currentOfficerId: officer.id,
      currentOfficerName: officer.fullName || officer.name || '',
    }),
}));
