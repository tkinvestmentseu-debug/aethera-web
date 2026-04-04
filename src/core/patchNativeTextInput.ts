// @ts-nocheck
import { TranslatedTextInput } from '../components/TranslatedTextInput';

const RNModule = require('react-native');

try {
  Object.defineProperty(RNModule, 'TextInput', {
    configurable: true,
    enumerable: true,
    get: () => TranslatedTextInput,
  });
} catch {
  // Property is non-configurable — placeholder translation patch skipped.
}
