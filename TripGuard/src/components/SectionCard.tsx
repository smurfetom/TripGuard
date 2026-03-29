import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { COLORS, SPACING, FONT_SIZES, BORDER_RADIUS } from '../constants/theme';
import { Section } from '../types';

interface SectionCardProps {
  section: Section;
  onEdit: () => void;
  onDelete: () => void;
  onMoveUp?: () => void;
  onMoveDown?: () => void;
  isFirst?: boolean;
  isLast?: boolean;
}

export function SectionCard({ section, onEdit, onDelete, onMoveUp, onMoveDown, isFirst, isLast }: SectionCardProps) {
  const getDisplacementLabel = () => {
    switch (section.displacementMode) {
      case 'open_end':
        return 'Open End';
      case 'closed_end':
        return 'Closed End';
      default:
        return 'Manual';
    }
  };

  const getTypeIcon = () => {
    switch (section.type) {
      case 'BHA':
        return '🔧';
      case 'DP':
        return '⬇';
      case 'HWDP':
        return '▬';
      default:
        return '●';
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.icon}>
        <Text style={styles.iconText}>{getTypeIcon()}</Text>
      </View>
      
      <View style={styles.info}>
        <Text style={styles.name}>{section.name}</Text>
        <Text style={styles.details}>
          {section.calculatedStands} stands • {section.displacementPerStand.toFixed(3)} vol/stand
        </Text>
        <Text style={styles.meta}>
          {getDisplacementLabel()} • Capacity {section.standCapacity?.toFixed(3) ?? '--'}
        </Text>
      </View>
      
      <View style={styles.actions}>
        <TouchableOpacity onPress={onMoveUp} style={styles.actionButton} disabled={isFirst}>
          <Text style={[styles.actionText, isFirst && styles.disabledText]}>↑</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={onMoveDown} style={styles.actionButton} disabled={isLast}>
          <Text style={[styles.actionText, isLast && styles.disabledText]}>↓</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={onEdit} style={styles.actionButton}>
          <Text style={styles.actionText}>✎</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={onDelete} style={styles.actionButton}>
          <Text style={[styles.actionText, styles.deleteText]}>✕</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.sm,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  icon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.border,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SPACING.md,
  },
  iconText: {
    fontSize: 18,
  },
  info: {
    flex: 1,
  },
  name: {
    fontSize: FONT_SIZES.body,
    fontWeight: '600',
    color: COLORS.textPrimary,
    marginBottom: 2,
  },
  details: {
    fontSize: FONT_SIZES.caption,
    color: COLORS.textSecondary,
  },
  meta: {
    fontSize: 12,
    color: COLORS.accent,
    marginTop: 2,
  },
  actions: {
    flexDirection: 'row',
  },
  actionButton: {
    padding: SPACING.sm,
    marginLeft: SPACING.xs,
  },
  actionText: {
    fontSize: 16,
    color: COLORS.accent,
  },
  deleteText: {
    color: COLORS.danger,
  },
  disabledText: {
    color: COLORS.textSecondary,
  },
});
