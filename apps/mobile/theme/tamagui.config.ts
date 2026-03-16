import { createTamagui, createTokens, createTheme } from 'tamagui';
import { createInterFont } from '@tamagui/font-inter';

// Use system font (SF Pro on iOS)
const headingFont = createInterFont({
  size: {
    1: 11,
    2: 12,
    3: 13,
    4: 14,
    5: 15,
    6: 16,
    7: 18,
    8: 24,
    9: 28,
    10: 32,
  },
  weight: {
    4: '400',
    5: '500',
    6: '600',
    7: '700',
  },
  face: {
    400: { normal: 'System' },
    500: { normal: 'System' },
    600: { normal: 'System' },
    700: { normal: 'System' },
  },
});

const bodyFont = createInterFont({
  size: {
    1: 11,
    2: 12,
    3: 13,
    4: 14,
    5: 15,
    6: 16,
    7: 18,
    8: 24,
    9: 28,
    10: 32,
  },
  weight: {
    4: '400',
    5: '500',
    6: '600',
    7: '700',
  },
  face: {
    400: { normal: 'System' },
    500: { normal: 'System' },
    600: { normal: 'System' },
    700: { normal: 'System' },
  },
});

const tokens = createTokens({
  size: {
    xs: 4,
    sm: 8,
    md: 12,
    lg: 16,
    xl: 20,
    xxl: 24,
    xxxl: 32,
    screenHorizontal: 20,
    cardPadding: 16,
    cardGap: 12,
    sectionGap: 24,
    tabBarHeight: 84,
    true: 16,
  },
  space: {
    xs: 4,
    sm: 8,
    md: 12,
    lg: 16,
    xl: 20,
    xxl: 24,
    xxxl: 32,
    true: 16,
  },
  radius: {
    sm: 8,
    md: 12,
    lg: 16,
    xl: 20,
    full: 9999,
    true: 12,
  },
  zIndex: {
    xs: 0,
    sm: 100,
    md: 200,
    lg: 300,
    xl: 400,
    xxl: 500,
    true: 0,
  },
  color: {
    // Dark mode backgrounds
    backgroundDark: '#0B0D17',
    backgroundSurfaceDark: '#131628',
    backgroundElevatedDark: '#1A1D35',
    backgroundInputDark: '#1A1D35',

    // Light mode backgrounds
    backgroundLight: '#F5F5FA',
    backgroundSurfaceLight: '#FFFFFF',
    backgroundElevatedLight: '#FFFFFF',
    backgroundInputLight: '#F0F0F5',

    // AI Accent
    accentPrimary: '#7C5CFC',
    accentPrimaryMuted: 'rgba(124, 92, 252, 0.15)',
    accentPrimaryGlow: 'rgba(124, 92, 252, 0.25)',

    // Category colors
    categorySkills: '#5B9CF6',
    categorySkillsMuted: 'rgba(91, 156, 246, 0.15)',
    categoryWealth: '#F5A623',
    categoryWealthMuted: 'rgba(245, 166, 35, 0.15)',
    categoryHealth: '#34D399',
    categoryHealthMuted: 'rgba(52, 211, 153, 0.15)',
    categoryImpact: '#F472B6',
    categoryImpactMuted: 'rgba(244, 114, 182, 0.15)',

    // Semantic
    success: '#34D399',
    successMuted: 'rgba(52, 211, 153, 0.15)',
    warning: '#FBBF24',
    error: '#F87171',

    // Special
    checkboxCompleted: '#34D399',
    streakFire: '#F59E0B',
    pointsGold: '#F5A623',

    // Text dark mode
    textPrimaryDark: '#E8E8ED',
    textSecondaryDark: '#8B8FA3',
    textTertiaryDark: '#555873',
    textInverseDark: '#0B0D17',

    // Text light mode
    textPrimaryLight: '#1A1A2E',
    textSecondaryLight: '#6B7084',
    textTertiaryLight: '#9CA3B4',
    textInverseLight: '#FFFFFF',

    // Borders dark
    borderDefaultDark: 'rgba(255, 255, 255, 0.08)',
    borderSubtleDark: 'rgba(255, 255, 255, 0.05)',
    borderAccentDark: 'rgba(124, 92, 252, 0.4)',
    borderFocusedDark: 'rgba(124, 92, 252, 0.6)',

    // Borders light
    borderDefaultLight: 'rgba(0, 0, 0, 0.08)',
    borderSubtleLight: 'rgba(0, 0, 0, 0.04)',
    borderAccentLight: 'rgba(124, 92, 252, 0.3)',
    borderFocusedLight: 'rgba(124, 92, 252, 0.5)',
  },
});

