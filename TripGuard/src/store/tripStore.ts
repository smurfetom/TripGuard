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
  calculateExpectedFromSegment,
  calculateDiff,
  getDeviationStatus,
  getCurrentSection,
  calculateTotalStands,
} from '../utils/calculations';
import { saveSession, loadSession, clearSession } from '../utils/storage';
import { createId } from '../utils/id';

interface TripState {
  session: TripSession | null;
  inputValue: string;
  currentExpectedTT: number;
  currentActualTT: number;
  currentDiff: number;
  deviationStatus: DeviationStatus;
  currentSection: Section | null;
  isLoading: boolean;
  
  startSession: (config: TripConfig) => void;
  setInputValue: (value: string) => void;
  addStand: () => void;
  addSlug: (volume: number) => void;
  surfaceReset: () => void;
  addComment: (comment: string) => void;
  endSession: () => void;
  restoreSession: () => Promise<void>;
  clearCurrentSession: () => Promise<void>;
}

export const useTripStore = create<TripState>((set, get) => ({
  session: null,
  inputValue: '',
  currentExpectedTT: 0,
  currentActualTT: 0,
  currentDiff: 0,
  deviationStatus: 'OK',
  currentSection: null,
  isLoading: false,

  startSession: (config: TripConfig) => {
    const totalStands = calculateTotalStands(config.sections) || config.totalStands;
    
    const initialExpected = calculateExpectedTT(
      0,
      config.sections,
      config.mode,
      config.initialTT
    );

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
      currentStand: 0,
      sections: config.sections,
      segments: [firstSegment],
      activeSegmentId: firstSegment.id,
      isActive: true,
      initialTT: config.initialTT,
      accumulatedSlugVolume: 0,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    set({
      session,
      inputValue: config.initialTT.toString(),
      currentExpectedTT: initialExpected,
      currentActualTT: config.initialTT,
      currentDiff: config.initialTT - initialExpected,
      deviationStatus: getDeviationStatus(config.initialTT - initialExpected, config.tolerance),
      currentSection: config.sections.length > 0 ? config.sections[0] : null,
    });

    saveSession(session);
  },

  setInputValue: (value: string) => {
    const sanitized = value.replace(/[^0-9.,-]/g, '').replace(/,/g, '.');
    set({ inputValue: sanitized });
  },

  addStand: () => {
    const { session, inputValue } = get();
    if (!session || !session.isActive) return;
    if (session.currentStand >= session.totalStands) return;

    const actualTT = parseFloat(inputValue.replace(/,/g, '.'));
    if (isNaN(actualTT)) return;

    const newStand = session.currentStand + 1;
    const accumulatedSlug = session.accumulatedSlugVolume || 0;
    const activeSegment = session.segments.find(
      (segment) => segment.id === session.activeSegmentId
    );
    if (!activeSegment) return;
    
    const newExpected = calculateExpectedFromSegment(
      newStand,
      activeSegment.startStand,
      session.sections,
      session.mode,
      activeSegment.startExpected,
      accumulatedSlug
    );

    const diff = calculateDiff(actualTT, newExpected);
    const status = getDeviationStatus(diff, session.tolerance);

    const newEvent: Event = {
      id: createId(),
      type: 'ADD_STAND',
      actualTT,
      expectedTT: newExpected,
      diff,
      standNumber: newStand,
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
      currentActualTT: actualTT,
      currentDiff: diff,
      deviationStatus: status,
      currentSection: newSection,
      inputValue: '',
    });

    saveSession(updatedSession);
  },

  addSlug: (volume: number) => {
    const { session, currentActualTT, currentExpectedTT } = get();
    if (!session || !session.isActive || session.mode !== 'POOH') return;

    const newExpected = currentExpectedTT + volume;
    const newAccumulatedSlug = (session.accumulatedSlugVolume || 0) + volume;

    const newEvent: Event = {
      id: createId(),
      type: 'SLUG',
      actualTT: currentActualTT,
      expectedTT: newExpected,
      diff: currentActualTT - newExpected,
      standNumber: session.currentStand,
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
      accumulatedSlugVolume: newAccumulatedSlug,
      updatedAt: Date.now(),
    };

    set({
      session: updatedSession,
      currentExpectedTT: newExpected,
      currentDiff: calculateDiff(currentActualTT, newExpected),
      deviationStatus: getDeviationStatus(currentActualTT - newExpected, session.tolerance),
    });

    saveSession(updatedSession);
  },

  surfaceReset: () => {
    const { session, currentActualTT, currentExpectedTT } = get();
    if (!session || !session.isActive) return;

    const newEvent: Event = {
      id: createId(),
      type: 'SURFACE_RESET',
      actualTT: currentActualTT,
      expectedTT: currentExpectedTT,
      diff: currentActualTT - currentExpectedTT,
      standNumber: session.currentStand,
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
      startStand: session.currentStand,
      startExpected: currentActualTT,
      startActual: currentActualTT,
      events: [],
      createdAt: Date.now(),
    };

    const updatedSession: TripSession = {
      ...session,
      segments: [...updatedSegments, newSegment],
      activeSegmentId: newSegment.id,
      accumulatedSlugVolume: 0,
      updatedAt: Date.now(),
    };

    set({
      session: updatedSession,
      currentExpectedTT: currentActualTT,
      currentDiff: 0,
      deviationStatus: 'OK',
    });

    saveSession(updatedSession);
  },

  addComment: (comment: string) => {
    const { session, currentActualTT, currentExpectedTT } = get();
    if (!session || !session.isActive) return;

    const newEvent: Event = {
      id: createId(),
      type: 'COMMENT',
      actualTT: currentActualTT,
      expectedTT: currentExpectedTT,
      diff: currentActualTT - currentExpectedTT,
      standNumber: session.currentStand,
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
    
    const session = await loadSession();
    
    if (session && session.isActive) {
      const activeSegment = session.segments.find(s => s.id === session.activeSegmentId);
      const allEvents = session.segments.flatMap((segment) => segment.events);
      const lastEvent = allEvents[allEvents.length - 1];
      const currentStand = session.currentStand;
      const actualTT = lastEvent?.actualTT ?? session.initialTT;
      const accumulatedSlug = session.accumulatedSlugVolume || 0;
      const expectedTT = activeSegment
        ? calculateExpectedFromSegment(
            currentStand,
            activeSegment.startStand,
            session.sections,
            session.mode,
            activeSegment.startExpected,
            accumulatedSlug
          )
        : calculateExpectedTT(
            currentStand,
            session.sections,
            session.mode,
            session.initialTT,
            accumulatedSlug
          );
      const diff = calculateDiff(actualTT, expectedTT);
      const status = getDeviationStatus(diff, session.tolerance);
      const section = getCurrentSection(currentStand, session.sections);

      set({
        session,
        currentExpectedTT: expectedTT,
        currentActualTT: actualTT,
        currentDiff: diff,
        deviationStatus: status,
        currentSection: section,
        inputValue: '',
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
      deviationStatus: 'OK',
      currentSection: null,
    });
  },
}));
