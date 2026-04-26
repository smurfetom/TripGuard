import React, { useEffect, useMemo, useState } from 'react';
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
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  SPACING,
  FONT_SIZES,
  BORDER_RADIUS,
  SECTION_TYPES,
  DISPLACEMENT_MODES,
  SECTION_TYPE_PRESETS,
} from '../constants/theme';
import { Button, SectionCard, TubularPicker } from '../components';
import { useTripStore } from '../store/tripStore';
import { TripMode, Section, SectionType, VolumeUnit, UnitSystem, DisplacementMode, SetupTemplate } from '../types';
import { createId } from '../utils/id';
import { loadTemplates, saveTemplates } from '../utils/storage';
import { BUILT_IN_TEMPLATES, cloneTemplate } from '../utils/templates';
import { convertLPerMToM3PerStand } from '../utils/calculations';
import { useAppTheme } from '../theme/ThemeProvider';

type SetupScreenProps = {
  onStartTrip: () => void;
  onGoToStatus?: () => void;
  onGoToDiagnostics?: () => void;
};

export function SetupScreen({ onStartTrip, onGoToStatus, onGoToDiagnostics }: SetupScreenProps) {
  const { colors, themeMode, setThemeMode } = useAppTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const startSession = useTripStore((state) => state.startSession);
  
  const [mode, setMode] = useState<TripMode>('RIH');
  const [unitSystem, setUnitSystem] = useState<UnitSystem>('metric');
  const [volumeUnit, setVolumeUnit] = useState<VolumeUnit>('m3');
  const [tolerance, setTolerance] = useState('0.5');
  const [totalStands, setTotalStands] = useState('88');
  const [startStand, setStartStand] = useState('0');
  const [loggingInterval, setLoggingInterval] = useState('5');
  const [initialTripTankVolume, setInitialTripTankVolume] = useState('1.0');
  const [openEndDisplacement, setOpenEndDisplacement] = useState('0');
  const [closedEndDisplacement, setClosedEndDisplacement] = useState('0');
  const [averageStandLength, setAverageStandLength] = useState('28.83');
  const [slugMudWeight, setSlugMudWeight] = useState('1.5');
  const [holeMudWeight, setHoleMudWeight] = useState('1.18');
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
  const [templates, setTemplates] = useState<SetupTemplate[]>([]);
  const [showTemplateModal, setShowTemplateModal] = useState(false);
  const [templateName, setTemplateName] = useState('');

  useEffect(() => {
    loadTemplates().then(setTemplates);
  }, []);

  const parseNumberInput = (value: string) => parseFloat(value.replace(',', '.')) || 0;

  const applySectionPreset = (type: SectionType) => {
    const preset = SECTION_TYPE_PRESETS[type];
    setSectionType(type);
    setSectionName(preset.name);
    setStandLength(preset.standLength);
    setSectionLength(preset.sectionLength);
    setOpenEndDisplacementPerStand(preset.displacementPerStand);
    setClosedEndDisplacementPerStand('');
    setStandCapacity(preset.standCapacity);
    setDisplacementMode('open_end');
  };

  const reindexSections = (items: Section[]) => items.map((section, index) => ({ ...section, order: index }));

  const applyTemplate = (template: SetupTemplate) => {
    const cloned = cloneTemplate(template);
    setMode(cloned.mode);
    setUnitSystem(cloned.unitSystem);
    setVolumeUnit(cloned.volumeUnit);
    setTolerance(cloned.tolerance.toString());
    setTotalStands(cloned.totalStands.toString());
    setStartStand(cloned.startStand.toString());
    setLoggingInterval(cloned.loggingInterval.toString());
    setInitialTripTankVolume(cloned.initialTripTankVolume?.toString() || '1.0');
    setOpenEndDisplacement('0');
    setClosedEndDisplacement('0');
    setAverageStandLength(cloned.averageStandLength.toString());
    setSlugMudWeight(cloned.slugMudWeight?.toString() || '1.5');
    setHoleMudWeight(cloned.holeMudWeight?.toString() || '1.18');
    setSections(reindexSections(cloned.sections));
    setShowTemplateModal(false);
    setShowSectionEditor(false);
  };

  const saveCurrentTemplate = async () => {
    const name = templateName.trim();
    if (!name) {
      Alert.alert('Missing Template Name', 'Enter a name before saving the template.');
      return;
    }
    if (sections.length === 0) {
      Alert.alert('Missing String Profile', 'Add at least one section before saving a template.');
      return;
    }

    const newTemplate: SetupTemplate = {
      id: createId(),
      name,
      mode,
      unitSystem,
      volumeUnit,
      tolerance: parseNumberInput(tolerance),
      totalStands: parseInt(totalStands, 10) || totalSectionStands,
      startStand: parseInt(startStand, 10) || 0,
      loggingInterval: parseInt(loggingInterval, 10) || 5,
      initialTT: parseNumberInput(initialTripTankVolume),
      initialTripTankVolume: parseNumberInput(initialTripTankVolume),
      openEndDisplacement: parseNumberInput(openEndDisplacement),
      closedEndDisplacement: parseNumberInput(closedEndDisplacement),
      averageStandLength: parseNumberInput(averageStandLength),
      slugMudWeight: mode === 'POOH' ? parseNumberInput(slugMudWeight) : undefined,
      holeMudWeight: mode === 'POOH' ? parseNumberInput(holeMudWeight) : undefined,
      sections: reindexSections(sections).map((section) => ({ ...section, id: createId() })),
    };

    const updatedTemplates = [...templates, newTemplate];
    setTemplates(updatedTemplates);
    await saveTemplates(updatedTemplates);
    setTemplateName('');
    setShowTemplateModal(false);
  };

  const moveSection = (index: number, direction: -1 | 1) => {
    const nextIndex = index + direction;
    if (nextIndex < 0 || nextIndex >= sections.length) return;
    const updated = [...sections];
    const [moved] = updated.splice(index, 1);
    updated.splice(nextIndex, 0, moved);
    setSections(reindexSections(updated));
  };

  const templateOptions = useMemo(() => [...BUILT_IN_TEMPLATES, ...templates], [templates]);

  const getActiveDisplacementPerStand = () => {
    if (displacementMode === 'open_end') {
      return parseNumberInput(openEndDisplacementPerStand);
    }

    if (displacementMode === 'closed_end') {
      return parseNumberInput(closedEndDisplacementPerStand);
    }

    return parseNumberInput(openEndDisplacementPerStand);
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
        setSections(reindexSections(sections.map(s => s.id === editingSection.id ? newSection : s)));
      } else {
        setSections(reindexSections([...sections, newSection]));
      }
    
    resetSectionForm();
  };

  const resetSectionForm = () => {
    setShowSectionEditor(false);
    setEditingSection(null);
    applySectionPreset('DP');
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
    const interval = parseInt(loggingInterval, 10) || 5;
    const startStandValue = parseInt(startStand, 10) || 0;
    const openEndDisp = parseNumberInput(openEndDisplacement);
    const closedEndDisp = parseNumberInput(closedEndDisplacement);
    const avgStand = parseNumberInput(averageStandLength);

    if (interval !== 1 && interval !== 5) {
      Alert.alert('Invalid Logging Interval', 'Logging interval must be 1 or 5 stands.');
      return;
    }

    if (sections.length === 0 && openEndDisp <= 0 && closedEndDisp <= 0) {
      Alert.alert('Invalid Trip Sheet Inputs', 'Please add sections or enter Open End / Closed End displacement values.');
      return;
    }

    if (mode === 'POOH' && (parseNumberInput(slugMudWeight) <= 0 || parseNumberInput(holeMudWeight) <= 0)) {
      Alert.alert('Invalid Slug Inputs', 'Hole mud weight and slug mud weight must be greater than zero for POOH.');
      return;
    }
    
    startSession({
      mode,
      unitSystem,
      volumeUnit,
      tolerance: parseFloat(tolerance) || 0.5,
      totalStands: finalTotalStands,
      sections,
      initialTT: parseFloat(initialTripTankVolume) || 1.0,
      initialTripTankVolume: parseFloat(initialTripTankVolume) || 1.0,
      startStand: startStandValue,
      loggingInterval: interval,
      openEndDisplacement: openEndDisp,
      closedEndDisplacement: closedEndDisp,
      displacementMode: sections.length > 0 ? 'closed_end' : 'closed_end',
      averageStandLength: avgStand,
      slugMudWeight: mode === 'POOH' ? parseNumberInput(slugMudWeight) : undefined,
      holeMudWeight: mode === 'POOH' ? parseNumberInput(holeMudWeight) : undefined,
    });
    
    onStartTrip();
  };

  const totalSectionStands = sections.reduce((sum, s) => sum + s.calculatedStands, 0);
  const editorStandLength = parseNumberInput(standLength);
  const editorSectionLength = parseNumberInput(sectionLength);
  const editorCalculatedStands = editorStandLength > 0 ? Math.round(editorSectionLength / editorStandLength) : 0;
  const editorActiveDisplacement = getActiveDisplacementPerStand();
  const canStartTrip = sections.length > 0 || (parseInt(totalStands, 10) || 0) > 0;

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
          <Text style={styles.title}>Trip Setup</Text>
          {onGoToStatus && (
            <View style={{ alignItems: 'flex-end', marginBottom: SPACING.md }}>
              <Button title="Status" onPress={onGoToStatus} />
            </View>
          )}
          {onGoToDiagnostics && (
            <View style={{ alignItems: 'flex-end', marginBottom: SPACING.md }}>
              <Button title="Diagnostics" onPress={onGoToDiagnostics} />
            </View>
          )}

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>THEME</Text>
            <View style={styles.compactToggle}>
              <TouchableOpacity
                style={[styles.compactToggleButton, themeMode === 'dark' && styles.toggleActive]}
                onPress={() => setThemeMode('dark')}
              >
                <Text style={[styles.compactToggleText, themeMode === 'dark' && styles.toggleTextActive]}>Dark</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.compactToggleButton, themeMode === 'light' && styles.toggleActive]}
                onPress={() => setThemeMode('light')}
              >
                <Text style={[styles.compactToggleText, themeMode === 'light' && styles.toggleTextActive]}>Light</Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>TEMPLATES</Text>
            </View>
            <View style={styles.templateActions}>
              <Button title="Load Template" variant="secondary" onPress={() => setShowTemplateModal(true)} style={styles.templateButton} />
              <Button title="Save Current" variant="outline" onPress={() => setShowTemplateModal(true)} style={styles.templateButton} />
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>MODE</Text>
            <View style={styles.compactToggle}>
              <TouchableOpacity
                style={[styles.compactToggleButton, mode === 'RIH' && styles.toggleActive]}
                onPress={() => setMode('RIH')}
              >
                <Text style={[styles.compactToggleText, mode === 'RIH' && styles.toggleTextActive]}>
                  RIH
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.compactToggleButton, mode === 'POOH' && styles.toggleActive]}
                onPress={() => setMode('POOH')}
              >
                <Text style={[styles.compactToggleText, mode === 'POOH' && styles.toggleTextActive]}>
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
                <Text style={styles.label}>Tolerance (m³)</Text>
                <TextInput
                  style={styles.input}
                  value={tolerance}
                  onChangeText={setTolerance}
                  keyboardType="decimal-pad"
                  placeholder="0.5"
                  placeholderTextColor={colors.textSecondary}
                />
              </View>
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>TRIP SHEET BASIS</Text>
            <View style={styles.row}>
              <View style={styles.field}>
                <Text style={styles.label}>Start Stand</Text>
                <TextInput
                  style={styles.input}
                  value={startStand}
                  onChangeText={setStartStand}
                  keyboardType="number-pad"
                  placeholder={mode === 'POOH' ? '103' : '0'}
                  placeholderTextColor={colors.textSecondary}
                />
              </View>
              <View style={styles.field}>
                <Text style={styles.label}>Logging Interval</Text>
                <View style={styles.compactToggle}>
                  {(['1', '5'] as const).map((interval) => (
                    <TouchableOpacity
                      key={interval}
                      style={[styles.compactToggleButton, loggingInterval === interval && styles.toggleActive]}
                      onPress={() => setLoggingInterval(interval)}
                    >
                      <Text style={[styles.compactToggleText, loggingInterval === interval && styles.toggleTextActive]}>
                        Every {interval}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            </View>

            <View style={styles.row}>
              <View style={styles.field}>
                <Text style={styles.label}>Open End Disp. (L/m)</Text>
                <TextInput
                  style={[styles.input, sections.length > 0 && styles.inputDisabled]}
                  value={openEndDisplacement}
                  onChangeText={setOpenEndDisplacement}
                  keyboardType="decimal-pad"
                  placeholder={sections.length > 0 ? "Using section values" : "0"}
                  placeholderTextColor={colors.textSecondary}
                  editable={sections.length === 0}
                />
              </View>
            </View>

            <View style={styles.row}>
              <View style={styles.field}>
                <Text style={styles.label}>Closed End Disp. (L/m)</Text>
                <TextInput
                  style={[styles.input, sections.length > 0 && styles.inputDisabled]}
                  value={closedEndDisplacement}
                  onChangeText={setClosedEndDisplacement}
                  keyboardType="decimal-pad"
                  placeholder={sections.length > 0 ? "Using section values" : "0"}
                  placeholderTextColor={colors.textSecondary}
                  editable={sections.length === 0}
                />
              </View>
            </View>

            <View style={styles.row}>
              <View style={styles.field}>
                <Text style={styles.label}>Avg Stand Length (m)</Text>
                <TextInput
                  style={styles.input}
                  value={averageStandLength}
                  onChangeText={setAverageStandLength}
                  keyboardType="decimal-pad"
                  placeholder="28.83"
                  placeholderTextColor={colors.textSecondary}
                />
              </View>
            </View>

            </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>INITIAL TRIP TANK VOLUME (m³)</Text>
            <TextInput
              style={styles.input}
              value={initialTripTankVolume}
              onChangeText={setInitialTripTankVolume}
              keyboardType="decimal-pad"
              placeholder="1.00"
              placeholderTextColor={colors.textSecondary}
            />
          </View>

          {mode === 'POOH' && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>SLUG BASIS</Text>
              <View style={styles.row}>
                <View style={styles.field}>
                  <Text style={styles.label}>Slug MW (sg)</Text>
                  <TextInput
                    style={styles.input}
                    value={slugMudWeight}
                    onChangeText={setSlugMudWeight}
                    keyboardType="decimal-pad"
                    placeholder="1.50"
                    placeholderTextColor={colors.textSecondary}
                  />
                </View>
                <View style={styles.field}>
                  <Text style={styles.label}>Hole MW (sg)</Text>
                  <TextInput
                    style={styles.input}
                    value={holeMudWeight}
                    onChangeText={setHoleMudWeight}
                    keyboardType="decimal-pad"
                    placeholder="1.18"
                    placeholderTextColor={colors.textSecondary}
                  />
                </View>
              </View>
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
                onMoveUp={() => moveSection(section.order, -1)}
                onMoveDown={() => moveSection(section.order, 1)}
                isFirst={section.order === 0}
                isLast={section.order === sections.length - 1}
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
                      onPress={() => applySectionPreset(type.value as SectionType)}
                    >
                      <Text style={[styles.optionButtonText, sectionType === type.value && styles.toggleTextActive]}>
                        {type.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              <View style={styles.field}>
                <Text style={styles.label}>Tubular Size</Text>
                <TubularPicker
                  selectedType={sectionType}
                  onSelect={(preset) => {
                    const standLength = preset.standLength || 27;
                    setOpenEndDisplacementPerStand(preset.openEndDisplacementPerStand?.toString() || '');
                    setClosedEndDisplacementPerStand(preset.closedEndDisplacementPerStand?.toString() || '');
                    setStandLength(standLength.toString());
                    setSectionName(preset.name);
                    setStandCapacity(preset.standCapacity?.toString() || '');
                  }}
                  value={sectionName}
                />
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

              {displacementMode === 'open_end' && (
                <View style={styles.field}>
                  <Text style={styles.label}>Open End Displacement / Stand (L/m)</Text>
                  <TextInput
                    style={styles.input}
                    value={openEndDisplacementPerStand}
                    onChangeText={setOpenEndDisplacementPerStand}
                    keyboardType="decimal-pad"
                    placeholder="0.015"
                    placeholderTextColor={colors.textSecondary}
                  />
                </View>
              )}

              {displacementMode === 'closed_end' && (
                <View style={styles.field}>
                  <Text style={styles.label}>Closed End Displacement / Stand (L/m)</Text>
                  <TextInput
                    style={styles.input}
                    value={closedEndDisplacementPerStand}
                    onChangeText={setClosedEndDisplacementPerStand}
                    keyboardType="decimal-pad"
                    placeholder="0.015"
                    placeholderTextColor={colors.textSecondary}
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
                  placeholderTextColor={colors.textSecondary}
                />
              </View>

              <View style={styles.previewCard}>
                <Text style={styles.previewTitle}>Live Preview</Text>
                <Text style={styles.previewLine}>{sectionName || 'Unnamed'} • {sectionType}</Text>
                <Text style={styles.previewLine}>Basis: {displacementMode.replace('_', ' ')}</Text>
                <Text style={styles.previewLine}>Stands: {editorCalculatedStands}</Text>
                <Text style={styles.previewLine}>Active displacement: {editorActiveDisplacement.toFixed(3)} L/m</Text>
                <Text style={styles.previewLine}>Stand capacity: {standCapacity || '--'} {volumeUnit}</Text>
                <Text style={styles.previewLine}>Trip sheet disp/stand: {sections.length > 0 ? editorActiveDisplacement.toFixed(3) : (parseNumberInput(openEndDisplacement) > 0 ? parseNumberInput(openEndDisplacement) : parseNumberInput(closedEndDisplacement)).toFixed(3)} L/m</Text>
                <Text style={styles.previewLine}>Logging: every {loggingInterval} stand(s)</Text>
              </View>
               
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
            disabled={!canStartTrip}
          />
        </View>
      </KeyboardAvoidingView>

      <Modal visible={showTemplateModal} transparent animationType="fade" onRequestClose={() => setShowTemplateModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Setup Templates</Text>
            <TextInput
              style={styles.input}
              value={templateName}
              onChangeText={setTemplateName}
              placeholder="Template name"
              placeholderTextColor={colors.textSecondary}
            />
            <View style={styles.templateActions}>
              <Button title="Save Current" onPress={saveCurrentTemplate} style={styles.templateButton} />
              <Button title="Close" variant="secondary" onPress={() => setShowTemplateModal(false)} style={styles.templateButton} />
            </View>
            <ScrollView style={styles.templateList}>
              {templateOptions.map((template) => (
                <TouchableOpacity key={template.id} style={styles.templateRow} onPress={() => applyTemplate(template)}>
                  <View>
                    <Text style={styles.templateName}>{template.name}</Text>
                    <Text style={styles.templateMeta}>{template.mode} • {template.sections.length} sections • {template.totalStands} stands</Text>
                  </View>
                  <Text style={styles.templateType}>{template.isBuiltIn ? 'Built-in' : 'Saved'}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
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
    color: colors.textPrimary,
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
    color: colors.textSecondary,
    letterSpacing: 1,
    marginBottom: SPACING.sm,
  },
  sectionCount: {
    fontSize: FONT_SIZES.caption,
    color: colors.accent,
  },
  templateActions: {
    flexDirection: 'row',
    gap: SPACING.sm,
  },
  templateButton: {
    flex: 1,
    maxWidth: 150,
  },
  toggle: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderRadius: BORDER_RADIUS.md,
    padding: 4,
  },
  compactToggle: {
    flexDirection: 'row',
    alignSelf: 'flex-start',
    backgroundColor: colors.surface,
    borderRadius: BORDER_RADIUS.md,
    paddingVertical: SPACING.xs,
    paddingHorizontal: SPACING.sm,
    flexWrap: 'wrap',
  },
  toggleButton: {
    flex: 1,
    paddingVertical: SPACING.md,
    alignItems: 'center',
    borderRadius: BORDER_RADIUS.sm,
  },
  compactToggleButton: {
    paddingVertical: SPACING.xs,
    paddingHorizontal: SPACING.xs,
    alignItems: 'center',
    borderRadius: BORDER_RADIUS.sm,
    marginRight: SPACING.xs,
  },
  toggleActive: {
    backgroundColor: colors.accent,
  },
  toggleText: {
    fontSize: FONT_SIZES.body,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  compactToggleText: {
    fontSize: FONT_SIZES.caption,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  toggleTextActive: {
    color: colors.white,
  },
  smallToggle: {
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
    borderRadius: BORDER_RADIUS.sm,
    marginRight: SPACING.xs,
  },
  smallToggleText: {
    fontSize: FONT_SIZES.caption,
    color: colors.textSecondary,
  },
  optionGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -SPACING.xs,
  },
  optionButton: {
    backgroundColor: colors.background,
    borderRadius: BORDER_RADIUS.sm,
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
    margin: SPACING.xs,
  },
  optionButtonText: {
    fontSize: FONT_SIZES.caption,
    color: colors.textSecondary,
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
    color: colors.textSecondary,
    marginBottom: SPACING.xs,
  },
  input: {
    backgroundColor: colors.surface,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.sm,
    fontSize: FONT_SIZES.caption,
    color: colors.textPrimary,
    borderWidth: 1,
    borderColor: colors.border,
    maxWidth: 150,
  },
  inputDisabled: {
    opacity: 0.5,
  },
  helperText: {
    fontSize: FONT_SIZES.caption,
    color: colors.textSecondary,
    lineHeight: 20,
    marginBottom: SPACING.md,
  },
  previewCard: {
    backgroundColor: colors.background,
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: SPACING.md,
    marginBottom: SPACING.md,
  },
  previewTitle: {
    fontSize: FONT_SIZES.caption,
    color: colors.accent,
    letterSpacing: 1,
    marginBottom: SPACING.sm,
  },
  previewLine: {
    fontSize: FONT_SIZES.caption,
    color: colors.textPrimary,
    marginBottom: SPACING.xs,
  },
  editor: {
    backgroundColor: colors.surface,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.lg,
    marginBottom: SPACING.lg,
  },
  editorTitle: {
    fontSize: FONT_SIZES.heading,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: SPACING.md,
  },
  spacer: {
    height: 100,
  },
  footer: {
    padding: SPACING.md,
    backgroundColor: colors.background,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    padding: SPACING.lg,
  },
  modalCard: {
    backgroundColor: colors.surface,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.lg,
    maxHeight: '80%',
    maxWidth: 400,
    width: '100%',
  },
  modalTitle: {
    fontSize: FONT_SIZES.heading,
    color: colors.textPrimary,
    fontWeight: '600',
    marginBottom: SPACING.md,
  },
  templateList: {
    marginTop: SPACING.md,
  },
  templateRow: {
    backgroundColor: colors.background,
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: SPACING.md,
    marginBottom: SPACING.sm,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  templateName: {
    fontSize: FONT_SIZES.body,
    color: colors.textPrimary,
    fontWeight: '600',
  },
  templateMeta: {
    fontSize: FONT_SIZES.caption,
    color: colors.textSecondary,
    marginTop: SPACING.xs,
  },
  templateType: {
    fontSize: FONT_SIZES.caption,
    color: colors.accent,
  },
});