const darkTheme = createTheme({
  background: tokens.color.backgroundDark,
  backgroundSurface: tokens.color.backgroundSurfaceDark,
  backgroundElevated: tokens.color.backgroundElevatedDark,
  backgroundInput: tokens.color.backgroundInputDark,

  borderDefault: tokens.color.borderDefaultDark,
  borderSubtle: tokens.color.borderSubtleDark,
  borderAccent: tokens.color.borderAccentDark,
  borderFocused: tokens.color.borderFocusedDark,

  textPrimary: tokens.color.textPrimaryDark,
  textSecondary: tokens.color.textSecondaryDark,
  textTertiary: tokens.color.textTertiaryDark,
  textInverse: tokens.color.textInverseDark,

  accentPrimary: tokens.color.accentPrimary,
  accentPrimaryMuted: tokens.color.accentPrimaryMuted,
  accentPrimaryGlow: tokens.color.accentPrimaryGlow,

  categorySkills: tokens.color.categorySkills,
  categorySkillsMuted: tokens.color.categorySkillsMuted,
  categoryWealth: tokens.color.categoryWealth,
  categoryWealthMuted: tokens.color.categoryWealthMuted,
  categoryHealth: tokens.color.categoryHealth,
  categoryHealthMuted: tokens.color.categoryHealthMuted,
  categoryImpact: tokens.color.categoryImpact,
  categoryImpactMuted: tokens.color.categoryImpactMuted,

  success: tokens.color.success,
  successMuted: tokens.color.successMuted,
  warning: tokens.color.warning,
  error: tokens.color.error,
  checkboxCompleted: tokens.color.checkboxCompleted,
  streakFire: tokens.color.streakFire,
  pointsGold: tokens.color.pointsGold,

  color: tokens.color.textPrimaryDark,
  borderColor: tokens.color.borderDefaultDark,
  borderColorHover: tokens.color.borderAccentDark,
  borderColorFocus: tokens.color.borderFocusedDark,
  borderColorPress: tokens.color.borderAccentDark,
  placeholderColor: tokens.color.textTertiaryDark,
});

const lightTheme = createTheme({
  background: tokens.color.backgroundLight,
  backgroundSurface: tokens.color.backgroundSurfaceLight,
  backgroundElevated: tokens.color.backgroundElevatedLight,
  backgroundInput: tokens.color.backgroundInputLight,

  borderDefault: tokens.color.borderDefaultLight,
  borderSubtle: tokens.color.borderSubtleLight,
  borderAccent: tokens.color.borderAccentLight,
  borderFocused: tokens.color.borderFocusedLight,

  textPrimary: tokens.color.textPrimaryLight,
  textSecondary: tokens.color.textSecondaryLight,
  textTertiary: tokens.color.textTertiaryLight,
  textInverse: tokens.color.textInverseLight,

  accentPrimary: tokens.color.accentPrimary,
  accentPrimaryMuted: 'rgba(124, 92, 252, 0.10)',
  accentPrimaryGlow: tokens.color.accentPrimaryGlow,

  categorySkills: tokens.color.categorySkills,
  categorySkillsMuted: 'rgba(91, 156, 246, 0.10)',
  categoryWealth: tokens.color.categoryWealth,
  categoryWealthMuted: 'rgba(245, 166, 35, 0.10)',
  categoryHealth: tokens.color.categoryHealth,
  categoryHealthMuted: 'rgba(52, 211, 153, 0.10)',
  categoryImpact: tokens.color.categoryImpact,
  categoryImpactMuted: 'rgba(244, 114, 182, 0.10)',

  success: tokens.color.success,
  successMuted: tokens.color.successMuted,
  warning: tokens.color.warning,
  error: tokens.color.error,
  checkboxCompleted: tokens.color.checkboxCompleted,
  streakFire: tokens.color.streakFire,
  pointsGold: tokens.color.pointsGold,

  color: tokens.color.textPrimaryLight,
  borderColor: tokens.color.borderDefaultLight,
  borderColorHover: tokens.color.borderAccentLight,
  borderColorFocus: tokens.color.borderFocusedLight,
  borderColorPress: tokens.color.borderAccentLight,
  placeholderColor: tokens.color.textTertiaryLight,
});

export const tamaguiConfig = createTamagui({
  tokens,
  themes: {
    dark: darkTheme,
    light: lightTheme,
  },
  fonts: {
    heading: headingFont,
    body: bodyFont,
  },
  defaultFont: 'body',
});

export default tamaguiConfig;

export type AppConfig = typeof tamaguiConfig;

declare module 'tamagui' {
  interface TamaguiCustomConfig extends AppConfig {}
}
