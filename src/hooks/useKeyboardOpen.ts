import { useEffect, useState } from 'react';
import { Keyboard, Platform } from 'react-native';

export const useKeyboardOpen = () => {
  const [keyboardOpen, setKeyboardOpen] = useState(false);

  useEffect(() => {
    const showEvent = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvent = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';

    const showSubscription = Keyboard.addListener(showEvent, () => setKeyboardOpen(true));
    const hideSubscription = Keyboard.addListener(hideEvent, () => setKeyboardOpen(false));

    return () => {
      showSubscription.remove();
      hideSubscription.remove();
    };
  }, []);

  return keyboardOpen;
};
