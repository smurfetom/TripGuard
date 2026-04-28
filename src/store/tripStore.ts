import { create } from 'zustand';
import {
  TripSession,
  TripConfig,
  TripMode,
  Section,
  Segment,
  Event,
  DeviationStatus,
  VolumeUnit,
} from '../types';
import {
  calculateExpectedTT,
  calculateCumulativeVolumeFromSegment,
  calculateDiff,
  getDeviationStatus,
  getCurrentSection,
  calculateTotalStands,
  calculateDisplacementFromSheet,
  calculateSlugCorrectionVolume,
  calculateActualCumulativeVolume,
  calculateGainLossVolume,
  getDisplayStandNumber,
  getProgressedStandsFromDisplay,
  getNextScheduledDisplayStand,
  calculateDisplacementPerStand,
} from '../utils/calculations';
import { ResetType } from '../types';
import { saveSession, loadSession, clearSession } from '../utils/storage';
import { createId } from '../utils/id';

interface TripState {
  session: TripSession | null;
  inputValue: string;
  currentExpectedTT: number;
  currentActualTT: number;
  currentDiff: number;
  currentObservedVolume: number;
  currentTotalVolume: number;
  currentExpectedTotalVolume: number;
  currentDisplayStand: number;
  calculatedCumulativeVolume: number;
  actualCumulativeVolume: number;
  gainLossVolume: number;
  deviationStatus: DeviationStatus;
  currentSection: Section | null;
  isLoading: boolean;
  
  startSession: (config: TripConfig) => void;
  setInputValue: (value: string) => void;
  addStand: (step?: number) => void;
  addSlug: (volume: number) => void;
  surfaceReset: (resetActualTT: number, resetStandDisplay: number, resetType: ResetType, comment?: string) => void;
  addComment: (comment: string) => void;
  endSession: () => void;
  restoreSession: () => Promise<void>;
  clearCurrentSession: () => Promise<void>;
  switchMode: (newMode: TripMode, newStand: number, resetVolumes: boolean) => void;
  setDisplacementMode: (mode: 'open_end' | 'closed_end') => void;
}

function normalizeSession(session: TripSession): TripSession {
  const openEndDisplacement = session.openEndDisplacement ?? 0;
  const closedEndDisplacement = session.closedEndDisplacement ?? 0;
  const displacementMode = session.displacementMode ?? 'closed_end';
  const averageStandLength = session.averageStandLength ?? 28.83;
  const defaultDisplacementPerStand = session.defaultDisplacementPerStand ?? 
    (session.sections.length > 0 ? 0 : (displacementMode === 'open_end' ? (openEndDisplacement > 0 ? openEndDisplacement * averageStandLength / 1000 : 0) : (closedEndDisplacement > 0 ? closedEndDisplacement * averageStandLength / 1000 : 0)));

  return {
    ...session,
    startStand: session.startStand ?? 0,
    loggingInterval: session.loggingInterval ?? 5,
    openEndDisplacement,
    closedEndDisplacement,
    displacementMode,
    averageStandLength,
    defaultDisplacementPerStand,
    initialTripTankVolume: session.initialTripTankVolume ?? 1.0,
    previousTripTankVolume: session.previousTripTankVolume ?? session.initialTripTankVolume ?? 1.0,
    resetBaselineVolume: session.resetBaselineVolume ?? session.initialTT,
    resetAccumulatedBase: session.resetAccumulatedBase ?? 0,
    resetCalculatedBase: session.resetCalculatedBase ?? 0,
    accumulatedSlugCorrectionVolume: session.accumulatedSlugCorrectionVolume ?? 0,
  };
}

