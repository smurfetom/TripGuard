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
    currentExpectedTT,
    currentActualTT,
    currentDiff,
    deviationStatus,
    currentSection,
    clearCurrentSession,
  } = useTripStore();
  
  const [showLog, setShowLog] = useState(false);
  const [showSlugModal, setShowSlugModal] = useState(false);
  const [showCommentModal, setShowCommentModal] = useState(false);
  const [slugValue, setSlugValue] = useState('');
  const [commentValue, setCommentValue] = useState('');
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

  const handleExportCsv = async () => {
    try {
      await exportTripCsv(session);
    } catch {
      Alert.alert('Export Failed', 'Unable to export the trip log right now.');
    }
  };

  const handleEndTrip = () => {
    if (Platform.OS === 'web') {
      const confirmed = window.confirm('Are you sure you want to end this trip?');
      if (!confirmed) return;
      useTripStore.getState().endSession();
      onNewTrip();
      return;
    }

    Alert.alert(
      'End Trip',
      'Are you sure you want to end this trip?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'End Trip', 
          style: 'destructive',
          onPress: () => {
            useTripStore.getState().endSession();
            onNewTrip();
          }
        },
      ]
    );
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

        <ProgressBar 
          current={session.currentStand} 
          total={session.totalStands}
          style={styles.progress}
        />

        <View style={styles.valuesRow}>
          <ValueDisplay
            label="Expected"
            value={currentExpectedTT}
            unit={session.volumeUnit}
            style={styles.valueItem}
          />
          <ValueDisplay
            label="Actual"
            value={currentActualTT}
            unit={session.volumeUnit}
            status={deviationStatus}
            size="large"
            style={styles.valueItem}
          />
          <View style={styles.diffContainer}>
            <Text style={styles.diffLabel}>DIFF</Text>
            <Text style={[styles.diffValue, { color: getStatusColor() }]}>
              {currentDiff > 0 ? '+' : ''}{currentDiff.toFixed(2)}
            </Text>
          </View>
        </View>

        {addStandEvents.length > 1 && (
          <TrendSlope
            events={allEvents}
            totalStands={session.totalStands}
            initialTT={session.initialTT}
            tolerance={session.tolerance}
            sections={session.sections}
            mode={session.mode}
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
            onPress={handleEndTrip}
            style={styles.actionButton}
          />
          <Button
            title="SURFACE RESET"
            variant="secondary"
            onPress={surfaceReset}
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
        <InputPad
          value={inputValue}
          onChange={setInputValue}
          unit={session.volumeUnit}
          onSubmit={handleAddStand}
          submitDisabled={session.currentStand >= session.totalStands}
        />
      </View>

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
    marginBottom: SPACING.lg,
  },
  valuesRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: SPACING.lg,
  },
  valueItem: {
    flex: 1,
  },
  diffContainer: {
    alignItems: 'center',
  },
  diffLabel: {
    fontSize: FONT_SIZES.caption,
    color: COLORS.textSecondary,
    letterSpacing: 1,
    marginBottom: SPACING.xs,
  },
  diffValue: {
    fontSize: FONT_SIZES.headingLarge,
    fontWeight: '700',
    fontVariant: ['tabular-nums'],
  },
  trend: {
    marginBottom: SPACING.lg,
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
    paddingVertical: SPACING.md,
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
    height: 200,
  },
  inputSection: {
    padding: SPACING.md,
    backgroundColor: COLORS.background,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
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
  modalButton: {
    minWidth: 80,
  },
});
