export const colors = {
  // Surfaces
  bg: '#FFFFFF',
  surface: '#F2EDE5',
  surfaceAlt: '#FAF7F2',

  // Primary (near-black warm)
  accent: '#2A1F1A',
  accentLight: '#EED4DE',

  // Secondary (grape juice)
  secondary: '#6D1F42',
  secondaryLight: '#D3B6D3',

  // Text
  text: '#2A1F1A',
  textSecondary: '#7A6A5F',
  textPlaceholder: '#B5A89C',

  // Borders
  border: '#DDD5C8',
  borderStrong: '#C5BAB0',

  // Tags
  tag: '#DDD5C8',
  tagText: '#7A6A5F',

  // Semantic
  success: '#25533F',
  warning: '#876029',
  error: '#6D1F42',

  // Misc
  white: '#FFFFFF',
  overlay: 'rgba(0,0,0,0.5)',
} as const;

export const fonts = {
  serif: 'Lora_400Regular',
  serifBold: 'Lora_600SemiBold',
  serifItalic: 'Lora_400Regular_Italic',
  sans: 'Inter_400Regular',
  sansMedium: 'Inter_500Medium',
  sansSemiBold: 'Inter_600SemiBold',
  sansBold: 'Inter_700Bold',
} as const;

export const hebrewFonts = {
  serif: 'Heebo_700Bold',
  serifBold: 'Heebo_700Bold',
  sans: 'Heebo_400Regular',
  sansMedium: 'Heebo_500Medium',
  sansSemiBold: 'Heebo_600SemiBold',
  sansBold: 'Heebo_700Bold',
} as const;

export const fontSize = {
  xs: 11,
  sm: 13,
  base: 15,
  md: 17,
  lg: 20,
  xl: 24,
  '2xl': 30,
  '3xl': 38,
} as const;

export const spacing = {
  2: 2,
  4: 4,
  6: 6,
  8: 8,
  12: 12,
  16: 16,
  20: 20,
  24: 24,
  32: 32,
  40: 40,
  48: 48,
} as const;

export const radius = {
  sm: 6,
  md: 12,
  lg: 16,
  xl: 24,
  full: 999,
} as const;
