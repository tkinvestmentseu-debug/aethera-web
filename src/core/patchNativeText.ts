// @ts-nocheck
/**
 * Patches react-native's Text export with ScaledText (respects textScale setting).
 * MUST be the very first import in App.tsx.
 *
 * React Native in Hermes exports Text via a getter (Object.defineProperty with get only),
 * so direct assignment fails. We override the getter descriptor instead.
 */
import { ScaledText } from '../components/ScaledText';

const RNModule = require('react-native');
try {
  Object.defineProperty(RNModule, 'Text', {
    configurable: true,
    enumerable: true,
    get: () => ScaledText,
  });
} catch {
  // Property is non-configurable — textScale patch skipped silently.
  // App still works; font scaling won't apply to raw <Text> components.
}
