import React from 'react';
import { View, Text, Button, StyleSheet } from 'react-native';

type Props = {
  onClose?: () => void;
};

export function StatusScreen({ onClose }: Props) {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>TripGuard Status</Text>
      <Text style={styles.subtitle}>All systems nominal.</Text>
      <View style={styles.spacer} />
      <Button title="Back to Setup" onPress={onClose} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
  },
  spacer: {
    height: 12,
  },
});

export default StatusScreen;
