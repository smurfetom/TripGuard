export type TripMode = 'RIH' | 'POOH';
export type UnitSystem = 'metric' | 'imperial';
export type VolumeUnit = 'm3' | 'bbl' | 'liters' | 'gallons';
export type DeviationStatus = 'OK' | 'WARNING' | 'ALARM';
export type EventType = 'ADD_STAND' | 'SLUG' | 'SURFACE_RESET' | 'COMMENT';
export type SectionType = 'BHA' | 'DP' | 'HWDP' | 'CUSTOM';
export type DisplacementMode = 'manual' | 'open_end' | 'closed_end';
export type ResetType = 'SURFACE_EVENT' | 'EMPTY_FILL_TT';

export interface Section {
  id: string;
  type: SectionType;
  name: string;
  displacementMode: DisplacementMode;
  length: number;
  standLength: number;
  displacementPerMeter: number;
  displacementPerStand: number;
  openEndDisplacementPerStand?: number;
  closedEndDisplacementPerStand?: number;
  standCapacity?: number;
  calculatedStands: number;
  order: number;
}

export interface Event {
  id: string;
  type: EventType;
  observedVolume?: number;
  totalVolume?: number;
  expectedTotalVolume?: number;
  actualTT: number;
  expectedTT: number;
  diff: number;
  standNumber: number;
  progressedStands?: number;
  calculatedCumulativeVolume?: number;
  actualCumulativeVolume?: number;
  gainLossVolume?: number;
  slugCorrectionVolume?: number;
  slugVolume?: number;
  resetType?: ResetType;
  comment?: string;
  timestamp: number;
}

export interface Segment {
  id: string;
  startStand: number;
  startExpected: number;
  startActual: number;
  events: Event[];
  createdAt: number;
}

export interface TripSession {
  id: string;
  totalStands: number;
  mode: TripMode;
  unitSystem: UnitSystem;
  volumeUnit: VolumeUnit;
  tolerance: number;
  startStand: number;
  loggingInterval: number;
  steelDisplacementPerMeter: number;
  averageStandLength: number;
  defaultDisplacementPerStand: number;
  currentStand: number;
  sections: Section[];
  segments: Segment[];
  activeSegmentId: string | null;
  isActive: boolean;
  initialTT: number;
  resetBaselineVolume: number;
  resetAccumulatedBase: number;
  resetCalculatedBase: number;
  slugMudWeight?: number;
  holeMudWeight?: number;
  accumulatedSlugCorrectionVolume: number;
  createdAt: number;
  updatedAt: number;
}

export interface TripConfig {
  totalStands: number;
  mode: TripMode;
  unitSystem: UnitSystem;
  volumeUnit: VolumeUnit;
  tolerance: number;
  sections: Section[];
  initialTT: number;
  startStand: number;
  loggingInterval: number;
  steelDisplacementPerMeter: number;
  averageStandLength: number;
  slugMudWeight?: number;
  holeMudWeight?: number;
}

export interface SetupTemplate {
  id: string;
  name: string;
  mode: TripMode;
  unitSystem: UnitSystem;
  volumeUnit: VolumeUnit;
  tolerance: number;
  totalStands: number;
  initialTT: number;
  startStand: number;
  loggingInterval: number;
  steelDisplacementPerMeter: number;
  averageStandLength: number;
  slugMudWeight?: number;
  holeMudWeight?: number;
  sections: Section[];
  isBuiltIn?: boolean;
}
