import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Modal,
  TextInput,
  Alert,
} from 'react-native';
import { SPACING, FONT_SIZES, BORDER_RADIUS } from '../constants/theme';
import { useAppTheme } from '../theme/ThemeProvider';
import { TUBULAR_PRESETS, getPresetsByType } from '../constants/theme';
import { UserTubular, loadUserTubulars, addUserTubular, updateUserTubular, deleteUserTubular } from '../utils/tubularStorage';

interface TubularPreset {
  type: string;
  name: string;
  openEndDisplacementPerStand: number;
  closedEndDisplacementPerStand: number;
  standCapacity?: number;
  standLength: number;
}

interface TubularPickerProps {
  selectedType: string;
  onSelect: (preset: TubularPreset) => void;
  value?: string;
}

export function TubularPicker({ selectedType, onSelect, value }: TubularPickerProps) {
  const { colors } = useAppTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  
  const [showPicker, setShowPicker] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [userTubulars, setUserTubulars] = useState<UserTubular[]>([]);
  const [editingTubular, setEditingTubular] = useState<TubularPreset | UserTubular | null>(null);
  const [editName, setEditName] = useState('');
  const [editDisplacement, setEditDisplacement] = useState(''); // Kept for backward compatibility but not used
  const [editOpenEndDisplacement, setEditOpenEndDisplacement] = useState('');
  const [editClosedEndDisplacement, setEditClosedEndDisplacement] = useState('');
  const [editStandCapacity, setEditStandCapacity] = useState('');
  const [editStandLength, setEditStandLength] = useState('');
  const [isNewCustom, setIsNewCustom] = useState(false);

  useEffect(() => {
    loadUserTubulars().then(setUserTubulars);
  }, []);

  // Reload when picker opens or type changes
  useEffect(() => {
    if (showPicker) {
      loadUserTubulars().then(setUserTubulars);
    }
  }, [showPicker, selectedType]);

  const presets = useMemo(() => {
    const builtIn = getPresetsByType(selectedType);
    const userItems = userTubulars.filter(t => t.type === selectedType);
    return [...builtIn, ...userItems];
  }, [selectedType, userTubulars]);

  const getDisplayName = () => {
    if (!value) return 'Select tubular...';
    const found = presets.find(p => p.name === value);
    return found ? found.name : value;
  };

  const handleSelect = (preset: TubularPreset) => {
    onSelect(preset);
    setShowPicker(false);
  };

  const handleEdit = (preset: TubularPreset | UserTubular) => {
    setEditingTubular(preset);
    setEditName(preset.name);
    setEditOpenEndDisplacement(preset.openEndDisplacementPerStand?.toString() || '');
    setEditClosedEndDisplacement(preset.closedEndDisplacementPerStand?.toString() || '');
    setEditStandCapacity(preset.standCapacity?.toString() || '');
    setEditStandLength(preset.standLength.toString());
    setIsNewCustom(false);
    setShowEditModal(true);
  };

  const handleSaveEdit = async () => {
    console.log('handleSaveEdit called');
    console.log('editName:', editName);
    console.log('editOpenEndDisplacement:', editOpenEndDisplacement);
    console.log('editClosedEndDisplacement:', editClosedEndDisplacement);
    console.log('editStandLength:', editStandLength);
    console.log('isNewCustom:', isNewCustom);
    
    if (!editName || editName.trim() === '') {
      Alert.alert('Missing Name', 'Please enter a name for the tubular.');
      return;
    }

    const openEnd = parseFloat(editOpenEndDisplacement) || 0;
    const closedEnd = parseFloat(editClosedEndDisplacement) || 0;
    const standCapacity = parseFloat(editStandCapacity) || 0;
    const standLength = parseFloat(editStandLength) || 27;
    
    console.log('Parsed values - openEnd:', openEnd, 'closedEnd:', closedEnd, 'standLength:', standLength);
    
    if (openEnd === 0 || closedEnd === 0 || standLength === 0) {
      Alert.alert('Invalid Values', 'Please enter valid numbers for Open End, Closed End and stand length.');
      return;
    }

    const tubularData = {
      type: selectedType as UserTubular['type'],
      name: editName.trim(),
      openEndDisplacementPerStand: openEnd,
      closedEndDisplacementPerStand: closedEnd,
      standCapacity: standCapacity || undefined,
      standLength: standLength,
    };
    
    console.log('tubularData to save:', tubularData);

    try {
      if (isNewCustom) {
        await addUserTubular(tubularData);
      } else if (editingTubular && 'id' in editingTubular) {
        await updateUserTubular(editingTubular.id, tubularData);
      } else if (editingTubular) {
        await addUserTubular(tubularData);
      }
      console.log('Saved tubular:', tubularData);
    } catch (err) {
      console.error('Save error:', err);
      Alert.alert('Error', 'Failed to save. Try again.');
      return;
    }

    // Force fresh load
    const refreshed = await loadUserTubulars();
    console.log('After save - loaded tubulars:', refreshed, 'count:', refreshed.length);
    setUserTubulars(refreshed);
    
    // Reset form and keep picker open to see new item
    setEditName('');
    setEditOpenEndDisplacement('');
    setEditClosedEndDisplacement('');
    setEditStandCapacity('');
    setEditStandLength('27');
    setShowEditModal(false);
    setEditingTubular(null);
    setIsNewCustom(false);
  };

  const handleDelete = async () => {
    if (editingTubular && 'id' in editingTubular) {
      await deleteUserTubular(editingTubular.id);
      const updated = await loadUserTubulars();
      setUserTubulars(updated);
      setShowEditModal(false);
      setShowPicker(false);
      setEditingTubular(null);
    }
  };

  const handleAddCustom = () => {
    setEditingTubular(null);
    setEditName('');
    setEditOpenEndDisplacement('5');
    setEditClosedEndDisplacement('10');
    setEditStandCapacity('15');
    setEditStandLength('27');
    setIsNewCustom(true);
    setShowEditModal(true);
  };

  return (
    <>
      <TouchableOpacity style={styles.selector} onPress={() => setShowPicker(true)}>
        <Text style={styles.selectorText}>{getDisplayName()}</Text>
        <Text style={styles.arrow}>▼</Text>
      </TouchableOpacity>

      <Modal visible={showPicker} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Tubular</Text>
              <TouchableOpacity onPress={() => setShowPicker(false)}>
                <Text style={styles.closeButton}>✕</Text>
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.presetList}>
              {presets.map((preset, index) => (
                <View key={`${preset.name}-${index}`} style={styles.presetRow}>
                  <TouchableOpacity
                    style={[styles.presetItem, value === preset.name && styles.presetSelected]}
                    onPress={() => handleSelect(preset)}
                  >
                    <Text style={[styles.presetName, value === preset.name && styles.presetNameSelected]}>
                      {preset.name}
                    </Text>
                    <Text style={styles.presetDetails}>
                      O: {preset.openEndDisplacementPerStand} C: {preset.closedEndDisplacementPerStand} L/m • {preset.standLength}m
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.editButton} onPress={() => handleEdit(preset)}>
                    <Text style={styles.editButtonText}>✎</Text>
                  </TouchableOpacity>
                </View>
              ))}
            </ScrollView>

            <TouchableOpacity style={styles.addButton} onPress={handleAddCustom}>
              <Text style={styles.addButtonText}>+ Add Custom</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <Modal visible={showEditModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{isNewCustom ? 'Add Custom' : 'Edit Tubular'}</Text>
              <TouchableOpacity onPress={() => setShowEditModal(false)}>
                <Text style={styles.closeButton}>✕</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.editForm}>
              <ScrollView style={styles.editScroll} keyboardShouldPersistTaps="handled">
              <Text style={styles.label}>Name</Text>
              <TextInput
                style={styles.input}
                value={editName}
                onChangeText={setEditName}
                placeholder="e.g., 5 7/8 inch DP"
              />

              <Text style={styles.label}>Open End Displacement (L/m)</Text>
              <TextInput
                style={styles.input}
                value={editOpenEndDisplacement}
                onChangeText={setEditOpenEndDisplacement}
                keyboardType="decimal-pad"
                placeholder="8"
              />

              <Text style={styles.label}>Closed End Displacement (L/m)</Text>
              <TextInput
                style={styles.input}
                value={editClosedEndDisplacement}
                onChangeText={setEditClosedEndDisplacement}
                keyboardType="decimal-pad"
                placeholder="12"
              />

              <Text style={styles.label}>Stand Capacity (L/m)</Text>
              <TextInput
                style={styles.input}
                value={editStandCapacity}
                onChangeText={setEditStandCapacity}
                keyboardType="decimal-pad"
                placeholder="18"
              />

              <Text style={styles.label}>Stand Length (m)</Text>
              <TextInput
                style={styles.input}
                value={editStandLength}
                onChangeText={setEditStandLength}
                keyboardType="decimal-pad"
                placeholder="27"
              />
              </ScrollView>

              <View style={styles.buttonRow}>
                <TouchableOpacity style={styles.saveButton} onPress={handleSaveEdit}>
                  <Text style={styles.saveButtonText}>Save</Text>
                </TouchableOpacity>

                {!isNewCustom && editingTubular && 'id' in editingTubular && (
                  <TouchableOpacity style={styles.deleteButton} onPress={handleDelete}>
                    <Text style={styles.deleteButtonText}>Delete</Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          </View>
        </View>
      </Modal>
    </>
  );
}

