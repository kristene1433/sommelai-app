// Metro configuration to ensure the React Native bundler ignores server code
// in the `backend/` directory (Express, Node-only APIs).
const { getDefaultConfig } = require('@expo/metro-config');

// Use __dirname per Expo's recommendation
const config = getDefaultConfig(__dirname);

// Exclude the backend directory from bundling to prevent RN from trying
// to resolve Node core modules like 'events', 'fs', etc.
config.resolver = config.resolver || {};
config.resolver.blockList = [/backend[\\/].*/];

module.exports = config;


