// @ts-nocheck
import React from 'react';
import { resolveUserFacingText } from '../core/utils/contentResolver';

// eslint-disable-next-line @typescript-eslint/no-var-requires
const OriginalTextInput = require('react-native').TextInput;

export const TranslatedTextInput = React.forwardRef((props, ref) => {
  const nextProps = {
    ...props,
    placeholder: typeof props?.placeholder === 'string'
      ? resolveUserFacingText(props.placeholder)
      : props?.placeholder,
  };

  return React.createElement(OriginalTextInput, { ...nextProps, ref });
});

TranslatedTextInput.displayName = 'TextInput';
