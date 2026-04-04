// @ts-nocheck
import { resolveUserFacingText } from './utils/contentResolver';

const RNModule = require('react-native');

const translateMaybe = (value: unknown) =>
  typeof value === 'string' ? resolveUserFacingText(value) : value;

try {
  const originalAlert = RNModule.Alert?.alert?.bind(RNModule.Alert);
  if (originalAlert) {
    RNModule.Alert.alert = (title, message, buttons, options) => {
      const translatedButtons = Array.isArray(buttons)
        ? buttons.map((button) => ({
            ...button,
            text: translateMaybe(button?.text),
          }))
        : buttons;

      return originalAlert(
        translateMaybe(title),
        translateMaybe(message),
        translatedButtons,
        options,
      );
    };
  }
} catch {
  // Alert patch is best-effort only.
}
