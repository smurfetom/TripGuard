import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS, SPACING, FONT_SIZES, BORDER_RADIUS, SECTION_TYPES, DISPLACEMENT_MODES } from '../constants/theme';
import { Button, SectionCard } from '../components';
import { useTripStore } from '../store/tripStore';
import { TripMode, Section, SectionType, VolumeUnit, UnitSystem, DisplacementMode } from '../types';
import { createId } from '../utils/id';

type SetupScreenProps = {
  onStartTrip: () => void;
};

export function SetupScreen({ onStartTrip }: SetupScreenProps) {
  const startSession = useTripStore((state) => state.startSession);
  
  const [mode, setMode] = useState<TripMode>('RIH');
  const [unitSystem, setUnitSystem] = useState<UnitSystem>('metric');
  const [volumeUnit, setVolumeUnit] = useState<VolumeUnit>('bbl');
  const [tolerance, setTolerance] = useState('0.5');
  const [totalStands, setTotalStands] = useState('88');
  const [initialTT, setInitialTT] = useState('25');
  const [sections, setSections] = useState<Section[]>([]);
  const [showSectionEditor, setShowSectionEditor] = useState(false);
  const [editingSection, setEditingSection] = useState<Section | null>(null);
  
  const [sectionType, setSectionType] = useState<SectionType>('DP');
  const [sectionName, setSectionName] = useState('Drill Pipe');
  const [displacementMode, setDisplacementMode] = useState<DisplacementMode>('manual');
  const [sectionLength, setSectionLength] = useState('2700');
  const [standLength, setStandLength] = useState('27');
  const [displacementPerStand, setDisplacementPerStand] = useState('0.015');
  const [openEndDisplacementPerStand, setOpenEndDisplacementPerStand] = useState('');
  const [closedEndDisplacementPerStand, setClosedEndDisplacementPerStand] = useState('');
  const [standCapacity, setStandCapacity] = useState('');

  const parseNumberInput = (value: string) => parseFloat(value.replace(',', '.')) || 0;

  const getActiveDisplacementPerStand = () => {
    if (displacementMode === 'open_end') {
      return parseNumberInput(openEndDisplacementPerStand);
    }

    if (displacementMode === 'closed_end') {
      return parseNumberInput(closedEndDisplacementPerStand);
    }

    return parseNumberInput(displacementPerStand);
  };

  const handleAddSection = () => {
    const parsedSectionLength = parseNumberInput(sectionLength);
    const parsedStandLength = parseNumberInput(standLength);
    const activeDisplacementPerStand = getActiveDisplacementPerStand();

    if (parsedSectionLength <= 0 || parsedStandLength <= 0) {
      Alert.alert('Invalid Section', 'Length and stand length must be greater than zero.');
      return;
    }

    if (activeDisplacementPerStand <= 0) {
      Alert.alert('Missing Displacement', 'Enter a valid displacement for the selected mode.');
      return;
    }

    const calculatedStands = Math.round(parsedSectionLength / parsedStandLength);
    
    const newSection: Section = {
      id: editingSection?.id || createId(),
      type: sectionType,
      name: sectionName,
      displacementMode,
      length: parsedSectionLength,
      standLength: parsedStandLength,
      displacementPerMeter: 0,
      displacementPerStand: activeDisplacementPerStand,
      openEndDisplacementPerStand: parseNumberInput(openEndDisplacementPerStand) || undefined,
      closedEndDisplacementPerStand: parseNumberInput(closedEndDisplacementPerStand) || undefined,
      standCapacity: parseNumberInput(standCapacity) || undefined,
      calculatedStands,
      order: editingSection?.order ?? sections.length,
    };
    
    if (editingSection) {
      setSections(sections.map(s => s.id === editingSection.id ? newSection : s));
    } else {
      setSections([...sections, newSection]);
    }
    
    resetSectionForm();
  };

  const resetSectionForm = () => {
    setShowSectionEditor(false);
    setEditingSection(null);
    setSectionType('DP');
    setSectionName('Drill Pipe');
    setDisplacementMode('manual');
    setSectionLength('2700');
    setStandLength('27');
    setDisplacementPerStand('0.015');
    setOpenEndDisplacementPerStand('');
    setClosedEndDisplacementPerStand('');
    setStandCapacity('');
  };

  const handleEditSection = (section: Section) => {
    setEditingSection(section);
    setSectionType(section.type);
    setSectionName(section.name);
    setDisplacementMode(section.displacementMode || 'manual');
    setSectionLength(section.length.toString());
    setStandLength(section.standLength.toString());
    setDisplacementPerStand(section.displacementPerStand.toString());
    setOpenEndDisplacementPerStand(section.openEndDisplacementPerStand?.toString() || '');
    setClosedEndDisplacementPerStand(section.closedEndDisplacementPerStand?.toString() || '');
    setStandCapacity(section.standCapacity?.toString() || '');
    setShowSectionEditor(true);
  };

  const handleDeleteSection = (id: string) => {
    Alert.alert(
      'Delete Section',
      'Are you sure you want to delete this section?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: () => 
          setSections(sections.filter(s => s.id !== id))
        },
      ]
    );
  };

  const handleStartTrip = () => {
    if (sections.some((section) => section.displacementPerStand <= 0)) {
      Alert.alert('Invalid String Profile', 'Every section must have a valid displacement per stand.');
      return;
    }

    const totalCalculated = sections.reduce((sum, s) => sum + s.calculatedStands, 0);
    const finalTotalStands = totalCalculated > 0 ? totalCalculated : parseInt(totalStands) || 88;
    
    startSession({
      mode,
      unitSystem,
      volumeUnit,
      tolerance: parseFloat(tolerance) || 0.5,
      totalStands: finalTotalStands,
      sections,
      initialTT: parseFloat(initialTT) || 0,
    });
    
    onStartTrip();
  };

  const totalSectionStands = sections.reduce((sum, s) => sum + s.calculatedStands, 0);

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
          <Text style={styles.title}>Trip Setup</Text>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>MODE</Text>
            <View style={styles.toggle}>
              <TouchableOpacity
                style={[styles.toggleButton, mode === 'RIH' && styles.toggleActive]}
                onPress={() => setMode('RIH')}
              >
                <Text style={[styles.toggleText, mode === 'RIH' && styles.toggleTextActive]}>
                  RIH
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.toggleButton, mode === 'POOH' && styles.toggleActive]}
                onPress={() => setMode('POOH')}
              >
                <Text style={[styles.toggleText, mode === 'POOH' && styles.toggleTextActive]}>
                  POOH
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>UNITS</Text>
            <View style={styles.row}>
              <View style={styles.field}>
                <Text style={styles.label}>Volume</Text>
                <View style={styles.toggle}>
                  {(['bbl', 'm3', 'gallons'] as VolumeUnit[]).map((unit) => (
                    <TouchableOpacity
                      key={unit}
                      style={[styles.smallToggle, volumeUnit === unit && styles.toggleActive]}
                      onPress={() => setVolumeUnit(unit)}
                    >
                      <Text style={[styles.smallToggleText, volumeUnit === unit && styles.toggleTextActive]}>
                        {unit}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
              <View style={styles.field}>
                <Text style={styles.label}>Tolerance</Text>
                <TextInput
                  style={styles.input}
                  value={tolerance}
                  onChangeText={setTolerance}
                  keyboardType="decimal-pad"
                  placeholder="0.5"
                  placeholderTextColor={COLORS.textSecondary}
                />
              </View>
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>INITIAL TRIP TANK</Text>
            <TextInput
              style={styles.input}
              value={initialTT}
              onChangeText={setInitialTT}
              keyboardType="decimal-pad"
              placeholder="25.00"
              placeholderTextColor={COLORS.textSecondary}
            />
          </View>

          {sections.length === 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>TOTAL STANDS</Text>
              <TextInput
                style={styles.input}
                value={totalStands}
                onChangeText={setTotalStands}
                keyboardType="number-pad"
                placeholder="88"
                placeholderTextColor={COLORS.textSecondary}
              />
            </View>
          )}

          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>STRING PROFILE</Text>
              <Text style={styles.sectionCount}>
                {totalSectionStands} stands total
              </Text>
            </View>
            
            {sections.map((section) => (
              <SectionCard
                key={section.id}
                section={section}
                onEdit={() => handleEditSection(section)}
                onDelete={() => handleDeleteSection(section.id)}
              />
            ))}
            
            <Button
              title={showSectionEditor ? 'Cancel' : '+ Add Section'}
              variant={showSectionEditor ? 'secondary' : 'outline'}
              onPress={() => {
                if (showSectionEditor) {
                  resetSectionForm();
                } else {
                  setShowSectionEditor(true);
                }
              }}
            />
          </View>

          {showSectionEditor && (
            <View style={styles.editor}>
              <Text style={styles.editorTitle}>Section Details</Text>
              
              <View style={styles.field}>
                <Text style={styles.label}>Type</Text>
                <View style={styles.optionGrid}>
                  {SECTION_TYPES.map((type) => (
                    <TouchableOpacity
                      key={type.value}
                      style={[styles.optionButton, sectionType === type.value && styles.toggleActive]}
                      onPress={() => {
                        setSectionType(type.value as SectionType);
                        setSectionName(type.label);
                      }}
                    >
                      <Text style={[styles.optionButtonText, sectionType === type.value && styles.toggleTextActive]}>
                        {type.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              <View style={styles.field}>
                <Text style={styles.label}>Displacement Basis</Text>
                <View style={styles.optionGrid}>
                  {DISPLACEMENT_MODES.map((option) => (
                    <TouchableOpacity
                      key={option.value}
                      style={[styles.optionButton, displacementMode === option.value && styles.toggleActive]}
                      onPress={() => setDisplacementMode(option.value as DisplacementMode)}
                    >
                      <Text style={[styles.optionButtonText, displacementMode === option.value && styles.toggleTextActive]}>
                        {option.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
              
              <View style={styles.field}>
                <Text style={styles.label}>Length (m)</Text>
                <TextInput
                  style={styles.input}
                  value={sectionLength}
                  onChangeText={setSectionLength}
                  keyboardType="decimal-pad"
                />
              </View>
              
              <View style={styles.field}>
                <Text style={styles.label}>Stand Length (m)</Text>
                <TextInput
                  style={styles.input}
                  value={standLength}
                  onChangeText={setStandLength}
                  keyboardType="decimal-pad"
                />
              </View>
              
              {displacementMode === 'manual' && (
                <View style={styles.field}>
                  <Text style={styles.label}>Manual Displacement / Stand ({volumeUnit})</Text>
                  <TextInput
                    style={styles.input}
                    value={displacementPerStand}
                    onChangeText={setDisplacementPerStand}
                    keyboardType="decimal-pad"
                    placeholder="0.015"
                    placeholderTextColor={COLORS.textSecondary}
                  />
                </View>
              )}

              {displacementMode === 'open_end' && (
                <View style={styles.field}>
                  <Text style={styles.label}>Open End Displacement / Stand ({volumeUnit})</Text>
                  <TextInput
                    style={styles.input}
                    value={openEndDisplacementPerStand}
                    onChangeText={setOpenEndDisplacementPerStand}
                    keyboardType="decimal-pad"
                    placeholder="0.015"
                    placeholderTextColor={COLORS.textSecondary}
                  />
                </View>
              )}

              {displacementMode === 'closed_end' && (
                <View style={styles.field}>
                  <Text style={styles.label}>Closed End Displacement / Stand ({volumeUnit})</Text>
                  <TextInput
                    style={styles.input}
                    value={closedEndDisplacementPerStand}
                    onChangeText={setClosedEndDisplacementPerStand}
                    keyboardType="decimal-pad"
                    placeholder="0.015"
                    placeholderTextColor={COLORS.textSecondary}
                  />
                </View>
              )}

              <View style={styles.field}>
                <Text style={styles.label}>Stand Capacity ({volumeUnit})</Text>
                <TextInput
                  style={styles.input}
                  value={standCapacity}
                  onChangeText={setStandCapacity}
                  keyboardType="decimal-pad"
                  placeholder="Informational only"
                  placeholderTextColor={COLORS.textSecondary}
                />
              </View>

              <Text style={styles.helperText}>
                Stand capacity is stored for reference only and does not affect trip volume calculations.
              </Text>
              
              <Button
                title={editingSection ? 'Update Section' : 'Add Section'}
                onPress={handleAddSection}
              />
            </View>
          )}

          <View style={styles.spacer} />
        </ScrollView>
        
        <View style={styles.footer}>
          <Button
            title="Start Trip"
            onPress={handleStartTrip}
            size="large"
          />
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  keyboardView: {
    flex: 1,
  },
  scroll: {
    flex: 1,
  },
  content: {
    padding: SPACING.md,
  },
  title: {
    fontSize: FONT_SIZES.headingLarge,
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginBottom: SPACING.lg,
  },
  section: {
    marginBottom: SPACING.lg,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  sectionTitle: {
    fontSize: FONT_SIZES.caption,
    color: COLORS.textSecondary,
    letterSpacing: 1,
    marginBottom: SPACING.sm,
  },
  sectionCount: {
    fontSize: FONT_SIZES.caption,
    color: COLORS.accent,
  },
  toggle: {
    flexDirection: 'row',
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.md,
    padding: 4,
  },
  toggleButton: {
    flex: 1,
    paddingVertical: SPACING.md,
    alignItems: 'center',
    borderRadius: BORDER_RADIUS.sm,
  },
  toggleActive: {
    backgroundColor: COLORS.accent,
  },
  toggleText: {
    fontSize: FONT_SIZES.body,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
  toggleTextActive: {
    color: COLORS.white,
  },
  smallToggle: {
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
    borderRadius: BORDER_RADIUS.sm,
    marginRight: SPACING.xs,
  },
  smallToggleText: {
    fontSize: FONT_SIZES.caption,
    color: COLORS.textSecondary,
  },
  optionGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -SPACING.xs,
  },
  optionButton: {
    backgroundColor: COLORS.background,
    borderRadius: BORDER_RADIUS.sm,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
    margin: SPACING.xs,
  },
  optionButtonText: {
    fontSize: FONT_SIZES.caption,
    color: COLORS.textSecondary,
    fontWeight: '600',
  },
  row: {
    flexDirection: 'row',
    gap: SPACING.md,
  },
  field: {
    flex: 1,
    marginBottom: SPACING.md,
  },
  label: {
    fontSize: FONT_SIZES.caption,
    color: COLORS.textSecondary,
    marginBottom: SPACING.xs,
  },
  input: {
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
    fontSize: FONT_SIZES.body,
    color: COLORS.textPrimary,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  helperText: {
    fontSize: FONT_SIZES.caption,
    color: COLORS.textSecondary,
    lineHeight: 20,
    marginBottom: SPACING.md,
  },
  editor: {
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.lg,
    marginBottom: SPACING.lg,
  },
  editorTitle: {
    fontSize: FONT_SIZES.heading,
    fontWeight: '600',
    color: COLORS.textPrimary,
    marginBottom: SPACING.md,
  },
  spacer: {
    height: 100,
  },
  footer: {
    padding: SPACING.md,
    backgroundColor: COLORS.background,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
});