export const useTripStore = create<TripState>((set, get) => ({
  session: null,
  inputValue: '',
  currentExpectedTT: 0,
  currentActualTT: 0,
  currentDiff: 0,
  currentObservedVolume: 0,
  currentTotalVolume: 0,
  currentExpectedTotalVolume: 0,
  currentDisplayStand: 0,
  calculatedCumulativeVolume: 0,
  actualCumulativeVolume: 0,
  gainLossVolume: 0,
  deviationStatus: 'OK',
  currentSection: null,
  isLoading: false,

  startSession: (config: TripConfig) => {
    const calculatedStands = calculateTotalStands(config.sections);
    const totalStands = config.sections.length > 0 && calculatedStands > 0 
      ? calculatedStands 
      : (config.totalStands || calculatedStands);
    const displacementMode = config.displacementMode ?? 'closed_end';
    const defaultDisplacementPerStand = config.sections.length > 0
      ? 0
      : displacementMode === 'open_end'
        ? (config.openEndDisplacement > 0 ? config.openEndDisplacement * config.averageStandLength / 1000 : 0)
        : (config.closedEndDisplacement > 0 ? config.closedEndDisplacement * config.averageStandLength / 1000 : 0);
    const initialExpected = config.initialTT;

    const firstSegment: Segment = {
      id: createId(),
      startStand: 0,
      startExpected: initialExpected,
      startActual: config.initialTT,
      events: [],
      createdAt: Date.now(),
    };

    const session: TripSession = {
      id: createId(),
      totalStands,
      mode: config.mode,
      unitSystem: config.unitSystem,
      volumeUnit: config.volumeUnit,
      tolerance: config.tolerance,
      startStand: config.startStand,
      loggingInterval: config.loggingInterval,
      openEndDisplacement: config.openEndDisplacement,
      closedEndDisplacement: config.closedEndDisplacement,
      displacementMode,
      averageStandLength: config.averageStandLength,
      defaultDisplacementPerStand,
      currentStand: 0,
      sections: config.sections,
      segments: [firstSegment],
      activeSegmentId: firstSegment.id,
      isActive: true,
      initialTT: config.initialTT,
      initialTripTankVolume: config.initialTripTankVolume ?? 1.0,
      previousTripTankVolume: config.initialTripTankVolume ?? 1.0,
      resetBaselineVolume: config.initialTT,
      resetAccumulatedBase: 0,
      resetCalculatedBase: 0,
      slugMudWeight: config.slugMudWeight,
      holeMudWeight: config.holeMudWeight,
      accumulatedSlugCorrectionVolume: 0,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    set({
      session,
      inputValue: '',
      currentExpectedTT: initialExpected,
      currentActualTT: 0,
      currentDiff: 0,
      currentObservedVolume: 0,
      currentTotalVolume: config.initialTT,
      currentExpectedTotalVolume: config.initialTT,
      currentDisplayStand: config.startStand,
      calculatedCumulativeVolume: 0,
      actualCumulativeVolume: 0,
      gainLossVolume: 0,
      deviationStatus: getDeviationStatus(0, config.tolerance),
      currentSection: config.sections.length > 0 ? config.sections[0] : null,
    });

    saveSession(session);
  },

  setInputValue: (value: string) => {
    const sanitized = value.replace(/[^0-9.,-]/g, '').replace(/,/g, '.');
    set({ inputValue: sanitized });
  },

  addStand: (step) => {
    const { session, inputValue, currentDisplayStand } = get();
    if (!session || !session.isActive) return;
    if (session.currentStand >= session.totalStands) return;

    const actualTT = parseFloat(inputValue.replace(/,/g, '.'));
    if (isNaN(actualTT)) return;
    const observedVolume = actualTT;
    const observedDirection = session.mode === 'RIH' ? 1 : -1;

    const activeSegment = session.segments.find(
      (segment) => segment.id === session.activeSegmentId
    );
    if (!activeSegment) return;

    const segmentStartStand = activeSegment.startStand;

    const newStand = (() => {
      if (step) {
        return Math.min(session.currentStand + step, session.totalStands);
      }

      const nextDisplayStand = getNextScheduledDisplayStand(
        currentDisplayStand,
        segmentStartStand,
        session.loggingInterval,
        session.mode
      );
      const nextProgressedStand = getProgressedStandsFromDisplay(
        segmentStartStand,
        nextDisplayStand,
        session.mode
      );

      return Math.min(nextProgressedStand, session.totalStands);
    })();
    const accumulatedSlugCorrection = session.accumulatedSlugCorrectionVolume || 0;

    const previousCalcVolume = get().calculatedCumulativeVolume;
    const newStandsLogged = newStand - session.currentStand;
    
    let calculatedCumulativeVolume = 0;
    if (session.sections.length > 0) {
      const startStand = session.currentStand;
      const endStand = newStand;
      let totalVolume = 0;
      
      console.log('[DEBUG calculated] displacementMode:', session.displacementMode);
      
      const sectionsToUse = session.mode === 'POOH' 
        ? [...session.sections].reverse() 
        : session.sections;
      
      let accumulatedStands = 0;
      const sectionBoundaries = sectionsToUse.map(section => {
        const start = accumulatedStands + 1;
        const end = accumulatedStands + section.calculatedStands;
        const result = { section, start, end };
        accumulatedStands = end;
        return result;
      });
      
      if (session.mode === 'POOH') {
        const totalStands = accumulatedStands;
        accumulatedStands = 0;
        for (const sb of sectionBoundaries) {
          const sectionStart = totalStands - sb.end + 1;
          const sectionEnd = totalStands - sb.start + 1;
          const overlapStart = Math.max(startStand + 1, sectionStart);
          const overlapEnd = Math.min(endStand, sectionEnd);
          const standsInOverlap = Math.max(0, overlapEnd - overlapStart + 1);
          
          if (standsInOverlap > 0) {
            const displacement = calculateDisplacementPerStand(sb.section, 'metric', session.displacementMode);
            const sectionVolume = displacement * standsInOverlap;
            totalVolume += sectionVolume;
            console.log('[DEBUG calculated] section:', sb.section.name, 'displacement:', displacement, 'stands:', standsInOverlap, 'volume:', sectionVolume);
          }
          accumulatedStands = sectionEnd;
        }
      } else {
        accumulatedStands = 0;
        for (const sb of sectionBoundaries) {
          const sectionStart = sb.start;
          const sectionEnd = sb.end;
          const overlapStart = Math.max(startStand + 1, sectionStart);
          const overlapEnd = Math.min(endStand, sectionEnd);
          const standsInOverlap = Math.max(0, overlapEnd - overlapStart + 1);
          
          if (standsInOverlap > 0) {
            const displacement = calculateDisplacementPerStand(sb.section, 'metric', session.displacementMode);
            const sectionVolume = displacement * standsInOverlap;
            totalVolume += sectionVolume;
            console.log('[DEBUG calculated] section:', sb.section.name, 'displacement:', displacement, 'stands:', standsInOverlap, 'volume:', sectionVolume);
          }
          accumulatedStands = sectionEnd;
        }
      }
      
      const calcDirection = session.mode === 'POOH' ? -1 : 1;
      const incrementalVolume = totalVolume * calcDirection;
      calculatedCumulativeVolume = previousCalcVolume + incrementalVolume;
      console.log('[DEBUG calculated] totalVolume:', totalVolume, 'calcDirection:', calcDirection);
    } else {
      const disp = isNaN(session.defaultDisplacementPerStand) ? 0 : session.defaultDisplacementPerStand;
      const calcDirection = session.mode === 'POOH' ? -1 : 1;
      const incrementalVolume = newStandsLogged * disp * calcDirection;
      calculatedCumulativeVolume = previousCalcVolume + incrementalVolume;
    }

    console.log('[DEBUG calculated] previousCalcVolume:', previousCalcVolume);
    console.log('[DEBUG calculated] newStandsLogged:', newStandsLogged);
    console.log('[DEBUG calculated] currentStand:', session.currentStand);
    console.log('[DEBUG calculated] newStand:', newStand);
    console.log('[DEBUG calculated] calculatedCumulativeVolume:', calculatedCumulativeVolume);

    const currentTripTankVolume = actualTT;
    const previousTripTankVolume = session.previousTripTankVolume ?? session.initialTripTankVolume;
    const tripTankDifference = currentTripTankVolume - previousTripTankVolume;
    
    const actualCumulativeVolume = get().actualCumulativeVolume + (tripTankDifference);
    
    const gainLossVolume = calculateGainLossVolume(actualCumulativeVolume, calculatedCumulativeVolume);
    const localAccumulatedVolume = actualCumulativeVolume - session.resetAccumulatedBase;
    const localCalculatedVolume = calculatedCumulativeVolume - session.resetCalculatedBase;
    const currentTotalVolume = session.resetBaselineVolume + localAccumulatedVolume;
    const expectedTotalVolume = session.resetBaselineVolume + localCalculatedVolume + accumulatedSlugCorrection;
    const newExpected = expectedTotalVolume;

    const diff = calculateDiff(currentTotalVolume, expectedTotalVolume);
    const status = getDeviationStatus(diff, session.tolerance);
    const displayStand = getDisplayStandNumber(activeSegment.startStand, newStand, session.mode);

    const newEvent: Event = {
      id: createId(),
      type: 'ADD_STAND',
      observedVolume,
      totalVolume: currentTotalVolume,
      expectedTotalVolume,
      actualTT: currentTotalVolume,
      expectedTT: newExpected,
      diff,
      standNumber: displayStand,
      progressedStands: newStand,
      calculatedCumulativeVolume,
      actualCumulativeVolume,
      gainLossVolume,
      slugCorrectionVolume: accumulatedSlugCorrection,
      timestamp: Date.now(),
    };

    const updatedSegments = session.segments.map(segment => {
      if (segment.id === session.activeSegmentId) {
        return {
          ...segment,
          events: [...segment.events, newEvent],
        };
      }
      return segment;
    });

    const updatedSession: TripSession = {
      ...session,
      currentStand: newStand,
      segments: updatedSegments,
      previousTripTankVolume: currentTripTankVolume,
      updatedAt: Date.now(),
    };

    const newSection = getCurrentSection(newStand, session.sections);

    set({
      session: updatedSession,
      currentExpectedTT: newExpected,
      currentActualTT: observedVolume,
      currentDiff: diff,
      currentObservedVolume: observedVolume,
      currentTotalVolume,
      currentExpectedTotalVolume: expectedTotalVolume,
      currentDisplayStand: displayStand,
      calculatedCumulativeVolume,
      actualCumulativeVolume,
      gainLossVolume,
      deviationStatus: status,
      currentSection: newSection,
      inputValue: '',
    });

    saveSession(updatedSession);
  },

  addSlug: (volume: number) => {
    const { session, currentActualTT, currentExpectedTT, currentTotalVolume } = get();
    if (!session || !session.isActive || session.mode !== 'POOH') return;
    const activeSegment = session.segments.find(
      (segment) => segment.id === session.activeSegmentId
    );
    if (!activeSegment) return;
    const slugCorrection = calculateSlugCorrectionVolume(
      volume,
      session.slugMudWeight || 0,
      session.holeMudWeight || 0
    );
    const newExpected = currentExpectedTT + slugCorrection;
    const newAccumulatedSlugCorrection = (session.accumulatedSlugCorrectionVolume || 0) + slugCorrection;
    const currentGainLoss = get().gainLossVolume;

    const newEvent: Event = {
      id: createId(),
      type: 'SLUG',
      observedVolume: volume,
      totalVolume: currentTotalVolume,
      expectedTotalVolume: newExpected,
      actualTT: currentTotalVolume,
      expectedTT: newExpected,
      diff: currentTotalVolume - newExpected,
      standNumber: getDisplayStandNumber(activeSegment.startStand, session.currentStand, session.mode),
      progressedStands: session.currentStand,
      calculatedCumulativeVolume: get().calculatedCumulativeVolume,
      actualCumulativeVolume: get().actualCumulativeVolume,
      gainLossVolume: currentGainLoss,
      slugCorrectionVolume: slugCorrection,
      slugVolume: volume,
      timestamp: Date.now(),
    };

    const updatedSegments = session.segments.map(segment => {
      if (segment.id === session.activeSegmentId) {
        return {
          ...segment,
          events: [...segment.events, newEvent],
        };
      }
      return segment;
    });

    const updatedSession: TripSession = {
      ...session,
      segments: updatedSegments,
      accumulatedSlugCorrectionVolume: newAccumulatedSlugCorrection,
      updatedAt: Date.now(),
    };

    set({
      session: updatedSession,
      currentExpectedTT: newExpected,
      currentExpectedTotalVolume: newExpected,
      currentDiff: calculateDiff(currentTotalVolume, newExpected),
      gainLossVolume: currentGainLoss,
      deviationStatus: getDeviationStatus(currentTotalVolume - newExpected, session.tolerance),
    });

    saveSession(updatedSession);
  },

  surfaceReset: (resetActualTT: number, resetStandDisplay: number, resetType: ResetType, comment) => {
    const { session, calculatedCumulativeVolume: currentCalcVolume } = get();
    if (!session || !session.isActive) return;
    if (Number.isNaN(resetActualTT)) return;

    const resetProgressedStand = Math.min(
      getProgressedStandsFromDisplay(session.startStand, resetStandDisplay, session.mode),
      session.totalStands
    );
    const activeSegment = session.segments.find(
      (segment) => segment.id === session.activeSegmentId
    );
    const accumulatedSlugCorrection = session.accumulatedSlugCorrectionVolume || 0;
    
    const isEmptyFillTT = resetType === 'EMPTY_FILL_TT';
    
    const adjustedResetStandDisplay = isEmptyFillTT 
      ? get().currentDisplayStand 
      : resetStandDisplay;
    const adjustedResetProgressedStand = isEmptyFillTT 
      ? session.currentStand 
      : resetProgressedStand;
    
    const calculatedCumulativeVolume = isEmptyFillTT 
      ? currentCalcVolume 
      : calculateCumulativeVolumeFromSegment(
          adjustedResetProgressedStand,
          activeSegment?.startStand ?? 0,
          session.sections,
          session.mode,
          session.defaultDisplacementPerStand
        );
    const localCalculatedVolume = calculatedCumulativeVolume - session.resetCalculatedBase;

    const resetExpectedTT = resetActualTT;

    const newEvent: Event = {
      id: createId(),
      type: 'SURFACE_RESET',
      totalVolume: resetActualTT,
      expectedTotalVolume: resetExpectedTT,
      actualTT: resetActualTT,
      expectedTT: resetExpectedTT,
      diff: resetActualTT - (session.resetBaselineVolume + localCalculatedVolume + accumulatedSlugCorrection),
      standNumber: adjustedResetStandDisplay,
      progressedStands: adjustedResetProgressedStand,
      calculatedCumulativeVolume,
      actualCumulativeVolume: get().actualCumulativeVolume,
      gainLossVolume: get().gainLossVolume,
      resetType,
      comment: comment?.trim() || undefined,
      timestamp: Date.now(),
    };

    const updatedSegments = session.segments.map(segment => {
      if (segment.id === session.activeSegmentId) {
        return {
          ...segment,
          events: [...segment.events, newEvent],
        };
      }
      return segment;
    });

    console.log('[DEBUG surfaceReset EMPTY_FILL] currentCalcVolume:', currentCalcVolume);
    console.log('[DEBUG surfaceReset EMPTY_FILL] resetCalculatedBase will be set to:', currentCalcVolume);
    console.log('[DEBUG surfaceReset EMPTY_FILL] adjustedResetStandDisplay:', adjustedResetStandDisplay);
    console.log('[DEBUG surfaceReset EMPTY_FILL] adjustedResetProgressedStand:', adjustedResetProgressedStand);
    console.log('[DEBUG surfaceReset EMPTY_FILL] session.currentStand before:', session.currentStand);
    
    let finalSegments = updatedSegments;
    let finalActiveSegmentId = session.activeSegmentId;
    let finalCurrentStand = session.currentStand;
    
    if (!isEmptyFillTT) {
      const newSegment: Segment = {
        id: createId(),
        startStand: adjustedResetProgressedStand,
        startExpected: resetExpectedTT,
        startActual: resetActualTT,
        events: [],
        createdAt: Date.now(),
      };
      finalSegments = [...updatedSegments, newSegment];
      finalActiveSegmentId = newSegment.id;
      finalCurrentStand = adjustedResetProgressedStand;
    }
    
    const updatedSession: TripSession = {
      ...session,
      currentStand: finalCurrentStand,
      segments: finalSegments,
      activeSegmentId: finalActiveSegmentId,
      resetBaselineVolume: resetActualTT,
      resetAccumulatedBase: isEmptyFillTT ? get().actualCumulativeVolume : session.resetAccumulatedBase,
      resetCalculatedBase: isEmptyFillTT ? currentCalcVolume : calculatedCumulativeVolume,
      previousTripTankVolume: resetActualTT,
      initialTripTankVolume: isEmptyFillTT ? session.initialTripTankVolume : resetActualTT,
      accumulatedSlugCorrectionVolume: 0,
      updatedAt: Date.now(),
    };

    const newSection = getCurrentSection(isEmptyFillTT ? session.currentStand : adjustedResetProgressedStand, session.sections);

    const resetDiff = resetActualTT - (session.resetBaselineVolume + localCalculatedVolume + accumulatedSlugCorrection);
    const newStatus = getDeviationStatus(resetDiff, session.tolerance);

    const { currentDisplayStand: prevDisplayStand } = get();
    set({
      session: updatedSession,
      currentExpectedTT: resetExpectedTT,
      currentActualTT: 0,
      currentDiff: 0,
      currentObservedVolume: 0,
      currentTotalVolume: resetActualTT,
      currentExpectedTotalVolume: resetExpectedTT,
      currentDisplayStand: isEmptyFillTT ? prevDisplayStand : resetStandDisplay,
      calculatedCumulativeVolume: currentCalcVolume,
      actualCumulativeVolume: get().actualCumulativeVolume,
      deviationStatus: newStatus,
      currentSection: newSection,
      inputValue: '',
    });

    saveSession(updatedSession);
  },

  addComment: (comment: string) => {
    const { session, currentActualTT, currentExpectedTT, currentTotalVolume } = get();
    if (!session || !session.isActive) return;
    const activeSegment = session.segments.find(
      (segment) => segment.id === session.activeSegmentId
    );
    if (!activeSegment) return;

    const newEvent: Event = {
      id: createId(),
      type: 'COMMENT',
      totalVolume: currentTotalVolume,
      expectedTotalVolume: currentExpectedTT,
      actualTT: currentTotalVolume,
      expectedTT: currentExpectedTT,
      diff: currentTotalVolume - currentExpectedTT,
      standNumber: getDisplayStandNumber(activeSegment.startStand, session.currentStand, session.mode),
      progressedStands: session.currentStand,
      calculatedCumulativeVolume: get().calculatedCumulativeVolume,
      actualCumulativeVolume: get().actualCumulativeVolume,
      gainLossVolume: get().gainLossVolume,
      comment,
      timestamp: Date.now(),
    };

    const updatedSegments = session.segments.map(segment => {
      if (segment.id === session.activeSegmentId) {
        return {
          ...segment,
          events: [...segment.events, newEvent],
        };
      }
      return segment;
    });

    const updatedSession: TripSession = {
      ...session,
      segments: updatedSegments,
      updatedAt: Date.now(),
    };

    set({ session: updatedSession });
    saveSession(updatedSession);
  },

  endSession: () => {
    const { session } = get();
    if (!session) return;

    const updatedSession: TripSession = {
      ...session,
      isActive: false,
      updatedAt: Date.now(),
    };

    set({ session: updatedSession });
    saveSession(updatedSession);
  },

  restoreSession: async () => {
    set({ isLoading: true });

    try {
      const loadedSession = await loadSession();
      const session = loadedSession ? normalizeSession(loadedSession) : null;

      if (session && session.isActive) {
        const allEvents = session.segments.flatMap((segment) => segment.events);
        const lastEvent = allEvents[allEvents.length - 1];
        const currentStand = session.currentStand;
        const observedVolume = lastEvent?.observedVolume ?? 0;
        const totalVolume = lastEvent?.totalVolume ?? session.resetBaselineVolume;
        const accumulatedSlugCorrection = session.accumulatedSlugCorrectionVolume || 0;
        const activeSegment = session.segments.find(
          (segment) => segment.id === session.activeSegmentId
        );
        const segmentStartStand = activeSegment?.startStand ?? 0;
        const calculatedCumulativeVolume = session.resetCalculatedBase + 
          calculateCumulativeVolumeFromSegment(
            currentStand,
            segmentStartStand,
            session.sections,
            session.mode,
            session.defaultDisplacementPerStand
          );
        console.log('[DEBUG restoreSession] resetCalculatedBase:', session.resetCalculatedBase);
        console.log('[DEBUG restoreSession] segmentStartStand:', segmentStartStand);
        console.log('[DEBUG restoreSession] currentStand:', currentStand);
        console.log('[DEBUG restoreSession] calculatedCumulativeVolume:', calculatedCumulativeVolume);
        const actualCumulativeVolume = lastEvent?.actualCumulativeVolume ?? 0;
        const localCalculatedVolume = calculatedCumulativeVolume - session.resetCalculatedBase;
        const expectedTT = session.resetBaselineVolume + localCalculatedVolume + accumulatedSlugCorrection;
        const gainLossVolume = calculateGainLossVolume(actualCumulativeVolume, calculatedCumulativeVolume);
        const diff = calculateDiff(totalVolume, expectedTT);
        const status = getDeviationStatus(diff, session.tolerance);
        const section = getCurrentSection(currentStand, session.sections);
        const displayStand = getDisplayStandNumber(activeSegment?.startStand ?? 0, currentStand, session.mode);

        set({
          session,
          currentExpectedTT: expectedTT,
          currentActualTT: observedVolume,
          currentDiff: diff,
          currentObservedVolume: observedVolume,
          currentTotalVolume: totalVolume,
          currentExpectedTotalVolume: expectedTT,
          currentDisplayStand: displayStand,
          calculatedCumulativeVolume,
          actualCumulativeVolume,
          gainLossVolume,
          deviationStatus: status,
          currentSection: section,
          inputValue: '',
        });

        await saveSession(session);
      }
    } catch (error) {
      console.error('Failed to restore TripGuard session:', error);
      await clearSession();
      set({
        session: null,
        inputValue: '',
        currentExpectedTT: 0,
        currentActualTT: 0,
        currentDiff: 0,
        currentObservedVolume: 0,
        currentTotalVolume: 0,
        currentExpectedTotalVolume: 0,
        currentDisplayStand: 0,
        calculatedCumulativeVolume: 0,
        actualCumulativeVolume: 0,
        gainLossVolume: 0,
        deviationStatus: 'OK',
        currentSection: null,
      });
    }

    set({ isLoading: false });
  },

  switchMode: (newMode: TripMode, newStand: number, resetVolumes: boolean) => {
    const { session, currentTotalVolume, currentExpectedTT, actualCumulativeVolume, calculatedCumulativeVolume, currentDisplayStand } = get();
    if (!session || !session.isActive) return;

    let newSegment: Segment;
    let updatedSegments: Segment[];
    let newResetBaselineVolume = currentTotalVolume;
    let newResetAccumulatedBase = actualCumulativeVolume;
    let newResetCalculatedBase = calculatedCumulativeVolume;
    let newActualCumulativeVolume: number;
    let newCalculatedCumulativeVolume: number;
    let newGainLossVolume = 0;

    if (resetVolumes) {
      newSegment = {
        id: createId(),
        startStand: newStand,
        startExpected: currentExpectedTT,
        startActual: currentTotalVolume,
        events: [],
        createdAt: Date.now(),
      };
      updatedSegments = [...session.segments, newSegment];
      newActualCumulativeVolume = 0;
      newCalculatedCumulativeVolume = 0;
    } else {
      newSegment = {
        id: createId(),
        startStand: newStand,
        startExpected: currentExpectedTT,
        startActual: currentTotalVolume,
        events: [],
        createdAt: Date.now(),
      };
      updatedSegments = [...session.segments, newSegment];
      newActualCumulativeVolume = actualCumulativeVolume;
      newCalculatedCumulativeVolume = 0;
    }

    const updatedSession: TripSession = {
      ...session,
      mode: newMode,
      currentStand: newStand,
      segments: updatedSegments,
      activeSegmentId: newSegment.id,
      resetBaselineVolume: newResetBaselineVolume,
      resetAccumulatedBase: newResetAccumulatedBase,
      resetCalculatedBase: newResetCalculatedBase,
      updatedAt: Date.now(),
    };

    set({ 
      session: updatedSession,
      actualCumulativeVolume: newActualCumulativeVolume,
      calculatedCumulativeVolume: newCalculatedCumulativeVolume,
      gainLossVolume: newGainLossVolume,
      currentTotalVolume: resetVolumes ? currentTotalVolume : currentTotalVolume,
      currentDisplayStand: getDisplayStandNumber(newStand, 0, newMode),
    });
    saveSession(updatedSession);
  },

  setDisplacementMode: (mode: 'open_end' | 'closed_end') => {
    console.log('=== setDisplacementMode START ===');
    console.log('Switching to mode:', mode);
    const { session } = get();
    if (!session || !session.isActive) {
      console.log('No session or not active');
      return;
    }

    console.log('--- Current Session State ---');
    console.log('  displacementMode before:', session.displacementMode);
    console.log('  defaultDisplacementPerStand before:', session.defaultDisplacementPerStand);
    console.log('  openEndDisplacement:', session.openEndDisplacement, 'L/m');
    console.log('  closedEndDisplacement:', session.closedEndDisplacement, 'L/m');

    const updatedSections = session.sections.map(section => ({
      ...section,
      displacementMode: mode,
    }));

    const newDefaultDisp = mode === 'open_end'
      ? (session.openEndDisplacement > 0 ? session.openEndDisplacement * session.averageStandLength / 1000 : 0)
      : (session.closedEndDisplacement > 0 ? session.closedEndDisplacement * session.averageStandLength / 1000 : 0);

    console.log('--- New Values ---');
    console.log('  New displacementMode:', mode);
    console.log('  New defaultDisplacementPerStand:', newDefaultDisp, 'm3/stand');
    console.log('  (Volume will be recalculated on next stand add)');

    const updatedSession: TripSession = {
      ...session,
      sections: updatedSections,
      displacementMode: mode,
      defaultDisplacementPerStand: newDefaultDisp,
      updatedAt: Date.now(),
    };

    set({ session: updatedSession });
    saveSession(updatedSession);
    console.log('=== setDisplacementMode COMPLETE ===');
  },

  clearCurrentSession: async () => {
    await clearSession();
    set({
      session: null,
      inputValue: '',
      currentExpectedTT: 0,
      currentActualTT: 0,
      currentDiff: 0,
      currentObservedVolume: 0,
      currentTotalVolume: 0,
      currentExpectedTotalVolume: 0,
      currentDisplayStand: 0,
      calculatedCumulativeVolume: 0,
      actualCumulativeVolume: 0,
      gainLossVolume: 0,
      deviationStatus: 'OK',
      currentSection: null,
    });
  },
}));
