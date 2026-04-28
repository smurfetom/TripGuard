import { Section, TripMode, VolumeUnit } from '../types';

export function calculateDisplacementFromSheet(
  steelDisplacementPerMeter: number,
  averageStandLength: number
): number {
  return (steelDisplacementPerMeter * averageStandLength) / 1000;
}

export function convertLPerMToM3PerStand(litersPerMeter: number, standLength: number): number {
  return (litersPerMeter * standLength) / 1000;
}

export function getSectionDisplacementPerStand(section: Section, sessionDisplacementMode?: string): number {
  const mode = (!section.displacementMode || section.displacementMode === 'manual') 
    ? (sessionDisplacementMode || 'closed_end')
    : section.displacementMode;
  
  let displacementLperM = 0;
  
  if (mode === 'open_end') {
    displacementLperM = section.openEndDisplacementPerStand ?? 0;
  } else if (mode === 'closed_end') {
    displacementLperM = section.closedEndDisplacementPerStand ?? 0;
  } else {
    displacementLperM = section.displacementPerStand > 0
      ? section.displacementPerStand
      : section.displacementPerMeter * section.standLength;
  }

  const standLength = section.standLength || 27;
  const displacementM3PerStand = (displacementLperM * standLength) / 1000;
  
  return isNaN(displacementM3PerStand) ? 0 : displacementM3PerStand;
}

export function calculateDisplacementPerStand(
  section: Section,
  unitSystem: 'metric' | 'imperial',
  sessionDisplacementMode?: string
): number {
  return getSectionDisplacementPerStand(section, sessionDisplacementMode);
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
  
  const sectionsToIterate = mode === 'POOH' ? [...sections].reverse() : sections;
  
  for (const section of sectionsToIterate) {
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

export function getDisplayStandNumber(
  startStand: number,
  progressedStands: number,
  mode: TripMode
): number {
  return mode === 'RIH'
    ? startStand + progressedStands
    : startStand - progressedStands;
}

export function getProgressedStandsFromDisplay(
  startStand: number,
  displayStand: number,
  mode: TripMode
): number {
  return mode === 'RIH'
    ? Math.max(0, displayStand - startStand)
    : Math.max(0, startStand - displayStand);
}

export function getNextScheduledDisplayStand(
  currentDisplayStand: number,
  startStand: number,
  loggingInterval: number,
  mode: TripMode
): number {
  if (loggingInterval <= 1) {
    return mode === 'RIH' ? currentDisplayStand + 1 : currentDisplayStand - 1;
  }

  const progressed = getProgressedStandsFromDisplay(startStand, currentDisplayStand, mode);
  const nextProgressed = Math.ceil((progressed + 1) / loggingInterval) * loggingInterval;
  return getDisplayStandNumber(startStand, nextProgressed, mode);
}

export function calculateCumulativeVolumeFromSegment(
  currentProgressedStands: number,
  startProgressedStands: number,
  sections: Section[],
  mode: TripMode,
  defaultDisplacementPerStand: number
): number {
  if (isNaN(currentProgressedStands) || isNaN(startProgressedStands) || isNaN(defaultDisplacementPerStand)) {
    console.log('[calculateCumulativeVolumeFromSegment] NaN detected, returning 0');
    return 0;
  }

  if (currentProgressedStands <= startProgressedStands) {
    return 0;
  }

  if (sections.length === 0) {
    const traversedStands = currentProgressedStands - startProgressedStands;
    const disp = isNaN(defaultDisplacementPerStand) ? 0 : defaultDisplacementPerStand;
    const baseVolume = traversedStands * disp;
    return mode === 'RIH' ? baseVolume : -baseVolume;
  }

  let cumulativeVolume = 0;
  let accumulatedStands = 0;

  const sectionsToIterate = mode === 'POOH' ? [...sections].reverse() : sections;

  for (const section of sectionsToIterate) {
    const sectionStart = accumulatedStands + 1;
    const sectionEnd = accumulatedStands + section.calculatedStands;
    const overlapStart = Math.max(startProgressedStands + 1, sectionStart);
    const overlapEnd = Math.min(currentProgressedStands, sectionEnd);
    const traversedStands = Math.max(0, overlapEnd - overlapStart + 1);

    if (traversedStands > 0) {
      const displacement = calculateDisplacementPerStand(section, 'metric');
      const disp = isNaN(displacement) ? 0 : displacement;
      const baseVolume = disp * traversedStands;
      cumulativeVolume += mode === 'RIH' ? baseVolume : -baseVolume;
    }

    accumulatedStands = sectionEnd;
  }

  return isNaN(cumulativeVolume) ? 0 : cumulativeVolume;
}

export function calculateSlugCorrectionVolume(
  slugVolume: number,
  slugMudWeight: number,
  holeMudWeight: number
): number {
  if (slugVolume <= 0 || slugMudWeight <= 0 || holeMudWeight <= 0) {
    return 0;
  }

  return slugVolume * ((slugMudWeight - holeMudWeight) / holeMudWeight);
}

export function calculateActualCumulativeVolume(
  actualTT: number,
  startActualTT: number
): number {
  return actualTT - startActualTT;
}

export function calculateGainLossVolume(
  actualCumulativeVolume: number,
  calculatedCumulativeVolume: number
): number {
  return actualCumulativeVolume - calculatedCumulativeVolume;
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

  const sectionsToIterate = mode === 'POOH' ? [...sections].reverse() : sections;

  for (const section of sectionsToIterate) {
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
  
  if (absDiff <= tolerance * 0.5) {
    return 'OK';
  } else if (absDiff <= tolerance) {
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
