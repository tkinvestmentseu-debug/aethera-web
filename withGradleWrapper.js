/**
 * Expo Config Plugin — patches gradle-wrapper.properties to Gradle 8.13
 * Required because react-native 0.81.5 uses AGP 8.11.0 which requires Gradle 8.13,
 * but the RN template generates gradle-wrapper with 8.10.2.
 */
const { withDangerousMod } = require('@expo/config-plugins');
const path = require('path');
const fs = require('fs');

module.exports = (config) => {
  return withDangerousMod(config, [
    'android',
    async (config) => {
      const filePath = path.join(
        config.modRequest.platformProjectRoot,
        'gradle',
        'wrapper',
        'gradle-wrapper.properties'
      );
      try {
        let contents = await fs.promises.readFile(filePath, 'utf8');
        contents = contents.replace(
          /distributionUrl=https\\:\/\/services\.gradle\.org\/distributions\/gradle-[\d.]+-bin\.zip/,
          'distributionUrl=https\\://services.gradle.org/distributions/gradle-8.13-bin.zip'
        );
        await fs.promises.writeFile(filePath, contents);
        console.log('[withGradleWrapper] ✓ Patched gradle-wrapper.properties → 8.13');
      } catch (e) {
        console.warn('[withGradleWrapper] Could not patch gradle-wrapper.properties:', e.message);
      }
      return config;
    },
  ]);
};
