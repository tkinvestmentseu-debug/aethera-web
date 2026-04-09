// metro.config.js — Aethera / Soulverse
const { getDefaultConfig } = require('expo/metro-config');
const os = require('os');
const path = require('path');

const config = getDefaultConfig(__dirname);

// Firebase v10+ requires .cjs extension support and disabled package exports for React Native Auth
config.resolver.sourceExts.push('cjs');
config.resolver.unstable_enablePackageExports = false;

// Dynamic worker count based on available RAM
const totalMemGb = os.totalmem() / (1024 ** 3);
config.maxWorkers = totalMemGb >= 16 ? 4 : totalMemGb >= 12 ? 3 : 2;

config.transformer = {
  ...config.transformer,
  enableBabelRCLookup: false,
  enableBabelRuntime: true,
  // Minifier options for faster dev transforms
  minifierConfig: {
    keep_fnames: true,
    mangle: { keep_fnames: true },
  },
};

// Persistent cache — dramatically speeds up subsequent Metro starts
config.cacheVersion = 'aethera-v2';

config.server = {
  ...config.server,
  port: 8081,
  enhanceMiddleware: (middleware) => middleware,
};

// Exclude garbage directories from bundling/watching
config.watchFolders = [__dirname];
config.resolver.blockList = [
  /\/tools\//,
  /QA_RUNTIME_REPORTS\//,
  /qa_output\//,
  /qa_v2\//,
  /tmp\//,
  /\.bak$/,
  /android\/app\/\.cxx\//,
];

module.exports = config;
