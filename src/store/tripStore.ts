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
}

function normalizeSession(session: TripSession): TripSession {
  const steelDisplacementPerMeter = session.steelDisplacementPerMeter ?? 5.03;
  const averageStandLength = session.averageStandLength ?? 28.83;
  const defaultDisplacementPerStand = session.defaultDisplacementPerStand ?? calculateDisplacementFromSheet(
    steelDisplacementPerMeter,
    averageStandLength
  );

  return {
    ...session,
    startStand: session.startStand ?? 0,
    loggingInterval: session.loggingInterval ?? 5,
    steelDisplacementPerMeter,
    averageStandLength,
    defaultDisplacementPerStand,
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
    const totalStands = calculateTotalStands(config.sections) || config.totalStands;
    const defaultDisplacementPerStand = config.sections.length > 0
      ? 0
      : calculateDisplacementFromSheet(config.steelDisplacementPerMeter, config.averageStandLength);
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
      steelDisplacementPerMeter: config.steelDisplacementPerMeter,
      averageStandLength: config.averageStandLength,
      defaultDisplacementPerStand,
      currentStand: 0,
      sections: config.sections,
      segments: [firstSegment],
      activeSegmentId: firstSegment.id,
      isActive: true,
      initialTT: config.initialTT,
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

    const newStand = (() => {
      if (step) {
        return Math.min(session.currentStand + step, session.totalStands);
      }

      const nextDisplayStand = getNextScheduledDisplayStand(
        currentDisplayStand,
        session.startStand,
        session.loggingInterval,
        session.mode
      );
      const nextProgressedStand = getProgressedStandsFromDisplay(
        session.startStand,
        nextDisplayStand,
        session.mode
      );

      return Math.min(nextProgressedStand, session.totalStands);
    })();
    const accumulatedSlugCorrection = session.accumulatedSlugCorrectionVolume || 0;
    const activeSegment = session.segments.find(
      (segment) => segment.id === session.activeSegmentId
    );
    if (!activeSegment) return;

    const calculatedCumulativeVolume = calculateCumulativeVolumeFromSegment(
      newStand,
      0,
      session.sections,
      session.mode,
      session.defaultDisplacementPerStand
    );

    const actualCumulativeVolume = get().actualCumulativeVolume + (observedVolume * observedDirection);
    const gainLossVolume = calculateGainLossVolume(actualCumulativeVolume, calculatedCumulativeVolume);
    const localAccumulatedVolume = actualCumulativeVolume - session.resetAccumulatedBase;
    const localCalculatedVolume = calculatedCumulativeVolume - session.resetCalculatedBase;
    const currentTotalVolume = session.resetBaselineVolume + localAccumulatedVolume;
    const expectedTotalVolume = session.resetBaselineVolume + localCalculatedVolume + accumulatedSlugCorrection;
    const newExpected = expectedTotalVolume;

    const diff = calculateDiff(currentTotalVolume, expectedTotalVolume);
    const status = getDeviationStatus(diff, session.tolerance);
    const displayStand = getDisplayStandNumber(session.startStand, newStand, session.mode);

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
      standNumber: getDisplayStandNumber(session.startStand, session.currentStand, session.mode),
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
    const { session } = get();
    if (!session || !session.isActive) return;
    if (Number.isNaN(resetActualTT)) return;

    const resetProgressedStand = Math.min(
      getProgressedStandsFromDisplay(session.startStand, resetStandDisplay, session.mode),
      session.totalStands
    );
    const accumulatedSlugCorrection = session.accumulatedSlugCorrectionVolume || 0;
    const calculatedCumulativeVolume = calculateCumulativeVolumeFromSegment(
      resetProgressedStand,
      0,
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
      standNumber: resetStandDisplay,
      progressedStands: resetProgressedStand,
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

    const newSegment: Segment = {
      id: createId(),
      startStand: resetProgressedStand,
      startExpected: resetExpectedTT,
      startActual: resetActualTT,
      events: [],
      createdAt: Date.now(),
    };

    const updatedSession: TripSession = {
      ...session,
      currentStand: resetProgressedStand,
      segments: [...updatedSegments, newSegment],
      activeSegmentId: newSegment.id,
      resetBaselineVolume: resetActualTT,
      resetAccumulatedBase: get().actualCumulativeVolume,
      resetCalculatedBase: calculatedCumulativeVolume,
      accumulatedSlugCorrectionVolume: 0,
      updatedAt: Date.now(),
    };

    const newSection = getCurrentSection(resetProgressedStand, session.sections);

    const resetDiff = resetActualTT - (session.resetBaselineVolume + localCalculatedVolume + accumulatedSlugCorrection);
    const newStatus = getDeviationStatus(resetDiff, session.tolerance);

    set({
      session: updatedSession,
      currentExpectedTT: resetExpectedTT,
      currentActualTT: 0,
      currentDiff: 0,
      currentObservedVolume: 0,
      currentTotalVolume: resetActualTT,
      currentExpectedTotalVolume: resetExpectedTT,
      currentDisplayStand: resetStandDisplay,
      calculatedCumulativeVolume,
      deviationStatus: newStatus,
      currentSection: newSection,
      inputValue: '',
    });

    saveSession(updatedSession);
  },

  addComment: (comment: string) => {
    const { session, currentActualTT, currentExpectedTT, currentTotalVolume } = get();
    if (!session || !session.isActive) return;

    const newEvent: Event = {
      id: createId(),
      type: 'COMMENT',
      totalVolume: currentTotalVolume,
      expectedTotalVolume: currentExpectedTT,
      actualTT: currentTotalVolume,
      expectedTT: currentExpectedTT,
      diff: currentTotalVolume - currentExpectedTT,
      standNumber: getDisplayStandNumber(session.startStand, session.currentStand, session.mode),
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
        const calculatedCumulativeVolume = calculateCumulativeVolumeFromSegment(
          currentStand,
          0,
          session.sections,
          session.mode,
          session.defaultDisplacementPerStand
        );
        const actualCumulativeVolume = lastEvent?.actualCumulativeVolume ?? 0;
        const localCalculatedVolume = calculatedCumulativeVolume - session.resetCalculatedBase;
        const expectedTT = session.resetBaselineVolume + localCalculatedVolume + accumulatedSlugCorrection;
        const gainLossVolume = calculateGainLossVolume(actualCumulativeVolume, calculatedCumulativeVolume);
        const diff = calculateDiff(totalVolume, expectedTT);
        const status = getDeviationStatus(diff, session.tolerance);
        const section = getCurrentSection(currentStand, session.sections);
        const displayStand = getDisplayStandNumber(session.startStand, currentStand, session.mode);

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
