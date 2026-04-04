import React from 'react';
import { StyleSheet, View } from 'react-native';

export const StarBackground = () => {
  return (
    <View style={StyleSheet.absoluteFill}>
      {/* Dynamicznie wygenerowane "gwiazdy" */}
      {[...Array(40)].map((_, i) => (
        <View
          key={i}
          style={[
            styles.star,
            {
              top: `${Math.random() * 100}%`,
              left: `${Math.random() * 100}%`,
              opacity: Math.random() * 0.5 + 0.2,
              width: Math.random() * 2 + 1,
              height: Math.random() * 2 + 1,
              transform: [{ scale: Math.random() }],
            },
          ]}
        />
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  star: {
    position: 'absolute',
    backgroundColor: '#FFF',
    borderRadius: 50,
  },
});
