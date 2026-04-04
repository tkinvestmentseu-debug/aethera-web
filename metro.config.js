// metro.config.js — Aethera / Soulverse
const { getDefaultConfig } = require('expo/metro-config');
const os = require('os');

const config = getDefaultConfig(__dirname);

// Dynamic worker count: 2 na ≤14 GB RAM, 3 na 16 GB+
const totalMemGb = os.totalmem() / (1024 ** 3);
config.maxWorkers = totalMemGb >= 14 ? 3 : 2;

config.transformer = {
  ...config.transformer,
  enableBabelRCLookup: false,
  enableBabelRuntime: true,
};

// config.resolver = {
//   ...config.resolver,
//   unstable_enableSymlinks: false,
// };

config.server = {
  ...config.server,
  port: 8081,
  enhanceMiddleware: (middleware) => middleware,
};

module.exports = config;
