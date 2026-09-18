/**
 * AgriRoute Stitch Theme Color Tokens
 */

export const colors = {
  // Brand Primary (Deep Emerald & Agri-Mint)
  primary: '#0F5132',
  primaryHover: '#0b3d26',
  primaryLight: '#D1E7DD',
  primaryMuted: '#e8f5e9',
  primaryDark: '#08331f',

  // Route & Actions Accent (Accent Blue)
  accentBlue: '#2563EB',
  accentBlueLight: '#DBEAFE',
  accentBlueDark: '#1D4ED8',

  // Warning & Offline (Warning Amber)
  warningAmber: '#D97706',
  warningAmberLight: '#FEF3C7',
  warningAmberDark: '#B45309',

  // Success / Online
  successGreen: '#16A34A',
  successGreenLight: '#DCFCE7',

  // Destructive / Danger
  dangerRed: '#DC2626',
  dangerRedLight: '#FEE2E2',

  // Neutrals (Slate Charcoal)
  neutralDark: '#0F172A',
  neutralMuted: '#475569',
  neutralLight: '#94A3B8',
  neutralBorder: '#E2E8F0',
  neutralDivider: '#F1F5F9',

  // Surfaces & Backgrounds
  surfaceLight: '#F8FAFC',
  cardSurface: '#FFFFFF',
  cardSurfaceAlt: '#F1F5F9',

  // Overlays
  overlayBackdrop: 'rgba(15, 23, 42, 0.65)',
  scannerOverlay: 'rgba(15, 81, 50, 0.15)',
} as const;

export type ColorToken = keyof typeof colors;
