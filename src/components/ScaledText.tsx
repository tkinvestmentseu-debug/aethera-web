// @ts-nocheck
import React from 'react';
import { StyleSheet } from 'react-native';
import { useAppStore } from '../store/useAppStore';
import { resolveUserFacingText } from '../core/utils/contentResolver';

/**
 * Drop-in replacement for React Native's Text that respects the global textScale
 * setting (ProfileScreen A-/A/A+ selector).
 *
 * IMPORTANT: We deliberately use require() to capture a direct VALUE reference to
 * the original Text BEFORE patchNativeText.ts replaces the module's Text export.
 * Using `import { Text }` would produce a property binding (_rn.Text) that would
 * resolve to ScaledText AFTER the patch → infinite recursion.
 */
// eslint-disable-next-line @typescript-eslint/no-var-requires
const OriginalText = require('react-native').Text;

export const ScaledText = React.forwardRef((props, ref) => {
  const textScale = useAppStore((s) => s.experience?.textScale ?? 1.0);
  const resolvedChildren = typeof props?.children === 'string'
    ? resolveUserFacingText(props.children)
    : props?.children;
  const nextProps = { ...props, children: resolvedChildren };

  if (textScale === 1.0) {
    return React.createElement(OriginalText, { ...nextProps, ref });
  }

  const { style, ...rest } = nextProps;
  const flat = StyleSheet.flatten(style) ?? {};
  const scaledStyle = { ...flat };
  if (typeof flat.fontSize === 'number') {
    scaledStyle.fontSize = flat.fontSize * textScale;
  }
  if (typeof flat.lineHeight === 'number') {
    scaledStyle.lineHeight = flat.lineHeight * textScale;
  }

  return React.createElement(OriginalText, { ...rest, style: scaledStyle, ref });
});

ScaledText.displayName = 'Text';
