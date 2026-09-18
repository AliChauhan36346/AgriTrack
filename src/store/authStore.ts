import { create } from 'zustand';
import { UserRole, Officer } from '../types';
import { mockOfficers } from '../mockData';

interface AuthState {
  isAuthenticated: boolean;
  selectedRole: UserRole;
  phoneNumber: string;
  currentOfficer: Officer | null;
  otpSent: boolean;
  isLoading: boolean;
  error: string | null;

  // Actions
  setSelectedRole: (role: UserRole) => void;
  setPhoneNumber: (phone: string) => void;
  requestOtp: (phone: string) => Promise<boolean>;
  verifyOtp: (code: string) => Promise<boolean>;
  logout: () => void;
  setCurrentOfficer: (officer: Officer) => void;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  isAuthenticated: true, // Default to true for smooth instant preview; role defines the initial screen
  selectedRole: 'officer',
  phoneNumber: '+91 98251 23456',
  currentOfficer: mockOfficers[0],
  otpSent: false,
  isLoading: false,
  error: null,

  setSelectedRole: (role: UserRole) => {
    set({
      selectedRole: role,
      currentOfficer: role === 'officer' ? mockOfficers[0] : null,
    });
  },

  setPhoneNumber: (phone: string) => set({ phoneNumber: phone }),

  requestOtp: async (phone: string) => {
    set({ isLoading: true, error: null });
    // Simulate SMS dispatch
    await new Promise((resolve) => setTimeout(resolve, 600));
    set({ phoneNumber: phone, otpSent: true, isLoading: false });
    return true;
  },

  verifyOtp: async (code: string) => {
    set({ isLoading: true, error: null });
    await new Promise((resolve) => setTimeout(resolve, 800));
    if (code.length === 6) {
      set({
        isAuthenticated: true,
        isLoading: false,
        currentOfficer: get().selectedRole === 'officer' ? mockOfficers[0] : null,
      });
      return true;
    } else {
      set({ isLoading: false, error: 'Invalid 6-digit verification code' });
      return false;
    }
  },

  logout: () => {
    set({
      isAuthenticated: false,
      otpSent: false,
      currentOfficer: null,
    });
  },

  setCurrentOfficer: (officer: Officer) => set({ currentOfficer: officer }),
}));
