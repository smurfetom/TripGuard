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
import { SPACING, FONT_SIZES, BORDER_RADIUS } from '../constants/theme';
import { Button, ValueDisplay, ProgressBar, InputPad, TrendSlope, EventItem } from '../components';
import { useTripStore } from '../store/tripStore';
import { exportTripCsv } from '../utils/export';
import { ResetType } from '../types';
import { useAppTheme } from '../theme/ThemeProvider';

type DrillerScreenProps = {
  onOpenMirror: () => void;
  onNewTrip: () => void;
};

export function DrillerScreen({ onOpenMirror, onNewTrip }: DrillerScreenProps) {
  const { colors, themeMode, setThemeMode } = useAppTheme();
  const styles = React.useMemo(() => createStyles(colors), [colors]);
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
  const [resetStand, setResetStand] = useState('');
  const [resetType, setResetType] = useState<ResetType>('SURFACE_EVENT');

  const getGainLossStatus = () => {
    const absGainLoss = Math.abs(gainLossVolume);
    if (absGainLoss <= session.tolerance * 0.5) return 'OK';
    if (absGainLoss <= session.tolerance) return 'WARNING';
    return 'ALARM';
  };

  if (!session) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loading}>
          <Text style={styles.loadingText}>Loading session...</Text>
        </View>
      </SafeAreaView>
    );
  }

  const allEvents = session.segments.flatMap(s => s.events).reverse();
  const addStandEvents = allEvents.filter(e => e.type === 'ADD_STAND');
  const lastEvent = allEvents[0];

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
    const parsedResetStand = parseInt(resetStand, 10);
    if (isNaN(parsedResetValue)) {
      Alert.alert('Invalid Volume', 'Enter the new observed trip tank volume before resetting.');
      return;
    }
    if (isNaN(parsedResetStand)) {
      Alert.alert('Invalid Stand', 'Enter the current stand number for the reset event.');
      return;
    }

    surfaceReset(parsedResetValue, parsedResetStand, resetType, resetComment);
    setResetValue('');
    setResetComment('');
    setResetStand('');
    setShowResetModal(false);
  };

  const openResetModal = (type: ResetType) => {
    setResetType(type);
    setResetStand(String(currentDisplayStand));
    setResetValue(String(currentTotalVolume));
    setResetComment('');
    setShowResetModal(true);
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
      case 'OK': return colors.success;
      case 'WARNING': return colors.warning;
      case 'ALARM': return colors.danger;
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <View style={[
              styles.modeBadge,
              { backgroundColor: session.mode === 'RIH' ? colors.accent : colors.warning }
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
            <TouchableOpacity
              style={styles.headerAction}
              onPress={() => void setThemeMode(themeMode === 'dark' ? 'light' : 'dark')}
            >
              <Text style={styles.headerActionText}>{themeMode === 'dark' ? 'Light' : 'Dark'}</Text>
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
            size="large"
            style={styles.valueItem}
          />
          <ValueDisplay
            label="Gain / Loss"
            value={gainLossVolume}
            unit={session.volumeUnit}
            status={getGainLossStatus()}
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
            valueColor={colors.white}
          />
          <ValueDisplay
            label="TT Volume"
            value={currentTotalVolume}
            unit={session.volumeUnit}
            style={styles.volumeItem}
            valueColor={colors.white}
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
                tolerance={session.tolerance}
              />
            ))}
          </View>
        )}

        <View style={styles.spacer} />
      </ScrollView>

