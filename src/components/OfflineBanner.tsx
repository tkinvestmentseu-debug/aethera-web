import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { WifiOff } from 'lucide-react-native';
import Animated, { FadeInDown, FadeOutUp } from 'react-native-reanimated';

interface Props {
  message?: string;
}

export const OfflineBanner = ({ message = 'Brak połączenia — Oracle niedostępny' }: Props) => (
  <Animated.View entering={FadeInDown.duration(300)} exiting={FadeOutUp.duration(300)} style={styles.banner}>
    <WifiOff size={14} color="#FFF" strokeWidth={2} />
    <Text style={styles.text}>{message}</Text>
  </Animated.View>
);

const styles = StyleSheet.create({
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#B91C1C',
    paddingHorizontal: 16,
    paddingVertical: 10,
    marginHorizontal: 16,
    marginBottom: 8,
    borderRadius: 12,
  },
  text: {
    color: '#FFF',
    fontSize: 13,
    fontWeight: '600',
    flex: 1,
  },
});