import React, { forwardRef } from 'react';
import PagerView from 'react-native-pager-view';

export const PlatformPagerView = forwardRef<any, any>((props, ref) => (
  <PagerView ref={ref} {...props} />
));

PlatformPagerView.displayName = 'PlatformPagerView';
