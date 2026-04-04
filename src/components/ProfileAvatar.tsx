import React, { useEffect, useState } from 'react';
import Animated, { ZoomIn } from 'react-native-reanimated';
import { Image, StyleSheet, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { User } from 'lucide-react-native';
import { Typography } from './Typography';

interface ProfileAvatarProps {
  uri?: string;
  name?: string;
  fallbackText: string;
  size: number;
  primary: string;
  borderColor: string;
  backgroundColor: string;
  textColor: string;
}

export const ProfileAvatar = ({
  uri,
  name,
  fallbackText,
  size,
  primary,
  borderColor,
  backgroundColor,
  textColor,
}: ProfileAvatarProps) => {
  const [hasImageError, setHasImageError] = useState(false);

  useEffect(() => {
    setHasImageError(false);
  }, [uri]);

  const initials = (name?.trim()?.charAt(0) || fallbackText.charAt(0) || '').toUpperCase();
  const showIcon = !initials;

  return (
    <View
      style={[
        styles.frame,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          borderColor,
          backgroundColor,
          shadowColor: primary,
        },
      ]}
    >
      {uri && !hasImageError ? (
        <Image
          source={{ uri }}
          style={[styles.image, { borderRadius: size / 2 }]}
          resizeMode="cover"
          onError={() => setHasImageError(true)}
        />
      ) : (
        <View style={styles.fallback}>
          <LinearGradient
            colors={[primary + '33', primary + '11'] as const}
            style={StyleSheet.absoluteFill}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          />
          <View style={[styles.innerRing, { width: size * 0.65, height: size * 0.65, borderRadius: size * 0.325, borderColor: primary + '22' }]} />
          {showIcon ? (
            <User color={textColor} size={size * 0.35} strokeWidth={1.5} />
          ) : (
            <>
              <Typography
                variant={size >= 80 ? 'heroTitle' : 'cardTitle'}
                color={textColor}
                align="center"
              >
                {initials}
              </Typography>
              {size >= 80 ? (
                <Typography variant="microLabel" color={primary} style={{ marginTop: 4 }}>
                  {fallbackText}
                </Typography>
              ) : null}
            </>
          )}
        </View>
      )}
      <View style={[styles.ring, { borderColor: primary + '33' }]} />
    </View>
  );
};

const styles = StyleSheet.create({
  frame: {
    borderWidth: 1,
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.14,
    shadowRadius: 24,
    elevation: 6,
  },
  image: {
    width: '100%',
    height: '100%',
  },
  fallback: {
    alignItems: 'center',
    justifyContent: 'center',
    ...StyleSheet.absoluteFillObject,
  },
  innerRing: {
    position: 'absolute',
    borderWidth: 1,
  },
  ring: {
    position: 'absolute',
    inset: 5,
    borderRadius: 999,
    borderWidth: 1,
  },
});
