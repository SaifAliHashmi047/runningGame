const path = require('path');
const { getDefaultConfig, mergeConfig } = require('@react-native/metro-config');

/**
 * Metro configuration
 * https://reactnative.dev/docs/metro
 *
 * @type {import('@react-native/metro-config').MetroConfig}
 */
const defaultConfig = getDefaultConfig(__dirname);

const {
  resolver: { sourceExts, assetExts },
} = defaultConfig;

const config = {
  transformer: {
    ...defaultConfig.transformer,
    // Use the RN-specific entry so SVGR always chains @react-native/metro-babel-transformer.
    babelTransformerPath: require.resolve('react-native-svg-transformer/react-native'),
  },
  resolver: {
    ...defaultConfig.resolver,
    assetExts: assetExts.filter((ext) => ext !== 'svg'),
    sourceExts: [...sourceExts, 'svg'],
    /**
     * `react-native-google-mobile-ads` points `"react-native"` at `src/index.ts`; Metro then
     * resolves TS submodules from source and can fail on `./NativeAdEventType`. Use the
     * published `lib/module` bundle instead (same as package `"module"` field).
     */
    resolveRequest(context, moduleName, platform) {
      if (moduleName === 'react-native-google-mobile-ads') {
        return {
          type: 'sourceFile',
          filePath: path.resolve(
            __dirname,
            'node_modules/react-native-google-mobile-ads/lib/module/index.js',
          ),
        };
      }
      return context.resolveRequest(context, moduleName, platform);
    },
  },
};

module.exports = mergeConfig(defaultConfig, config);
