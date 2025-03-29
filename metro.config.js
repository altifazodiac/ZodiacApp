const { getDefaultConfig } = require('@expo/metro-config');

// Retrieve the default Metro configuration
const defaultConfig = getDefaultConfig(__dirname);

module.exports = {
  ...defaultConfig,
  transformer: {
    ...defaultConfig.transformer,
    assetPlugins: ['expo-asset/tools/hashAssetFiles'], // Ensures hashed asset support
  },
};