const createStyles = (colors: ReturnType<typeof useAppTheme>['colors']) => StyleSheet.create({
  selector: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  selectorText: {
    fontSize: FONT_SIZES.body,
    color: colors.textPrimary,
  },
  arrow: {
    fontSize: FONT_SIZES.caption,
    color: colors.textSecondary,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: colors.background,
    borderTopLeftRadius: BORDER_RADIUS.lg,
    borderTopRightRadius: BORDER_RADIUS.lg,
    maxHeight: '70%',
    padding: SPACING.md,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  modalTitle: {
    fontSize: FONT_SIZES.heading,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  closeButton: {
    fontSize: FONT_SIZES.heading,
    color: colors.textSecondary,
    padding: SPACING.sm,
  },
  presetList: {
    maxHeight: 300,
  },
  presetRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  presetItem: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  presetSelected: {
    borderColor: colors.accent,
    backgroundColor: colors.accent + '20',
  },
  presetName: {
    fontSize: FONT_SIZES.body,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  presetNameSelected: {
    color: colors.accent,
  },
  presetDetails: {
    fontSize: FONT_SIZES.caption,
    color: colors.textSecondary,
    marginTop: 2,
  },
  editButton: {
    padding: SPACING.sm,
    marginLeft: SPACING.sm,
  },
  editButtonText: {
    fontSize: FONT_SIZES.body,
    color: colors.accent,
  },
  addButton: {
    backgroundColor: colors.accent,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
    alignItems: 'center',
    marginTop: SPACING.md,
  },
  addButtonText: {
    fontSize: FONT_SIZES.body,
    fontWeight: '600',
    color: colors.white,
  },
  editForm: {
    padding: SPACING.md,
    maxHeight: 400,
  },
  editScroll: {
    maxHeight: 320,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: SPACING.sm,
    paddingTop: SPACING.sm,
  },
  label: {
    fontSize: FONT_SIZES.caption,
    color: colors.textSecondary,
    marginBottom: SPACING.xs,
    marginTop: SPACING.md,
  },
  input: {
    backgroundColor: colors.surface,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
    fontSize: FONT_SIZES.body,
    color: colors.textPrimary,
    borderWidth: 1,
    borderColor: colors.border,
  },
  saveButton: {
    backgroundColor: colors.success,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
    alignItems: 'center',
    marginTop: SPACING.lg,
  },
  saveButtonText: {
    fontSize: FONT_SIZES.body,
    fontWeight: '600',
    color: colors.white,
  },
  deleteButton: {
    backgroundColor: colors.danger,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
    alignItems: 'center',
    marginTop: SPACING.sm,
  },
  deleteButtonText: {
    fontSize: FONT_SIZES.body,
    fontWeight: '600',
    color: colors.white,
  },
});