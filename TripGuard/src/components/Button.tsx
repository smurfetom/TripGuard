import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ViewStyle, TextStyle, ActivityIndicator } from 'react-native';
import { COLORS, SPACING, FONT_SIZES, BORDER_RADIUS } from '../constants/theme';

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'danger' | 'outline';
  size?: 'small' | 'medium' | 'large';
  disabled?: boolean;
  loading?: boolean;
  style?: ViewStyle;
}

export function Button({
  title,
  onPress,
  variant = 'primary',
  size = 'medium',
  disabled = false,
  loading = false,
  style,
}: ButtonProps) {
  const getBackgroundColor = () => {
    if (disabled) return COLORS.border;
    switch (variant) {
      case 'primary':
        return COLORS.success;
      case 'secondary':
        return COLORS.surface;
      case 'danger':
        return COLORS.danger;
      case 'outline':
        return 'transparent';
      default:
        return COLORS.accent;
    }
  };

  const getBorderColor = () => {
    if (variant === 'outline') {
      return disabled ? COLORS.border : COLORS.accent;
    }
    return 'transparent';
  };

  const getTextColor = () => {
    if (disabled) return COLORS.textSecondary;
    if (variant === 'outline') return COLORS.accent;
    if (variant === 'secondary') return COLORS.textPrimary;
    return COLORS.white;
  };

  const getPadding = () => {
    switch (size) {
      case 'small':
        return { paddingVertical: SPACING.sm, paddingHorizontal: SPACING.md };
      case 'large':
        return { paddingVertical: SPACING.lg, paddingHorizontal: SPACING.xl };
      default:
        return { paddingVertical: SPACING.md, paddingHorizontal: SPACING.lg };
    }
  };

  const getFontSize = () => {
    switch (size) {
      case 'small':
        return FONT_SIZES.caption;
      case 'large':
        return FONT_SIZES.heading;
      default:
        return FONT_SIZES.body;
    }
  };

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.7}
      style={[
        styles.button,
        getPadding(),
        {
          backgroundColor: getBackgroundColor(),
          borderColor: getBorderColor(),
          borderWidth: variant === 'outline' ? 2 : 0,
        },
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={getTextColor()} />
      ) : (
        <Text style={[styles.text, { color: getTextColor(), fontSize: getFontSize() }]}>
          {title}
        </Text>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    borderRadius: BORDER_RADIUS.md,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 48,
  },
  text: {
    fontWeight: '600',
    textAlign: 'center',
  },
});
