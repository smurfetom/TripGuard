export const COLORS = {
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
  { value: 'CUSTOM', label: 'Custom' },
] as const;

export const DISPLACEMENT_MODES = [
  { value: 'manual', label: 'Manual' },
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
} as const;
