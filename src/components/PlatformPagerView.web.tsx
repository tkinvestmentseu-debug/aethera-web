import React, { forwardRef, useImperativeHandle, useRef } from 'react';
import { View } from 'react-native';

export const PlatformPagerView = forwardRef<any, any>(({ children, style }, ref) => {
  const viewRef = useRef<any>(null);

  useImperativeHandle(ref, () => ({
    setPage: () => {},
  }));

  return (
    <View ref={viewRef} style={style}>
      {children}
    </View>
  );
});

PlatformPagerView.displayName = 'PlatformPagerView';
