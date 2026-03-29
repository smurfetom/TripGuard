import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Modal,
  TextInput,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS, SPACING, FONT_SIZES, BORDER_RADIUS } from '../constants/theme';
import { Button, ValueDisplay, ProgressBar, InputPad, TrendSlope, EventItem } from '../components';
import { useTripStore } from '../store/tripStore';
import { exportTripCsv } from '../utils/export';

type DrillerScreenProps = {
  onOpenMirror: () => void;
  onNewTrip: () => void;
};

export function DrillerScreen({ onOpenMirror, onNewTrip }: DrillerScreenProps) {
  const {
    session,
    inputValue,
    setInputValue,
    addStand,
    addSlug,
    surfaceReset,
    addComment,
    currentObservedVolume,
    currentTotalVolume,
    currentDisplayStand,
    calculatedCumulativeVolume,
    actualCumulativeVolume,
    gainLossVolume,
    deviationStatus,
    currentSection,
    clearCurrentSession,
  } = useTripStore();
  
  const [showLog, setShowLog] = useState(false);
  const [showSlugModal, setShowSlugModal] = useState(false);
  const [showCommentModal, setShowCommentModal] = useState(false);
  const [showResetModal, setShowResetModal] = useState(false);
  const [showEndTripModal, setShowEndTripModal] = useState(false);
  const [slugValue, setSlugValue] = useState('');
  const [commentValue, setCommentValue] = useState('');
  const [resetValue, setResetValue] = useState('');
  const [resetComment, setResetComment] = useState('');
  if (!session) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loading}>
          <Text style={styles.loadingText}>Loading session...</Text>
        </View>
      </SafeAreaView>
    );
  }

  const allEvents = session.segments.flatMap(s => s.events).slice(-10).reverse();
  const addStandEvents = allEvents.filter(e => e.type === 'ADD_STAND');

  const handleAddStand = () => {
    if (!inputValue) return;
    addStand();
  };

  const handleSingleStandLog = () => {
    if (!inputValue) return;
    addStand(1);
  };

  const handleSlug = () => {
    const volume = parseFloat(slugValue.replace(/,/g, '.'));
    if (isNaN(volume) || volume <= 0) {
      Alert.alert('Invalid Volume', 'Please enter a valid slug volume');
      return;
    }
    addSlug(volume);
    setSlugValue('');
    setShowSlugModal(false);
  };

  const handleComment = () => {
    if (!commentValue.trim()) return;
    addComment(commentValue.trim());
    setCommentValue('');
    setShowCommentModal(false);
  };

  const handleSurfaceReset = () => {
    const parsedResetValue = parseFloat(resetValue.replace(/,/g, '.'));
    if (isNaN(parsedResetValue)) {
      Alert.alert('Invalid Volume', 'Enter the new observed trip tank volume before resetting.');
      return;
    }

    surfaceReset(parsedResetValue, resetComment);
    setResetValue('');
    setResetComment('');
    setShowResetModal(false);
  };

  const handleExportCsv = async () => {
    try {
      await exportTripCsv(session);
    } catch {
      Alert.alert('Export Failed', 'Unable to export the trip log right now.');
    }
  };

  const finishTrip = () => {
    useTripStore.getState().endSession();
    setShowEndTripModal(false);
    onNewTrip();
  };

  const handleSaveAndEnd = async () => {
    try {
      await exportTripCsv(session);
      finishTrip();
    } catch {
      if (Platform.OS === 'web') {
        const confirmed = window.confirm('CSV export failed. End trip without saving?');
        if (confirmed) {
          finishTrip();
        }
        return;
      }

      Alert.alert('Export Failed', 'Unable to export the trip log right now.', [
        { text: 'Cancel', style: 'cancel' },
        { text: 'End Without Saving', style: 'destructive', onPress: finishTrip },
      ]);
    }
  };

  const handleNewTrip = () => {
    if (Platform.OS === 'web') {
      const confirmed = window.confirm('This will clear the current session and return to setup. Continue?');
      if (!confirmed) return;
      clearCurrentSession().then(onNewTrip);
      return;
    }

    Alert.alert(
      'New Trip',
      'This will clear the current session. Continue?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'New Trip', 
          onPress: async () => {
            await clearCurrentSession();
            onNewTrip();
          }
        },
      ]
    );
  };

  const getStatusColor = () => {
    switch (deviationStatus) {
      case 'OK': return COLORS.success;
      case 'WARNING': return COLORS.warning;
      case 'ALARM': return COLORS.danger;
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <View style={[
              styles.modeBadge,
              { backgroundColor: session.mode === 'RIH' ? COLORS.accent : COLORS.warning }
            ]}>
              <Text style={styles.modeText}>{session.mode}</Text>
            </View>
            {currentSection && (
              <Text style={styles.sectionName}>{currentSection.name}</Text>
            )}
          </View>
          <View style={styles.headerRight}>
            <TouchableOpacity style={styles.headerAction} onPress={onOpenMirror}>
              <Text style={styles.headerActionText}>Mirror</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.headerAction} onPress={handleExportCsv}>
              <Text style={styles.headerActionText}>CSV</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.headerAction} onPress={handleNewTrip}>
              <Text style={styles.headerActionText}>Setup</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.tripMetaRow}>
          <Text style={styles.tripMetaText}>Current Stand: {currentDisplayStand}</Text>
          <Text style={styles.tripMetaText}>Logging: every {session.loggingInterval}</Text>
        </View>

        <ProgressBar 
          current={session.currentStand} 
          total={session.totalStands}
          style={styles.progress}
        />

        <View style={styles.valuesRow}>
          <ValueDisplay
            label="Calculated Volume"
            value={calculatedCumulativeVolume}
            unit={session.volumeUnit}
            size="large"
            style={styles.valueItem}
          />
          <ValueDisplay
            label="Accumulated Volume"
            value={actualCumulativeVolume}
            unit={session.volumeUnit}
            status={deviationStatus}
            size="large"
            style={styles.valueItem}
          />
          <ValueDisplay
            label="Gain / Loss"
            value={gainLossVolume}
            unit={session.volumeUnit}
            status={deviationStatus}
            size="large"
            style={styles.valueItem}
          />
        </View>

        <View style={styles.volumeGrid}>
          <ValueDisplay
            label="Observed Volume"
            value={currentObservedVolume}
            unit={session.volumeUnit}
            style={styles.volumeItem}
          />
          <ValueDisplay
            label="Total Volume"
            value={currentTotalVolume}
            unit={session.volumeUnit}
            style={styles.volumeItem}
          />
        </View>

        {addStandEvents.length > 1 && (
          <TrendSlope
            events={allEvents}
            totalStands={session.totalStands}
            tolerance={session.tolerance}
            currentStand={session.currentStand}
            style={styles.trend}
          />
        )}

        <View style={styles.actions}>
          {session.mode === 'POOH' && (
            <Button
              title="+ SLUG"
              variant="secondary"
              onPress={() => setShowSlugModal(true)}
              style={styles.actionButton}
            />
          )}
          <Button
            title="END TRIP"
            variant="danger"
            onPress={() => setShowEndTripModal(true)}
            style={styles.actionButton}
          />
          <Button
            title="SURFACE RESET"
            variant="secondary"
            onPress={() => setShowResetModal(true)}
            style={styles.actionButton}
          />
          <Button
            title="COMMENT"
            variant="secondary"
            onPress={() => setShowCommentModal(true)}
            style={styles.actionButton}
          />
        </View>

        <TouchableOpacity 
          style={styles.logToggle}
          onPress={() => setShowLog(!showLog)}
        >
          <Text style={styles.logToggleText}>
            {showLog ? '▼ Hide Log' : '▲ Show Log'}
          </Text>
          <Text style={styles.logCount}>{allEvents.length} events</Text>
        </TouchableOpacity>

        {showLog && (
          <View style={styles.log}>
            {allEvents.map((event) => (
              <EventItem 
                key={event.id} 
                event={event} 
                volumeUnit={session.volumeUnit}
              />
            ))}
          </View>
        )}

        <View style={styles.spacer} />
      </ScrollView>

      <View style={styles.inputSection}>
        {session.loggingInterval > 1 && (
          <Button
            title="LOG SINGLE STAND"
            variant="outline"
            onPress={handleSingleStandLog}
            disabled={!inputValue || session.currentStand >= session.totalStands}
            style={styles.singleStandButton}
          />
        )}
        <InputPad
          value={inputValue}
          onChange={setInputValue}
          unit={session.volumeUnit}
          onSubmit={handleAddStand}
          submitLabel={`LOG ${session.loggingInterval} STAND${session.loggingInterval > 1 ? 'S' : ''}`}
          submitDisabled={session.currentStand >= session.totalStands}
        />
      </View>

      <Modal
        visible={showEndTripModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowEndTripModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modal}>
            <Text style={styles.modalTitle}>End Trip</Text>
            <Text style={styles.modalHelper}>
              Export the trip to CSV before ending, or end the trip without saving.
            </Text>
            <View style={styles.modalStackActions}>
              <Button title="Save and End" onPress={handleSaveAndEnd} />
              <Button title="End Without Saving" variant="danger" onPress={finishTrip} />
              <Button title="Cancel" variant="secondary" onPress={() => setShowEndTripModal(false)} />
            </View>
          </View>
        </View>
      </Modal>

      <Modal
        visible={showResetModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowResetModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modal}>
            <Text style={styles.modalTitle}>Surface Reset</Text>
            <Text style={styles.modalHelper}>
              Enter the new observed trip tank volume. This starts a fresh monitoring segment.
            </Text>
            <TextInput
              style={styles.modalInput}
              value={resetValue}
              onChangeText={setResetValue}
              keyboardType="decimal-pad"
              placeholder={`New actual TT (${session.volumeUnit})`}
              placeholderTextColor={COLORS.textSecondary}
              autoFocus
            />
            <TextInput
              style={[styles.modalInput, styles.commentInput]}
              value={resetComment}
              onChangeText={setResetComment}
              placeholder="Optional comment"
              placeholderTextColor={COLORS.textSecondary}
              multiline
            />
            <View style={styles.modalActions}>
              <Button
                title="Cancel"
                variant="secondary"
                onPress={() => {
                  setShowResetModal(false);
                  setResetValue('');
                  setResetComment('');
                }}
                style={styles.modalButton}
              />
              <Button
                title="Reset"
                onPress={handleSurfaceReset}
                style={styles.modalButton}
              />
            </View>
          </View>
        </View>
      </Modal>

      <Modal
        visible={showSlugModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowSlugModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modal}>
            <Text style={styles.modalTitle}>Add Slug</Text>
            <TextInput
              style={styles.modalInput}
              value={slugValue}
              onChangeText={setSlugValue}
              keyboardType="decimal-pad"
              placeholder="Enter slug volume"
              placeholderTextColor={COLORS.textSecondary}
              autoFocus
            />
            <View style={styles.modalActions}>
              <Button
                title="Cancel"
                variant="secondary"
                onPress={() => setShowSlugModal(false)}
                style={styles.modalButton}
              />
              <Button
                title="Add"
                onPress={handleSlug}
                style={styles.modalButton}
              />
            </View>
          </View>
        </View>
      </Modal>

      <Modal
        visible={showCommentModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowCommentModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modal}>
            <Text style={styles.modalTitle}>Add Comment</Text>
            <TextInput
              style={[styles.modalInput, styles.commentInput]}
              value={commentValue}
              onChangeText={setCommentValue}
              placeholder="Enter comment"
              placeholderTextColor={COLORS.textSecondary}
              multiline
              autoFocus
            />
            <View style={styles.modalActions}>
              <Button
                title="Cancel"
                variant="secondary"
                onPress={() => setShowCommentModal(false)}
                style={styles.modalButton}
              />
              <Button
                title="Add"
                onPress={handleComment}
                style={styles.modalButton}
              />
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  loading: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    fontSize: FONT_SIZES.body,
    color: COLORS.textSecondary,
  },
  scroll: {
    flex: 1,
  },
  content: {
    padding: SPACING.md,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerRight: {
    flexDirection: 'row',
  },
  headerAction: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    marginLeft: SPACING.sm,
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.sm,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  headerActionText: {
    fontSize: FONT_SIZES.caption,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
  modeBadge: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
    borderRadius: BORDER_RADIUS.sm,
  },
  modeText: {
    fontSize: FONT_SIZES.body,
    fontWeight: '700',
    color: COLORS.white,
  },
  sectionName: {
    fontSize: FONT_SIZES.caption,
    color: COLORS.textSecondary,
    marginLeft: SPACING.sm,
  },
  progress: {
    marginBottom: SPACING.md,
  },
  tripMetaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: SPACING.md,
  },
  tripMetaText: {
    fontSize: FONT_SIZES.caption,
    color: COLORS.textSecondary,
  },
  valuesRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: SPACING.md,
  },
  valueItem: {
    flex: 1,
  },
  trend: {
    marginBottom: SPACING.md,
  },
  volumeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm,
    marginBottom: SPACING.md,
  },
  volumeItem: {
    width: '48%',
  },
  actions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: SPACING.md,
    gap: SPACING.sm,
  },
  actionButton: {
    flex: 1,
    minWidth: '45%',
  },
  logToggle: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: SPACING.sm,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  logToggleText: {
    fontSize: FONT_SIZES.body,
    color: COLORS.textSecondary,
  },
  logCount: {
    fontSize: FONT_SIZES.caption,
    color: COLORS.textSecondary,
  },
  log: {
    marginTop: SPACING.md,
  },
  spacer: {
    height: 120,
  },
  inputSection: {
    paddingHorizontal: SPACING.md,
    paddingTop: SPACING.sm,
    paddingBottom: SPACING.sm,
    backgroundColor: COLORS.background,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  singleStandButton: {
    marginBottom: SPACING.sm,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modal: {
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.lg,
    width: '80%',
    maxWidth: 320,
  },
  modalTitle: {
    fontSize: FONT_SIZES.heading,
    fontWeight: '600',
    color: COLORS.textPrimary,
    marginBottom: SPACING.md,
  },
  modalHelper: {
    fontSize: FONT_SIZES.caption,
    color: COLORS.textSecondary,
    marginBottom: SPACING.md,
    lineHeight: 20,
  },
  modalInput: {
    backgroundColor: COLORS.background,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
    fontSize: FONT_SIZES.body,
    color: COLORS.textPrimary,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: SPACING.md,
  },
  commentInput: {
    height: 100,
    textAlignVertical: 'top',
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: SPACING.sm,
  },
  modalStackActions: {
    gap: SPACING.sm,
  },
  modalButton: {
    minWidth: 80,
  },
});
