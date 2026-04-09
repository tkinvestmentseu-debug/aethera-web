import React from 'react';
import { Text, TextProps, StyleSheet, StyleProp, TextStyle } from 'react-native';
import { typography as designTypography } from '../core/theme/designSystem';
import { getResolvedTheme } from '../core/theme/tokens';
import { resolveUserFacingText } from '../core/utils/contentResolver';
import { useTheme } from '../core/hooks/useTheme';
export type TypographyVariant =
  | 'display'
  | 'heading'
  | 'title'
  | 'body'
  | 'caption'
  | 'label'
  | 'heroTitle'
  | 'editorialHeader'
  | 'screenTitle'
  | 'subtitle'
  | 'premiumLabel'
  | 'microLabel'
  | 'cardTitle'
  | 'bodyRefined'
  | 'bodySmall'
  | 'button';

interface BaseTypographyProps extends TextProps {
  style?: StyleProp<TextStyle>;
  children?: React.ReactNode;
}

export interface TypographyProps extends BaseTypographyProps {
  variant?: TypographyVariant;
  color?: string;
  align?: 'auto' | 'left' | 'right' | 'center' | 'justify';
  muted?: boolean;
}

export const Typography: React.FC<TypographyProps> = ({
  variant,
  color,
  align,
  muted,
  style,
  children,
  ...rest
}) => {
  const { currentTheme } = useTheme();
  const theme = currentTheme;
  const resolvedColor = color || getDefaultColor(theme, variant);
  const variantStyle = getVariantStyle(variant);
  const resolvedChildren = typeof children === 'string' ? resolveUserFacingText(children) : children;

  return (
    <Text
      style={[
        styles.base,
        variantStyle,
        { color: resolvedColor },
        align ? { textAlign: align } : null,
        muted ? styles.muted : null,
        style,
      ]}
      {...rest}
    >
      {resolvedChildren}
    </Text>
  );
};

export const Display: React.FC<BaseTypographyProps> = ({ style, children, ...rest }) => (
  <Typography variant="display" style={style} {...rest}>
    {children}
  </Typography>
);

export const Heading: React.FC<BaseTypographyProps> = ({ style, children, ...rest }) => (
  <Typography variant="heading" style={style} {...rest}>
    {children}
  </Typography>
);

export const Title: React.FC<BaseTypographyProps> = ({ style, children, ...rest }) => (
  <Typography variant="title" style={style} {...rest}>
    {children}
  </Typography>
);

export const Body: React.FC<BaseTypographyProps> = ({ style, children, ...rest }) => (
  <Typography variant="body" style={style} {...rest}>
    {children}
  </Typography>
);

export const Caption: React.FC<BaseTypographyProps> = ({ style, children, ...rest }) => (
  <Typography variant="caption" style={style} {...rest}>
    {children}
  </Typography>
);

export const Label: React.FC<BaseTypographyProps> = ({ style, children, ...rest }) => (
  <Typography variant="label" style={style} {...rest}>
    {children}
  </Typography>
);

const styles = StyleSheet.create({
  base: {
    color: '#F0EDE8',
    fontFamily: 'Raleway_400Regular',
  },
  display: {
    fontSize: 36,
    fontFamily: 'Cinzel_700Bold',
    letterSpacing: -0.4,
    color: '#F0EDE8',
  },
  heading: {
    fontSize: 23,
    fontFamily: 'Cinzel_600SemiBold',
    letterSpacing: 0.05,
    color: 'rgba(240,237,232,0.94)',
  },
  title: {
    fontSize: 19,
    fontFamily: 'Cinzel_600SemiBold',
    color: '#F0EDE8',
  },
  body: {
    fontSize: 16,
    fontFamily: 'Raleway_400Regular',
    lineHeight: 25,
    color: 'rgba(240,237,232,0.90)',
  },
  caption: {
    fontSize: 12,
    fontFamily: 'Raleway_500Medium',
    letterSpacing: 0.2,
    color: 'rgba(240,237,232,0.68)',
  },
  label: {
    fontSize: 13,
    fontFamily: 'Raleway_600SemiBold',
    color: 'rgba(240,237,232,0.88)',
    letterSpacing: 0.3,
  },
  muted: {
    opacity: 0.84,
  }
});

const getDefaultColor = (theme: ReturnType<typeof getResolvedTheme>, variant?: TypographyVariant) => {
  switch (variant) {
    case 'caption':
      return theme.textMuted;
    case 'microLabel':
      return theme.textSoft;
    case 'premiumLabel':
    case 'cardTitle':
    case 'screenTitle':
    case 'heroTitle':
    case 'editorialHeader':
      return theme.text;
    case 'body':
    case 'bodyRefined':
    case 'bodySmall':
    case 'subtitle':
    case 'label':
      return theme.textSoft;
    default:
      return theme.text;
  }
};

const variantStyles: Record<TypographyVariant, TextStyle> = {
  display: styles.display,
  heading: styles.heading,
  title: styles.title,
  body: styles.body,
  caption: styles.caption,
  label: designTypography.label,
  heroTitle: designTypography.heroTitle,
  editorialHeader: designTypography.editorialHeader,
  screenTitle: designTypography.screenTitle,
  subtitle: designTypography.subtitle,
  premiumLabel: designTypography.premiumLabel,
  microLabel: designTypography.microLabel,
  cardTitle: designTypography.cardTitle,
  bodyRefined: designTypography.bodyRefined,
  bodySmall: designTypography.bodySmall,
  button: {
    ...designTypography.premiumLabel,
    fontSize: 14,
    letterSpacing: 0.6,
  },
};

const getVariantStyle = (variant?: TypographyVariant): TextStyle => {
  if (!variant) {
    return styles.body;
  }

  return variantStyles[variant] || styles.body;
};
