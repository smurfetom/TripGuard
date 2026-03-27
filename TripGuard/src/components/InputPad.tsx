import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ViewStyle } from 'react-native';
import { COLORS, SPACING, FONT_SIZES, BORDER_RADIUS } from '../constants/theme';

interface InputPadProps {
  value: string;
  onChange: (value: string) => void;
  unit: string;
  onSubmit: () => void;
  submitDisabled?: boolean;
  style?: ViewStyle;
}

export function InputPad({
  value,
  onChange,
  unit,
  onSubmit,
  submitDisabled = false,
  style,
}: InputPadProps) {
  const handleKeyPress = (key: string) => {
    if (key === 'backspace') {
      onChange(value.slice(0, -1));
    } else if (key === 'decimal') {
      if (!value.includes('.') && !value.includes(',')) {
        onChange(value + '.');
      }
    } else if (key === 'clear') {
      onChange('');
    } else {
      if (value.length < 10) {
        onChange(value + key);
      }
    }
  };

  const keys = [
    ['1', '2', '3'],
    ['4', '5', '6'],
    ['7', '8', '9'],
    ['decimal', '0', 'backspace'],
  ];

  return (
    <View style={[styles.container, style]}>
      <View style={styles.displayContainer}>
        <Text style={styles.display} numberOfLines={1} adjustsFontSizeToFit>
          {value || '0'}
        </Text>
        <Text style={styles.unitLabel}>{unit}</Text>
      </View>

      <View style={styles.pad}>
        {keys.map((row, rowIndex) => (
          <View key={rowIndex} style={styles.row}>
            {row.map((key) => (
              <TouchableOpacity
                key={key}
                style={[
                  styles.key,
                  key === 'backspace' && styles.keySpecial,
                ]}
                onPress={() => handleKeyPress(key)}
                activeOpacity={0.7}
              >
                {key === 'backspace' ? (
                  <Text style={styles.keyText}>⌫</Text>
                ) : key === 'decimal' ? (
                  <Text style={styles.keyText}>.</Text>
                ) : (
                  <Text style={styles.keyText}>{key}</Text>
                )}
              </TouchableOpacity>
            ))}
          </View>
        ))}
      </View>

      <TouchableOpacity
        style={[
          styles.submitButton,
          (!value || submitDisabled) && styles.submitButtonDisabled,
        ]}
        onPress={onSubmit}
        disabled={!value || submitDisabled}
        activeOpacity={0.7}
      >
        <Text style={styles.submitText}>ADD STAND</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  displayContainer: {
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: SPACING.md,
  },
  display: {
    fontSize: FONT_SIZES.value,
    fontWeight: '700',
    color: COLORS.textPrimary,
    fontVariant: ['tabular-nums'],
    flex: 1,
  },
  unitLabel: {
    fontSize: FONT_SIZES.heading,
    color: COLORS.textSecondary,
    marginLeft: SPACING.md,
  },
  pad: {
    marginBottom: SPACING.md,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'center',
  },
  key: {
    width: 80,
    height: 64,
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.md,
    margin: SPACING.xs,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  keySpecial: {
    backgroundColor: COLORS.border,
  },
  keyText: {
    fontSize: FONT_SIZES.heading,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
  submitButton: {
    backgroundColor: COLORS.success,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitButtonDisabled: {
    backgroundColor: COLORS.border,
  },
  submitText: {
    fontSize: FONT_SIZES.heading,
    fontWeight: '700',
    color: COLORS.white,
    letterSpacing: 2,
  },
});
