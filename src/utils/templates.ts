import { SetupTemplate, Section } from '../types';
import { createId } from './id';

function createSection(partial: Partial<Section> & Pick<Section, 'type' | 'name' | 'length' | 'standLength' | 'displacementPerStand' | 'calculatedStands' | 'order'>): Section {
  return {
    id: createId(),
    displacementMode: 'manual',
    displacementPerMeter: 0,
    ...partial,
  };
}

export const BUILT_IN_TEMPLATES: SetupTemplate[] = [
  {
    id: 'standard-pooh',
    name: 'Standard POOH',
    mode: 'POOH',
    unitSystem: 'metric',
    volumeUnit: 'm3',
    tolerance: 0.5,
    totalStands: 110,
    initialTT: 24,
    startStand: 110,
    loggingInterval: 5,
    steelDisplacementPerMeter: 5.03,
    averageStandLength: 28.97,
    slugMudWeight: 1.5,
    holeMudWeight: 1.18,
    isBuiltIn: true,
    sections: [
      createSection({ type: 'BHA', name: 'BHA', length: 81, standLength: 27, displacementPerStand: 0.12, calculatedStands: 3, order: 0, standCapacity: 0 }),
      createSection({ type: 'HWDP', name: 'HWDP', length: 270, standLength: 27, displacementPerStand: 0.021, calculatedStands: 10, order: 1, standCapacity: 0.18 }),
      createSection({ type: 'DP', name: 'Drill Pipe', length: 2619, standLength: 27, displacementPerStand: 0.015, calculatedStands: 97, order: 2, standCapacity: 0.18 }),
    ],
  },
  {
    id: 'deep-rih',
    name: 'Deep RIH',
    mode: 'RIH',
    unitSystem: 'metric',
    volumeUnit: 'm3',
    tolerance: 0.4,
    totalStands: 140,
    initialTT: 18,
    startStand: 0,
    loggingInterval: 5,
    steelDisplacementPerMeter: 5.03,
    averageStandLength: 28.83,
    isBuiltIn: true,
    sections: [
      createSection({ type: 'BHA', name: 'BHA', length: 108, standLength: 27, displacementPerStand: 0.14, calculatedStands: 4, order: 0, standCapacity: 0 }),
      createSection({ type: 'HWDP', name: 'HWDP', length: 405, standLength: 27, displacementPerStand: 0.022, calculatedStands: 15, order: 1, standCapacity: 0.19 }),
      createSection({ type: 'DP', name: 'Drill Pipe', length: 3267, standLength: 27, displacementPerStand: 0.015, calculatedStands: 121, order: 2, standCapacity: 0.19 }),
    ],
  },
  {
    id: 'bha-test',
    name: 'Short BHA Test',
    mode: 'RIH',
    unitSystem: 'metric',
    volumeUnit: 'm3',
    tolerance: 0.25,
    totalStands: 18,
    initialTT: 12,
    startStand: 0,
    loggingInterval: 1,
    steelDisplacementPerMeter: 5.03,
    averageStandLength: 27,
    isBuiltIn: true,
    sections: [
      createSection({ type: 'BHA', name: 'BHA', length: 81, standLength: 27, displacementPerStand: 0.11, calculatedStands: 3, order: 0, standCapacity: 0 }),
      createSection({ type: 'DP', name: 'Drill Pipe', length: 405, standLength: 27, displacementPerStand: 0.015, calculatedStands: 15, order: 1, standCapacity: 0.17 }),
    ],
  },
];

export function cloneTemplate(template: SetupTemplate): SetupTemplate {
  return {
    ...template,
    sections: template.sections.map((section, index) => ({
      ...section,
      id: createId(),
      order: index,
    })),
  };
}
