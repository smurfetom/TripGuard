export type ThemeColors = {
  background: string;
  surface: string;
  border: string;
  textPrimary: string;
  textSecondary: string;
  accent: string;
  success: string;
  warning: string;
  danger: string;
  white: string;
  black: string;
};

export const DARK_COLORS: ThemeColors = {
  background: '#0D1117',
  surface: '#161B22',
  border: '#30363D',
  textPrimary: '#F0F6FC',
  textSecondary: '#8B949E',
  accent: '#58A6FF',
  success: '#3FB950',
  warning: '#D29922',
  danger: '#F85149',
  white: '#FFFFFF',
  black: '#000000',
};

export const LIGHT_COLORS: ThemeColors = {
  background: '#EEF2F6',
  surface: '#FFFFFF',
  border: '#C8D1DB',
  textPrimary: '#10161D',
  textSecondary: '#556270',
  accent: '#0F62FE',
  success: '#1F8A46',
  warning: '#B97700',
  danger: '#C62828',
  white: '#FFFFFF',
  black: '#000000',
};

export const COLORS = DARK_COLORS;

export const SPACING = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

export const FONT_SIZES = {
  caption: 14,
  body: 16,
  heading: 24,
  headingLarge: 32,
  value: 48,
};

export const BORDER_RADIUS = {
  sm: 4,
  md: 8,
  lg: 12,
  xl: 16,
  round: 9999,
};

export const VOLUME_UNITS: Record<string, { label: string; factor: number }> = {
  m3: { label: 'm³', factor: 1 },
  bbl: { label: 'bbl', factor: 6.28981 },
  liters: { label: 'L', factor: 1000 },
  gallons: { label: 'gal', factor: 264.172 },
};

export const SECTION_TYPES = [
  { value: 'BHA', label: 'BHA' },
  { value: 'DP', label: 'Drill Pipe' },
  { value: 'HWDP', label: 'HWDP' },
  { value: 'CASING', label: 'Casing' },
  { value: 'CUSTOM', label: 'Custom' },
] as const;

export const TUBULAR_PRESETS = [
  // BHA - displacement values in L/m
  { type: 'BHA', name: '8 1/2" BHA', openEndDisplacementPerStand: 5, closedEndDisplacementPerStand: 10, standCapacity: 20, standLength: 27 },
  { type: 'BHA', name: '12 1/4" BHA', openEndDisplacementPerStand: 5, closedEndDisplacementPerStand: 10, standCapacity: 25, standLength: 27 },
  { type: 'BHA', name: '17 1/2" BHA', openEndDisplacementPerStand: 5, closedEndDisplacementPerStand: 10, standCapacity: 35, standLength: 27 },
  
  // Drill Pipe (DP) - displacement values in L/m
  { type: 'DP', name: '2 7/8" DP', openEndDisplacementPerStand: 5, closedEndDisplacementPerStand: 10, standCapacity: 12, standLength: 27 },
  { type: 'DP', name: '3 1/2" DP', openEndDisplacementPerStand: 5, closedEndDisplacementPerStand: 10, standCapacity: 15, standLength: 27 },
  { type: 'DP', name: '4" DP', openEndDisplacementPerStand: 5, closedEndDisplacementPerStand: 10, standCapacity: 16, standLength: 27 },
  { type: 'DP', name: '5" DP', openEndDisplacementPerStand: 5, closedEndDisplacementPerStand: 10, standCapacity: 18, standLength: 27 },
  { type: 'DP', name: '5 7/8" DP', openEndDisplacementPerStand: 5, closedEndDisplacementPerStand: 10, standCapacity: 24, standLength: 27 },
  { type: 'DP', name: '6 5/8" DP', openEndDisplacementPerStand: 5, closedEndDisplacementPerStand: 10, standCapacity: 30, standLength: 27 },
  
  // HWDP - displacement values in L/m
  { type: 'HWDP', name: '5" HWDP', openEndDisplacementPerStand: 5, closedEndDisplacementPerStand: 10, standCapacity: 26, standLength: 27 },
  { type: 'HWDP', name: '5 7/8" HWDP', openEndDisplacementPerStand: 5, closedEndDisplacementPerStand: 10, standCapacity: 35, standLength: 27 },
  { type: 'HWDP', name: '6 5/8" HWDP', openEndDisplacementPerStand: 5, closedEndDisplacementPerStand: 10, standCapacity: 40, standLength: 27 },
  
  // Casing - displacement values in L/m
  { type: 'CASING', name: '7" Casing', openEndDisplacementPerStand: 5, closedEndDisplacementPerStand: 10, standCapacity: 50, standLength: 27 },
  { type: 'CASING', name: '9 5/8" Casing', openEndDisplacementPerStand: 5, closedEndDisplacementPerStand: 10, standCapacity: 75, standLength: 27 },
  { type: 'CASING', name: '13 3/8" Casing', openEndDisplacementPerStand: 5, closedEndDisplacementPerStand: 10, standCapacity: 110, standLength: 27 },
  
  // Custom - displacement values in L/m
  { type: 'CUSTOM', name: 'Custom', openEndDisplacementPerStand: 5, closedEndDisplacementPerStand: 10, standCapacity: 18, standLength: 27 },
];

export const getPresetsByType = (type: string) => TUBULAR_PRESETS.filter(p => p.type === type);

export const DISPLACEMENT_MODES = [
  { value: 'open_end', label: 'Open End' },
  { value: 'closed_end', label: 'Closed End' },
] as const;

export const SECTION_TYPE_PRESETS = {
  BHA: {
    name: 'BHA',
    standLength: '27',
    sectionLength: '81',
    displacementPerStand: '0.120',
    standCapacity: '',
  },
  DP: {
    name: 'Drill Pipe',
    standLength: '27',
    sectionLength: '2700',
    displacementPerStand: '0.015',
    standCapacity: '0.180',
  },
  HWDP: {
    name: 'HWDP',
    standLength: '27',
    sectionLength: '270',
    displacementPerStand: '0.021',
    standCapacity: '0.180',
  },
  CUSTOM: {
    name: 'Custom',
    standLength: '27',
    sectionLength: '270',
    displacementPerStand: '0.015',
    standCapacity: '',
  },
  CASING: {
    name: 'Casing',
    standLength: '27',
    sectionLength: '270',
    displacementPerStand: '0.040',
    standCapacity: '',
  },
} as const;
