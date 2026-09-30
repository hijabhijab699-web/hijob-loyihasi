module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: [
      // Worklet plugin is what turns 'worklet' string directives + frame
      // processor bodies into worklets that run on Vision Camera's UI thread.
      // Must be listed BEFORE reanimated so both share the same runtime.
      'react-native-worklets-core/plugin',
      'react-native-reanimated/plugin',
    ],
  };
};
