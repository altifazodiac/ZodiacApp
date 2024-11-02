const { getDefaultConfig } = require("metro-config");

module.exports = (async () => {
  const {
    resolver: { sourceExts, assetExts },
  } = await getDefaultConfig();
  return {
    transformer: {
      assetPlugins: ["react-native-svg-asset-plugin"],
    },
    resolver: {
      assetExts: [...assetExts, "png"],
      sourceExts: [...sourceExts, "js", "jsx", "ts", "tsx"],
    },
  };
})();
