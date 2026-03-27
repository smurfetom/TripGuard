import { Section, TripMode, VolumeUnit } from '../types';

export function getSectionDisplacementPerStand(section: Section): number {
  if (section.displacementMode === 'open_end') {
    return section.openEndDisplacementPerStand ?? 0;
  }

  if (section.displacementMode === 'closed_end') {
    return section.closedEndDisplacementPerStand ?? 0;
  }

  return section.displacementPerStand > 0
    ? section.displacementPerStand
    : section.displacementPerMeter * section.standLength;
}

export function calculateDisplacementPerStand(
  section: Section,
  unitSystem: 'metric' | 'imperial'
): number {
  return getSectionDisplacementPerStand(section);
}

export function getCurrentSection(
  standNumber: number,
  sections: Section[]
): Section | null {
  if (standNumber <= 0) return null;
  if (sections.length === 0) return null;
  
  let accumulatedStands = 0;
  
  for (const section of sections) {
    accumulatedStands += section.calculatedStands;
    if (standNumber <= accumulatedStands) {
      return section;
    }
  }
  
  return sections[sections.length - 1];
}

export function calculateExpectedTT(
  currentStand: number,
  sections: Section[],
  mode: TripMode,
  initialTT: number,
  slugVolume: number = 0
): number {
  if (sections.length === 0) {
    return mode === 'POOH' ? initialTT + slugVolume : initialTT;
  }
  
  let expected = initialTT;
  let accumulatedStands = 0;
  
  for (const section of sections) {
    const sectionStands = section.calculatedStands;
    const standsInThisSection = Math.min(
      Math.max(0, currentStand - accumulatedStands),
      sectionStands
    );
    
    const displacement = calculateDisplacementPerStand(section, 'metric');
    
    if (mode === 'RIH') {
      expected += displacement * standsInThisSection;
    } else {
      expected -= displacement * standsInThisSection;
    }
    
    accumulatedStands += sectionStands;
  }
  
  if (mode === 'POOH') {
    expected += slugVolume;
  }
  
  return Math.max(0, expected);
}

export function calculateExpectedFromSegment(
  currentStand: number,
  startStand: number,
  sections: Section[],
  mode: TripMode,
  startExpected: number,
  slugVolume: number = 0
): number {
  if (currentStand <= startStand) {
    return mode === 'POOH' ? Math.max(0, startExpected + slugVolume) : Math.max(0, startExpected);
  }

  let expected = startExpected;
  let accumulatedStands = 0;

  for (const section of sections) {
    const sectionStart = accumulatedStands + 1;
    const sectionEnd = accumulatedStands + section.calculatedStands;
    const overlapStart = Math.max(startStand + 1, sectionStart);
    const overlapEnd = Math.min(currentStand, sectionEnd);
    const traversedStands = Math.max(0, overlapEnd - overlapStart + 1);

    if (traversedStands > 0) {
      const displacement = calculateDisplacementPerStand(section, 'metric');
      expected += mode === 'RIH'
        ? displacement * traversedStands
        : -displacement * traversedStands;
    }

    accumulatedStands = sectionEnd;
  }

  if (mode === 'POOH') {
    expected += slugVolume;
  }

  return Math.max(0, expected);
}

export function calculateDiff(
  actual: number,
  expected: number
): number {
  return actual - expected;
}

export function getDeviationStatus(
  diff: number,
  tolerance: number
): 'OK' | 'WARNING' | 'ALARM' {
  const absDiff = Math.abs(diff);
  
  if (absDiff <= tolerance) {
    return 'OK';
  } else if (absDiff <= tolerance * 2) {
    return 'WARNING';
  } else {
    return 'ALARM';
  }
}

export function getSectionAtStand(
  standNumber: number,
  sections: Section[]
): { section: Section; sectionStartStand: number } | null {
  if (sections.length === 0) return null;
  
  let accumulatedStands = 0;
  
  for (const section of sections) {
    if (standNumber <= accumulatedStands + section.calculatedStands) {
      return {
        section,
        sectionStartStand: accumulatedStands + 1,
      };
    }
    accumulatedStands += section.calculatedStands;
  }
  
  return null;
}

export function calculateTotalStands(sections: Section[]): number {
  return sections.reduce((total, section) => total + section.calculatedStands, 0);
}

export function convertVolume(
  value: number,
  fromUnit: VolumeUnit,
  toUnit: VolumeUnit,
  factors: Record<string, number>
): number {
  const valueInM3 = value / factors[fromUnit];
  return valueInM3 * factors[toUnit];
}

export function formatVolume(value: number, unit: VolumeUnit): string {
  return `${value.toFixed(2)} ${unit}`;
}
