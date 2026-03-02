import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';

type Props = {
  message: string | null;
  onDismiss?: () => void;
};

export default function ErrorBanner({ message, onDismiss }: Props) {
  if (!message) return null;

  return (
    <View style={styles.container}>
      <Text style={styles.text}>{message}</Text>
      {onDismiss && (
        <Pressable onPress={onDismiss} style={styles.closeButton}>
          <Text style={styles.closeText}>×</Text>
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#8b1c1c',
    borderRadius: 8,
    marginBottom: 12,
  },
  text: {
    flex: 1,
    color: '#fff3f3',
    fontSize: 14,
    fontWeight: '500',
  },
  closeButton: {
    marginLeft: 8,
    paddingHorizontal: 4,
    paddingVertical: 2,
  },
  closeText: {
    color: '#fff3f3',
    fontSize: 18,
    fontWeight: '700',
  },
});

