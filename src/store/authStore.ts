import { create } from 'zustand';
import { UserRole, FieldOfficer } from '../types';
import { MOCK_OFFICERS } from '../mockData';

export interface AuthState {
  // Required state
  userRole: UserRole | null;
  isAuthenticated: boolean;
  currentOfficerId: string | null;
  currentOfficerName: string;

  // Additional state for auth flow & backward compatibility
  selectedRole: UserRole;
  phoneNumber: string;
  currentOfficer: FieldOfficer | null;
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
}

export const useAuthStore = create<AuthState>((set, get) => ({
  userRole: null,
  isAuthenticated: false,
  currentOfficerId: null,
  currentOfficerName: '',

  selectedRole: 'officer',
  phoneNumber: '+92 300 1234567',
  currentOfficer: null,
  otpSent: false,
  isLoading: false,
  error: null,

  loginAs: (role: UserRole, officerId?: string) => {
    const targetOfficerId = role === 'officer' ? (officerId || 'off_01') : null;
    let matchedOfficer: FieldOfficer | null = null;

    if (role === 'officer') {
      matchedOfficer =
        MOCK_OFFICERS.find(
          (o) =>
            o.id === targetOfficerId ||
            o.id.replace('-', '_') === targetOfficerId?.replace('-', '_')
        ) ?? MOCK_OFFICERS[0];
    }

    set({
      userRole: role,
      selectedRole: role,
      isAuthenticated: true,
      currentOfficerId: targetOfficerId,
      currentOfficerName: matchedOfficer
        ? matchedOfficer.fullName || matchedOfficer.name || 'Muhammad Tariq'
        : '',
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

  setSelectedRole: (role: UserRole) => {
    set({
      selectedRole: role,
    });
  },

  setPhoneNumber: (phone: string) => set({ phoneNumber: phone }),

  requestOtp: async (phone: string) => {
    set({ isLoading: true, error: null });
    // Simulate SMS dispatch
    await new Promise((resolve) => setTimeout(resolve, 400));
    set({ phoneNumber: phone, otpSent: true, isLoading: false });
    return true;
  },

  verifyOtp: async (code: string) => {
    set({ isLoading: true, error: null });
    await new Promise((resolve) => setTimeout(resolve, 350));
    if (code.length === 6) {
      const activeRole = get().selectedRole || 'officer';
      get().loginAs(activeRole);
      return true;
    } else {
      set({ isLoading: false, error: 'Please enter a valid 6-digit verification code' });
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