<View style={styles.inputSection}>
          <View style={styles.actionsLeft}>
            {session.mode === 'POOH' && (
              <Button
                title="+ SLUG"
                variant="secondary"
                size="small"
                onPress={() => setShowSlugModal(true)}
                style={styles.actionButtonSmall}
              />
            )}
            <Button
              title="END TRIP"
              variant="danger"
              size="small"
              onPress={() => setShowEndTripModal(true)}
              style={styles.actionButtonSmall}
            />
            <Button
              title="SURFACE RESET"
              variant="secondary"
              size="small"
              onPress={() => openResetModal('SURFACE_EVENT')}
              style={styles.actionButtonSmall}
            />
            <Button
              title="EMPTY/FILL TT"
              variant="secondary"
              size="small"
              onPress={() => openResetModal('EMPTY_FILL_TT')}
              style={styles.actionButtonSmall}
            />
            <Button
              title="COMMENT"
              variant="secondary"
              size="small"
              onPress={() => setShowCommentModal(true)}
              style={styles.actionButtonSmall}
            />
          </View>

          <View style={styles.inputRight}>
            {session.loggingInterval > 1 && (
              <Button
                title="LOG SINGLE"
                variant="outline"
                size="small"
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
              Enter the exact stand and new tank baseline. The trip gain/loss continues, but total volume is rebaselined from this point.
            </Text>
            <View style={styles.resetTypeRow}>
              <TouchableOpacity
                style={[styles.resetTypeButton, resetType === 'SURFACE_EVENT' && styles.resetTypeButtonActive]}
                onPress={() => setResetType('SURFACE_EVENT')}
              >
                <Text style={[styles.resetTypeText, resetType === 'SURFACE_EVENT' && styles.resetTypeTextActive]}>Surface Event</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.resetTypeButton, resetType === 'EMPTY_FILL_TT' && styles.resetTypeButtonActive]}
                onPress={() => setResetType('EMPTY_FILL_TT')}
              >
                <Text style={[styles.resetTypeText, resetType === 'EMPTY_FILL_TT' && styles.resetTypeTextActive]}>Empty/Fill TT</Text>
              </TouchableOpacity>
            </View>
            <TextInput
              style={styles.modalInput}
              value={resetStand}
              onChangeText={setResetStand}
              keyboardType="number-pad"
              placeholder="Current stand"
              placeholderTextColor={colors.textSecondary}
              autoFocus
            />
            <TextInput
              style={styles.modalInput}
              value={resetValue}
              onChangeText={setResetValue}
              keyboardType="decimal-pad"
              placeholder={`New actual TT (${session.volumeUnit})`}
              placeholderTextColor={colors.textSecondary}
              autoFocus
            />
            <TextInput
              style={[styles.modalInput, styles.commentInput]}
              value={resetComment}
              onChangeText={setResetComment}
              placeholder="Optional comment"
              placeholderTextColor={colors.textSecondary}
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
                  setResetStand('');
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
              placeholderTextColor={colors.textSecondary}
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
              placeholderTextColor={colors.textSecondary}
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

const createStyles = (colors: ReturnType<typeof useAppTheme>['colors']) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  loading: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    fontSize: FONT_SIZES.body,
    color: colors.textSecondary,
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
    backgroundColor: colors.surface,
    borderRadius: BORDER_RADIUS.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  headerActionText: {
    fontSize: FONT_SIZES.caption,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  modeBadge: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
    borderRadius: BORDER_RADIUS.sm,
  },
  modeText: {
    fontSize: FONT_SIZES.body,
    fontWeight: '700',
    color: colors.white,
  },
  sectionName: {
    fontSize: FONT_SIZES.caption,
    color: colors.textSecondary,
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
    color: colors.textSecondary,
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
    borderTopColor: colors.border,
  },
  logToggleText: {
    fontSize: FONT_SIZES.body,
    color: colors.textSecondary,
  },
  logCount: {
    fontSize: FONT_SIZES.caption,
    color: colors.textSecondary,
  },
  log: {
    marginTop: SPACING.md,
  },
  spacer: {
    height: 120,
  },
  inputSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    paddingHorizontal: SPACING.sm,
    paddingTop: SPACING.xs,
    paddingBottom: SPACING.xs,
    backgroundColor: colors.background,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  actionsLeft: {
    width: '45%',
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 3,
  },
  inputRight: {
    width: '50%',
  },
  actionButtonSmall: {
    flex: 1,
    minWidth: '45%',
  },
  singleStandButton: {
    marginBottom: 4,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modal: {
    backgroundColor: colors.surface,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.lg,
    width: '80%',
    maxWidth: 320,
  },
  modalTitle: {
    fontSize: FONT_SIZES.heading,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: SPACING.md,
  },
  modalHelper: {
    fontSize: FONT_SIZES.caption,
    color: colors.textSecondary,
    marginBottom: SPACING.md,
    lineHeight: 20,
  },
  resetTypeRow: {
    flexDirection: 'row',
    gap: SPACING.sm,
    marginBottom: SPACING.md,
  },
  resetTypeButton: {
    flex: 1,
    backgroundColor: colors.background,
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: SPACING.sm,
    alignItems: 'center',
  },
  resetTypeButtonActive: {
    backgroundColor: colors.accent,
    borderColor: colors.accent,
  },
  resetTypeText: {
    fontSize: FONT_SIZES.caption,
    color: colors.textPrimary,
    fontWeight: '600',
  },
  resetTypeTextActive: {
    color: colors.white,
  },
  modalInput: {
    backgroundColor: colors.background,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
    fontSize: FONT_SIZES.body,
    color: colors.textPrimary,
    borderWidth: 1,
    borderColor: colors.border,
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
