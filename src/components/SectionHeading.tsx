import React from 'react';
import { StyleSheet, View, ViewStyle, StyleProp } from 'react-native';
import { useAppStore } from '../store/useAppStore';
import { getResolvedTheme } from '../core/theme/tokens';
import { Typography } from './Typography';

interface SectionHeadingProps {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  style?: StyleProp<ViewStyle>;
  centered?: boolean;
}

/** Tiny rotated square — mystical diamond separator */
const Diamond = ({ color, size = 5 }: { color: string; size?: number }) => (
  <View
    style={{
      width: size,
      height: size,
      borderWidth: 1.2,
      borderColor: color,
      transform: [{ rotate: '45deg' }],
      marginHorizontal: 7,
      opacity: 0.85,
    }}
  />
);

export const SectionHeading: React.FC<SectionHeadingProps> = ({
  eyebrow,
  title,
  subtitle,
  style,
  centered,
}) => {
  const { themeName } = useAppStore();
  const theme = getResolvedTheme(themeName);
  const isLight = theme.background.startsWith('#F');

  return (
    <View style={[styles.container, !centered && styles.leftAccent, { borderLeftColor: theme.primary + '55' }, style, centered && styles.centered]}>
      {eyebrow ? (
        <View style={[styles.eyebrowRow, centered && styles.eyebrowCentered]}>
          {/* Left line */}
          {centered ? (
            <View style={[styles.eyebrowLineFlex, { backgroundColor: theme.primary, opacity: 0.55 }]} />
          ) : (
            <View style={[styles.eyebrowLineShort, { backgroundColor: theme.primary, opacity: 0.65 }]} />
          )}

          <Diamond color={theme.primary} />

          <Typography variant="premiumLabel" color={theme.primary}>
            {eyebrow}
          </Typography>

          <Diamond color={theme.primary} />

          {/* Right line always extends */}
          <View style={[styles.eyebrowLineFlex, { backgroundColor: theme.primary, opacity: 0.40 }]} />
        </View>
      ) : null}

      <Typography
        variant="heroTitle"
        align={centered ? 'center' : 'left'}
        style={[styles.title, centered && { paddingLeft: 0 }]}
      >
        {title}
      </Typography>

      {subtitle ? (
        <Typography
          variant="bodySmall"
          align={centered ? 'center' : 'left'}
          style={[styles.subtitle, { color: isLight ? 'rgba(43,34,25,0.72)' : 'rgba(245,241,234,0.70)' }]}
        >
          {subtitle}
        </Typography>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  centered: {
    alignItems: 'center',
    paddingLeft: 0,
    borderLeftWidth: 0,
  },
  container: {
    marginBottom: 10,
  },
  leftAccent: {
    borderLeftWidth: 2,
    paddingLeft: 12,
  },
  eyebrowRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 2,
  },
  eyebrowCentered: {
    justifyContent: 'center',
  },
  eyebrowLineShort: {
    width: 22,
    height: 1,
  },
  eyebrowLineFlex: {
    flex: 1,
    height: 1,
    maxWidth: 80,
  },
  title: {
    marginTop: 8,
    maxWidth: 420,
  },
  subtitle: {
    marginTop: 10,
    maxWidth: 390,
    lineHeight: 24,
  },
});
